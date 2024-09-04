import { Client } from "@notionhq/client"
import { Folder, MarkdownFileData } from "./read-md"
import { LogLevel, makeConsoleLogger } from "./logging"
import {
  BlockObjectResponse,
  GetPageResponse,
  ListBlockChildrenResponse,
  PageObjectResponse,
  PartialBlockObjectResponse,
} from "@notionhq/client/build/src/api-endpoints"

function isBlockObjectResponse(
  child: PartialBlockObjectResponse | BlockObjectResponse
): child is BlockObjectResponse {
  return (child as BlockObjectResponse).object === "block"
}

const logger = makeConsoleLogger("sync-to-notion")
const NOTION_BLOCK_LIMIT = 100

export type NotionPageLink = {
  id: string
  link: string
}

/**
 * Generates a unique key for a page based on its parent ID and title to find markdown file in Notion.
 * @param parentId - The notion page ID of the parent page.
 * @param title
 */
function commonPageKey(parentId: string, title: string): string {
  return `${parentId}/${title}`
}

function getPageTitle(pageResponse: GetPageResponse): string {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return pageResponse.properties.title.title[0].text.content
}

function newNotionPageLink(response: PageObjectResponse): NotionPageLink {
  return {
    id: response.id,
    link: response.url,
  }
}

export async function collectCurrentFiles(
  notion: Client,
  rootPageId: string
): Promise<Map<string, NotionPageLink>> {
  const linkMap = new Map<string, NotionPageLink>()

  async function collectPages(pageId: string, parentTitle: string) {
    const response = await notion.pages.retrieve({
      page_id: pageId,
    })

    logger(LogLevel.DEBUG, "", response)

    const pageTitle = getPageTitle(response)

    if (response.object === "page") {
      linkMap.set(
        commonPageKey(parentTitle, pageTitle),
        newNotionPageLink(response as PageObjectResponse)
      )
      const childrenResponse = await notion.blocks.children.list({
        block_id: pageId,
      })

      for (const child of childrenResponse.results) {
        if (isBlockObjectResponse(child) && child.type === "child_page") {
          await collectPages(
            child.id,
            pageId === rootPageId ? "." : parentTitle + "/" + pageTitle
          )
        }
      }
    }
  }

  await collectPages(rootPageId, ".")
  return linkMap
}

/**
 * Synchronizes a folder structure to a Notion page.
 *
 * @param notion
 * @param pageId - The ID of the Notion page to sync the content to.
 * @param dir - The folder structure to sync.
 * @param linkMap
 * @returns A promise that resolves when the synchronization is complete.
 */
export async function syncToNotion(
  notion: Client,
  pageId: string,
  dir: Folder,
  linkMap: Map<string, NotionPageLink> = new Map<string, NotionPageLink>()
): Promise<void> {
  async function appendBlocksInChunks(
    pageId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    blocks: any[]
  ): Promise<void> {
    // Append blocks in chunks of NOTION_BLOCK_LIMIT
    for (let i = 0; i < blocks.length; i += NOTION_BLOCK_LIMIT) {
      const chunk = blocks.slice(i, i + NOTION_BLOCK_LIMIT)
      await notion.blocks.children.append({
        block_id: pageId,
        children: chunk,
      })
    }
  }

  async function createOrUpdatePage(
    folderName: string,
    parentId: string,
    parentName: string,
    onUpdated: (pageId: string) => Promise<void>
  ): Promise<string> {
    const key = commonPageKey(parentName, folderName)
    logger(LogLevel.INFO, "Create page", { key: key })
    if (linkMap.has(key)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const pageId = linkMap.get(key)!.id
      await onUpdated(pageId)
      return pageId
    } else {
      const response = await notion.pages.create({
        parent: { page_id: parentId },
        properties: {
          title: [{ text: { content: folderName } }],
        },
      })
      linkMap.set(key, newNotionPageLink(response as PageObjectResponse))
      return response.id
    }
  }

  async function getExistingBlocks(notion: Client, pageId: string) {
    const existingBlocks: BlockObjectResponse[] = []
    let cursor: string | null | undefined = undefined

    do {
      const response: ListBlockChildrenResponse =
        await notion.blocks.children.list({
          block_id: pageId,
          start_cursor: cursor,
        })
      existingBlocks.push(
        ...(response.results.filter(
          isBlockObjectResponse
        ) as BlockObjectResponse[])
      )
      cursor = response.has_more ? response.next_cursor : undefined
    } while (cursor)

    return existingBlocks
  }

  async function removeAllBlocksFromPage(
    notion: Client,
    pageId: string
  ): Promise<void> {
    // Retrieve all child blocks of the page
    const childrenResponse = await getExistingBlocks(notion, pageId)

    // Iterate through the list of child blocks and delete each block
    for (const child of childrenResponse) {
      await notion.blocks.delete({
        block_id: child.id,
      })
    }
  }

  async function syncFolder(
    folder: Folder,
    parentId: string,
    parentName: string,
    createFolder = true,
    pages: Array<{ pageId: string; file: MarkdownFileData }>
  ): Promise<void> {
    let folderPageId = parentId
    if (createFolder) {
      folderPageId = await createOrUpdatePage(
        folder.name,
        parentId,
        parentName,
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        async () => {}
      )
    }

    const childParentName =
      dir.name === folder.name ? parentName : parentName + "/" + folder.name

    for (const file of folder.files) {
      const pageId = await createOrUpdatePage(
        file.fileName,
        folderPageId,
        childParentName,
        async pageId => {
          await removeAllBlocksFromPage(notion, pageId)
        }
      )
      pages.push({ pageId: pageId, file: file })
    }

    for (const subfolder of folder.subfolders) {
      await syncFolder(subfolder, folderPageId, childParentName, true, pages)
    }
  }

  const pages = [] as Array<{ pageId: string; file: MarkdownFileData }>
  await syncFolder(dir, pageId, ".", false, pages)

  const linkUrlMap = new Map<string, string>(
    Array.from(linkMap.entries()).map(([key, value]) => [key, value.link])
  )
  for (const page of pages) {
    logger(LogLevel.INFO, "Append blocks", { pageId: page.pageId })
    await appendBlocksInChunks(page.pageId, page.file.getContent(linkUrlMap))
  }
}

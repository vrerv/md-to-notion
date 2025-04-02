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
import { mergeBlocks } from "./merge-blocks"

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const properties: any = Object.values(
    (pageResponse as PageObjectResponse).properties || {}
  )
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    .find((prop: unknown) => prop.type === "title")
  if (properties && properties.title && properties.title.length > 0) {
    const title =
      properties.title[0]?.plain_text || properties.title[0]?.text?.content
    if (title) {
      return title
    }
  }
  logger(LogLevel.ERROR, "Error no title found", { pageResponse })
  throw new Error(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    `No title found. Please set a title for the page ${pageResponse.url} and try again.`
  )
}

function newNotionPageLink(response: PageObjectResponse): NotionPageLink {
  return {
    id: response.id,
    link: response.url,
  }
}

/**
 * find the maximum depth of the req block
 * @param block
 * @param depth
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const findMaxDepth = (block: any, depth = 0): number => {
  if (!block || !block.children) {
    return depth
  }
  let maxDepth = depth

  for (const child of block.children) {
    const childNode = child[child.type]
    const childDepth = findMaxDepth(childNode, depth + 1)
    maxDepth = Math.max(maxDepth, childDepth)
  }
  return maxDepth
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
 * @param deleteNonExistentFiles - Whether to delete pages in Notion that don't exist locally
 * @returns A promise that resolves when the synchronization is complete.
 */
export async function syncToNotion(
  notion: Client,
  pageId: string,
  dir: Folder,
  linkMap: Map<string, NotionPageLink> = new Map<string, NotionPageLink>(),
  deleteNonExistentFiles = false
): Promise<void> {
  async function appendBlocksInChunks(
    pageId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    blocks: any[],
    afterId: string | null = null
  ): Promise<void> {
    const limitChild = findMaxDepth({ children: blocks }, 0) > 3
    // Append blocks in chunks of NOTION_BLOCK_LIMIT
    for (let i = 0; i < blocks.length; i += NOTION_BLOCK_LIMIT) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const children: Record<number, any[]> = {}
      const chunk = blocks
        .slice(i, i + NOTION_BLOCK_LIMIT)
        .map((block, index) => {
          if (limitChild && block.bulleted_list_item?.children) {
            children[index] = block.bulleted_list_item?.children
            delete block.bulleted_list_item?.children
          }
          return block
        })
      try {
        const response = await notion.blocks.children.append({
          block_id: pageId,
          children: chunk,
          after: afterId ? afterId : undefined,
        })

        // Check for children in the chunk and append them separately
        for (const index in children) {
          if (children[index]) {
            await appendBlocksInChunks(
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              response.results[index].id,
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              children[index]
            )
          }
        }
      } catch (error) {
        logger(LogLevel.ERROR, "Error appending blocks", { error, chunk })
        throw error
      }
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

    // you have to get children blocks if the block has children
    for (const block of existingBlocks) {
      if (block.has_children) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        block[block.type].children = await getExistingBlocks(notion, block.id)
      }
    }
    return existingBlocks
  }

  async function syncFolder(
    folder: Folder,
    parentId: string,
    parentName: string,
    createFolder = true,
    pages: Array<{ pageId: string; file: MarkdownFileData }>,
    folderPageIds: Set<string>
  ): Promise<void> {
    let folderPageId = parentId
    if (createFolder) {
      folderPageId = await createOrUpdatePage(
        folder.name,
        parentId,
        parentName,
        async _ => {
          /* do nothing */
        }
      )
    }
    folderPageIds.add(folderPageId)

    const childParentName =
      dir.name === folder.name ? parentName : parentName + "/" + folder.name

    for (const file of folder.files) {
      const pageId = await createOrUpdatePage(
        file.fileName,
        folderPageId,
        childParentName,
        async _ => {
          /* do nothing */
        }
      )
      pages.push({ pageId: pageId, file: file })
    }

    for (const subfolder of folder.subfolders) {
      await syncFolder(
        subfolder,
        folderPageId,
        childParentName,
        true,
        pages,
        folderPageIds
      )
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function updateBlocks(pageId: string, newBlocks: any[]) {
    const blockIdSetToDelete = new Set<string>()
    const existingBlocks = await getExistingBlocks(notion, pageId)
    await mergeBlocks(
      existingBlocks,
      newBlocks,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (blocks: any[], after: any) => {
        let afterId = after?.id
        let appendBlocks = blocks
        if (
          (after === null || after === undefined) &&
          existingBlocks.length > 0 &&
          existingBlocks[0]?.id
        ) {
          // to overcome the limitation of the Notion API that requires an after block to append blocks,
          // append to after first block and delete first block
          const firstBlock = existingBlocks[0]
          afterId = firstBlock.id
          appendBlocks = blockIdSetToDelete.has(afterId)
            ? blocks
            : [
                ...blocks,
                {
                  ...firstBlock,
                  /* to create a new block or avoid any interference with existing blocks, set id undefined */
                  id: undefined,
                },
              ]
          blockIdSetToDelete.add(afterId)
        }
        logger(LogLevel.INFO, "Appending blocks", { appendBlocks, after })
        await appendBlocksInChunks(pageId, appendBlocks, afterId)
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (block: any) => {
        blockIdSetToDelete.add(block.id)
      }
    )
    for (const blockId of blockIdSetToDelete) {
      logger(LogLevel.INFO, "Deleting a block", { blockId })
      await notion.blocks.delete({ block_id: blockId })
    }
  }

  const pages = [] as Array<{ pageId: string; file: MarkdownFileData }>
  const folderPageIds = new Set<string>()
  await syncFolder(dir, pageId, ".", false, pages, folderPageIds)

  const linkUrlMap = new Map<string, string>(
    Array.from(linkMap.entries()).map(([key, value]) => [key, value.link])
  )

  for (const page of pages) {
    const blocks = page.file.getContent(linkUrlMap)
    logger(LogLevel.INFO, "Update blocks", {
      pageId: page.pageId,
      file: page.file,
      newBlockSize: blocks.length,
    })
    await updateBlocks(page.pageId, blocks)
  }

  // Track which pages from Notion were found in the local directory
  // Include both file pages and their parent folder pages
  const processedNotionPageIds = new Set<string>([
    ...pages.map(page => page.pageId),
    ...folderPageIds,
  ])

  if (deleteNonExistentFiles) {
    // Track pages that we've archived in this run
    const archivedPages = new Set<string>()

    // Sort keys by path length so that we delete parent paths first
    // This reduces API calls because archiving a parent will archive all children
    const sortedEntries = Array.from(linkMap.entries()).sort(
      (a, b) => a[0].length - b[0].length
    )

    for (const [key, pageLink] of sortedEntries) {
      const isRootPage =
        pageLink.id.replace(/-/g, "") === pageId.replace(/-/g, "")
      if (isRootPage) {
        continue
      }
      if (processedNotionPageIds.has(pageLink.id)) {
        continue
      }
      const parentPath = key.substring(0, key.lastIndexOf("/"))
      if (parentPath && archivedPages.has(parentPath)) {
        continue
      }

      try {
        logger(LogLevel.INFO, `Deleting page: ${key}`)
        await notion.pages.update({
          page_id: pageLink.id,
          archived: true,
        })

        archivedPages.add(key)
      } catch (error) {
        logger(LogLevel.ERROR, `Error deleting page: ${key}`, {
          error,
          pageId: pageLink.id,
        })
        throw error
      }
    }
  }
}

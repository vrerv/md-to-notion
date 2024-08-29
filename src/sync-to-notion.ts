import { Client } from "@notionhq/client"
import { Folder, MarkdownFileData } from "./read-md"
import { LogLevel, makeConsoleLogger } from "./logging"
import {
  BlockObjectResponse,
  PartialBlockObjectResponse,
} from "@notionhq/client/build/src/api-endpoints"

function isBlockObjectResponse(
  child: PartialBlockObjectResponse | BlockObjectResponse
): child is BlockObjectResponse {
  return (child as BlockObjectResponse).object === "block"
}

const logger = makeConsoleLogger("sync-to-notion")
const NOTION_BLOCK_LIMIT = 100

/**
 * Generates a unique key for a page based on its parent ID and title to find markdown file in Notion.
 * @param parentId - The notion page ID of the parent page.
 * @param title
 */
function commonPageKey(parentId: string, title: string): string {
  return parentId + title
}

async function collectCurrentFiles(
  notion: Client,
  rootPageId: string
): Promise<Map<string, string>> {
  const linkMap = new Map<string, string>()

  async function collectPages(pageId: string, parentId: string) {
    const response = await notion.pages.retrieve({
      page_id: pageId,
    })

    logger(LogLevel.DEBUG, "", response)
    if (response.object === "page") {
      linkMap.set(
        commonPageKey(
          parentId,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          response.properties.title.title[0].text.content
        ),
        response.id
      )
      // Retrieve children blocks
      const childrenResponse = await notion.blocks.children.list({
        block_id: pageId,
      })

      for (const child of childrenResponse.results) {
        if (isBlockObjectResponse(child) && child.type === "child_page") {
          await collectPages(child.id, pageId)
        }
      }
    }
  }

  await collectPages(rootPageId, rootPageId)
  return linkMap
}

/**
 * Synchronizes a folder structure to a Notion page.
 *
 * @param token - The Notion integration token.
 * @param pageId - The ID of the Notion page to sync the content to.
 * @param dir - The folder structure to sync.
 * @returns A promise that resolves when the synchronization is complete.
 */
export async function syncToNotion(
  token: string,
  pageId: string,
  dir: Folder
): Promise<void> {
  const notion = new Client({ auth: token })
  const linkMap = await collectCurrentFiles(notion, pageId)

  async function createOrUpdatePageForFolder(
    folderName: string,
    parentId: string
  ): Promise<string> {
    const key = commonPageKey(parentId, folderName)
    if (linkMap.has(key)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return linkMap.get(key)!
    } else {
      const response = await notion.pages.create({
        parent: { page_id: parentId },
        properties: {
          title: [{ text: { content: folderName } }],
        },
      })
      linkMap.set(parentId + folderName, response.id)
      return response.id
    }
  }

  async function removeAllBlocksFromPage(
    notion: Client,
    pageId: string
  ): Promise<void> {
    // Retrieve all child blocks of the page
    const childrenResponse = await notion.blocks.children.list({
      block_id: pageId,
    })

    // Iterate through the list of child blocks and delete each block
    for (const child of childrenResponse.results) {
      await notion.blocks.delete({
        block_id: child.id,
      })
    }
  }

  async function createOrUpdatePageForMarkdown(
    file: MarkdownFileData,
    parentId: string
  ): Promise<void> {
    logger(LogLevel.DEBUG, "Creating or updating page for file", {
      parentId: parentId,
      fileName: file.fileName,
    })

    const key = parentId + file.fileName
    async function appendBlocksInChunks(
      pageId: string,
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

    if (linkMap.has(key)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const pageId = linkMap.get(key)!
      // await notion.pages.update({
      //   page_id: pageId,
      //   properties: {
      //     title: [{ text: { content: file.fileName } }],
      //   },
      // })
      await removeAllBlocksFromPage(notion, pageId)
      await appendBlocksInChunks(pageId, file.blockContent)
    } else {
      const response = await notion.pages.create({
        parent: { page_id: parentId },
        properties: {
          title: [{ text: { content: file.fileName } }],
        },
        children: file.blockContent.slice(0, NOTION_BLOCK_LIMIT),
      })
      linkMap.set(key, response.id)
      await appendBlocksInChunks(
        response.id,
        file.blockContent.slice(NOTION_BLOCK_LIMIT)
      )
    }
  }

  async function syncFolder(folder: Folder, parentId: string): Promise<void> {
    const folderPageId = await createOrUpdatePageForFolder(
      folder.name,
      parentId
    )

    for (const file of folder.files) {
      await createOrUpdatePageForMarkdown(file, folderPageId)
    }

    for (const subfolder of folder.subfolders) {
      await syncFolder(subfolder, folderPageId)
    }
  }

  await syncFolder(dir, pageId)
}

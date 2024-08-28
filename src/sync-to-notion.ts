import { Client } from '@notionhq/client'
import { Folder, MarkdownFileData } from './read-md'
import { LogLevel, makeConsoleLogger } from "./logging"  // Update the import path to match your project's structure

const logger = makeConsoleLogger('read-md')
/**
 * Synchronizes a folder structure to a Notion page.
 *
 * @param token - The Notion integration token.
 * @param pageId - The ID of the Notion page to sync the content to.
 * @param dir - The folder structure to sync.
 * @returns A promise that resolves when the synchronization is complete.
 */
export async function syncToNotion(token: string, pageId: string, dir: Folder): Promise<void> {
  const notion = new Client({ auth: token })

  // Function to create a Notion page for a folder
  async function createPageForFolder(folderName: string, parentId: string): Promise<string> {
    const response = await notion.pages.create({
      parent: { page_id: parentId },
      properties: {
        title: [{ text: { content: folderName } }],
      },
    })

    return response.id
  }

  // Function to create a Notion page for a Markdown file
  async function createPageForMarkdown(file: MarkdownFileData, parentId: string): Promise<void> {
    logger(LogLevel.DEBUG, 'Creating page for file', { parentId: parentId, fileName: file.fileName })
    await notion.pages.create({
      parent: { page_id: parentId },
      properties: {
        title: [{ text: { content: file.fileName } }],
      },
      children: file.blockContent // Assumes blockContent is already in a Notion-compatible format
    })
  }

  // Recursively sync folder structure to Notion
  async function syncFolder(folder: Folder, parentId: string): Promise<void> {
    // Create a Notion page for the current folder
    const folderPageId = await createPageForFolder(folder.name, parentId)

    // Sync Markdown files in the current folder
    for (const file of folder.files) {
      await createPageForMarkdown(file, folderPageId)
    }

    // Recursively sync subfolders
    for (const subfolder of folder.subfolders) {
      await syncFolder(subfolder, folderPageId)
    }
  }

  // Start syncing from the root folder
  await syncFolder(dir, pageId)
}

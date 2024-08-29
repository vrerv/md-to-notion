import * as fs from "fs"
import * as path from "path"
import matter from "gray-matter"
import { markdownToBlocks } from "@tryfabric/martian"
import { LogLevel, makeConsoleLogger } from "./logging"

export interface Folder {
  name: string
  files: MarkdownFileData[]
  subfolders: Folder[]
}

export interface MarkdownFileData {
  fileName: string
  blockContent: any[]
}

const logger = makeConsoleLogger('read-md')

/**
 * Read and process Markdown files from a specified directory.
 * The function reads all Markdown files in the directory and its subdirectories, following symbolic links,
 * extracts their content, and converts it to Notion block format.
 *
 * @param dirPath - The path to the directory containing the Markdown files.
 * @param filterOutFunc - A function that determines if a path should be excluded. node_modules are excluded by default.
 * @returns A hierarchical structure of folders and files that contain Markdown files.
 */
export function readMarkdownFiles(dirPath: string, filterOutFunc: (path: string) => boolean = (path) => path.includes("node_modules")): Folder | null {
  function walk(currentPath: string): Folder | null {
    const folder: Folder = {
      name: path.basename(currentPath),
      files: [],
      subfolders: []
    }

    const entries = fs.readdirSync(currentPath, { withFileTypes: true })

    for (const entry of entries) {
      const entryPath = path.join(currentPath, entry.name)

      if (filterOutFunc(entryPath)) {
        continue
      }

      let stats

      try {
        // Use fs.statSync to follow symbolic links
        stats = fs.statSync(entryPath)
      } catch (err) {
        console.error(`Error reading path: ${entryPath}`, err)
        continue
      }

      if (stats.isDirectory()) {
        const subfolder = walk(entryPath)
        if (subfolder) {
          folder.subfolders.push(subfolder)
        }
      } else if (stats.isFile() && entry.name.endsWith('.md')) {
        const content = matter(fs.readFileSync(entryPath, 'utf-8')).content
        const noLinkContent = removeMarkdownLinks(content)
        const blockContent = markdownToBlocks(noLinkContent)

        const fileNameWithoutExtension = path.basename(entry.name, '.md')
        folder.files.push({ fileName: fileNameWithoutExtension, blockContent })
      }
    }

    // Return the folder only if it contains any files or subfolders with Markdown files
    return folder.files.length > 0 || folder.subfolders.length > 0 ? folder : null
  }

  return walk(dirPath)
}

/**
 * Removes internal Markdown links from the content for Notion.
 *
 * @param content - The content to process.
 * @returns The content with links removed.
 */
export function removeMarkdownLinks(content: string): string {
  return content.replace(/\[([^\]]+)]\((?!(#|https?:\/\/))[^)]+\)/g, '$1');
}

/**
 * Prints the folder hierarchy structure.
 *
 * @param folder - The root folder to start printing from.
 * @param indent - The current level of indentation (used for recursion).
 */
export function printFolderHierarchy(folder: Folder | null, indent = ''): void {
  if (!folder) return; // Exit if the folder is null

  // Print the current folder's name
  logger(LogLevel.INFO, `${indent}${folder.name}/`)

  // Print the files in the current folder
  for (const file of folder.files) {
    logger(LogLevel.INFO, `${indent}  - ${file.fileName}.md`)
  }

  // Recursively print each subfolder
  for (const subfolder of folder.subfolders) {
    printFolderHierarchy(subfolder, indent + '  ') // Increase indentation for subfolders
  }
}

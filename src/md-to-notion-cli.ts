#!/usr/bin/env node

import { printFolderHierarchy, readMarkdownFiles, syncToNotion } from "./index"
import { Command } from "commander"
import { description, version } from "../package.json"
import { Client } from "@notionhq/client"
import { collectCurrentFiles, archiveChildPages } from "./sync-to-notion"

const REPL_TEXT = "${text}"
const REPL_LINK_PATH_FROM_ROOT = "${linkPathFromRoot}"
const REPL_GITHUB_PATH = "${githubPath}"
const GIT_HUB_LINK_REPLACEMENT = `[${REPL_TEXT}](https://github.com/${REPL_GITHUB_PATH}/${REPL_LINK_PATH_FROM_ROOT}?raw=true)`

const program = new Command()

async function main(
  directory: string,
  options: {
    verbose: boolean
    token: string
    pageId: string
    include: string
    exclude: string
    linkReplacer: string
    useGithubLinkReplacer: string
    delete: boolean
    renew: boolean
    timeout: number
  }
) {
  let replacer
  if (options.linkReplacer) {
    replacer = (text: string, linkFromRootPath: string) =>
      options.linkReplacer
        .replace("${text}", text)
        .replace("${linkPathFromRoot}", linkFromRootPath)
  } else if (options.useGithubLinkReplacer) {
    replacer = (text: string, linkFromRootPath: string) =>
      GIT_HUB_LINK_REPLACEMENT.replace(
        "${githubPath}",
        options.useGithubLinkReplacer
      )
        .replace("${text}", text)
        .replace("${linkPathFromRoot}", linkFromRootPath)
  }
  const dir = readMarkdownFiles(
    directory,
    path => {
      const exclude = options.exclude || "node_modules"
      const include = options.include || path
      return path.includes(include) && !path.includes(exclude)
    },
    replacer
  )

  if (options.verbose) {
    printFolderHierarchy(dir)
  }

  if (dir) {
    const timeoutMs = parseInt(String(options.timeout), 10)
    const notion = new Client({ auth: options.token, timeoutMs })
    if (options.renew) {
      await archiveChildPages(notion, options.pageId)
    }
    const linkMap = await collectCurrentFiles(notion, options.pageId)
    await syncToNotion(notion, options.pageId, dir, linkMap, options.delete)
  }

  console.log("Sync complete!")
}

program
  .version(version)
  .description(description)
  .argument("<directory>", "Directory containing markdown files")
  .option(
    "-t, --token <token>",
    "Notion API Token, default is environment variable NOTION_API_TOKEN",
    process.env["NOTION_API_TOKEN"]
  )
  .option(
    "-p, --page-id <id>",
    "Target Notion root page ID, default is env MD_TO_NOTION_PAGE_ID",
    process.env["MD_TO_NOTION_PAGE_ID"]
  )
  .option(
    "-i, --include <text>",
    "Scan only path includes text, default is all files"
  )
  .option(
    "-r, --link-replacer <replacement>",
    "Custom link replacer string.\n" +
      `Use ${REPL_TEXT}, ${REPL_LINK_PATH_FROM_ROOT} to replace text and link.\n` +
      "Try -g if you want to use GitHub raw link"
  )
  .option(
    "-g, --use-github-link-replacer <githubPath>",
    "Replace links with raw GitHub links.\n" +
      "<githubPath> will be 'vrerv/md-to-notion/blob/main' for example.\n" +
      `This is short version of -r '${GIT_HUB_LINK_REPLACEMENT.replace(
        REPL_GITHUB_PATH,
        "<githubPath>"
      )}' option`
  )
  .option("-v, --verbose", "Print folder hierarchy", false)
  .option(
    "-d, --delete",
    "Delete pages in Notion that don't exist locally",
    false
  )
  .option("-n, --renew", "Delete all pages in Notion before sync", false)
  .option("--timeout <number>", "Timeout for API calls in milliseconds", "10000")
  .action(main)

// Export for testing purposes
export { program, main }

if (require.main === module) {
  program.parse(process.argv)
}

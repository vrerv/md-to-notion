#!/usr/bin/env node

import { printFolderHierarchy, readMarkdownFiles, syncToNotion } from "./index"
import { Command } from "commander"
import { description, version } from "../package.json"

const program = new Command();

async function main(directory: string, options: { verbose: boolean; token: string; pageId: string; }) {
  const dir = readMarkdownFiles(directory);

  if (options.verbose) {
    printFolderHierarchy(dir);
  }

  if (dir) {
    await syncToNotion(
      options.token,
      options.pageId,
      dir
    );
  }

  console.log("Sync complete!");
}

program
  .version(version)
  .description(description)
  .argument("<directory>", "Directory containing markdown files")
  .option("-t, --token <token>", "Notion API Token, default is environment variable NOTION_API_TOKEN", process.env["NOTION_API_TOKEN"])
  .option("-p, --page-id <id>", "Target Notion root page ID, default is env MD_TO_NOTION_PAGE_ID", process.env["MD_TO_NOTION_PAGE_ID"])
  .option("-v, --verbose", "Print folder hierarchy", false)
  .action(main);

program.parse(process.argv);

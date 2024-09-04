import {
  printFolderHierarchy,
  readMarkdownFiles,
  syncToNotion,
} from "@vrerv/md-to-notion"
import { Client } from "@notionhq/client"

async function main() {
  const notion = new Client({ auth: process.env.NOTION_API_TOKEN })
  const dir = readMarkdownFiles("./docs")
  printFolderHierarchy(dir)
  await syncToNotion(notion, "9d82d1c88ffa422e84472fb3b1d7c8b8", dir)
}

main()

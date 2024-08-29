import {
  readMarkdownFiles,
  printFolderHierarchy,
  syncToNotion,
  makeConsoleLogger,
  LogLevel,
} from "@vrerv/md-to-notion"

const logger = makeConsoleLogger()

async function main() {
  const dir = readMarkdownFiles("./docs")
  printFolderHierarchy(dir)
  //logger(LogLevel.DEBUG, "", dir)
  await syncToNotion(
    process.env.NOTION_API_TOKEN,
    "9d82d1c88ffa422e84472fb3b1d7c8b8",
    dir
  )
}

main()

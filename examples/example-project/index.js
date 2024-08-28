import {
  readMarkdownFiles,
  printFolderHierarchy,
  syncToNotion,
  makeConsoleLogger,
  LogLevel,
} from "@vrerv/node-package-template"
async function main() {
  const dir = readMarkdownFiles("./docs1")
  printFolderHierarchy(dir)
  const logger = makeConsoleLogger()
  logger(LogLevel.INFO, dir)
  // await syncToNotion(process.env.NOTION_API_TOKEN, "9d82d1c88ffa422e84472fb3b1d7c8b8", dir)
}

main()

jest.mock("@notionhq/client") // Ensure this is at the very top

import { Client } from "@notionhq/client" // Import type, actual is mocked
import { Command } from "commander"

// Type alias for the mocked client, will be assigned in beforeEach
let MockedClient: jest.MockedClass<typeof Client>

// Mock 'readMarkdownFiles' and other functions to avoid side effects
// These mocks are hoisted by Jest, so they apply to any subsequent require
jest.mock("../src/index", () => ({
  ...jest.requireActual("../src/index"),
  readMarkdownFiles: jest.fn().mockReturnValue({ name: "mockDir", files: [], subfolders: [] }),
  syncToNotion: jest.fn().mockResolvedValue(undefined),
  printFolderHierarchy: jest.fn(),
}))

jest.mock("../src/sync-to-notion", () => ({
  collectCurrentFiles: jest.fn().mockResolvedValue(new Map()),
  archiveChildPages: jest.fn().mockResolvedValue(undefined),
}))

describe("md-to-notion-cli", () => {
  let program: Command
  let originalArgv: string[]
  let consoleLogSpy: jest.SpyInstance
  let consoleErrorSpy: jest.SpyInstance
  let processExitSpy: jest.SpyInstance

  beforeEach(() => {
    jest.resetModules() // Reset modules first

    // Now require the mocked Client and the program
    MockedClient = require("@notionhq/client").Client as jest.MockedClass<typeof Client>
    program = require("../src/md-to-notion-cli").program

    // Clear mocks for each test
    MockedClient.mockClear()
    // jest.clearAllMocks() // This might be too broad if other mocks are needed across tests in a suite

    originalArgv = [...process.argv]
    process.argv = ["node", "md-to-notion-cli.js", "mockDir"] 

    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {})
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {})
    processExitSpy = jest.spyOn(process, "exit").mockImplementation((() => {}) as (code?: string | number | null | undefined) => never)
  })

  afterEach(() => {
    process.argv = originalArgv
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
    processExitSpy.mockRestore()
  })

  it("should call Notion Client with default timeout (10000ms) when --timeout is not provided", async () => {
    const testArgs = ["node", "md-to-notion-cli.js", "mockDir", "--token", "test-token", "--page-id", "test-page-id"]
    await program.parseAsync(testArgs, { from: "user" })

    expect(MockedClient).toHaveBeenCalledTimes(1)
    expect(MockedClient).toHaveBeenCalledWith({
      auth: "test-token",
      timeoutMs: 10000, 
    })
  })

  it("should call Notion Client with specified timeout when --timeout is provided", async () => {
    const testArgs = ["node", "md-to-notion-cli.js", "mockDir", "--token", "test-token", "--page-id", "test-page-id", "--timeout", "5000"]
    await program.parseAsync(testArgs, { from: "user" })

    expect(MockedClient).toHaveBeenCalledTimes(1)
    expect(MockedClient).toHaveBeenCalledWith({
      auth: "test-token",
      timeoutMs: 5000,
    })
  })

  it("should call Notion Client with 1ms timeout when --timeout 1 is provided", async () => {
    const testArgs = ["node", "md-to-notion-cli.js", "mockDir", "--token", "test-token", "--page-id", "test-page-id", "--timeout", "1"]
    await program.parseAsync(testArgs, { from: "user" })

    expect(MockedClient).toHaveBeenCalledTimes(1)
    expect(MockedClient).toHaveBeenCalledWith({
      auth: "test-token",
      timeoutMs: 1,
    })
  })

  it("should parse timeout as an integer", async () => {
    const testArgs = ["node", "md-to-notion-cli.js", "mockDir", "--token", "test-token", "--page-id", "test-page-id", "--timeout", "123.45"]
    await program.parseAsync(testArgs, { from: "user" })

    expect(MockedClient).toHaveBeenCalledTimes(1)
    expect(MockedClient).toHaveBeenCalledWith({
      auth: "test-token",
      timeoutMs: 123, 
    })
  })
})

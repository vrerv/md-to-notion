import {
  collectCurrentFiles,
  findMaxDepth,
  NotionPageLink,
  syncToNotion,
} from "../src/sync-to-notion"
import { Client } from "@notionhq/client"
import { Folder } from "../src/read-md"

describe("findMaxDepth", () => {
  it("finds the maximum depth of a block", () => {
    const block = {
      children: [
        {
          type: "bulleted_list_item",
          bulleted_list_item: {
            children: [
              {
                type: "bulleted_list_item",
                bulleted_list_item: {
                  children: [
                    {
                      type: "bulleted_list_item",
                      bulleted_list_item: {
                        children: [
                          {
                            type: "bulleted_list_item",
                            bulleted_list_item: {
                              rich_text: [
                                {
                                  text: {
                                    content: "depth4",
                                  },
                                },
                              ],
                            },
                          },
                        ],
                        rich_text: [
                          {
                            text: {
                              content: "depth3",
                            },
                          },
                        ],
                      },
                    },
                  ],
                  rich_text: [
                    {
                      text: {
                        content: "depth2",
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    }
    expect(findMaxDepth(block)).toBe(4)
  })

  it("returns 0 for a block without children", () => {
    const block = {}
    expect(findMaxDepth(block)).toBe(0)
  })

  it("returns 3 for more blocks", () => {
    const block = {
      children: [
        {
          type: "bulleted_list_item",
          bulleted_list_item: {
            children: [
              {
                type: "bulleted_list_item",
                bulleted_list_item: {
                  children: [
                    {
                      type: "bulleted_list_item",
                      bulleted_list_item: {
                        rich_text: [
                          {
                            text: {
                              content: "depth3",
                            },
                          },
                        ],
                      },
                    },
                  ],
                  rich_text: [
                    {
                      text: {
                        content: "depth2",
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        {
          type: "bulleted_list_item",
          bulleted_list_item: {
            children: [
              {
                type: "bulleted_list_item",
                bulleted_list_item: {
                  rich_text: [
                    {
                      text: {
                        content: "depth2",
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    }
    expect(findMaxDepth(block)).toBe(3)
  })
})

describe("syncToNotion", () => {
  const mockNotionClient = new Client({ auth: "test-token" })
  const mockFolder: Folder = {
    name: "root",
    files: [],
    subfolders: [],
  }
  //mock call to Notion API
  mockNotionClient.pages.retrieve = jest.fn().mockImplementation(async () => {
    return {
      object: "page",
      id: "page-1",
      url: "https://vrerv.com/page-1",
      properties: {
        title: {
          title: [
            {
              text: {
                content: "test-title",
              },
            },
          ],
        },
      },
    }
  })
  mockNotionClient.pages.create = jest
    .fn()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .mockImplementation(async (req: any) => {
      const id = req.properties.title[0].text.content
      return {
        object: "page",
        id: id,
        url: "https://vrerv.com/" + id,
      }
    })
  mockNotionClient.blocks.children.list = jest
    .fn()
    .mockImplementation(async () => {
      return {
        results: [],
      }
    })
  mockNotionClient.blocks.children.append = jest
    .fn()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .mockImplementation(async (req: any) => {
      const maxDepth = findMaxDepth(req, 0)
      if (maxDepth > 3) {
        throw new Error(
          "Depth of the block is more than 3. maxDepth: " + maxDepth
        )
      }

      return {
        object: "block",
        id: req.id,
        url: "https://vrerv.com/" + req.id,
        results: req.children.map((_: any, index: number) => {
          return { id: "child-" + index }
        }),
      }
    })
  mockNotionClient.blocks.delete = jest.fn().mockImplementation(async () => {
    return {
      object: "block",
    }
  })

  it("synchronizes an empty folder structure to a Notion page", async () => {
    const pageId = "test-page-id"
    const linkMap = new Map<string, NotionPageLink>()

    await syncToNotion(mockNotionClient, pageId, mockFolder, linkMap)

    expect(linkMap.size).toBe(0)
  })

  it("creates a new page for a folder", async () => {
    const pageId = "test-page-id"
    const linkMap = new Map<string, NotionPageLink>()
    const folder: Folder = {
      name: "new-folder",
      files: [],
      subfolders: [],
    }

    await syncToNotion(mockNotionClient, pageId, folder, linkMap)

    expect(linkMap.size).toBe(0)
  })

  it("updates an existing page for a folder", async () => {
    const pageId = "test-page-id"
    const linkMap = new Map<string, NotionPageLink>([
      [
        `${pageId}/existing-folder`,
        { id: "existing-page-id", link: "existing-link" },
      ],
    ])
    const folder: Folder = {
      name: "existing-folder",
      files: [],
      subfolders: [],
    }

    await syncToNotion(mockNotionClient, pageId, folder, linkMap)

    expect(linkMap.size).toBe(1)
    expect(linkMap.get(`${pageId}/existing-folder`)?.id).toBe(
      "existing-page-id"
    )
  })

  it("creates a new page for a markdown file", async () => {
    const pageId = "test-page-id"
    const linkMap = new Map<string, NotionPageLink>()
    const folder: Folder = {
      name: "root",
      files: [
        {
          fileName: "test-file",
          getContent: _ => [],
        },
      ],
      subfolders: [],
    }

    await syncToNotion(mockNotionClient, pageId, folder, linkMap)

    expect(linkMap.size).toBe(1)
    expect(linkMap.get(`./test-file`)?.id).toBe("test-file")
  })

  it("creates a new page for a markdown file with contents", async () => {
    const pageId = "test-page-id"
    const linkMap = new Map<string, NotionPageLink>()
    const folder: Folder = {
      name: "root",
      files: [
        {
          fileName: "test-file",
          getContent: _ => [
            {
              bulleted_list_item: {
                children: [
                  {
                    bulleted_list_item: {
                      children: [
                        {
                          bulleted_list_item: {
                            children: [
                              {
                                bulleted_list_item: {
                                  rich_text: [
                                    {
                                      annotations: {
                                        bold: false,
                                        code: false,
                                        color: "default",
                                        italic: false,
                                        strikethrough: false,
                                        underline: false,
                                      },
                                      text: {
                                        content: "depth4",
                                      },
                                      type: "text",
                                    },
                                  ],
                                },
                                object: "block",
                                type: "bulleted_list_item",
                              },
                            ],
                            rich_text: [
                              {
                                annotations: {
                                  bold: false,
                                  code: false,
                                  color: "default",
                                  italic: false,
                                  strikethrough: false,
                                  underline: false,
                                },
                                text: {
                                  content: "depth3",
                                },
                                type: "text",
                              },
                            ],
                          },
                          object: "block",
                          type: "bulleted_list_item",
                        },
                      ],
                      rich_text: [
                        {
                          annotations: {
                            bold: false,
                            code: false,
                            color: "default",
                            italic: false,
                            strikethrough: false,
                            underline: false,
                          },
                          text: {
                            content: "depth2",
                          },
                          type: "text",
                        },
                      ],
                    },
                    object: "block",
                    type: "bulleted_list_item",
                  },
                ],
                rich_text: [
                  {
                    annotations: {
                      bold: false,
                      code: false,
                      color: "default",
                      italic: false,
                      strikethrough: false,
                      underline: false,
                    },
                    text: {
                      content: "depth1",
                    },
                    type: "text",
                  },
                ],
              },
              object: "block",
              type: "bulleted_list_item",
            },
          ],
        },
      ],
      subfolders: [],
    }

    await syncToNotion(mockNotionClient, pageId, folder, linkMap)

    expect(linkMap.size).toBe(1)
    expect(linkMap.get(`./test-file`)?.id).toBe("test-file")
  })

  it("updates an existing page for a markdown file", async () => {
    const pageId = "test-page-id"
    const linkMap = new Map<string, NotionPageLink>([
      [`./test-file`, { id: "test-file", link: "https://vrerv.com/test-file" }],
    ])
    const folder: Folder = {
      name: ".",
      files: [
        {
          fileName: "test-file",
          getContent: _ => [],
        },
      ],
      subfolders: [],
    }

    await syncToNotion(mockNotionClient, pageId, folder, linkMap)

    expect(linkMap.size).toBe(1)
    expect(linkMap.get(`./test-file`)?.id).toBe("test-file")
  })

  it("handles nested folders and files", async () => {
    const pageId = "test-page-id"
    const linkMap = new Map<string, NotionPageLink>()
    const folder: Folder = {
      name: ".",
      files: [],
      subfolders: [
        {
          name: "subfolder",
          files: [
            {
              fileName: "subfile",
              getContent: _ => [],
            },
          ],
          subfolders: [],
        },
      ],
    }

    await syncToNotion(mockNotionClient, pageId, folder, linkMap)

    expect(linkMap.size).toBe(2)
    expect(linkMap.get(`./subfolder`)?.id).toBe("subfolder")
    expect(linkMap.get(`./subfolder/subfile`)?.id).toBe("subfile")
  })

  it("archives pages that don't exist locally when deleteNonExistentFiles is true", async () => {
    const pageId = "test-page-id"

    // Track pages that get archived
    const archivedPages: string[] = []

    // Mock the Notion client's update method
    mockNotionClient.pages.update = jest
      .fn()
      .mockImplementation(
        async (params: { page_id: string; archived: boolean }) => {
          if (params.archived) {
            archivedPages.push(params.page_id)
          }
          return { id: params.page_id }
        }
      )

    // Create a linkMap with pages that don't exist locally
    const linkMap = new Map<string, NotionPageLink>([
      [
        `./existing-file`,
        { id: "existing-file-id", link: "https://notion.so/existing-file" },
      ],
      [
        `./non-existent-file`,
        {
          id: "non-existent-file-id",
          link: "https://notion.so/non-existent-file",
        },
      ],
      [
        `./subfolder`,
        { id: "subfolder-id", link: "https://notion.so/subfolder" },
      ],
      [
        `./subfolder/non-existent-subfile`,
        {
          id: "non-existent-subfile-id",
          link: "https://notion.so/non-existent-subfile",
        },
      ],
      [
        `./folder-non-exists`,
        {
          id: "folder-non-exists-id",
          link: "https://notion.so/folder-non-exists",
        },
      ],
      [
        `./folder-non-exists/non-exists-sub2`,
        {
          id: "non-exists-sub2-id",
          link: "https://notion.so/folder-non-exists/non-exists-sub2",
        },
      ],
      [
        `./folder-non-exists/non-exists-sub2/non-exists-file2`,
        {
          id: "non-exists-file2-id",
          link: "https://notion.so/folder-non-exists/non-exists-sub2/non-exists-file2",
        },
      ],
      [
        `./folder-non-exists/non-existent-subfile2`,
        {
          id: "non-existent-subfile2-id",
          link: "https://notion.so/folder-non-exists/non-existent-subfile2",
        },
      ],
    ])

    // Create a folder structure that only has some of the files in the linkMap
    const folder: Folder = {
      name: ".",
      files: [
        {
          fileName: "existing-file",
          getContent: _ => [],
        },
      ],
      subfolders: [
        {
          name: "subfolder",
          files: [],
          subfolders: [],
        },
      ],
    }

    // Run syncToNotion with deleteNonExistentFiles set to true
    await syncToNotion(mockNotionClient, pageId, folder, linkMap, true)

    // Verify that non-existent files were archived
    expect(archivedPages).toContain("non-existent-file-id")
    expect(archivedPages).toContain("non-existent-subfile-id")
    expect(archivedPages).toContain("folder-non-exists-id")

    // Verify that existing files and folders were not archived
    expect(archivedPages).not.toContain("existing-file-id")
    expect(archivedPages).not.toContain("subfolder-id")
    expect(archivedPages).not.toContain("non-existent-subfile2-id")
    expect(archivedPages).not.toContain("non-exists-sub2-id")
    expect(archivedPages).not.toContain("non-exists-file2-id")
    expect(archivedPages).not.toContain(pageId)

    // Verify update was called the right number of times
    expect(mockNotionClient.pages.update).toHaveBeenCalledTimes(3)
  })
})

describe("collectCurrentFiles", () => {
  const mockNotionClient = new Client({ auth: "test-token" })
  //mock call to Notion API and return no title page response
  const setPageResponse = (properties: unknown) => {
    mockNotionClient.pages.retrieve = jest.fn().mockImplementation(async () => {
      return {
        object: "page",
        id: "page-1",
        url: "https://vrerv.com/page-1",
        properties: properties,
      }
    })
    mockNotionClient.blocks.children.list = jest
      .fn()
      .mockImplementation(async () => {
        return {
          results: [],
        }
      })
  }

  const assertNoPageTitleError = async () => {
    const pageId = "test-page-id"
    try {
      await collectCurrentFiles(mockNotionClient, pageId)
      fail("Should throw error if there's no page title page")
    } catch (e: unknown) {
      if (e instanceof Error) {
        expect(e.message).toBe(
          "No title found. Please set a title for the page https://vrerv.com/page-1 and try again."
        )
      } else {
        fail("Should throw error if there's no page title page")
      }
    }
  }

  it("should throw error if there's no page title page", async () => {
    setPageResponse({
      title: {
        title: {},
      },
    })
    await assertNoPageTitleError()
    setPageResponse({
      title: {
        title: [],
      },
    })
    await assertNoPageTitleError()

    setPageResponse({
      title: {},
    })
    await assertNoPageTitleError()

    setPageResponse({})
    await assertNoPageTitleError()

    setPageResponse(undefined)
    await assertNoPageTitleError()
  })

  it("should find page title if type == title in the pageResponse.properties", async () => {
    setPageResponse({
      Page: {
        type: "title",
        title: [
          {
            text: {
              content: "test-title",
            },
          },
        ],
      },
    })
    const linkMap = await collectCurrentFiles(mockNotionClient, "test-page-id")
    expect(linkMap.get("./test-title")).toEqual({
      id: "page-1",
      link: "https://vrerv.com/page-1",
    })
  })
})

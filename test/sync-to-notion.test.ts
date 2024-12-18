import {
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
})

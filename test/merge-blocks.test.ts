import { compareBlock, mergeBlocks } from "../src/merge-blocks"

describe("compareBlocks", () => {
  it("should return true if the blocks are the same", () => {
    const block1 = {
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [
          {
            type: "text",
            text: { content: "한글 테스트 문서입니다.", link: null },
            annotations: {
              bold: false,
              italic: false,
              strikethrough: false,
              underline: false,
              code: false,
              color: "default",
            },
            plain_text: "한글 테스트 문서입니다.",
            href: null,
          },
        ],
        color: "default",
      },
    }

    const block2 = {
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [
          {
            type: "text",
            annotations: {
              bold: false,
              strikethrough: false,
              underline: false,
              italic: false,
              code: false,
              color: "default",
            },
            text: { content: "한글 테스트 문서입니다.", link: undefined },
          },
        ],
      },
    }
    const equals = compareBlock(block1, block2)
    expect(equals).toBe(true)
  })

  it("should return false if the blocks are same with url type", () => {
    const block1 = {
      object: "block",
      id: "0472600e-3f07-4991-b5a1-f6b944aae69e",
      parent: {
        type: "page_id",
        page_id: "0a96df1b-dcd9-4d2e-8a26-ee235d3173e0",
      },
      created_time: "2024-09-04T18:41:00.000Z",
      last_edited_time: "2024-09-04T18:41:00.000Z",
      created_by: {
        object: "user",
        id: "a0890b1f-ee1e-4027-8ec6-132e328fbbfa",
      },
      last_edited_by: {
        object: "user",
        id: "a0890b1f-ee1e-4027-8ec6-132e328fbbfa",
      },
      has_children: false,
      archived: false,
      in_trash: false,
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          {
            type: "text",
            text: {
              content: "notion-sdk-js",
              link: { url: "https://github.com/makenotion/notion-sdk-js" },
            },
            annotations: {
              bold: false,
              italic: false,
              strikethrough: false,
              underline: false,
              code: false,
              color: "default",
            },
            plain_text: "notion-sdk-js",
            href: "https://github.com/makenotion/notion-sdk-js",
          },
        ],
        color: "default",
      },
    }
    const block2 = {
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          {
            type: "text",
            annotations: {
              bold: false,
              strikethrough: false,
              underline: false,
              italic: false,
              code: false,
              color: "default",
            },
            text: {
              content: "notion-sdk-js",
              link: {
                type: "url",
                url: "https://github.com/makenotion/notion-sdk-js",
              },
            },
          },
        ],
        children: undefined,
      },
    }
    const equals = compareBlock(block1, block2)
    expect(equals).toBe(true)
  })
})

describe("mergeBlocks", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a: any[] = []
  const b: number[] = []

  const appendBlocks = async (x: number[], z: number) => {
    a.push({ list: x, after: z })
  }
  const deleteBlocks = async (x: number) => {
    b.push(x)
  }

  beforeEach(() => {
    a.length = 0
    b.length = 0
  })

  it("should do nothing if blocks are same", async () => {
    await mergeBlocks([1, 2, 3, 4], [1, 2, 3, 4], appendBlocks, deleteBlocks)

    expect(a).toEqual([])
    expect(b).toEqual([])
  })
  it("should append", async () => {
    await mergeBlocks([1, 2, 3, 4], [0, 1, 2, 3, 4], appendBlocks, deleteBlocks)

    expect(a).toEqual([{ list: [0], after: null }])
    expect(b).toEqual([])
  })
  it("should append from empty", async () => {
    await mergeBlocks([], [1], appendBlocks, deleteBlocks)

    expect(a).toEqual([{ list: [1], after: null }])
    expect(b).toEqual([])
  })
  it("should delete", async () => {
    await mergeBlocks([1, 2, 3, 4], [2, 3, 4], appendBlocks, deleteBlocks)

    expect(a).toEqual([])
    expect(b).toEqual([1])
  })
  it("should add and delete", async () => {
    await mergeBlocks([1, 2, 3, 4], [1, 5, 3, 4], appendBlocks, deleteBlocks)

    expect(a).toEqual([{ list: [5], after: 1 }])
    expect(b).toEqual([2])
  })
  it("should add and delete many", async () => {
    await mergeBlocks([1, 2, 3, 4], [1, 6, 7, 4], appendBlocks, deleteBlocks)

    expect(a).toEqual([{ list: [6, 7], after: 1 }])
    expect(b).toEqual([2, 3])
  })
  it("should append end", async () => {
    await mergeBlocks([1, 2, 3, 4], [1, 2, 3, 4, 5], appendBlocks, deleteBlocks)

    expect(a).toEqual([{ list: [5], after: 4 }])
    expect(b).toEqual([])
  })
  it("should replace all", async () => {
    await mergeBlocks([1, 2, 3, 4], [5, 6, 7, 8], appendBlocks, deleteBlocks)

    expect(a).toEqual([{ list: [5, 6, 7, 8], after: null }])
    expect(b).toEqual([1, 2, 3, 4])
  })
  it("should replace first", async () => {
    await mergeBlocks([1, 2, 3, 4], [10, 2, 3, 4], appendBlocks, deleteBlocks)

    expect(a).toEqual([{ list: [10], after: undefined }])
    expect(b).toEqual([1])
  })
})

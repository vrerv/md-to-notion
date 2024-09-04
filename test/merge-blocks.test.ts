import { compareBlock, mergeBlocks } from "../src/merge-blocks"

describe("compareBlocks", () => {

  it("should return true if the blocks are the same", () => {
    const block1 = {
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [
          {
            type: 'text',
            text: { content: '한글 테스트 문서입니다.', link: null },
            annotations: {
              bold: false,
              italic: false,
              strikethrough: false,
              underline: false,
              code: false,
              color: 'default'
            },
            plain_text: '한글 테스트 문서입니다.',
            href: null
          }
        ],
        color: 'default'
      }
    };

    const block2 = {
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [
          {
            type: 'text',
            annotations: {
              bold: false,
              strikethrough: false,
              underline: false,
              italic: false,
              code: false,
              color: 'default'
            },
            text: { content: '한글 테스트 문서입니다.', link: undefined }
          }
        ]
      }
    };
    const equals = compareBlock(block1, block2)
    expect(equals).toBe(true)
  })

})

describe("mergeBlocks", () => {
  const a: any[] = []
  const b: number[] = []

  const appendBlocks = (x: number[], z: number) => a.push({ list: x, after: z })
  const deleteBlocks = (x: number) => b.push(x)

  beforeEach(() => {
    a.length = 0
    b.length = 0
  })

  it("should do nothing if blocks are same", () => {
    mergeBlocks([1, 2, 3, 4], [1, 2, 3, 4], appendBlocks, deleteBlocks)

    expect(a).toEqual([])
    expect(b).toEqual([])
  })
  it("should append", () => {
    mergeBlocks([1, 2, 3, 4], [0, 1, 2, 3, 4], appendBlocks, deleteBlocks)

    expect(a).toEqual([{ list: [0], after: null }])
    expect(b).toEqual([])
  })
  it("should delete", () => {
    mergeBlocks([1, 2, 3, 4], [2, 3, 4], appendBlocks, deleteBlocks)

    expect(a).toEqual([])
    expect(b).toEqual([1])
  })
  it("should add and delete", () => {
    mergeBlocks([1, 2, 3, 4], [1, 5, 3, 4], appendBlocks, deleteBlocks)

    expect(a).toEqual([{ list: [5], after: 1 }])
    expect(b).toEqual([2])
  })
  it("should add and delete many", () => {
    mergeBlocks([1, 2, 3, 4], [1, 6, 7, 4], appendBlocks, deleteBlocks)

    expect(a).toEqual([{ list: [6, 7], after: 1  }])
    expect(b).toEqual([2, 3])
  })
  it("should append end", () => {
    mergeBlocks([1, 2, 3, 4], [1, 2, 3, 4, 5], appendBlocks, deleteBlocks)

    expect(a).toEqual([{ list: [5], after: 4}])
    expect(b).toEqual([])
  })
  it("should replace all", () => {
    mergeBlocks([1, 2, 3, 4], [5, 6, 7, 8], appendBlocks, deleteBlocks)

    expect(a).toEqual([{ list: [5, 6, 7, 8], after: null}])
    expect(b).toEqual([1, 2, 3, 4])
  })
})

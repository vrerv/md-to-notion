import { removeMarkdownLinks } from "../src/read-md"

describe("removeMarkdownLinks", () => {
  it("removes markdown links and keeps the link text", () => {
    const content = "This is a [link](./section) in markdown."
    const result = removeMarkdownLinks(content)
    expect(result).toBe("This is a link in markdown.")
  })

  it("removes multiple markdown links and keeps the link texts", () => {
    const content =
      "Here is a [link1](./section1) and another [link2](./section2)."
    const result = removeMarkdownLinks(content)
    expect(result).toBe("Here is a link1 and another link2.")
  })

  it("returns the same content if there are no markdown links", () => {
    const content = "This content has no links."
    const result = removeMarkdownLinks(content)
    expect(result).toBe(content)
  })

  it("handles empty content", () => {
    const content = ""
    const result = removeMarkdownLinks(content)
    expect(result).toBe("")
  })

  it("remove link if it contains space", () => {
    const content = "* [Internal Link To Doc1](./doc1.md)"
    const result = removeMarkdownLinks(content)
    expect(result).toBe("* Internal Link To Doc1")
  })

  it("handles content with only markdown links", () => {
    const content = "[link1](./section1) [link2](./section2)"
    const result = removeMarkdownLinks(content)
    expect(result).toBe("link1 link2")
  })

  it("keep anchor links", () => {
    const content = "follow [link1](#section1)"
    const result = removeMarkdownLinks(content)
    expect(result).toBe("follow [link1](#section1)")
  })

  it("keeps external links starting with http or https", () => {
    const content =
      "This is an [external link](https://example.com) in markdown."
    const result = removeMarkdownLinks(content)
    expect(result).toBe(
      "This is an [external link](https://example.com) in markdown."
    )
  })
})

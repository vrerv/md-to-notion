import {
  removeMarkdownLinks,
  replaceInternalMarkdownLinks,
} from "../src/replace-links"

describe("replaceInternalMarkdownLinks", () => {
  const linkMap = new Map<string, string>([
    ["./docs/intro", "https://example.com/docs/intro"],
    ["./docs/setup/index", "https://example.com/docs/setup/index"],
    ["./src/test", "https://example.com/src/test"],
    ["./root", "https://example.com/root"],
  ])

  it("replaces markdown links with corresponding URLs from linkMap", () => {
    const markdownContent =
      "This is an [introduction](docs/intro) and [setup guide](./docs/setup/index)."
    const filePathFromRoot = "./README.md"
    const result = replaceInternalMarkdownLinks(
      markdownContent,
      linkMap,
      filePathFromRoot
    )
    expect(result).toBe(
      "This is an [introduction](https://example.com/docs/intro) and [setup guide](https://example.com/docs/setup/index)."
    )
  })

  it("returns original markdown link if no match in linkMap", () => {
    const markdownContent = "This is an [unknown link](docs/unknown)."
    const filePathFromRoot = "src/README.md"
    const result = replaceInternalMarkdownLinks(
      markdownContent,
      linkMap,
      filePathFromRoot
    )
    expect(result).toBe("This is an [unknown link](docs/unknown).")
  })

  it("returns original markdown link if it is external link", () => {
    const markdownContent = "This is an [VReRV](https://github.com/vrerv)."
    const filePathFromRoot = "src/README.md"
    const result = replaceInternalMarkdownLinks(
      markdownContent,
      linkMap,
      filePathFromRoot
    )
    expect(result).toBe("This is an [VReRV](https://github.com/vrerv).")
  })

  it("resolves relative links correctly", () => {
    const markdownContent = "This is a [relative link](../docs/intro)."
    const filePathFromRoot = "src/README.md"
    const result = replaceInternalMarkdownLinks(
      markdownContent,
      linkMap,
      filePathFromRoot
    )
    expect(result).toBe(
      "This is a [relative link](https://example.com/docs/intro)."
    )
  })

  it("resolves relative .. links correctly", () => {
    const markdownContent = "This is a [relative link](../root)."
    const filePathFromRoot = "src/README.md"
    const result = replaceInternalMarkdownLinks(
      markdownContent,
      linkMap,
      filePathFromRoot
    )
    expect(result).toBe("This is a [relative link](https://example.com/root).")
  })

  it("resolves relative . links correctly", () => {
    const markdownContent = "This is a [relative link](./test)."
    const filePathFromRoot = "src/README.md"
    const result = replaceInternalMarkdownLinks(
      markdownContent,
      linkMap,
      filePathFromRoot
    )
    expect(result).toBe(
      "This is a [relative link](https://example.com/src/test)."
    )
  })

  it("resolves relative current links correctly", () => {
    const markdownContent = "This is a [relative link](test)."
    const filePathFromRoot = "src/README.md"
    const result = replaceInternalMarkdownLinks(
      markdownContent,
      linkMap,
      filePathFromRoot
    )
    expect(result).toBe(
      "This is a [relative link](https://example.com/src/test)."
    )
  })

  it("handles links with special characters", () => {
    const specialLinkMap = new Map<string, string>([
      [
        "./src/docs/special%20chars",
        "https://example.com/docs/special%20chars",
      ],
    ])
    const markdownContent = "This is a [special link](docs/special%20chars)."
    const filePathFromRoot = "src/README.md"
    const result = replaceInternalMarkdownLinks(
      markdownContent,
      specialLinkMap,
      filePathFromRoot
    )
    expect(result).toBe(
      "This is a [special link](https://example.com/docs/special%20chars)."
    )
  })
})

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

import { replaceInternalMarkdownLinks } from "../src/replace-links"

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

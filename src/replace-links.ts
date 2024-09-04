// Regular expression to match markdown links: [text](link)
export const MARKDOWN_LINK_REGEX = /\[([^\]]+)]\(((?!(#|https?:\/\/))[^)]+)\)/g

export function replaceInternalMarkdownLinks(
  markdownContent: string,
  linkMap: Map<string, string>,
  filePathFromRoot: string
): string {
  // Replace markdown links with corresponding URLs from linkMap
  return markdownContent.replace(MARKDOWN_LINK_REGEX, (match, text, link) => {
    // Resolve the link path based on filePathFromRoot
    const resolvedLinkPath = resolveLinkPath(filePathFromRoot, link)
    const key = resolvedLinkPath.replace(".md", "") // Remove the .md extension
    const url = linkMap.get(key)
    if (url) {
      return `[${text}](${url})`
    }
    // If no match in the map, return the original match
    return match
  })
}

// Helper function to resolve link paths based on the filePathFromRoot and relative links
function resolveLinkPath(filePathFromRoot: string, link: string): string {
  // Create an array from the file path and resolve the relative link
  const filePathSegments = filePathFromRoot.split("/")
  const linkSegments = link.split("/")

  // If the link starts with "..", navigate up the directories
  while (linkSegments[0] === "..") {
    linkSegments.shift() // Remove the ".."
    filePathSegments.pop() // Navigate up the parent directory
  }
  // Remove file name
  filePathSegments.pop()

  if (linkSegments[0] === ".") {
    linkSegments.shift() // Remove the "."
  }
  if (filePathSegments[0] === ".") {
    filePathSegments.shift() // Remove the "."
  }

  // Combine the remaining segments
  return [".", ...filePathSegments, ...linkSegments].join("/")
}

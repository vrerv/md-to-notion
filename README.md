<div align="center">
	<h1>MD to Notion</h1>
	<p>
		<b>An upload of markdown files to a hierarchy of Notion pages.</b>
	</p>
	<br>
</div>

![Build status](https://github.com/vrerv/md-to-notion/actions/workflows/ci.yml/badge.svg)
[![npm version](https://badge.fury.io/js/%40vrerv%2Fmd-to-notion.svg)](https://www.npmjs.com/package/@vrerv/md-to-notion)

## Features

- [x] Upload markdown files to Notion pages with hierarchy
- [x] Update existing pages if the file name is same
      this is slow as it needs to fetch all pages and remove all blocks before update the page (you can delete whole page before running this to create new pages rather updates)
- [ ] Upload images to Notion
- [ ] internal links are converted to Notion page links
- [ ] only updates the blocks if the content is changed

## Usage

See [Example Project](./examples/example-project) for live example

### CLI

```bash
npx @vrerv/md-to-notion --help
```

## Requirements

This package supports the following minimum versions:

- Runtime: `node >= 14`
- Type definitions (optional): `typescript >= 4.5`

Earlier versions may still work, but we encourage people building new applications to upgrade to the current stable.

## References

- [notion-sdk-js](https://github.com/makenotion/notion-sdk-js)
- [martian](https://github.com/tryfabric/martian)
- [markdown2notion](https://github.com/Rujuu-prog/markdown2notion) - Initially I tried to use this but need more feature for my use case

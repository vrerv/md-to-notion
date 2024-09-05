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
- [x] Update existing pages if the file name is same. only update changed blocks.
- [x] internal links are converted to Notion page links
- [ ] Upload images to Notion

## Usage

You need to get Notion API secret and page ID to upload your markdown files.
Follow this [guide](./docs/configure-notion.md) to get the secret and page ID.

See [Example Project](./examples/example-project) for live example

### CLI

```bash
npx @vrerv/md-to-notion --help
```

This project markdown files are also published as Notion pages by this package.
You can see the [md-to-notion Notion Page](https://vrerv.notion.site/MD-To-Notion-e85be6990664452b8669c72d989ce258)

## Requirements

This package supports the following minimum versions:

- Runtime: `node >= 15`
- Type definitions (optional): `typescript >= 4.5`

Earlier versions may still work, but we encourage people building new applications to upgrade to the current stable.

## References

- [notion-sdk-js](https://github.com/makenotion/notion-sdk-js)
- [martian](https://github.com/tryfabric/martian)
- [markdown2notion](https://github.com/Rujuu-prog/markdown2notion) - Initially I tried to use this but need more feature for my use case

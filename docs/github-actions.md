# GitHub Actions

You can automatically deploy your markdown files to Notion using GitHub Actions. This project uses a similar [GitHub Action](../.github/workflows/cd.yml) to update its own documentation on Notion.

Use the following workflow as a template:

Create a workflow file, for example, at `.github/workflows/deploy-docs.yml`, with the following content:

```yml
name: Deploy docs

on:
  push:
    branches:
      - main
    paths:
      - "**/*.md"
  # manually run workflow
  workflow_dispatch:

jobs:
  deploy-docs-to-notion:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2
      - run: |
          npx @vrerv/md-to-notion \
          -t ${{ secrets.NOTION_API_TOKEN }} \
          -p ${{ secrets.MD_TO_NOTION_PAGE_ID }} \
          -g ${{ github.repository }}/blob/${{ github.ref_name }} \
          -v .
```

- Set the `NOTION_API_TOKEN` and `MD_TO_NOTION_PAGE_ID` secrets in your repository settings.
- The `-g` option converts relative GitHub file links (like `../path/to/file.md`) into absolute URLs based on your repository and branch.

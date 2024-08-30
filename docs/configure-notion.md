# Configure Notion

## Create internal Notion Integration

You can create your own integration in Notion and get the secret.

To create new integration or see your integration secret, go to the [My Integrations](https://www.notion.so/my-integrations) page in your Notion account.

![My Integrations](https://github.com/vrerv/md-to-notion/blob/main/docs/notion-my-integrations.png?raw=true)

Create a new **Internal** Integration and get the secret if you don't have one.
Once you get the secret, you can set it as an environment variable `NOTION_API_TOKEN` to use `md-to-notion`

add the following line to your ~/.profile or ~/.bashrc or ~/.zshrc file

```bash
export NOTION_API_TOKEN=<your-token>
```

## Connect your Integration to Notion page

Create a Notion page and connect your Integration to that page.

To connect your integration to a page,
you need to go to the page and click three dots on the top right corner
and hover over `Connect to` and select your integration.

![Connect to Integration](https://github.com/vrerv/md-to-notion/blob/main/docs/notion-page-connect-popup-menu.png?raw=true)

Find the page ID from the URL of the page. If page url is `https://www.notion.so/Page-Title-1234567890abcdef1234567890abcdef` then the page ID is `1234567890abcdef1234567890abcdef`.

Now you can use this page ID to upload your markdown files.

## Reference

- [official notion documentation](https://developers.notion.com/docs/getting-started)

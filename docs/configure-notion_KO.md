# 노션 설정하기

## 내부 통합 생성

노션에서 내부 API 통합을 생성하고 시크릿을 얻을 수 있습니다.

새로운 통합을 생성하거나 시크릿을 확인하려면 노션 계정의 [내 통합](https://www.notion.so/my-integrations) 페이지로 이동하십시오.

![My Integrations](https://github.com/vrerv/md-to-notion/blob/main/docs/notion-my-integrations.png?raw=true)

API 사용을 위한 새로운 내부 통합을 생성하고 API 호출을 위한 시크릿을 얻으세요.
API 시크릿을 얻었으면, 그값을 환경변수 `NOTION_API_TOKEN` 으로 설정하여 `md-to-notion`을 사용할 수 있습니다.

bash 나 zsh 를 사용하면 아래와 같이 환경변수를 설정할 수 있습니다.

```bash
export NOTION_API_TOKEN=<your-token>
```

## 노션 페이지에 통합 연결하기

노션 페이지를 생성하고 통합을 연결하세요.

생성된 API 통합을 통해 페이지를 변경하려면, 페이지에 해당 통합을 연결해야 합니다.
연결하기 위해서는 연결하려는 노션 페이지로 이동해서 페이지 우측 상단의 세개의 점을 클릭하고 `Connect to`를 선택하고 만들어놓은 API 통합을 선택하세요.

![Connect to Integration](https://github.com/vrerv/md-to-notion/blob/main/docs/notion-page-connect-popup-menu.png?raw=true)

페이지 URL에서 페이지 ID를 찾으세요. 페이지 URL이 `https://www.notion.so/Page-Title-1234567890abcdef1234567890abcdef` 이면 페이지 ID는 `1234567890abcdef1234567890abcdef` 입니다.

이제 이 페이지 ID를 사용하여 마크다운 파일을 업로드할 수 있습니다.

## Reference

- [official notion documentation](https://developers.notion.com/docs/getting-started)

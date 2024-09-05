<div align=“center”>
	<h1>MD to Notion</h1>
	<p>
		<b>마크다운 파일을 디렉토리 구조대로 스캔해서 노션페이지에 동일 구조대로 올립니다.</b>
	</p>
	<br>
</div>

![Build status](https://github.com/vrerv/md-to-notion/actions/workflows/ci.yml/badge.svg)
[![npm version](https://badge.fury.io/js/%40vrerv%2Fmd-to-notion.svg)](https://www.npmjs.com/package/@vrerv/md-to-notion)

[🇰🇷 (한국어)](./README_KO.md) | [🇬🇧 (English)](./README.md)

## Features

- [x] 로컬 마크다운 파일을 노션 페이지로 디렉토리 구조를 유지한채 모두 업로드합니다.
- [x] 파일이름이 같은 파일은 블록 단위로 업데이트 합니다.
- [x] 내부 마크다운파일 링크는 노션의 생성된 페이지 링크로 바꿉니다.
- [ ] 로컬 이미지를 노션에 업로드합니다.

## Usage

노션의 API 시크릿과 페이지 ID를 얻어야 마크다운 파일을 업로드할 수 있습니다.
이 [가이드](./docs/configure-notion_KO.md)를 따라 시크릿과 페이지 ID를 얻으세요.

작동하는 [예제 프로젝트](./examples/example-project)를 확인하세요.

### CLI (명령행 인터페이스)

```bash
npx @vrerv/md-to-notion --help
```

노션의 페이지로 현재 디렉토리의 모든 마크다운 파일을 업데이트합니다.

```bash
npx @vrerv/md-to-notion -t <notion-api-secret> -p <notion-page-id> .
```

이 프로젝트 마크다운 파일은 이 패키지에 의해 노션 페이지로도 게시됩니다.
[md-to-notion 노션 페이지](https://vrerv.notion.site/MD-To-Notion-e85be6990664452b8669c72d989ce258)에서 확인할 수 있습니다.

## 요구 사항

이 패키지는 다음 최소 버전을 지원합니다:

- 런타임: `노드 >= 15`
- 유형 정의(선택 사항): `typescript >= 4.5`

이전 버전도 여전히 작동할 수 있지만 새 애플리케이션을 구축하는 사용자는 현재 안정 버전으로 업그레이드하는 것이 좋습니다.

## 참조

- [notion-sdk-js](https://github.com/makenotion/notion-sdk-js)
- [martian](https://github.com/tryfabric/martian)
- [markdown2notion](https://github.com/Rujuu-prog/markdown2notion) - 처음에 이것을 사용하려고 했지만 사용 사례에 더 많은 기능이 필요했습니다.

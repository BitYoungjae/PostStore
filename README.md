# PostStore

`PostStore` 는 `NEXT.JS` 와 함께 `블로그`를 위시한 `마크다운 기반의 문서 페이지`를 보다 쉽게 제작하기 위한 도구입니다.

## 장점

1. 디렉터리 구조에 기반한 카테고리 기능을 제공하여 굳이 마크다운 파일 내에 카테고리를 명시할 필요가 없습니다. `./Javascript/Snippets` 폴더에 위치한 게시물들은 모두 `Javascript -> Snippets` 라는 중첩된 카테고리를 가지게 됩니다.
2. 마크다운 문서가 저장된 특정 디렉터리를 분석하여, `NEXT.JS`의 `getStaticPaths`와 `getStaticProps`를 위한 `paths`와 `props`를 자동으로 생성합니다.
3. 마크다운 문서에 첨부된 이미지들은 굳이 `public` 디렉터리에 옮기지 않아도, 개발 모드와 프로덕션 빌드 단계에서 자동으로 빌드 결과물에 삽입됩니다. 즉, 상대경로 절대경로를 포함한 그 어떤 경로도 자유롭게 이미지 삽입을 위해 사용할 수 있습니다.
4. 180자 길이의 Excerpt가 마크다운 해석 과정 중 자동으로 생성되며, 마크다운 문서 편집 만으로 특정 이미지를 `Thumbnail`로 지정하거나 `Youtube 영상`을 첨부하는 것이 가능합니다.
5. 마크다운을 통해 파싱된 `html` 결과물은 검증된 [rehype-sanitize](https://github.com/rehypejs/rehype-sanitize) 플러그인의 기본 옵션을 사용하여 `XSS 공격`을 예방 하였습니다.
6. 타입 선언을 패키지 내에 자체적으로 내장하고 있어서, 타입스크립트와 함께 사용하기 용이합니다.

## 단점

1. 블로그 데이터에 대한 자유로운 커스터마이징이 필요하다면 이 라이브러리 사용을 재고해 보셔야 합니다.

## 설치

```bash
npm i poststore
```

## 사용법

`PostStore` 는 각 페이지의 목적에 맞는 `PageHandler`를 각각 제공합니다.

모든 `PageHandler`는 `NEXT.JS`의 `getStaticPaths`와 `getStaticProps`에 사용하기 위한 `Paths`와 `Props`를 제공합니다.

## PageHandler 분류

별도의 Paths 생성이 필요한 페이지와 불필요한 페이지 두 가지 핸들러로 분류가 됩니다.

### 별도의 Paths 생성이 필요한 페이지

- getPageHandler : `/page/[pageNum]` 에 대한 각각의 `Paths`와 `Props`를 생성하는데 사용됩니다.
- getPostPageHandler : `/posts/[PostSlug]` 에 대한 각각의 `Paths`와 `Props`를 생성하는데 사용됩니다.
- getCategoryPageHandler : `/categories/[...categories]` 에 대한 각각의 `Paths`와 `Props`를 생성하는데 사용됩니다.
- getTagPageHandler : `/tags/[..tags]` 에 대한 각각의 `Paths`와 `Props`를 생성하는데 사용됩니다.

상기의 핸들러들은 모두 동일한 `API` 를 사용합니다.

```tsx
import React from 'react';
import { getPostPageHandler, PostPageProp } from 'poststore';

const PostView: React.FC<PostPageProp> = (/* 생략 */) => {
  //... 컴포넌트 코드 생략
};

const { getPathsBySlug, getPropsBySlug } = getPostPageHandler({
  useConfig: true,
});

export async function getStaticPaths() {
  const paths = await getPathsBySlug();

  return {
    paths,
    fallback: false,
  };
}
export async function getStaticProps({ params: { post } }) {
  const props = await getPropsBySlug(post);

  return {
    props,
  };
}
```

### 별도의 Paths 생성이 불필요한 페이지

- getMainPageHandler : 메인 페이지를 위한 핸들러이며, `/page/1` 과 동일한 Props를 생성합니다.

```tsx
import { getMainPageHandler, ListPageProp } from 'poststore';
import PostList from 'components/molecules/PostList';

const Post = ({ main: { postList } }: ListPageProp) => {
  return (
    <>
      <PostList postList={postList} href='/blog/[post]' as='/blog/' />
    </>
  );
};

export default Post;

const { getMainProps } = getMainPageHandler({
  useConfig: true,
});

export async function getStaticProps() {
  const props = await getMainProps();

  return {
    props,
  };
}
```

## 사용 예시

### getPostPageHandler

개개의 마크다운 문서들을 위한 `Paths`를 `Props`를 제공합니다.

```tsx
import Link from 'next/link';
import { getPostPageHandler, PostPageProp } from 'poststore';

const Post = ({
  param,
  main: {
    postData: { title, html, date, prevPost, excerpt, thumbnail, nextPost },
  },
}: PostPageProp) => {
  return (
    <>
      <h1>
        {title} - {param}
      </h1>
      <h2>{new Date(date).toLocaleString()}</h2>
      {excerpt && <h2>요약 : {excerpt}</h2>}
      {thumbnail && <h2>썸네일 : {thumbnail}</h2>}
      <div className='article' dangerouslySetInnerHTML={{ __html: html }}></div>
      {prevPost && (
        <Link href='/blog/[post]' as={`/blog/${prevPost.slug}`}>
          <a>이전 포스트 : {prevPost.title}</a>
        </Link>
      )}
      {nextPost && (
        <Link href='/blog/[post]' as={`/blog/${nextPost.slug}`}>
          <a>다음 포스트 : {nextPost.title}</a>
        </Link>
      )}
    </>
  );
};

export default Post;

const { getPathsBySlug, getPropsBySlug } = getPostPageHandler({
  useConfig: true,
});

export async function getStaticPaths() {
  const paths = await getPathsBySlug();

  return {
    paths,
    fallback: false,
  };
}
export async function getStaticProps({ params: { post } }) {
  const props = await getPropsBySlug(post);

  return {
    props,
  };
}
```

## 테스트

## jest 단위 테스트

```bash
npm test
```

![jest 테스트](images/jest.jpg)

### 스냅샷 테스트

- 스냅샷 링크 : [스냅샷 디렉터리](tests/snapshot)
- 스냅샷 테스트 함수 목록 : [스냅샷 함수들](scripts/snapshotLIst/list.ts)

```bash
npm run snapshot update
```

![스냅샷 업데이트](images/snapshot-cli-update.jpg)

```bash
npm run snapshot test
```

![스냅샷 테스트](images/snapshot-cli-test.jpg)

```bash
npm run snapshot all
```

![스냅샷 일괄진행](images/snapshot-cli-all.jpg)

## 주요 기록

### 2020-07-07

- Watch mode 구현 완료
  - 기존 포스트 수정시 Store 재생성 없이 해당 PostData 객체만 업데이트.
  - 다중 Store 의 경우 별개의 watcher가 지원됨.
- 마크다운 관련 편의기능 추가
  - 마크다운을 통해 Youtube 영상을 첨부할 수 있는 기능 추가.
    - Youtube 링크를 삽입하면서 url 뒤에 !!를 붙일 경우 링크가 아닌 `iframe` 요소로 삽입됨.
  - 상대 경로로 이미지 삽입이 가능하도록 수정.
    - 마크다운 파싱 과정에서 해당 마크다운에 사용된 이미지 asset들을 수집.
    - store 생성시 public/assets 폴더로 일괄 전송

### 2020-07-03

- 게시물 이름이 중복되는 경우에 대한 핸들링 추가.
  - 중복될 경우 hash를 붙이되, hash는 우선 경로 단위, 동일 경로에도 중복이 발생될 경우 salt를 늘려가며 재귀적 변경.
  - [관련 코드 링크](src/postParser.ts#L108-L128)
  - [스냅샷 링크](tests/snapshot/etc/duplicatedNames.snapshot.json)
- Multiple Store 기능 추가
  - 서로 다른 경로를 갖는 다수의 store 를 생성함으로써, 하나의 프로젝트에서 다수의 서브 페이지를 생성할 수 있게됨.
  - 하나의 프로젝트에서 블로그 관련, 기술 문서 관련 store를 별개로 생성해 관리 가능.
  - `perPageOption` 추가. 리스트 페이지 별로 페이지 당 게시물 출력 수를 각각 지정 가능.

#### 현재 기준 구현된 Configuration

```ts
interface PostStoreConfig {
  storeOption: {
    [key: string]: {
      path: string;
      shouldUpdate: boolean;
      incremental: boolean;
      perPage: {
        category: number;
        tag: number;
        page: number;
      };
      pageParam: {
        post: string;
        category: string;
        tag: string;
        page: string;
      };
    };
  };
}
```

### 2020-07-02

- 증분 빌드 초안 구현 ([src/utils/incrementalBuild.ts](src/utils/incrementalBuild.ts))
- 개발 모드 식별을 위한 환경변수 `MODE_DEV` 추가 ([src/common.ts](src/common.ts))
- tsConfig 기준 code quality 관련 옵션 추가 및 해당 옵션에 맞는 코드 리팩터링 진행.
- 카테고리 순서와 게시물 순서의 일관성을 유지하기 위해 트리 생성시 정렬 기능 추가.
  - [src/utils/getNodeTree.ts 코드](src/utils/getNodeTree.ts#L82-L115)
  - [sortTest 스냅샷 링크](tests/snapshot/tree/sortTest.snapshot.json)
- 스냅샷 테스트 관련 cli 추가

### 2020-07-01

**`PostStore` 를 별도의 모듈로 분리하였습니다.**

- `store` 생성 과정에서 `postData`에 대한 확장을 진행.
- `store`를 통해 생성된 `propList.post`의 경우 반환하는 `postData`에 대해 아래의 추가적인 확장 정보를 갖는다.
  - `relatedPosts` -> 카테고리 단위의 연관 게시물 목록
  - `prevPost`, `nextPost` -> 각각 카테고리 단위로 이전과 이후의 게시물의 `{title, slug}`를 갖는다.
  - `categories` -> 최하위 카테고리가 배열 형태로 저장된다. ex : `['javascript', '특별-시리즈']`
- 테스트 개선
  - 스냅샷 테스트를 별도의 유틸로 분리함.
  - `store.propList` 및 `getNodeTree` 스냅샷 테스트 추가
    - [getNodeTree 스냅샷 링크](tests/snapshot/tree/fileTree.snapshot.json)
    - [propList.global 스냅샷 링크](tests/snapshot/propList/global.snapshot.json)
    - [propList.category 스냅샷 링크](tests/snapshot/propList/category.snapshot.json)
    - [propList.tag 스냅샷 링크](tests/snapshot/propList/tag.snapshot.json)
    - [propList.page 스냅샷 링크](tests/snapshot/propList/page.snapshot.json)
    - [propList.post 스냅샷 링크](tests/snapshot/propList/post.snapshot.json)

### 2020-06-30

- postStore 구조 정립 및 하기 내용 구현완료
  - store.pathList
    - store.pathList.post -> getStaticPaths에 사용될 게시물 path list
    - store.pathList.category -> getStaticPaths에 사용될 category의 path list
    - store.pathList.tag -> getStaticPaths에 사용될 tag path list
    - store.pathList.page -> getStaticPaths에 사용될 page path list
  - store.propList
    - store.propList.category -> getStaticProps에 사용될 category의 prop list
    - store.propList.tag -> getStaticProps에 사용될 tag prop list
    - store.propList.page -> getStaticProps에 사용될 page prop list
    - store.propList.post -> getStaticProps에 사용될 post prop list
  - store.propList.global -> 각종 전역 데이터
    - store.propList.global.postCount -> 전체 게시물 갯수
    - store.propList.global.categoryCount -> 전체 category 갯수
    - store.propList.global.tagCount -> 전체 tag 갯수

### 2020-06-29

- 트리 탐색을 위한 헬퍼 함수들 작성함.
  - visit.tsx
    - visit 함수
    - findNode 함수
    - findeNodeAll 함수
- postStore 초안 구현완료
  - getCategoriesPath 함수
    - next.js에서 category 관련 path를 생성하기 위한 목적.
  - getPostsByCategories 함수
    - 카테고리 배열로부터 해당 카테고리에 속한 포스트들을 가져오기 위한 목적.

### 2020-06-25

- rehype용 prism.js 플러그인 제작함
  - prism.js로 하이라이트된 코드를 정적 생성하기 위한 플러그인임.
- postParser 초기 구현 완료
- 간단한 형태의 slugify 모듈 제작함.
- lib/getNodeTree.tsx 구현 완료
  - posts 폴더를 스캔하여 하부 디렉터리를 카테고리로 하위 마크다운 파일을 포스트로 하는 트리를 생성한다.
  - [테스트 디렉터리](tests/testPosts)
  - [스냅샷 링크](tests/snapshot/tree/fileTree.snapshot.json)

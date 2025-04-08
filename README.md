<div id="top"></div>

# WebImagePro

画像をネット上にアップロードし、加工・圧縮等の機能を利用することが出来るwebアプリです。

## 使用技術一覧

[![Netlify Status](https://api.netlify.com/api/v1/badges/61248f07-42b9-4f1b-b212-7665ed6a2396/deploy-status)](https://app.netlify.com/sites/webimagepro/deploys)

<p style="display: inline">
  <!-- フロントエンドフレームワーク -->
	<a href="https://nextjs.org/" target="_blank">
		<img src="https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white">
  </a>
	<a href="https://reactjs.org/" target="_blank">
    <img src="https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB">
  </a>
  <a href="https://tailwindcss.com/" target="_blank">
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white">
  </a>

  <!-- プログラミング言語 -->
  <a href="https://www.typescriptlang.org/" target="_blank">
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white">
  </a>
  <a href="https://www.rust-lang.org/" target="_blank">
    <img src="https://img.shields.io/badge/Rust-000000?style=flat&logo=rust&logoColor=white">
  </a>

  <!-- バックエンド/データベース -->
  <a href="https://supabase.com/" target="_blank">
    <img src="https://img.shields.io/badge/Supabase-181818?style=flat&logo=supabase&logoColor=white">
  </a>

  <!-- WebAssembly -->
  <a href="https://webassembly.org/" target="_blank">
    <img src="https://img.shields.io/badge/WebAssembly-654FF0?style=flat&logo=webassembly&logoColor=white">
  </a>
  <a href="https://github.com/rustwasm/wasm-bindgen" target="_blank">
    <img src="https://img.shields.io/badge/wasm--bindgen-654FF0?style=flat&logo=webassembly&logoColor=white">
  </a>

  <!-- テスト/開発ツール -->
  <a href="https://storybook.js.org/" target="_blank">
    <img src="https://img.shields.io/badge/Storybook-FF4785?style=flat&logo=storybook&logoColor=white">
  </a>
  <a href="https://vitest.dev/" target="_blank">
    <img src="https://img.shields.io/badge/Vitest-6E9F18?style=flat&logo=vitest&logoColor=white">
  </a>
  <a href="https://playwright.dev/" target="_blank">
    <img src="https://img.shields.io/badge/Playwright-2EAD33?style=flat&logo=playwright&logoColor=white">
  </a>
</p>

## 環境

### アーキテクチャ図

![アーキテクチャ図](./docs/architecture.png)

## ディレクトリ構成

```sh
$ tree -a -I ".next|.storybook|.task|.vscode|node_modules|.git|target" -L 3 | sed 's/│/|/g; s/├──/|--/g; s/└──/`--/g' | sed 's/|--/├──/g'
.
├── .env.example
├── .env.local
├── .gitignore
├── README.md
├── Taskfile.yml
├── components.json
├── docs
|   |                                               `-- architecture.drawio
|                                                   `-- architecture.png
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── public
|   |                                               `-- file.svg
|   |                                               `-- globe.svg
|   |                                               `-- next.svg
|   |                                               `-- vercel.svg
|                                                   `-- window.svg
├── src
|   |                                               `-- app
|   |   |                                           `-- api
|   |   |                                           `-- contact
|   |   |                                           `-- favicon.ico
|   |   |                                           `-- gallery
|   |   |                                           `-- globals.css
|   |   |                                           `-- layout.tsx
|   |   |                                           `-- login
|   |   |                                           `-- page.tsx
|   |   |                                           `-- privacy
|   |   |                                           `-- profile
|   |   |                                           `-- settings
|   |   |                                           `-- terms
|   |                                               `-- upload
|   ├── components
|   |   |                                           `-- ImageCliper.tsx
|   |   |                                           `-- ImageCliperControls.tsx
|   |   |                                           `-- ImageColorAjustment.tsx
|   |   |                                           `-- ImageComposition.tsx
|   |   |                                           `-- ImageEditor.tsx
|   |   |                                           `-- ImageFilter.tsx
|   |   |                                           `-- ImageGallery.tsx
|   |   |                                           `-- ImageList.tsx
|   |   |                                           `-- ImagePreviewList.tsx
|   |   |                                           `-- ImageResizer.tsx
|   |   |                                           `-- ImageTransform.tsx
|   |   |                                           `-- ImageUpload.tsx
|   |   |                                           `-- ImageUploadActions.tsx
|   |   |                                           `-- common
|   |   |                                           `-- form
|   |                                               `-- ui
|   ├── lib
|   |   |                                           `-- api.ts
|   |   |                                           `-- azure-storage.ts
|   |   |                                           `-- constants.ts
|   |   |                                           `-- stripe.ts
|   |   |                                           `-- supabase.ts
|   |                                               `-- utils.ts
|   ├── middleware.ts
|   ├── pkg
|   |   |                                           `-- .gitignore
|   |   |                                           `-- package.json
|   |   |                                           `-- wasm.d.ts
|   |   |                                           `-- wasm.js
|   |   |                                           `-- wasm_bg.wasm
|   |                                               `-- wasm_bg.wasm.d.ts
|   ├── providers
|   |                                               `-- ThemeProvider.tsx
|   ├── store
|   |                                               `-- useAuthStore.ts
|   `-- types
|       |                                           `-- types.ts
|                                                   `-- wasm-module.d.ts
├── tsconfig.json
├── vitest.config.ts
`-- wasm
    ├── .gitignore
    ├── Cargo.lock
    ├── Cargo.toml
    ├── fonts
    `-- src
        |                                           `-- brightness_adjustment
        |                                           `-- color_adjustment
        |                                           `-- color_conversion.rs
        |                                           `-- filter_effects
        |                                           `-- image_composition
        |                                           `-- image_operations
                                                    `-- lib.rs

30 directories, 60 files
```
<p align="right">(<a href="#top">トップへ</a>)</p>

## 開発環境構築

### リポジトリをクローンする
```sh
> git clone
```

### taskfileのインストール
```sh
> brew install taskfile
```

### クローンしたリポジトリを開き、パッケージをインストール
```sh
> npm install
```

### taskコマンドを実行し、wasmをビルド
```sh
> task build:wasm
```

### 開発サーバーの起動
```sh
> npm run dev
```

<p align="right">(<a href="#top">トップへ</a>)</p>
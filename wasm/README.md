# @araki777/wasm-image-pro

WebAssemblyによる高速な画像処理ライブラリです。

## 主な機能

- **画像の基本操作**
  - 回転、リサイズ、反転、トリミング、フォーマット変換（JPEG/PNG等）

- **画像合成・加工**
  - 画像の合成
  - 透過化
  - ウォーターマーク・スタンプの追加

- **フィルター・エフェクト**
  - ぼかし（Blur）、エッジ検出、HDR、ノイズ除去、モザイク、油絵風、シャープ、ビネット など

- **色調・明るさ調整**
  - セピア、彩度、カラーバランス、グレースケール、ガンマ補正、コントラスト、明るさ、反転、しきい値

- **AI画像認識**
  - 物体検出（YOLOベース）
  - 顔検出（ランドマーク抽出含む）

---

Rust + WebAssemblyによる高速な画像処理を、Node.jsやブラウザから簡単に利用できます。

## インストール

このパッケージはGithub Packages（プライベートリポジトリ）で管理されています。
**インストールにはGithubのアクセストークン（`NPM_TOKEN`）が必要です。**

### 1. アクセストークンの取得

- パッケージ管理者からGitHubアクセストークン（`NPM_TOKEN`）を発行してもらってください。

### 2. 環境変数の設定

シェルで以下のように環境変数を設定してください。

**Linux/macOS**
```bash
export NPM_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Windows（PowerShell）:**
```powershell
$env:NPM_TOKEN="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### 3. インストールコマンド

```bash
npm install @araki777/wasm-image-pro
```

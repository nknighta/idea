# My Idea - GitHub Pages対応のアイデア管理ツール

GitHub認証を使用したアイデア管理ツールです。nknightaユーザーのみがアイデアの編集を行え、日付ごとにマークダウンファイルとしてGitHubリポジトリに保存できます。

## 機能

- GitHub認証（Personal Access Token方式）
- アイデアの表示・追加・編集・削除
- 権限管理（nknightaユーザーのみ編集可能）
- **GitHub同期機能**
  - 日付ごとにマークダウンファイル（`ideas/YYYY-MM-DD.md`）として保存
  - 自動同期および手動同期
  - GitHubリポジトリからの読み込み
- GitHub Pages対応

## セットアップ

### 1. 開発環境

```bash
npm install
npm run dev
```

### 2. GitHub Pagesへのデプロイ

1. GitHubリポジトリの設定で Pages を有効化
2. Source を "GitHub Actions" に設定
3. コードをpushすると自動的にデプロイされます

### 3. GitHub Personal Access Token の取得

1. [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. "Generate new token" をクリック
3. 以下の権限を付与:
   - `read:user` - ユーザー情報の読み取り
   - `repo` - リポジトリへの読み書き（同期機能用）
4. トークンを安全に保存

## 使用方法

### 基本的な使用方法

1. サイトにアクセス
2. "GitHubでログイン" をクリック
3. Personal Access Token を入力
4. nknightaユーザーの場合、アイデアの編集が可能になります

### GitHub同期の設定

1. ログイン後、「リポジトリを設定」をクリック
2. オーナー名（GitHubユーザー名）を入力
3. リポジトリ名を入力
4. 「接続」をクリック

### アイデアの管理

- **追加**: 新しいアイデアを追加すると自動的にその日のマークダウンファイルに保存
- **編集**: 既存のアイデアを編集すると自動的に同期
- **削除**: アイデアを削除すると自動的に同期
- **手動同期**: 「手動同期」ボタンでいつでも同期可能

## マークダウンファイル形式

```markdown
# アイデア - 2025-01-15

## アイデアタイトル1

アイデアの詳細説明...

*作成日: 2025/1/15*

---

## アイデアタイトル2

別のアイデアの詳細説明...

*作成日: 2025/1/15*

---
```

## 技術仕様

- Next.js 15
- TypeScript
- GitHub API (Octokit)
- LocalStorage + GitHub同期（ハイブリッド）
- GitHub Pages（静的ホスティング）

## 同期の仕組み

1. **自動同期**: アイデアの追加・編集・削除時に自動的にGitHubに保存
2. **読み込み**: ページロード時にGitHubから最新データを取得
3. **フォールバック**: GitHub接続に失敗した場合はLocalStorageを使用
4. **日付別管理**: `ideas/YYYY-MM-DD.md` 形式で日付ごとにファイルを作成

## 注意事項

- Personal Access Tokenは安全に管理してください
- `repo` 権限が必要です（リポジトリの読み書きのため）
- 同期先のリポジトリは事前に作成しておく必要があります
- GitHub APIの利用制限にご注意ください

## ディレクトリ構造

```
my-idea/
├── components/
│   ├── GitHubAuth.tsx    # GitHub認証コンポーネント
│   ├── GitHubSync.tsx    # GitHub同期設定
│   └── IdeaFeed.tsx      # アイデアフィード
├── utils/
│   └── github.ts         # GitHub API ユーティリティ
├── pages/
│   ├── index.tsx         # メインページ
│   ├── global.css        # グローバルスタイル
│   └── _app.tsx          # Next.js App
├── .github/
│   └── workflows/
│       └── deploy.yml    # GitHub Actions設定
├── next.config.ts        # Next.js設定
└── package.json
```

## 同期先リポジトリの構造

```
your-repo/
└── ideas/
    ├── 2025-01-15.md
    ├── 2025-01-16.md
    └── ...
```

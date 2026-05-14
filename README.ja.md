# Biwa Press (日本語)

SvelteKit、Tailwind CSS 4、Bits UI、mdsvex、および柔軟なレンダリングモードを備えた、VitePress にインスパイアされたドキュメントフレームワークのスターターテンプレートです。

## 特徴

- ⚡️ **Svelte 5 & SvelteKit**: モダンでリアクティブ、かつ高速。
- 🎨 **Tailwind CSS 4**: 最新のユーティリティファースト CSS フレームワーク。
- 📝 **mdsvex**: Markdown 内で Svelte コンポーネントを使用可能。
- 🔍 **組み込み検索**: 高速なクライアントサイド検索機能。
- 🌐 **多言語対応**: i18n サポートを内蔵（英語、中国語、日本語）。
- 🛠️ **柔軟なレンダリング**: SSG、SSR、CSR モードをサポート。

## 開発

```bash
npm install
npm run dev
```

## ビルドとデプロイ

Biwa Press は環境変数を通じて複数のレンダリングモードをサポートしています。

### 1. SSG (静的サイト生成) - 推奨
`build/ssg/` ディレクトリに完全な静的サイトを生成します。GitHub Pages や Vercel へのデプロイに最適です。
```bash
npm run build:ssg
npm run preview:ssg
npm run package:ssg
```

### 2. SSR (サーバーサイドレンダリング)
`build/ssr/` ディレクトリに Node.js サーバーを構築します。動的なサーバーロジックが必要な場合に使用します。
```bash
npm run build:ssr
npm run preview:ssr
npm run package:ssr
```

### 3. CSR (クライアントサイドレンダリング / SPA)
`build/csr/` ディレクトリに `index.html` フォールバックを備えたシングルページアプリケーション（SPA）を生成します。
```bash
npm run build:csr
npm run preview:csr
npm run package:csr
```

### ドキュメントキャッシュの更新

Biwa Press は、本番環境（SSR）でサイドバー構造と検索インデックスをキャッシュし、最高の応答速度を確保しています。VPS 上で SFTP などを使用して Markdown ファイルを更新した場合、Node.js プロセスを再起動することなく、以下の `curl` コマンドで強制的にキャッシュをクリアできます。

```bash
# <YOUR_TOKEN> を環境変数 REVALIDATE_TOKEN の値に置き換えてください。
# <YOUR_DOMAIN> を実際のドメインまたは IP に置き換えてください (例: your-domain.com または 192.168.1.100:3000)。
curl -X POST \
     -H "Authorization: Bearer <YOUR_TOKEN>" \
     https://<YOUR_DOMAIN>/api/refresh-cache
```

#### 設定に関する注意
1. **セキュリティ**：この API は `REVALIDATE_TOKEN` によって保護されています。VPS の環境変数（例: `.env` ファイル、pm2 設定ファイル、またはシステム環境変数）に強力なパスワードを設定してください。
2. **ローカルテスト**：
   ```bash
   curl -X POST -H "Authorization: Bearer your-secret-token" http://localhost:5173/api/refresh-cache
   ```
3. **適用範囲**：この操作により、サイドバーのディレクトリツリーが再スキャンされ、検索インデックスが再構築されます。

## メディア使用ガイド

Biwa Press は、画像の標準 Markdown 構文と、ビデオのカスタム拡張構文をサポートしています。

### 画像 (Images)

標準の Markdown 構文を使用します。画像ファイルは `static/` ディレクトリ（例：`static/images/`）に配置してください。

```markdown
![画像の説明](/images/your-image.jpg)
```

### ビデオ (Videos)

Biwa Press は、サイズ、アスペクト比、ポスター画像、遅延読み込みを制御できる拡張ビデオ埋め込み構文をサポートしています。

#### 構文
`::タイプタイトル{width=幅}{ratio=比率}{poster=ポスターのパス}{lazy}`

#### 1. ローカルビデオ
```markdown
::video[デモビデオ](/videos/1.mp4){width=300}{ratio=9:16}{poster=/videos/1.png}{lazy}
```

#### 2. YouTube ビデオ
```markdown
::youtube[ビデオタイトル](YouTube_Video_ID){width=600}{ratio=16:9}{lazy}
```

#### 3. Bilibili ビデオ
```markdown
::bilibili[ビデオタイトル](Bilibili_BV_ID){width=600}{ratio=16:9}{lazy}
```

#### パラメータ詳細
- **タイプ**: `video` (ローカルファイル), `youtube`, `bilibili` から選択。
- **{width=...}**: (オプション) ビデオの最大幅をピクセル単位で設定します。
- **{ratio=...}**: (オプション) アスペクト比を設定します（例：`16:9`, `9:16`, `4:3`）。
- **{poster=...}**: (オプション) ビデオのポスター画像を設定します。iOSデバイスでの白屏問題を解決するため、ローカルビデオには設定を強く推奨します。
- **{lazy}**: (オプション) 遅延読み込みモードを有効にします。ビデオがビューポートに入ると読み込みを開始し、ミュート状態で自動再生されます。
```
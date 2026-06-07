---
title: "インストール"
description: "Debian 13 に PostgreSQL 18 をインストールする方法 - 完全ガイド"
tags: ["データベース", "PostgreSQL 18", "プログラミング", "Debian 13"]
order: 1
---

Debian 13（Trixie）は PostgreSQL 18 をネイティブでサポートしています。データベースサーバーをインストールするには、公式 PGDG APT リポジトリを追加し、パッケージインデックスを更新して、apt install コマンドを実行します。

### ステップ 1: PostgreSQL リポジトリを追加する
公式 PostgreSQL リポジトリを追加します。

まず、必要な前提パッケージがインストールされていることを確認し、その後リポジトリ署名キーとソースリストを追加します。

```bash showLineNumbers
sudo apt install -y curl ca-certificates gnupg
curl -fsSL https://postgresql.org | sudo gpg --dearmor -o /usr/share/keyrings/postgresql-archive-keyring.gpg
sudo sh -c 'echo "deb [signed-by=/usr/share/keyrings/postgresql-archive-keyring.gpg] http://apt.postgresql.org/pub/repos/apt/ trixie-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
````

### ステップ 2: PostgreSQL 18 をインストールする
Debian のパッケージリストを更新し、PostgreSQL 18 サーバーおよび contrib モジュールをインストールします。

```bash showLineNumbers
sudo apt update
sudo apt install -y postgresql-18 postgresql-contrib-18
```

### ステップ 3: インストールを確認する
サービスを管理します。

PostgreSQL サービスが有効かつ実行中であることを確認し、システム起動時に自動起動するよう設定します。

```bash showLineNumbers
# サービスを起動し、自動起動を有効化
sudo systemctl enable --now postgresql

# ステータスを確認
sudo systemctl status postgresql
```

### ステップ 4: PostgreSQL シェルへアクセスする
PostgreSQL シェルへアクセスします。

PostgreSQL はデフォルトで postgres というシステムユーザーを作成します。データベース操作を開始するには、このユーザーへ切り替えて psql インタラクティブターミナルを開きます。

```bash showLineNumbers
sudo su - postgres
psql
```

ここから、以下のコマンドを実行して postgres スーパーユーザーにカスタムパスワードを設定できます。

```sql
ALTER USER postgres WITH PASSWORD 'your_secure_password';
```

`\q` と入力すると psql プロンプトを終了できます。その後 `exit` を実行すると通常ユーザーアカウントへ戻ります。

サービス管理、データベース一覧表示、基本設定に関するヒントについては以下を参照してください。

* reference:
  ::urllink[Debian Linux 13 に PostgreSQL 18.1 をインストール＆設定する方法](https://www.youtube.com/watch?v=RSSPnqcwLDo)

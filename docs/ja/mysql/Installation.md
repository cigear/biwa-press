---
title: "インストール"
description: "Debian 13 に MySQL 8.4 をインストールする方法 - 完全ガイド"
tags: ["データベース", "MySQL 8", "プログラミング", "Debian 13"]
order: 1
---

Debian 13（Trixie）に MySQL 8.4 LTS をインストールするには、公式 MySQL APT リポジトリを使用する方法が最も信頼性があります。Debian 13 は比較的新しいリリースであるため、セットアップ時に「trixie」または「bookworm」の設定を明示的に選択する必要がある場合があります。

### ステップ 1: MySQL APT リポジトリを追加する
MySQL 8.4 リリーストラックを有効化するため、リポジトリ設定パッケージをダウンロードしてインストールします。

- システムを更新する:

```bash
sudo apt update && sudo apt upgrade -y
````

* 必要なツールをインストールする:

```bash
sudo apt install wget gnupg -y
```

* 設定ツールをダウンロードする:

```bash
wget https://mysql.com
```

* パッケージをインストールする:

```bash
sudo dpkg -i mysql-apt-config_0.8.32-1_all.deb
```

設定プロンプト:

メニューが表示されます。矢印キーと Enter キーを使用して以下を選択します。

1. MySQL Server & Cluster を選択する。

2. mysql-8.4-lts を選択する。

3. Ok を選択して設定を保存する。

### ステップ 2: MySQL サーバーをインストールする
リポジトリ設定後、パッケージリストを更新してサーバーをインストールします。

* パッケージインデックスを更新する:

```bash
sudo apt update
```

* MySQL 8.4 をインストールする:

```bash
sudo apt install mysql-server
```

*インストール中に root パスワードの設定を求められます。必ず安全な場所に記録してください。*

### ステップ 3: MySQL サービスを管理する
サービスが実行中であることを確認し、システム起動時に自動起動するよう設定します。

* ステータスを確認する:

```bash
sudo systemctl status mysql
```

* サービスを開始する:

```bash
sudo systemctl start mysql
```

* 起動時に自動実行を有効化する:

```bash
sudo systemctl enable mysql
```

### ステップ 4: インストールを安全化する
セキュリティスクリプトを実行し、匿名ユーザーの削除、リモート root ログインの無効化、テストデータベースの削除を行います。

```bash
sudo mysql_secure_installation
```

### ステップ 5: MySQL にアクセスする
先ほど作成した root パスワードを使用して MySQL シェルへログインします。

```bash
mysql -u root -p
```

シェル内でバージョンを確認するには、以下を実行します:

```sql
SELECT version();
```

* reference:
  ::urllink[10 分でプロのように Debian 12 に MySQL 8.4.4 LTS をインストールする方法！ | 2025 更新版](https://www.youtube.com/watch?v=N50qIeTIF4A)


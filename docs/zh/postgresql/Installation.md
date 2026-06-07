---
title: "安装"
description: "如何在 Debian 13 上安装 PostgreSQL 18 - 完整指南"
tags: ["数据库", "PostgreSQL 18", "编程", "Debian 13"]
order: 1
---

Debian 13（Trixie）原生支持 PostgreSQL 18。要安装数据库服务器，需要添加官方 PGDG APT 仓库、更新软件包索引，并执行 apt install 命令。

### 第 1 步：添加 PostgreSQL 仓库

添加官方 PostgreSQL 仓库。

首先，请确保已经安装所需的依赖包，然后添加仓库签名密钥和软件源列表：

```bash showLineNumbers
sudo apt install -y curl ca-certificates gnupg
curl -fsSL https://postgresql.org | sudo gpg --dearmor -o /usr/share/keyrings/postgresql-archive-keyring.gpg
sudo sh -c 'echo "deb [signed-by=/usr/share/keyrings/postgresql-archive-keyring.gpg] http://apt.postgresql.org/pub/repos/apt/ trixie-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
````

### 第 2 步：安装 PostgreSQL 18

更新 Debian 软件包列表，并安装 PostgreSQL 18 服务器及其 contrib 模块：

```bash showLineNumbers id="2h6qt4"
sudo apt update
sudo apt install -y postgresql-18 postgresql-contrib-18
```

### 第 3 步：验证安装

管理服务。

确认 PostgreSQL 服务已经启动并正在运行，同时设置为系统启动时自动启动：

```bash showLineNumbers id="sk1f9g"
# 启动服务并启用开机自启动
sudo systemctl enable --now postgresql

# 检查服务状态
sudo systemctl status postgresql
```

### 第 4 步：访问 PostgreSQL Shell

访问 PostgreSQL Shell。

PostgreSQL 会默认创建一个名为 postgres 的系统用户。要开始操作数据库，请切换到该用户并打开 psql 交互终端：

```bash showLineNumbers id="u3xmb8"
sudo su - postgres
psql
```

接下来，可以通过执行以下命令为 postgres 超级用户设置自定义密码：

```sql
ALTER USER postgres WITH PASSWORD 'your_secure_password';
```

输入 `\q` 可退出 psql 提示符，然后执行 `exit` 返回普通用户账户。

关于如何管理服务、查看数据库列表以及进行基础配置的更多说明，请参考：

* reference:
  ::urllink[如何在 Debian Linux 13 上安装并配置 PostgreSQL 18.1](https://www.youtube.com/watch?v=RSSPnqcwLDo)

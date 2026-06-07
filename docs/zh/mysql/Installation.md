---
title: "安装"
description: "如何在 Debian 13 上安装 MySQL 8.4 - 完整指南"
tags: ["数据库", "Mysql 8", "编程", "Debian 13"]
order: 1
---

要在 Debian 13（Trixie）上安装 MySQL 8.4 LTS，最可靠的方法是使用官方 MySQL APT 仓库。由于 Debian 13 是较新的发行版本，因此在安装过程中，你可能需要手动选择 “trixie” 或 “bookworm” 配置。

### 第 1 步：添加 MySQL APT 仓库

下载并安装仓库配置包，以启用 MySQL 8.4 发布通道。

- 更新系统：

```bash
sudo apt update && sudo apt upgrade -y
````

* 安装所需工具：

```bash
sudo apt install wget gnupg -y
```

* 下载配置工具：

```bash
wget https://mysql.com
```

* 安装软件包：

```bash
sudo dpkg -i mysql-apt-config_0.8.32-1_all.deb
```

配置提示：

安装过程中会出现一个菜单，使用方向键和 Enter 键完成以下选择：

1. 选择 MySQL Server & Cluster。

2. 选择 mysql-8.4-lts。

3. 选择 Ok 保存配置。

### 第 2 步：安装 MySQL 服务器

仓库配置完成后，刷新软件包列表并安装服务器。

* 刷新软件包索引：

```bash
sudo apt update
```

* 安装 MySQL 8.4：

```bash
sudo apt install mysql-server
```

*安装过程中会提示你设置 root 密码，请务必妥善保存。*

### 第 3 步：管理 MySQL 服务

确认服务正在运行，并确保系统启动时自动启动。

* 查看状态：

```bash
sudo systemctl status mysql
```

* 启动服务：

```bash
sudo systemctl start mysql
```

* 设置开机自动启动：

```bash
sudo systemctl enable mysql
```

### 第 4 步：加固安装安全性

运行安全脚本以删除匿名用户、禁用远程 root 登录，并移除测试数据库。

```bash
sudo mysql_secure_installation
```

### 第 5 步：访问 MySQL

使用之前创建的 root 密码登录 MySQL Shell：

```bash
mysql -u root -p
```

在 Shell 中执行以下命令以确认版本：

```sql
SELECT version();
```

* reference:
  ::urllink[像专业人士一样在 10 分钟内安装 MySQL 8.4.4 LTS 到 Debian 12！| 2025 更新版](https://www.youtube.com/watch?v=N50qIeTIF4A)



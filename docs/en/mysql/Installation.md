---
title: "Installation"
description: "How to Install MySQL 8.4 in Debian 13 - Complete Guide"
tags: ["Database", "Mysql 8", "Programming", "Debian 13"]
order: 1
---

To install MySQL 8.4 LTS on Debian 13 (Trixie), the most reliable method is using the Official MySQL APT Repository. Because Debian 13 is a newer release, you may need to specifically select the "trixie" or "bookworm" configuration during setup.

### Step 1: Add the MySQL APT Repository
Download and install the repository configuration package to enable the MySQL 8.4 release track.Update your system:

- Update your system:

```bash
sudo apt update && sudo apt upgrade -y
```

- Install required tools:

```bash
sudo apt install wget gnupg -y
```

- Download the configuration tool:

```bash
wget https://mysql.com
```

- Install the package:

```bash
sudo dpkg -i mysql-apt-config_0.8.32-1_all.deb
```

Configuration Prompt: A menu will appear. Use the arrow keys and "Enter" to:

1. Select MySQL Server & Cluster.

2. Choose mysql-8.4-lts.

3. Select Ok to save the configuration.


### Step 2: Install MySQL Server
Once the repository is configured, refresh your package list and install the server.

- Refresh package index:

```bash
sudo apt update
```

- Install MySQL 8.4:

```bash
sudo apt install mysql-server
```

*During installation, you will be prompted to set a root password. Make sure to record this safely.*  


### Step 3: Manage the MySQL Service
Verify that the service is running and ensure it starts automatically on boot.

- Check status:

```bash
sudo systemctl status mysql
```

- Start service:

```bash
sudo systemctl start mysql
```

- Enable on boot: 

```bash
sudo systemctl enable mysql
```

### Step 4: Secure the Installation
Run the security script to remove anonymous users, disable remote root login, and remove test databases.

```bash
sudo mysql_secure_installation
```

### Step 5: Access MySQL
Log in to the MySQL shell using the root password you created earlier:

```bash
mysql -u root -p
```

To verify the version from within the shell, run: `SELECT version();`

- reference:
::urllink[Install MySQL 8.4.4 LTS on Debian 12 Like a Pro in 10 Minutes! | 2025 Updated](https://www.youtube.com/watch?v=N50qIeTIF4A)

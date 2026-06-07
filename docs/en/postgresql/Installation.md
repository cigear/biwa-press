---
title: "Installation"
description: "How to Install PostgreSQL 18 in Debian 13 - Complete Guide"
tags: ["Database", "PostgreSQL 18", "Programming", "Debian 13"]
order: 1
---

Debian 13 (Trixie) supports PostgreSQL 18 natively. To install the database server, add the official PGDG APT repository, update your package index, and run the apt install command.

### Step 1: Add the PostgreSQL Repository
Add the Official PostgreSQL RepositoryFirst, make sure you have the necessary prerequisites installed, then add the repository signing key and the source list:

```bash showLineNumbers
sudo apt install -y curl ca-certificates gnupg
curl -fsSL https://postgresql.org | sudo gpg --dearmor -o /usr/share/keyrings/postgresql-archive-keyring.gpg
sudo sh -c 'echo "deb [signed-by=/usr/share/keyrings/postgresql-archive-keyring.gpg] http://apt.postgresql.org/pub/repos/apt/ trixie-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
```

### Step 2: Install PostgreSQL 18
Update your Debian package lists and install the PostgreSQL 18 server and its contributed modules:

```bash showLineNumbers
sudo apt update
sudo apt install -y postgresql-18 postgresql-contrib-18
```

### Step 3: Verify the Installation
Manage the Service

Verify that the PostgreSQL service is active and running, and enable it to start automatically on boot:

```bash showLineNumbers
# Start and enable the service
sudo systemctl enable --now postgresql

# Check the status
sudo systemctl status postgresql
```

### Step 4: Access the PostgreSQL Shell
Access the PostgreSQL Shell

PostgreSQL creates a default system user called postgres. To start interacting with the database, switch to this user and open the psql interactive terminal

```bash showLineNumbers
sudo su - postgres
psql
```

From here, you can set a custom password for the postgres superuser by running:

```sql
ALTER USER postgres WITH PASSWORD 'your_secure_password';
```

Type ` \q ` to exit the psql prompt, and exit to return to your regular user account.
For tips on how to manage the service, list databases, and perform basic configurations:

- reference:
::urllink[How to install & configure PostgreSQL 18.1 on Debian Linux 13](https://www.youtube.com/watch?v=RSSPnqcwLDo)

# SRA_APP

## Local Setup

The API requires MySQL credentials in `.env`.

Current defaults:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=sradb
```

If MySQL rejects `root` without a password, set `DB_PASSWORD` to your MySQL root password, or create a dedicated database user and update `DB_USER` / `DB_PASSWORD`.

Load the schema and seed data:

```bash
mysql -u root -p < server/database.sql
```

Then start the app:

```bash
npm run dev
```

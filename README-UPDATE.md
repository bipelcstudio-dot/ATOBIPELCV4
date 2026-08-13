# BIPELAK OS — Update Package

This package keeps the existing Cloudflare Worker name and D1 database ID.

## Important
Do NOT run all migrations blindly against an already-initialized production D1. The new Worker is schema-tolerant for legacy `users` columns.

### Deploy
```bash
npm install
npx wrangler deploy
```

If your production database still has the legacy users schema, apply the additive migration only after checking the columns with:
```bash
npx wrangler d1 execute DB --remote --command "PRAGMA table_info(users);"
```

The current Worker ID is already configured in `wrangler.toml`.

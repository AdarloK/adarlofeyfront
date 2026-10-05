# Stockroom - Product Management (React + Vite)

Frontend for **Laboratory Exercise No. 6**. It only talks to the LavaLust API - never to the database.

Features: Login / Register, product list with search, Add, Edit, Delete, Logout.
Access tokens are refreshed automatically using the refresh token.

## Run locally

```bash
npm install
cp .env.example .env      # set VITE_API_URL to your LavaLust API
npm run dev               # http://localhost:5173
```

## Build / deploy to Render (Static Site)

- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Environment variable: `VITE_API_URL=https://your-lavalust-api.onrender.com`

After deploying, put the frontend URL in the API's `ALLOW_ORIGIN` environment variable (no trailing slash).

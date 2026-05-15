# SchoolFit Bay Area

SchoolFit ranks Bay Area home candidates by the average GreatSchools Test Score percentile for assigned elementary, middle, and high schools.

## Run Locally

```bash
npm run dev
```

Open `http://localhost:4173`.

## Refresh Data

```bash
npm run refresh
```

The refresh script recalculates days on market from listing dates and updates the feed timestamp.

## Verify

```bash
npm run check
npm run smoke
```

## Deploy

This repo is ready for Vercel. Import `dongchris/schoolfit` and use the included `vercel.json` settings:

- Build command: `npm run refresh && npm run check && npm run build`
- Output directory: `_site`

GitHub Actions includes an hourly data refresh workflow that commits updated feed data to `main`, which can trigger Vercel redeploys.

## Key Files

- `index.html` - SchoolFit app shell
- `styles.css` - Apple-style responsive visual system
- `app.js` - filtering, ranking, inspector, and CSV export
- `data/candidates.json` - staged home and school-score feed
- `scripts/refresh-data.mjs` - timestamp and days-on-market refresh
- `vercel.json` - Vercel static deployment config

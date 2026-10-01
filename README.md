# Akshay Pai — Cinematic Portfolio

A responsive, single-page AI engineering portfolio with an animated cinematic hero. The site is intentionally configured for private local development and does not require a database, account, or hosted service.

## Run locally

Use Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Stop the local server with `Control-C` in the terminal where it is running.

To test the optimized version:

```bash
npm run build
npm run start
```

## Personalize the portfolio

- Edit biography, metrics, projects, credentials, links, and writing entries in `app/content.ts`.
- Replace `public/resume-placeholder.txt` with a real resume and update `resumeUrl` in `app/content.ts`.
- Replace `public/images/cinematic-hero.png` to change the hero artwork.
- Global styling, responsive rules, and animations live in `app/globals.css`.
- The replaceable animated hero layer is the `HeroVisual` component in `app/page.tsx`.

The site binds to `localhost` by default, so it remains accessible only from this computer.

## Responsive behavior

- Laptop and desktop screens at least 1024×700 use a fluid three-band fit mode that keeps the complete portfolio in one viewport without letterboxing.
- Browser zoom and window resizing proportionally reduce section heights, typography, cards, and spacing while preserving the artwork ratio.
- Tablets use a compact scrolling layout with multi-column projects and credentials.
- Phones use a single-column flow, full-screen touch navigation, two-column metrics, stacked projects and credentials, and repositioned hero artwork.

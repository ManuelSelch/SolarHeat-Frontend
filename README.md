This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Temperature history

The dashboard sends `GET /temperatures?range=day|month|year&date=YYYY-MM-DD`.
`date` is a reference calendar date in the browser's local timezone, not a UTC timestamp:
- `day`: raw readings for that day (`timestamp`, `solar`, `pump`, `security`, `rel`).
- `month`: daily averages for the containing month (`date`, `avg_solar`, `avg_pump`, `avg_security`, `avg_rel`).
- `year`: monthly averages for the containing year (`month`, the same average fields).

The frontend is ready for `date`; **backend support is still pending**. Responses containing only a different period are not displayed under the selected historical date. Instead, the UI explains that the backend needs updating. An actual empty array produces the normal empty state.

The day chart uses a fixed local wall-clock X-axis from 00:00 to 24:00, with ticks every four hours on all screen sizes. Measurements retain their original times and values; absent/future hours remain blank. Tooltips show the actual reading time. On a daylight-saving fallback day, repeated local clock times share the same X-coordinate.

Live readings always request today's date independently of the history selection. The app opens on today (the mockup initially used yesterday only to demonstrate history). Live and chart data refresh every 10 seconds. The refresh icon reloads live readings/status without reloading the page or losing unsaved difference edits.

`Zuletzt aktualisiert` is the time of a successful frontend refresh; `Letzter Eintrag` is the machine timestamp from `/temperatures/status` (`time`, milliseconds since epoch). Saving sends `{ "dif": number }` to the existing `POST /temperatures/dif` endpoint. A draft is not overwritten by background polling.

Run `npm test` with Node.js 22.18+ (native TypeScript stripping), and `npx tsc --noEmit` for type checking. Approved mockup source is preserved in `mockups/history/`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

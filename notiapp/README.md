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

The console uses local system sans-serif, serif, and monospace fonts; no font download is required.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Console pages

- `/`: notification composer, server health check, and API responses.
- `/v1/api-keys`: generate, copy, and delete local preview keys; open the integration documentation drawer.
- `/v1/smtp`: prepare SMTP credentials, TLS settings, and sender identity with an inbox preview.

Key management and SMTP configuration are frontend previews. Their backend endpoints do not exist yet. Non-secret preview state survives navigation within the console and resets on refresh. Full API keys are shown in the generation panel only; SMTP passwords stay in the form and are cleared on save or navigation. No secrets are written to browser storage.

Run `npm run lint`, `npx tsc --noEmit`, and `npm run build` to validate.

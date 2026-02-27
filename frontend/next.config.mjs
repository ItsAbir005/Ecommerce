import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withSentryConfig(nextConfig, {
    org: "your-org",
    project: "your-project",

    silent: !process.env.CI,

    widenClientFileUpload: true,
    tunnelRoute: "/monitoring",
    hideSourceMaps: true,
});

import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Force a unique build ID on every deploy to prevent Vercel from
    // serving stale Turbopack cache artifacts across builds.
    generateBuildId: async () => {
        return `build-${Date.now()}`;
    },
};

export default withSentryConfig(nextConfig, {
    org: "your-org",
    project: "your-project",

    silent: !process.env.CI,

    widenClientFileUpload: true,
    tunnelRoute: "/monitoring",
    hideSourceMaps: true,
});

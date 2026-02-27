import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        instrumentationHook: true,
    },
};

export default withSentryConfig(nextConfig, {
    org: "your-org",
    project: "your-project",

    silent: !process.env.CI,

    widenClientFileUpload: true,
    reactComponentAnnotation: {
        enabled: true,
    },
    tunnelRoute: "/monitoring",
    hideSourceMaps: true,

    disableLogger: true,
});

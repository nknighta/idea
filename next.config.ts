/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    trailingSlash: true,
    images: {
        unoptimized: true,
    },
    assetPrefix: process.env.NODE_ENV === 'production' ? (process.env.NEXT_PUBLIC_BASE_PATH || '/idea') : '',
    basePath: process.env.NODE_ENV === 'production' ? (process.env.NEXT_PUBLIC_BASE_PATH || '/idea') : '',
    experimental: {
        esmExternals: false,
    },
    env: {
        NODE_ENV: process.env.NODE_ENV || 'development',
        NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH || '',
    },
};

module.exports = nextConfig;
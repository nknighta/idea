/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    trailingSlash: true,
    images: {
        unoptimized: true,
    },
    assetPrefix: process.env.MODE === 'production' ? (process.env.NEXT_PUBLIC_BASE_PATH || '/idea') : '',
    basePath: process.env.MODE === 'production' ? (process.env.NEXT_PUBLIC_BASE_PATH || '/idea') : '',
};

module.exports = nextConfig;
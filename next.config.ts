/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    trailingSlash: true,
    images: {
        unoptimized: true,
    },
    assetPrefix: process.env.NODE_ENV === 'production' ? '/idea' : '',
    basePath: process.env.NODE_ENV === 'production' ? '/idea' : '',
    experimental: {
        esmExternals: false,
    },
};

module.exports = nextConfig;
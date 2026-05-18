/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' }
    ]
  },
  experimental: {
    serverActions: { bodySizeLimit: '50mb' },
    serverComponentsExternalPackages: ['@prisma/client', 'prisma']
  }
};
module.exports = nextConfig;

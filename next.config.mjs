/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob:; worker-src 'self' blob:; child-src blob: 'self'; img-src 'self' * data: blob:; connect-src 'self' *;"
          }
        ]
      }
    ];
  },
};

export default nextConfig;

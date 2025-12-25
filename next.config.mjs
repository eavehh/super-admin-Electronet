/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  devIndicators: false,
  output: 'standalone',
  // Base path для работы через nginx по пути /super-admin
  // Если запускается отдельно на порту 3001, basePath не нужен
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
}

export default nextConfig

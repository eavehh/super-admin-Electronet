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
  // В production через nginx: basePath='/super-admin'
  // Для локальной разработки: basePath='' (пустая строка)
  basePath: '/super-admin',
  
  // Asset prefix должен совпадать с basePath + слэш в конце для правильной загрузки статики
  assetPrefix: '/super-admin/',
}

export default nextConfig

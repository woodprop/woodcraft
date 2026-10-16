import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // dev-сервер по умолчанию отдаёт JS только для localhost; разрешаем локальную сеть,
  // чтобы проверять сайт с телефона по IP (на продакшен не влияет)
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
  partialPrefetching: true,
  images: {
    formats: ["image/avif", "image/webp"],
    // фото, загруженные через админку, лежат в Vercel Blob
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com", pathname: "/uploads/**" }],
  },
  experimental: {
    // загрузка фото и сохранение форм с фото (в демо-режиме — data URL) идут через Server Actions
    serverActions: { bodySizeLimit: "3mb" },
  },
};

export default nextConfig;

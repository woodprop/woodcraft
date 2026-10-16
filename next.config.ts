import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // dev-сервер по умолчанию отдаёт JS только для localhost; разрешаем локальную сеть,
  // чтобы проверять сайт с телефона по IP (на продакшен не влияет)
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
  partialPrefetching: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;

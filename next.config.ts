import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
  // Next 16: Turbopack root'u açıkça bu projeye sabitle.
  // Aksi halde monorepo / üst dizindeki package-lock.json yanlış root seçilir.
  // process.cwd() = `next build` çalıştığı dizin = u2Games/
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "assets.meshy.ai" },
    ],
  },
};

export default nextConfig;

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
  async rewrites() {
    return [
      {
        source: "/api/game/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

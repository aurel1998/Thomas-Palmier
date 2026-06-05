import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  outputFileTracingRoot: process.cwd(),
  experimental: {
    /** Transitions natives entre vues (navigation plus fluide, Chromium / Safari récents). */
    viewTransition: true,
    /** Garde les segments préchargés utilisables plus longtemps = retours menu plus instantanés. */
    staleTimes: {
      dynamic: 60,
      static: 300,
    },
    /** Réduit le coût d’import de GSAP (barrels) sur le chemin client. */
    optimizePackageImports: ["gsap"],
  },
  images: {
    /** Valeurs passées à `<Image quality={…}>` — obligatoire à partir de Next.js 16 */
    qualities: [75, 85],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/**" },
      { protocol: "https", hostname: "img.youtube.com", pathname: "/**" },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  /**
   * Cache HTTP long pour les medias uploades : les noms de fichiers sont uniques
   * (timestamp + random), donc le contenu est immuable -> on peut le mettre en
   * cache navigateur/CDN un an. Allege fortement le VPS sur les visites repetees.
   */
  async headers() {
    return [
      {
        source: "/uploads/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;


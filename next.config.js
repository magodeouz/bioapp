/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep the rewrite for local/dev; Vercel also has vercel.json for production.
  async rewrites() {
    return [
      // Public bio page: /username -> /profile/index.html
      { source: "/:username", destination: "/profile/index.html" },
    ];
  },
};

export default nextConfig;


/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      // Public bio page: /username -> /profile/index.html
      { source: "/:username", destination: "/profile/index.html" },
    ];
  },
};

export default nextConfig;


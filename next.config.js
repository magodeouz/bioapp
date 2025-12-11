/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep local rewrites so dev/preview works (Vercel also uses vercel.json)
  async rewrites() {
    // Route /:username to the static public profile page,
    // but skip known app routes and assets.
    return [
      {
        source:
          "/:path((?!api|_next|static|assets|auth|dashboard|links|onboarding|themes|settings|profile|favicon.ico|robots.txt).+)",
        destination: "/profile/index.html",
      },
    ];
  },
};

export default nextConfig;


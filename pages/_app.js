// Fallback for Next pages dir (keeps compatibility if needed)
// env.js is loaded via script tag in HTML pages, not imported here

export default function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}


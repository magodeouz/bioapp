// Fallback for Next pages dir (keeps compatibility if needed)
import "../public/env.js";

export default function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}


/** @type {import('next').NextConfig} */
const nextConfig = {
  // One page with ~6 KB of gzipped CSS: inlining it into the HTML saves the
  // render-blocking stylesheet round-trip before first paint.
  experimental: { inlineCss: true },
};
export default nextConfig;

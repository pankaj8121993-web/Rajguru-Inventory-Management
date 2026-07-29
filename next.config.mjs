/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The pg driver is server-only; keep it out of any client bundle (ADR-0004).
  serverExternalPackages: ['pg'],
};
export default nextConfig;

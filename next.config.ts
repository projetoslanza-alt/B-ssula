import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_AUTH_PROVIDER:
      process.env.NEXT_PUBLIC_AUTH_PROVIDER ?? process.env.AUTH_PROVIDER ?? "supabase",
    NEXT_PUBLIC_DATABASE_PROVIDER:
      process.env.NEXT_PUBLIC_DATABASE_PROVIDER ??
      process.env.DATABASE_PROVIDER ??
      "supabase",
    NEXT_PUBLIC_STORAGE_DRIVER:
      process.env.NEXT_PUBLIC_STORAGE_DRIVER ?? process.env.STORAGE_DRIVER ?? "supabase",
  },
  async redirects() {
    return [
      { source: "/crm", destination: "/inicio", permanent: true },
      { source: "/crm/:path*", destination: "/inicio", permanent: true },
      { source: "/one-a-one", destination: "/conversa-de-norte", permanent: true },
      { source: "/one-a-one/:path*", destination: "/conversa-de-norte/:path*", permanent: true },
      { source: "/relatorios/crm", destination: "/relatorios/comercial", permanent: true },
      { source: "/relatorios/conversa-de-norte", destination: "/relatorios/one-a-one", permanent: true },
    ];
  },
};

export default nextConfig;

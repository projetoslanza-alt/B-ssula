import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/crm", destination: "/inicio", permanent: true },
      { source: "/crm/:path*", destination: "/inicio", permanent: true },
      { source: "/one-a-one", destination: "/conversa-de-norte", permanent: true },
      { source: "/one-a-one/:path*", destination: "/conversa-de-norte/:path*", permanent: true },
      { source: "/relatorios/crm", destination: "/relatorios/comercial", permanent: true },
      { source: "/relatorios/one-a-one", destination: "/relatorios/conversa-de-norte", permanent: true },
    ];
  },
};

export default nextConfig;

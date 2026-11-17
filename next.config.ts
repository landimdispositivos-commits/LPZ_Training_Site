import type { NextConfig } from "next";

// Interface web do Mailpit (docker-compose.yml, com MP_WEBROOT=emails).
const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://localhost:8025";

const nextConfig: NextConfig = {
  // Nginx faz buffering por padrão, o que quebra streaming/Suspense do App
  // Router quando self-hosted atrás de um reverse proxy.
  async headers() {
    return [
      {
        source: "/:path*{/}?",
        headers: [{ key: "X-Accel-Buffering", value: "no" }],
      },
    ];
  },

  // Só em desenvolvimento: a caixa de e-mails de teste (Mailpit) aparece no
  // próprio site, em /emails — uma URL só para tudo. Em produção esta rota
  // não existe (o Mailpit nem roda lá).
  async rewrites() {
    if (process.env.NODE_ENV !== "development") return [];
    return [
      { source: "/emails", destination: `${MAILPIT_URL}/emails/` },
      { source: "/emails/:path*", destination: `${MAILPIT_URL}/emails/:path*` },
    ];
  },
};

export default nextConfig;

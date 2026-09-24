import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Libera o acesso ao servidor de desenvolvimento pelo IP da rede local
  // (ex.: testar no celular) — por padrão o Next 16 bloqueia qualquer
  // origem que não seja localhost, por segurança.
  allowedDevOrigins: ["192.168.68.81"],
};

export default nextConfig;

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.muhlstore.app',
  appName: 'MuhlStore',
  webDir: 'dist',
  server: {
    // PRODUÇÃO: App usa a API do servidor via IP público
    // Para desenvolvimento com live reload, descomente as linhas abaixo:
    // url: 'http://177.67.33.248:8040',
    // cleartext: true

    // IMPORTANTE: Para APK de produção, deixe vazio (usa .env.production)
    // O app vai usar VITE_API_URL definido em .env.production
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;

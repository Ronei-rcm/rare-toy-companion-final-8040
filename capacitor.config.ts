import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.muhlstore.app',
  appName: 'MuhlStore',
  webDir: 'dist',
  server: {
    // Em produção o app usa a API do servidor. Para desenvolvimento com live reload:
    // androidScheme: 'https',
    // url: 'http://SEU_IP:8040',
    // cleartext: true
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;

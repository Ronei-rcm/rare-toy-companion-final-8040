module.exports = {
  apps: [
    {
      name: "api",
      script: "./server/server.cjs",
      exec_mode: "fork",
      instances: 1,
      watch: false,
      time: true,
      env_file: ".env",
      env: {
        NODE_ENV: "development",
        SERVER_PORT: process.env.SERVER_PORT || 3001,
        MYSQL_HOST: process.env.MYSQL_HOST || "127.0.0.1",
        MYSQL_USER: process.env.MYSQL_USER || "root",
        // SECURITY: Nunca hardcodar senhas! Use variáveis de ambiente
        MYSQL_PASSWORD: process.env.MYSQL_PASSWORD || "",
        MYSQL_DATABASE: process.env.MYSQL_DATABASE || "rare_toy_companion",
        MYSQL_PORT: parseInt(process.env.MYSQL_PORT || "3306")
      },
      autorestart: true,
      max_memory_restart: "300M"
    },
    {
      name: "web",
      script: "./server/proxy-debug.cjs",
      exec_mode: "fork",
      instances: 1,
      watch: false,
      time: true,
      env_file: ".env",
      env: {
        NODE_ENV: "production",
        PORT: process.env.VITE_PORT || 8040
      },
      autorestart: true,
      max_memory_restart: "300M"
    },
    {
      name: "whatsapp-webhook",
      script: "./server/whatsapp-webhook-server.cjs",
      exec_mode: "fork",
      instances: 1,
      watch: false,
      time: true,
      env_file: ".env",
      env: {
        NODE_ENV: "production",
        WHATSAPP_WEBHOOK_PORT: process.env.WHATSAPP_WEBHOOK_PORT || 3002,
        DB_HOST: process.env.DB_HOST || "localhost",
        DB_USER: process.env.DB_USER || "root",
        DB_PASSWORD: process.env.DB_PASSWORD || "",
        DB_NAME: process.env.DB_NAME || "rare_toy_store",
        DB_PORT: process.env.DB_PORT || 3306,
        WHATSAPP_WEBHOOK_SECRET: process.env.WHATSAPP_WEBHOOK_SECRET || "seu-secret-aqui",
        WHATSAPP_TOKEN: process.env.WHATSAPP_TOKEN || "seu-token-aqui",
        WHATSAPP_PHONE_ID: process.env.WHATSAPP_PHONE_ID || "seu-phone-id-aqui"
      },
      autorestart: true,
      max_memory_restart: "300M"
    }
  ]
};



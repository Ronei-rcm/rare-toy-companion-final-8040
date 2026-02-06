# Gerar APK Android (MuhlStore)

O app web (Vite + React) pode ser empacotado como app Android usando **Capacitor**. O APK abre o site em um WebView e usa a API do servidor em produção.

---

## Pré-requisitos

- **Node.js** 18 ou 20 (Capacitor 5) e `npm install` já executado no projeto
- **Android Studio** (recomendado) ou **Android SDK + Gradle** para gerar o APK
- **Java JDK 17** (obrigatório: defina `JAVA_HOME`; o Gradle usa para buildar o APK)

A pasta `android/` já foi adicionada ao projeto. Para gerar o APK você precisa rodar os comandos em um ambiente onde Java e o Android SDK estejam instalados (por exemplo no seu PC com Android Studio).

---

## 1. API em produção

No APK, o app não usa proxy local: todas as chamadas vão para uma URL fixa. Defina a URL da API antes de buildar.

No `.env` (ou ao rodar o build):

```bash
# Use a URL completa do seu backend (ex.: site em produção)
VITE_API_URL=https://muhlstore.re9suainternet.com.br/api
```

Se não definir, o app usará `/api` (relativo), que no APK não funciona a menos que você sirva a API no mesmo host que o app.

---

## 2. Primeira vez: adicionar a plataforma Android

```bash
npm install
npm run build:prod
npx cap add android
npx cap sync
```

Isso cria a pasta `android/` com o projeto Android.

---

## 3. Gerar o APK

### Opção A – Linha de comando (APK de debug)

```bash
# Build do site + sync com Android + gerar APK debug
npm run apk:debug
```

O APK ficará em:

`android/app/build/outputs/apk/debug/app-debug.apk`

### Opção B – Android Studio (recomendado para release)

```bash
npm run build:android
npx cap open android
```

No Android Studio:

1. **Build → Build Bundle(s) / APK(s) → Build APK(s)** para um APK de release assinável.
2. Ou **Build → Generate Signed Bundle / APK** para assinar e publicar na Play Store.

### Opção C – APK de release (linha de comando)

```bash
npm run apk:release
```

O APK de release fica em `android/app/build/outputs/apk/release/`. Para publicar, é preciso **assinar** o APK (keystore); isso costuma ser feito pelo Android Studio em **Generate Signed Bundle / APK**.

---

## 4. Scripts disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run build:android` | Faz `build:prod` e `cap sync android` (atualiza o app dentro do projeto Android) |
| `npm run cap:sync` | Sincroniza a pasta `dist/` com o projeto Android |
| `npm run cap:open:android` | Abre o projeto Android no Android Studio |
| `npm run apk:debug` | Build + sync + gera APK de debug |
| `npm run apk:release` | Build + sync + gera APK de release (não assinado) |

---

## 5. Resumo rápido (já com Android adicionado)

```bash
# Definir API de produção
export VITE_API_URL=https://muhlstore.re9suainternet.com.br/api

# Gerar APK de debug
npm run apk:debug
```

Depois, instale no celular o arquivo:

`android/app/build/outputs/apk/debug/app-debug.apk`

---

## 6. Solução de problemas

- **"capacitor: command not found"**  
  Rode `npm install` (o CLI está em `@capacitor/cli`).

- **"ANDROID_HOME not set"**  
  Instale o Android SDK e defina a variável `ANDROID_HOME` (ou use Android Studio, que costuma configurar isso).

- **App abre mas não carrega dados**  
  Confirme que `VITE_API_URL` foi definido no momento do **build** e que a URL está acessível do celular (CORS e HTTPS corretos no servidor).

- **Erro de Gradle no Windows**  
  Use o terminal dentro do Android Studio ou o PowerShell; evite caminhos muito longos.

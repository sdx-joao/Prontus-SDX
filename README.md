# Prontus-SDX

Aplicativo mobile (Expo / React Native) do ecossistema **ScandexPRO™** focado em
**Prontuários** — busca de paciente, visualização de cirurgias/documentos e leitura
de prontuários digitalizados no Hospital do Olho Júlio Cândido de Brito.

> App **separado** do `Sdx-Mobile` (Ordens de Serviço / Inventário). Compartilha o
> mesmo backend (`app.scandexplus.com.br` / `app-test.scandexplus.com.br`) e a mesma
> identidade visual do ScandexPlus Design System, mas tem pacote e listagem próprios.

## Identidade

| | |
|---|---|
| Nome | Prontus-SDX |
| Pacote Android / iOS | `com.sdxpro.prontus` |
| Backend (prod) | `https://app.scandexplus.com.br` |
| Backend (teste) | `https://app-test.scandexplus.com.br` |
| OTA | desativado (`updates.enabled: false`) — toda mudança = novo build |

## Stack

- Expo SDK 54 · React Native · TypeScript
- React Navigation (stack + bottom tabs)
- expo-camera (leitura de código de barras), expo-print, expo-secure-store

## Setup

```bash
npm install
npx expo start          # dev
# Primeira vez no EAS (cria o projeto e o projectId):
npx eas init
```

## Build

```bash
# Teste (AAB, backend app-test)
EXPO_PUBLIC_SDX_API_URL=https://app-test.scandexplus.com.br EXPO_PUBLIC_APP_ENV=test \
  npx eas-cli build --profile test --platform android

# Produção (AAB, backend app)
npx eas-cli build --profile production --platform android
```

> Base derivada do `Sdx-Mobile`; o módulo de Prontuários é a peça central deste app.
> Conceito visual de referência: `Sdx-Mobile/ScandexPlus mobile design`.

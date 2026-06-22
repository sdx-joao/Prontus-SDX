# SDX Mobile - Contexto para Codex

Aplicativo Android/mobile do ecossistema SDX.

Este repositorio deve evoluir separado do SDX-Pro principal. O SDX-Pro continua sendo o backend central; este app consumira APIs mobile-friendly para ordens de servico, anexos/fotos, catalogos e sincronizacao futura.

## Stack inicial

- Expo SDK 56
- React Native
- TypeScript
- Android como prioridade

## Diretrizes

- Nao copiar codigo do SDX-Pro para este repositorio sem necessidade clara.
- Preferir chamadas por API ao backend central.
- Projetar telas pensando em uso com rede instavel.
- Nao armazenar senha em texto.
- No futuro, tokens devem usar armazenamento seguro do dispositivo.
- Offline deve ser implementado em fase propria, com fila de sincronizacao e idempotencia no backend.

## Primeiro foco

1. App abre no Android.
2. Configuracao de ambiente/API.
3. Login mobile.
4. Lista e detalhe de ordens de servico.
5. Criacao de OS simples.
6. Upload de fotos comprimidas.

# Hi-Score Grid

Plataforma WebAssembly de emulação Arcade com estética retro e integração Cloud (Supabase).

## Modelo de Utilizadores (Funil de Conversão)
1. **Visitante (Zero Fricção):** Joga instantaneamente (Drag & Drop), mas não grava a pontuação no ranking global.
2. **Registado (Comunidade):** Registo gratuito que permite imortalizar o nome no *Global Ranking*, validar ROMs (Anti-Cheat) e participar no chat ao vivo segmentado por plataforma.
3. **Colaborador VIP (Premium):** Doadores (Patreon/Ko-fi) que desbloqueiam emblemas exclusivos e funcionalidades avançadas, como *Cloud Saves* (para quando introduzirmos consolas que exigem gravação de progresso).

## Estado Atual (Fase 1 - Secção Arcade)
- [x] Motor FBNeo (WebAssembly) e sistema de ficheiros virtual (VFS) configurados.
- [x] Interface Arcade (CPS-1, CPS-2, CPS-3, MVS) com controlos e Drag & Drop.
- [x] Filtro CRT dinâmico e otimização de áudio.
- [x] Ligação ao backend (Supabase) estabelecida.
- [ ] Criação da Base de Dados (Ranking e Chat).

# 🕹️ Hi-Score Grid // Insert Coin Arena

![Status](https://img.shields.io/badge/Status-Em_Desenvolvimento-00f0ff?style=for-the-badge)
![Plataforma](https://img.shields.io/badge/Plataforma-Web_/_Local-ff003c?style=for-the-badge)
![Backend](https://img.shields.io/badge/Backend-Supabase-24b47e?style=for-the-badge)

O **Hi-Score Grid** é uma plataforma web de emulação de jogos arcade retro, desenhada com uma forte estética *cyberpunk* e *90s arcade*. A plataforma permite aos jogadores executarem ROMs localmente (através de um motor WebAssembly) e registarem as suas pontuações num **Global Ranking** alimentado pelo Supabase.

O objetivo é recriar a experiência competitiva dos salões de jogos, com tabelas de liderança globais e dinâmicas, validando um modelo de negócio assente em três níveis: visitantes, utilizadores registados e colaboradores/doadores.

---

## 🏗️ Arquitetura e Tecnologias

A arquitetura do projeto divide-se entre um frontend altamente otimizado para execução local (sem necessidade de enviar ROMs pesadas pela rede) e um backend leve para a persistência dos recordes.

*   **Frontend (Static & Local Execution):**
    *   **HTML5 / CSS3 (Variáveis Nativas):** Interface adaptável com tema escuro, contrastes *neon*, e filtros CRT (*scanlines*) aplicados em tempo real via CSS puro.
    *   **Vanilla JavaScript (ES6):** Gestão de estado, manipulação do DOM e integração de APIs.
    *   **JSZip & Web Crypto API:** Leitura local e validação de ficheiros `.zip` (Hash Check).
    *   **Gamepad API (`input.js`):** Mapeamento nativo de comandos físicos (ex: GameSir, Xbox) para os inputs do emulador.
*   **Motor de Emulação (Core):**
    *   **FBNeo (FinalBurn Neo):** Compilado para WebAssembly (via Emscripten / Libretro).
    *   **Virtual File System (VFS):** Criação de um sistema de pastas virtual em memória para injetar o ficheiro `retroarch.cfg` (otimização de áudio e vsync) e as ROMs carregadas.
*   **Backend & Base de Dados (Cloud):**
    *   **Supabase (PostgreSQL):** Tabela `global_ranking` para armazenar iniciais, jogos, pontuações e o sistema (ex: CPS-1).
    *   **Supabase JS Client (`@latest`):** Comunicação em tempo real compatível com chaves de segurança `Publishable Key` (`sb_publishable_...`).

---

## 🚀 Como Executar o Projeto (Localmente)

Devido às restrições de segurança modernas dos navegadores (CORS e execução de WebAssembly), o projeto não pode ser aberto diretamente dando duplo clique no ficheiro `index.html`. Deve ser servido através de um servidor local.

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/DIOLUIS/hi-score-grid.git](https://github.com/DIOLUIS/hi-score-grid.git)
    cd hi-score-grid
    ```
2.  **Inicie um Servidor Local:**
    *   **No VS Code:** Instale e utilize a extensão *Live Server*. Clique em "Go Live" na barra inferior.
    *   **Usando Python:** Execute `python -m http.server 5500` no terminal e abra `http://localhost:5500` no navegador.
3.  **Jogue e Registe Recordes:**
    *   Arraste um ficheiro de jogo Arcade válido (`.zip`) para a área de largada (Drop Zone).
    *   Jogue usando o teclado ou ligue um comando compatível.
    *   Para registar a pontuação no Supabase, clique em **"Abortar Missão"**, insira o seu nome e envie para a nuvem!

---

## 📜 Registo de Progresso (Changelog)

### Fase Atual: Validação da Base Tecnológica (Fase 1 - Concluída)

**🟢 O que está a funcionar a 100%**
*   **Motor de Emulação (FBNeo WebAssembly):**
    *   Carregamento dinâmico de ficheiros `.zip` via Drag & Drop ou botão de seleção.
    *   Instanciação do Canvas adaptável ao ecrã inteiro (`object-fit: contain`) sem perder o *aspect ratio*.
    *   Gestão do áudio e sincronização de frames otimizada (`retroarch.cfg` virtual injetado no arranque).
*   **Controlos e UX:**
    *   `input.js` ativo com Gamepad API a mapear comandos físicos diretamente para o WebAssembly sem atrasos.
    *   Filtro CRT retro (Shader) a aplicar scanlines e escurecimento via CSS, ligável/desligável em tempo real.
*   **Backend & Cloud (Supabase):**
    *   **Conexão Estabelecida:** Cliente configurado com sucesso usando a CDN `@supabase/supabase-js@latest` para compatibilidade total com o novo formato `Publishable key` (`sb_publishable_...`).
    *   **Global Ranking:** Tabela a ser lida corretamente do PostgreSQL, renderizando os lugares de topo na interface cyberpunk.
    *   **Submissão Automática:** Modal de "GAME OVER" customizado em HTML/CSS (substituindo popups nativos que eram bloqueados pelo foco do jogo), permitindo ao jogador inserir as iniciais e enviar o seu score diretamente para a nuvem.

### 🛠️ Resolução de Bugs Notáveis (Para Memória Futura)
1.  **Erro 401 Unauthorized / Invalid API Key (Supabase):**
    *   *Causa:* Desalinhamento entre a versão v2 antiga do CDN e o novo formato de chaves do Supabase.
    *   *Solução:* Atualização da tag do script no `index.html` para puxar sempre a versão `@latest`.
2.  **Erro `Uncaught SyntaxError: Unexpected token '<'` no app.js:**
    *   *Causa:* O VS Code Live Server perdia o caminho do ficheiro e injetava a página HTML como resposta ao pedido do script.
    *   *Solução:* Forçar o caminho relativo estrito (`./app.js`) e garantir que a estrutura de pastas estava na raiz.
3.  **Botão de Abortar Missão inativo durante o jogo:**
    *   *Causa:* O motor FBNeo em ecrã/Canvas sequestra o foco de inputs, bloqueando diálogos nativos do browser como `confirm()`.
    *   *Solução:* Remoção do `confirm()` e implementação de um modal HTML dedicado (`#score-modal`) com `z-index` superior.

---

## 🎯 Próximos Passos (Backlog - Fase 2)
- [ ] **Autenticação:** Implementar sistema de Login de utilizadores no Supabase para preenchimento automático do nome na submissão de scores.
- [ ] **Interface do Ranking:** Diferenciar rankings por sistema (CPS-1, CPS-2, MVS) e adicionar abas dinâmicas.
- [ ] **Personalização Visual:** Adicionar suporte a avatares, logótipos dos jogos, ou emblemas de ranking ao lado dos nomes dos jogadores.

---
*Desenvolvido por Diotec Software (DIOLUIS).*

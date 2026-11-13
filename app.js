/**
 * HI-SCORE GRID // INSERT COIN ARENA
 * Interface, Áudio, Filtro CRT, Autenticação, Upload de Avatar, Segurança Hash, Supabase e Gamepad
 */

// =========================================
// 1. LIGAÇÃO AO BACKEND (SUPABASE)
// =========================================
const supabaseUrl = 'https://jjsngwebputgcctdsdac.supabase.co';
const supabaseAnonKey = 'sb_publishable_UIMz7ucKnLjFTM7XOAJpKA_YrQgLv2E';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
console.log("[SYSTEM] Conexão Supabase Estabelecida:", supabaseClient);

let currentUser = null; 
let isRankedMode = false; 

// =========================================
// 2. ELEMENTOS DA INTERFACE (DOM) & ÁUDIO
// =========================================
const dropZone = document.getElementById('rom-drop-zone');
const fileInput = document.getElementById('rom-input');
const btnSelect = document.getElementById('btn-select-rom');
const dropTitle = document.getElementById('drop-title');
const sectionDrop = document.getElementById('drop-zone-section');
const sectionEmulator = document.getElementById('emulator-section');

const btnQuit = document.getElementById('btn-quit');
const btnFullscreen = document.getElementById('btn-fullscreen');
const btnToggleShader = document.getElementById('btn-toggle-shader'); 
const canvasContainer = document.getElementById('game-canvas-container');
const canvas = document.getElementById('emulator-canvas');

const scoreModal = document.getElementById('score-modal');
const btnSubmitScore = document.getElementById('btn-submit-score');
const btnSkipScore = document.getElementById('btn-skip-score');
const finalScoreDisplay = document.getElementById('final-score-display');
const inputPlayerName = document.getElementById('input-player-name');
const scoreModalMsg = document.getElementById('score-modal-msg');

const authModal = document.getElementById('auth-modal');
const btnShowLogin = document.getElementById('btn-show-login');
const btnLogout = document.getElementById('btn-logout');
const loggedInInfo = document.getElementById('logged-in-info');
const displayUserName = document.getElementById('display-user-name');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const authUsername = document.getElementById('auth-username');
const btnLoginSubmit = document.getElementById('btn-login-submit');
const btnRegisterSubmit = document.getElementById('btn-register-submit');
const btnCloseAuth = document.getElementById('btn-close-auth');
const authFeedback = document.getElementById('auth-feedback');

const userAvatarImg = document.getElementById('user-avatar-img');

const modalPerfil = document.getElementById('perfil-modal');
const overlayPerfil = document.getElementById('perfil-overlay');
const vipUploadSection = document.getElementById('vip-upload-section');
const vipAvatarUpload = document.getElementById('vip-avatar-upload');
const vipLockMessage = document.getElementById('vip-lock-message');

const systemTabs = document.querySelectorAll('.system-tab');
const rankingSystemTitle = document.getElementById('ranking-system-title');

let activeSystemCode = 'cps1';
let runningSystemCode = 'cps1';
let activeRomCode = 'sf2'; 

// --- SISTEMA DE EFEITOS SONOROS ---
const sfxCoin = new Audio('./assets/sounds/coin.mp3');
const sfxGameOver = new Audio('./assets/sounds/game-over.mp3');
const sfxWin = new Audio('./assets/sounds/win.mp3');
const sfxError = new Audio('./assets/sounds/error.mp3'); 

sfxCoin.volume = 0.6; 
sfxGameOver.volume = 0.5; 
sfxWin.volume = 0.6;
sfxError.volume = 0.5;

// =========================================
// 3. SISTEMA DE AUTENTICAÇÃO E PERFIL
// =========================================
supabaseClient.auth.getSession().then(({ data: { session } }) => updateUserInterface(session));
supabaseClient.auth.onAuthStateChange((_event, session) => updateUserInterface(session));

function updateUserInterface(session) {
    if (session && session.user) {
        currentUser = session.user;
        const playerName = currentUser.user_metadata.username || 'PLAYER_1';
        
        btnShowLogin.classList.add('hidden');
        loggedInInfo.classList.remove('hidden');
        displayUserName.innerText = playerName;
        
        const { data } = supabaseClient.storage.from('avatars').getPublicUrl(currentUser.id);
        
        const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(playerName)}&background=111116&color=00f0ff`;
        userAvatarImg.onerror = () => { userAvatarImg.onerror = null; userAvatarImg.src = fallbackAvatar; };
        userAvatarImg.src = `${data.publicUrl}?t=${Date.now()}`;
        
        inputPlayerName.classList.add('hidden');
    } else {
        currentUser = null;
        btnShowLogin.classList.remove('hidden');
        loggedInInfo.classList.add('hidden');
        inputPlayerName.classList.remove('hidden');
    }
}

btnShowLogin.addEventListener('click', () => authModal.classList.remove('hidden'));
btnCloseAuth.addEventListener('click', () => { authModal.classList.add('hidden'); authFeedback.innerText = ''; });

btnRegisterSubmit.addEventListener('click', async () => {
    const email = authEmail.value.trim(), password = authPassword.value, username = authUsername.value.trim().toUpperCase() || 'PLAYER';
    if (!email || !password) return authFeedback.innerText = "ERRO: Preencha email e password.", authFeedback.style.color = "var(--neon-pink)";
    authFeedback.innerText = "A registar..."; authFeedback.style.color = "var(--neon-cyan)";
    const { error } = await supabaseClient.auth.signUp({ email, password, options: { data: { username } } });
    if (error) { authFeedback.innerText = `ERRO: ${error.message}`; authFeedback.style.color = "var(--neon-pink)"; } 
    else { authFeedback.innerText = "REGISTO CONCLUÍDO! PODE ENTRAR."; authFeedback.style.color = "#ffd700"; }
});

btnLoginSubmit.addEventListener('click', async () => {
    authFeedback.innerText = "A ligar aos servidores..."; authFeedback.style.color = "var(--neon-cyan)";
    const { error } = await supabaseClient.auth.signInWithPassword({ email: authEmail.value.trim(), password: authPassword.value });
    if (error) { authFeedback.innerText = "ERRO: Credenciais inválidas."; authFeedback.style.color = "var(--neon-pink)"; } 
    else { authFeedback.innerText = "LOGIN COM SUCESSO!"; setTimeout(() => { authModal.classList.add('hidden'); authFeedback.innerText = ''; }, 1000); }
});

btnLogout.addEventListener('click', async () => await supabaseClient.auth.signOut());

// =========================================
// 4. SISTEMA DE AVATARES E PERFIL VIP
// =========================================
async function abrirModalComPermissoes() {
    if (!currentUser) {
        alert("SISTEMA ALERTA: Inicie sessão primeiro para mudar o avatar.");
        return;
    }

    try {
        const { data: profile, error: dbError } = await supabaseClient
            .from('profiles')
            .select('is_vip')
            .eq('id', currentUser.id)
            .single();

        if (dbError && dbError.code !== 'PGRST116') {
            console.error("Erro ao verificar status VIP:", dbError.message);
        }

        if (profile && profile.is_vip) {
            vipUploadSection.style.opacity = "1";
            vipAvatarUpload.disabled = false; 
            vipAvatarUpload.style.color = "#00f0ff";
            vipLockMessage.style.display = "none"; 
        } else {
            vipUploadSection.style.opacity = "0.5";
            vipAvatarUpload.disabled = true; 
            vipAvatarUpload.style.color = "#888";
            vipLockMessage.style.display = "block"; 
        }

        modalPerfil.style.display = 'block';
        overlayPerfil.style.display = 'block';
        gerarAvataresAleatorios();

    } catch (error) {
        console.error("[SYSTEM] Erro no carregamento de permissões:", error);
    }
}
window.abrirModalComPermissoes = abrirModalComPermissoes;

function fecharModalPerfil() {
    if (modalPerfil) modalPerfil.style.display = 'none';
    if (overlayPerfil) overlayPerfil.style.display = 'none';
}
window.fecharModalPerfil = fecharModalPerfil;

function gerarAvataresAleatorios() {
    const avatares = document.querySelectorAll('#avatar-grid img');
    avatares.forEach(img => {
        const textoAleatorio = Math.random().toString(36).substring(2, 10);
        img.src = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${textoAleatorio}`;
    });
}
window.gerarAvataresAleatorios = gerarAvataresAleatorios;

function selecionarAvatar(urlImagem) {
    if (!currentUser) return;
    userAvatarImg.src = urlImagem;
    alert("Avatar atualizado para a sessão atual! (Persistência na BD em breve)");
    fecharModalPerfil();
}
window.selecionarAvatar = selecionarAvatar;

if (vipAvatarUpload) {
    vipAvatarUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file || !currentUser) return;
        if (file.size > 2 * 1024 * 1024) { alert("SISTEMA ALERTA: Imagem demasiado pesada. Limite máximo: 2MB."); return; }
        
        userAvatarImg.style.opacity = "0.3"; 
        try {
            const { error } = await supabaseClient.storage.from('avatars').upload(currentUser.id, file, { upsert: true, cacheControl: '3600' });
            if (error) throw error;
            
            const { data } = supabaseClient.storage.from('avatars').getPublicUrl(currentUser.id);
            userAvatarImg.src = `${data.publicUrl}?t=${new Date().getTime()}`;
            fecharModalPerfil(); 
            alert("Avatar VIP transferido com sucesso!");
        } catch (err) { 
            alert("SISTEMA ALERTA: Falha na transmissão de imagem. " + err.message); 
        } finally { 
            userAvatarImg.style.opacity = "1"; 
        }
    });
}

// =========================================
// 5. GESTÃO DE SISTEMAS (TABS & FILTROS)
// =========================================
systemTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
        systemTabs.forEach(t => t.classList.remove('active')); e.target.classList.add('active');
        activeSystemCode = e.target.getAttribute('data-system');
        dropTitle.innerText = `SISTEMA ATIVO: ${e.target.innerText}`;
        rankingSystemTitle.innerText = e.target.innerText;
        fetchGlobalRanking();
    });
});

// =========================================
// 6. SHADER & DROP ZONE
// =========================================
btnToggleShader.addEventListener('click', () => {
    canvasContainer.classList.toggle('crt-shader');
    if (canvasContainer.classList.contains('crt-shader')) { btnToggleShader.className = "btn-danger"; btnToggleShader.innerText = "DESLIGAR SHADER"; } 
    else { btnToggleShader.className = "btn-neon"; btnToggleShader.innerText = "LIGAR SHADER CRT"; }
});
btnSelect.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.style.backgroundColor = 'rgba(0, 240, 255, 0.1)'; });
dropZone.addEventListener('dragleave', (e) => { e.preventDefault(); dropZone.style.backgroundColor = 'transparent'; });
dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.style.backgroundColor = 'transparent'; if (e.dataTransfer.files.length > 0) processRomFile(e.dataTransfer.files[0]); });
fileInput.addEventListener('change', (e) => { if (e.target.files.length > 0) processRomFile(e.target.files[0]); });
btnFullscreen.addEventListener('click', () => { if (canvasContainer.requestFullscreen) canvasContainer.requestFullscreen(); });

// =========================================
// 7. ARRANQUE E PROCESSAMENTO DA ROM
// =========================================
const ROM_WHITELIST = {
    'sf2': ['622fa72606ac0b07ac83192256e6edf062f61856a0a3f6009befb7d64a7a06b8'],
    'sf2ce': ['7a8b9c2606ac0b07ac83192256e6edf062f61856a0a3f6009befb7d64a7a0abc']
};

const GAME_DEFAULTS = {
    'sf2': [50000, 40000, 30000, 20000, 10000],
    'sf2ce': [50000, 45000, 40000, 35000, 30000]
};

async function calculateSHA256(buffer) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function processRomFile(file) {
    if (!file.name.toLowerCase().endsWith('.zip')) { alert("FORMATO INVÁLIDO: O ficheiro deve ser .zip"); return; }
    
    runningSystemCode = activeSystemCode; 
    activeRomCode = file.name.toLowerCase().replace('.zip', '');
    dropTitle.innerText = "A ANALISAR INTEGRIDADE CRIPTOGRÁFICA..."; 
    
    try { 
        const arrayBuffer = await file.arrayBuffer(); 
        const romHash = await calculateSHA256(arrayBuffer);
        const validHashes = ROM_WHITELIST[activeRomCode];
        
        fetchGlobalRanking(activeRomCode);

        if (!validHashes || !validHashes.includes(romHash)) {
            isRankedMode = false; 
            sfxError.play().catch(() => {}); 
            
            sectionDrop.style.backgroundColor = "rgba(255, 170, 0, 0.05)";
            dropTitle.innerHTML = `
                <span style="color: #ffaa00; font-size: 1.2rem;">⚠️ ROM NÃO OFICIAL - MODO TREINO ⚠️</span><br><br>
                <span style="font-size: 0.7rem; color: #fff;">O seu recorde não será gravado no ranking. Hash detetado:</span><br>
                <input type="text" value="${romHash}" style="width: 100%; max-width: 600px; background: #000; color: #ffaa00; border: 1px solid #ffaa00; padding: 15px; margin-top: 15px; text-align: center; font-family: monospace; font-size: 0.8rem; cursor: pointer;" readonly onclick="this.select();">
                <br><br>
                <span style="font-size: 0.6rem; color: #888;">(ADMIN: Copie este hash para a Whitelist se desejar oficializar esta versão)</span><br><br>
                <button id="btn-force-play" class="btn-neon" style="border-color: #ffaa00; color: #ffaa00;">JOGAR APENAS POR DIVERSÃO</button>
            `;
            
            document.getElementById('btn-force-play').addEventListener('click', () => {
                sectionDrop.classList.add('hidden'); 
                sectionEmulator.classList.remove('hidden');
                bootWebAssemblyCore(activeRomCode, new Uint8Array(arrayBuffer));
            });
            return; 
        }

        isRankedMode = true; // ROM oficial; o login é verificado no fim do jogo
        sfxCoin.play().catch(() => {}); 

        sectionDrop.classList.add('hidden'); 
        sectionEmulator.classList.remove('hidden');
        bootWebAssemblyCore(activeRomCode, new Uint8Array(arrayBuffer)); 
        
    } catch (error) { 
        alert(`Erro Crítico na Análise de Ficheiro: ${error.message}`); 
        window.location.reload(); 
    }
}

async function bootWebAssemblyCore(romCode, romZipBuffer) {
    try { await window.CoreReady; } catch (e) { alert("Falha ao carregar o motor FBNeo."); return; }
    const FS = window.CoreFS;
    if (!FS || !window.CoreModule) { alert("Motor FBNeo indisponível."); return; }
    try {
        if (!FS.analyzePath('/roms').exists) FS.mkdir('/roms');
        FS.writeFile(`/roms/${romCode}.zip`, romZipBuffer);

        // 1. Diretórios nativos do VFS (System + Saves) criados ANTES de qualquer escrita
        FS.mkdirTree(HI_SYSTEM_DIR);
        FS.mkdirTree(HI_SAVES_DIR);

        // 2. hiscore.dat no System + recorde guardado injetado como .hi nos Saves
        await injectHiScoreDat();
        await injectSavedHiScore(romCode);

        // 3. Configuração do emulador (vsync + saída por Escape)
        const antiCheatCfg = `
audio_latency = "128"
video_vsync = "true"
confirm_quit = "false"
input_menu_toggle = "nul"
input_save_state = "nul"
input_load_state = "nul"
input_rewind = "nul"
input_reset = "nul"
input_exit_emulator = "escape"
input_cheat_index_plus = "nul"
input_cheat_index_minus = "nul"
input_cheat_toggle = "nul"
`;
        FS.writeFile('/retroarch.cfg', antiCheatCfg);

        canvas.style.display = "block";
        canvas.setAttribute('tabindex', '0');
        canvas.focus();
        window.CoreModule.callMain(['-v', '-c', '/retroarch.cfg', `/roms/${romCode}.zip`]);
    } catch (e) { console.error("[SYSTEM] Erro Wasm:", e); }
}


// =========================================
// 8. HISCORE NATIVO (.hi) VIA VFS + ESCAPE
// =========================================
const HI_SYSTEM_DIR = '/home/web_user/retroarch/userdata/system/fbneo';
const HI_SAVES_DIR  = '/home/web_user/retroarch/userdata/saves/FinalBurn Neo/fbneo';

// sf2.hi = 52 bytes: 6 x [4B score BCD | 3B iniciais ASCII | 0x20] + 4B "HI" BCD
const HI_TABLE_LAYOUT = { entries: 6, entrySize: 8, scoreBytes: 4, initialsBytes: 3, topOffset: 48, topBytes: 4, size: 52 };
const HI_LAYOUTS = { 'sf2': HI_TABLE_LAYOUT, 'sf2ce': HI_TABLE_LAYOUT };

// Jogos sem layout de tabela confirmado (leitura simples, só extração)
const GLOBAL_MACHINE_CONFIG = {
    'ffight': { offset: 0, length: 3, type: 'BCD' },
    'mslug': { offset: 24, length: 4, type: 'HEX' }
};

let ultimoScore = 0;

// --- Conversores BCD <-> Número ---
function numeroParaBCD(numero, nBytes) {
    const digitos = String(Math.max(0, Math.floor(numero))).padStart(nBytes * 2, '0').slice(-nBytes * 2);
    const out = new Uint8Array(nBytes);
    for (let i = 0; i < nBytes; i++) {
        out[i] = ((digitos.charCodeAt(i * 2) - 48) << 4) | (digitos.charCodeAt(i * 2 + 1) - 48);
    }
    return out;
}

function bcdParaNumero(bytes) {
    let s = '';
    for (const b of bytes) {
        const hi = b >> 4, lo = b & 0x0F;
        if (hi > 9 || lo > 9) return NaN; 
        s += `${hi}${lo}`;
    }
    return parseInt(s, 10);
}

// Constrói o binário da tabela a partir do Top 5 do banco de dados (Correção Bug 2)
function construirHiFile(layout, entriesArray) {
    const buf = new Uint8Array(layout.size);
    let topScore = 0;
    
    for (let e = 0; e < layout.entries; e++) {
        const entry = entriesArray[e] || { score: 0, initials: 'AAA' };
        if (e === 0) topScore = entry.score;
        
        const base = e * layout.entrySize;
        buf.set(numeroParaBCD(entry.score, layout.scoreBytes), base);
        
        const ini = String(entry.initials).toUpperCase().replace(/[^A-Z0-9]/g, '').padEnd(3, 'A').slice(0, 3);
        for (let j = 0; j < layout.initialsBytes; j++) {
            buf[base + layout.scoreBytes + j] = ini.charCodeAt(j);
        }
        buf[base + layout.entrySize - 1] = 0x20;
    }
    buf.set(numeroParaBCD(topScore, layout.topBytes), layout.topOffset);
    return buf;
}

// Extrai TODOS os scores encontrados no .hi para um array (Correção Bug 1)
function extrairTodosScores(bytes, romCode) {
    const layout = HI_LAYOUTS[romCode];
    const scores = [];
    if (layout) {
        if (bytes.length < layout.size) return scores;
        for (let e = 0; e < layout.entries; e++) {
            const v = bcdParaNumero(bytes.slice(e * layout.entrySize, e * layout.entrySize + layout.scoreBytes));
            if (!isNaN(v) && v > 0) scores.push(v);
        }
        const top = bcdParaNumero(bytes.slice(layout.topOffset, layout.topOffset + layout.topBytes));
        if (!isNaN(top) && top > 0) scores.push(top);
    } else {
        const cfg = GLOBAL_MACHINE_CONFIG[romCode];
        if (!cfg || bytes.length < cfg.offset + cfg.length) return scores;
        const parte = bytes.slice(cfg.offset, cfg.offset + cfg.length);
        let v = 0;
        if (cfg.type === 'BCD') {
            v = bcdParaNumero(parte);
        } else {
            v = parseInt(Array.from(parte, b => b.toString(16).padStart(2, '0')).join(''), 16);
        }
        if (!isNaN(v) && v > 0) scores.push(v);
    }
    return scores;
}

// Compara o "antes" e o "depois" para descobrir qual foi o novo score inserido (Correção Bug 1)
function encontrarNovoScore(antes, depois) {
    const contagemAntes = {};
    for (const s of antes) contagemAntes[s] = (contagemAntes[s] || 0) + 1;
    
    for (const s of depois) {
        if (s <= 0) continue;
        if (!contagemAntes[s] || contagemAntes[s] === 0) {
            return s; // Encontrou o score inédito da partida atual!
        }
        contagemAntes[s]--;
    }
    return 0; // Nenhum score novo ou não atingiu o Top 5 local.
}

async function obterTop5Global(romCode) {
    try {
        const { data, error } = await supabaseClient.from('global_ranking')
            .select('score, player_name')
            .eq('game_code', romCode)
            .order('score', { ascending: false })
            .limit(5);
        if (!error && data) return data;
    } catch (e) { console.warn("[HI] Erro fetch top 5:", e.message); }
    return [];
}

// --- Fase pré-arranque ---
async function injectHiScoreDat() {
    try {
        const resDat = await fetch('./assets/hiscore.dat');
        if (!resDat.ok) return;
        window.CoreFS.writeFile(`${HI_SYSTEM_DIR}/hiscore.dat`, new Uint8Array(await resDat.arrayBuffer()));
        console.log("[HI] hiscore.dat instalado no System.");
    } catch (e) { console.warn("[HI] hiscore.dat não carregado:", e.message); }
}

async function injectSavedHiScore(romCode) {
    const layout = HI_LAYOUTS[romCode];
    if (!layout) return;
    
    // Busca os 5 melhores jogadores do mundo (Correção Bug 2)
    const globais = await obterTop5Global(romCode);
    let merged = globais.map(g => ({ score: g.score, initials: g.player_name || 'AAA' }));
    
    // Se a BD tiver menos de 5 jogadores, preenchemos o resto com as pontuações de fábrica originais do jogo
    const defaults = GAME_DEFAULTS[romCode] || [];
    if (merged.length < layout.entries && defaults.length > 0) {
        for (let i = merged.length; i < layout.entries; i++) {
            merged.push({ score: defaults[i] || 10000, initials: 'CPU' });
        }
    }
    
    merged.sort((a, b) => b.score - a.score);
    window.CoreFS.writeFile(`${HI_SAVES_DIR}/${romCode}.hi`, construirHiFile(layout, merged));
    console.log(`[HI] Ranking global injetado na RAM do jogo.`);
}

// --- Escape + polling do mtime ---
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

function enviarTeclaEscape(tipo) {
    const ev = new KeyboardEvent(tipo, { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true, cancelable: true });
    try { Object.defineProperty(ev, 'keyCode', { get: () => 27 }); Object.defineProperty(ev, 'which', { get: () => 27 }); } catch (e) {}
    if (canvas) canvas.dispatchEvent(ev);
}

function procurarHiFile(romCode) {
    const caminhos = [
        `${HI_SAVES_DIR}/${romCode}.hi`,
        `/home/web_user/retroarch/userdata/saves/FinalBurn Neo/${romCode}.hi`,
        `/home/web_user/retroarch/userdata/saves/fbneo/${romCode}.hi`
    ];
    for (const c of caminhos) {
        try { if (window.CoreFS.analyzePath(c).exists) return c; } catch (e) {}
    }
    return null;
}

function mtimeHi(caminho) {
    try { return new Date(window.CoreFS.stat(caminho).mtime).getTime(); } catch (e) { return null; }
}

btnQuit.addEventListener('click', async () => {
    if (!confirm("SISTEMA ALERTA: Tem a certeza que deseja abortar a missão atual? O emulador será encerrado.")) return;

    btnQuit.innerText = "A DESLIGAR MOTOR...";
    btnQuit.disabled = true;

    // Tira a "fotografia" do Top 5 antes de gravar (Correção Bug 1)
    const caminhoAntes = procurarHiFile(activeRomCode);
    const mtimeAntes = caminhoAntes ? mtimeHi(caminhoAntes) : null;
    let scoresAntes = [];
    if (caminhoAntes) {
        try { scoresAntes = extrairTodosScores(window.CoreFS.readFile(caminhoAntes), activeRomCode); } catch(e) {}
    }

    enviarTeclaEscape('keydown');
    await esperar(300);
    enviarTeclaEscape('keyup');

    sectionEmulator.classList.add('hidden');
    try {
        if (typeof WEBAudio !== 'undefined' && WEBAudio.audioContext) WEBAudio.audioContext.suspend();
        if (window.SDL && window.SDL.audioContext) window.SDL.audioContext.suspend();
    } catch (e) {}

    let finalScore = 0, atualizado = false;
    for (let i = 0; i < 16 && !atualizado; i++) {
        await esperar(500);
        const caminho = procurarHiFile(activeRomCode);
        if (!caminho) continue;
        const m = mtimeHi(caminho);
        if (m !== null && (mtimeAntes === null || m > mtimeAntes)) {
            // Tira nova fotografia e compara para descobrir qual foi o novo score inserido
            let scoresDepois = extrairTodosScores(window.CoreFS.readFile(caminho), activeRomCode);
            finalScore = encontrarNovoScore(scoresAntes, scoresDepois);
            atualizado = true;
            console.log(`[SAIR] .hi atualizado. O score exclusivo desta sessão foi: ${finalScore}`);
        }
    }
    if (!atualizado) console.warn("[SAIR] O .hi não foi atualizado dentro do tempo limite.");

    btnQuit.innerText = "ABORTAR MISSÃO";
    btnQuit.disabled = false;
    triggerGameOver(activeRomCode, finalScore);
});

// =========================================
// CORREÇÃO DO BOTÃO DE ENVIO PARA A NUVEM
// =========================================
btnSubmitScore.addEventListener('click', async () => {
    if (!currentUser || ultimoScore <= 0) return;
    
    btnSubmitScore.disabled = true;
    btnSubmitScore.innerText = "A ENVIAR...";
    
    const nome = (currentUser.user_metadata.username || 'PLAYER').toUpperCase();
    
    const result = await submitScore(nome, activeRomCode, ultimoScore, runningSystemCode, currentUser.id);
    
    if (result.success) {
        scoreModalMsg.innerText = "RECORDE ENVIADO COM SUCESSO!";
        scoreModalMsg.style.color = "var(--neon-cyan)";
        setTimeout(() => window.location.reload(), 1200);
    } else {
        scoreModalMsg.innerHTML = `<span style="color: var(--neon-pink); font-size: 0.8rem; font-weight: bold;">ERRO DB: ${result.error}</span>`;
        btnSubmitScore.innerText = "TENTAR NOVAMENTE";
        btnSubmitScore.disabled = false;
    }
});

async function submitScore(playerName, gameCode, scoreValue, systemName, userId) {
    try {
        const payload = {
            player_name: playerName,
            game_code: gameCode,
            score: scoreValue,
            system: systemName,
            user_id: userId
        };

        const { error } = await supabaseClient.from('global_ranking').insert([payload]);
        
        if (error) throw error;
        
        return { success: true };
    } catch (err) {
        console.error("[SYSTEM] Erro ao submeter pontuação:", err.message);
        return { success: false, error: err.message };
    }
}

btnSkipScore.addEventListener('click', () => window.location.reload());

function triggerGameOver(romCode, scoreAchieved) {
    ultimoScore = scoreAchieved;
    btnSubmitScore.disabled = false;
    finalScoreDisplay.innerText = `SCORE: ${scoreAchieved.toLocaleString()}`; 
    scoreModal.classList.remove('hidden');
    
    if (isRankedMode && currentUser && scoreAchieved > 0) {
        sfxWin.play().catch(() => {}); 
        btnSubmitScore.style.display = 'inline-block';
        scoreModalMsg.innerText = `Recorde oficial pronto para o Global Ranking!`;
        scoreModalMsg.style.color = "var(--neon-cyan)";
        btnSkipScore.innerText = "IGNORAR E SAIR";
    } else {
        sfxGameOver.play().catch(() => {}); 
        btnSubmitScore.style.display = 'none';
        btnSkipScore.innerText = "SAIR DA MÁQUINA";

        if (scoreAchieved === 0) {
            scoreModalMsg.innerText = "SCORE 0 DETETADO (Ou não alcançou o Top 5 local).";
            scoreModalMsg.style.color = "#ffaa00";
        } else if (!currentUser) {
            scoreModalMsg.innerHTML = `
                <span style="color: #fff; font-size: 1.1rem; font-weight: bold;">JOGÃO! 🕹️</span><br><br>
                <span style="color: #ffd700; font-size: 0.85rem;">Mandaste muito bem! Cria a tua conta para eternizares os teus futuros recordes.</span>
            `;
        } else {
            scoreModalMsg.style.color = "#ffaa00";
            scoreModalMsg.innerText = "⚠️ MODO TREINO: A ROM utilizada não é a oficial da Arena.";
        }
    }
}

// =========================================
// 9. LEITURA NO SUPABASE & TABELA
// =========================================
function criarImg(src, fallback, alt, className, styleText) {
    const img = document.createElement('img');
    img.alt = alt;
    if (className) img.className = className;
    if (styleText) img.style.cssText = styleText;
    img.onerror = () => { img.onerror = null; img.src = fallback; };
    img.src = src;
    return img;
}

function criarCelula(...filhos) {
    const td = document.createElement('td');
    td.append(...filhos);
    return td;
}

async function fetchGlobalRanking(romCode = null) {
    try {
        let query = supabaseClient.from('global_ranking').select('*');
        if (romCode) {
            query = query.eq('game_code', romCode);
            rankingSystemTitle.innerText = `JOGO: ${romCode.toUpperCase()}`;
        } else {
            query = query.eq('system', activeSystemCode);
        }

        const { data, error } = await query.order('score', { ascending: false }).limit(10);
        if (error) throw error;

        const body = document.getElementById('ranking-data');
        if (!body) return;
        body.innerHTML = '';

        if (!data || data.length === 0) {
            body.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #888;">Nenhum recorde nestes registos.</td></tr>`;
            return;
        }

        data.forEach((row, index) => {
            const rankLabel = ['1ST', '2ND', '3RD'][index] || `${index + 1}TH`;
            const nome = String(row.player_name ?? '???');
            const jogo = String(row.game_code ?? '').toLowerCase();
            const fallbackJogador = `https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}&background=111116&color=00f0ff&bold=true`;
            const fallbackJogo = `https://ui-avatars.com/api/?name=${encodeURIComponent(jogo)}&background=111116&color=00f0ff&font-size=0.4&bold=true&rounded=true`;

            let avatarUrl = fallbackJogador;
            if (row.user_id) avatarUrl = supabaseClient.storage.from('avatars').getPublicUrl(row.user_id).data.publicUrl;

            const tr = document.createElement('tr');
            if (index === 0) tr.className = 'top-1';

            const wrapJogador = document.createElement('div');
            wrapJogador.style.cssText = 'display: flex; align-items: center; gap: 10px;';
            const spanNome = document.createElement('span');
            spanNome.textContent = nome;
            wrapJogador.append(
                criarImg(avatarUrl, fallbackJogador, 'P', '', 'width: 25px; height: 25px; border-radius: 50%; border: 1px solid var(--neon-cyan); object-fit: cover;'),
                spanNome
            );

            const wrapJogo = document.createElement('div');
            wrapJogo.className = 'game-cell';
            const spanJogo = document.createElement('span');
            spanJogo.textContent = jogo.toUpperCase();
            wrapJogo.append(
                criarImg(`./assets/logos/${encodeURIComponent(jogo)}.png`, fallbackJogo, jogo.toUpperCase(), 'game-logo'),
                spanJogo
            );

            const tdData = criarCelula(new Date(row.created_at).toLocaleDateString('pt-BR'));
            tdData.style.cssText = 'color: #888; font-size: 0.7rem;';

            tr.append(
                criarCelula(rankLabel),
                criarCelula(wrapJogador),
                criarCelula(wrapJogo),
                criarCelula(Number(row.score).toLocaleString()),
                tdData
            );
            body.appendChild(tr);
        });
    } catch (err) { console.error("[SYSTEM] Erro ao carregar ranking:", err.message); }
}

window.addEventListener('DOMContentLoaded', () => fetchGlobalRanking());

// =========================================
// 10. DETEÇÃO DE GAMEPAD (PLUG & PLAY)
// =========================================
function initGamepadIndicator() {
    let gpUI = document.getElementById('gamepad-indicator');
    if (!gpUI) {
        gpUI = document.createElement('div');
        gpUI.id = 'gamepad-indicator';
        gpUI.innerHTML = '🎮 <span id="gamepad-text">P1: OFF</span>';
        
        Object.assign(gpUI.style, {
            position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', 
            color: '#ff2a2a', border: '1px solid #ff2a2a', padding: '5px 12px', borderRadius: '4px',
            fontFamily: 'monospace', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px',
            transition: 'all 0.3s ease', zIndex: '9999', backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)'
        });
        document.body.appendChild(gpUI);
    }
}
initGamepadIndicator();

window.addEventListener("gamepadconnected", (e) => {
    const gpUI = document.getElementById('gamepad-indicator');
    const gpText = document.getElementById('gamepad-text');
    if(gpUI && gpText) {
        gpUI.style.color = '#00f0ff'; gpUI.style.borderColor = '#00f0ff'; gpUI.style.boxShadow = '0 0 8px rgba(0, 240, 255, 0.5)';
        let gamepadName = e.gamepad.id; if(gamepadName.length > 15) gamepadName = gamepadName.substring(0, 15) + '...';
        gpText.innerText = `P1: ON (${gamepadName})`;
    }
});

window.addEventListener("gamepaddisconnected", (e) => {
    const gpUI = document.getElementById('gamepad-indicator');
    const gpText = document.getElementById('gamepad-text');
    if(gpUI && gpText) {
        gpUI.style.color = '#ff2a2a'; gpUI.style.borderColor = '#ff2a2a'; gpUI.style.boxShadow = 'none'; gpText.innerText = 'P1: OFF';
    }
});
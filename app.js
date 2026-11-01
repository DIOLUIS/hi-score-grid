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

const avatarUploadInput = document.getElementById('avatar-upload');
const userAvatarImg = document.getElementById('user-avatar-img');

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
        
        userAvatarImg.src = `${data.publicUrl}?t=${new Date().getTime()}`;
        userAvatarImg.onerror = () => { 
            userAvatarImg.src = `https://ui-avatars.com/api/?name=${playerName}&background=111116&color=00f0ff`; 
        };
        
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
// 4. UPLOAD DE AVATAR (COM LIMITE E UPSERT)
// =========================================
if (avatarUploadInput) {
    avatarUploadInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file || !currentUser) return;
        if (file.size > 2 * 1024 * 1024) { alert("SISTEMA ALERTA: Imagem demasiado pesada. Limite máximo: 2MB."); return; }
        userAvatarImg.style.opacity = "0.3"; 
        try {
            const { error } = await supabaseClient.storage.from('avatars').upload(currentUser.id, file, { upsert: true, cacheControl: '3600' });
            if (error) throw error;
            const { data } = supabaseClient.storage.from('avatars').getPublicUrl(currentUser.id);
            userAvatarImg.src = `${data.publicUrl}?t=${new Date().getTime()}`;
        } catch (err) { alert("SISTEMA ALERTA: Falha na transmissão de imagem. " + err.message); } 
        finally { userAvatarImg.style.opacity = "1"; }
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

// =========================================
// 7. CONTROLOS DO EMULADOR & FIM DE JOGO
// =========================================
btnQuit.addEventListener('click', () => {
    const desejaSair = confirm("SISTEMA ALERTA: Tem a certeza que deseja abortar a missão atual? O seu progresso não guardado será perdido.");
    if (!desejaSair) return; 

    sectionEmulator.classList.add('hidden');
    if (canvas) { canvas.style.display = 'none'; canvas.remove(); }
    try {
        if (typeof WEBAudio !== 'undefined' && WEBAudio.audioContext) WEBAudio.audioContext.suspend();
        if (window.SDL && window.SDL.audioContext) window.SDL.audioContext.suspend();
    } catch(e) {}

    triggerGameOver(activeRomCode, Math.floor(Math.random() * 150000) + 25000);
});

btnFullscreen.addEventListener('click', () => { if (canvasContainer.requestFullscreen) canvasContainer.requestFullscreen(); });

function triggerGameOver(romCode, scoreAchieved) {
    finalScoreDisplay.innerText = `SCORE: ${scoreAchieved.toLocaleString()}`; 
    scoreModal.classList.remove('hidden');
    
    if (isRankedMode && currentUser) {
        sfxWin.play().catch(() => {}); 
        btnSubmitScore.style.display = 'inline-block';
        scoreModalMsg.innerText = `Recorde oficial pronto para o Global Ranking!`;
        scoreModalMsg.style.color = "var(--neon-cyan)";
        btnSkipScore.innerText = "IGNORAR E SAIR";
    } else {
        sfxGameOver.play().catch(() => {}); 
        btnSubmitScore.style.display = 'none';
        btnSkipScore.innerText = "SAIR DA MÁQUINA";

        if (!currentUser) {
            scoreModalMsg.innerHTML = `
                <span style="color: #fff; font-size: 1.1rem; font-weight: bold;">JOGÃO! 🕹️</span><br><br>
                <span style="color: #ffd700; font-size: 0.85rem;">Mandaste muito bem! Cria a tua conta (ou faz login) para eternizares os teus futuros recordes no Global Ranking e mostrares quem manda na Arena.</span>
            `;
        } else {
            scoreModalMsg.style.color = "#ffaa00";
            scoreModalMsg.innerText = "⚠️ MODO TREINO: A ROM utilizada não é a oficial da Arena. O recorde não será guardado.";
        }
    }
}

btnSubmitScore.addEventListener('click', async () => {
    let playerNameToSubmit = currentUser.user_metadata.username;
    const scoreVal = parseInt(finalScoreDisplay.innerText.replace(/\D/g, '')) || 0;
    btnSubmitScore.innerText = "A ENVIAR...";
    await submitScore(playerNameToSubmit, activeRomCode, scoreVal, runningSystemCode, currentUser.id);
    scoreModal.classList.add('hidden'); window.location.reload();
});

btnSkipScore.addEventListener('click', () => { scoreModal.classList.add('hidden'); window.location.reload(); });

// =========================================
// 8. SEGURANÇA: VALIDAÇÃO HASH SHA-256 E MODO TREINO
// =========================================
const ROM_WHITELIST = {
    'sf2': [
        '622fa72606ac0b07ac83192256e6edf062f61856a0a3f6009befb7d64a7a06b8' 
    ],
    'sf2ce': [
        '622fa72606ac0b07ac83192256e6edf062f61856a0a3f6009befb7d64a7a06b8' 
    ]
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

        if (!currentUser) {
            isRankedMode = false;
        } else {
            isRankedMode = true; 
        }
        
        sfxCoin.play().catch(() => {}); 

        sectionDrop.classList.add('hidden'); 
        sectionEmulator.classList.remove('hidden');
        bootWebAssemblyCore(activeRomCode, new Uint8Array(arrayBuffer)); 
        
    } catch (error) { 
        alert(`Erro Crítico na Análise de Ficheiro: ${error.message}`); 
        window.location.reload(); 
    }
}

function bootWebAssemblyCore(romCode, romZipBuffer) {
    if (!window.CoreFS || !window.CoreModule) { alert("A carregar motor..."); return; }
    try {
        if (!window.CoreFS.analyzePath('/roms').exists) window.CoreFS.mkdir('/roms');
        window.CoreFS.writeFile(`/roms/${romCode}.zip`, romZipBuffer);
        window.CoreFS.writeFile('/retroarch.cfg', `audio_latency = "128"\naudio_rate_control = "true"\nvideo_vsync = "true"`);
        window.CoreModule.callMain(['-c', '/retroarch.cfg', `/roms/${romCode}.zip`]); canvas.style.display = "block";
    } catch (e) { console.error("[SYSTEM] Erro Wasm:", e); }
}

// =========================================
// 9. LEITURA NO SUPABASE & TABELA (AVATARES/LOGOS E DATA)
// =========================================
async function fetchGlobalRanking() {
    try {
        const { data, error } = await supabaseClient.from('global_ranking')
            .select('*').eq('system', activeSystemCode).order('score', { ascending: false }).limit(10);
        if (error) throw error;
        
        const rankingTableBody = document.getElementById('ranking-data');
        if (!rankingTableBody) return;
        rankingTableBody.innerHTML = ''; 

        if (data && data.length > 0) {
            data.forEach((row, index) => {
                let rankLabel = index === 0 ? '1ST' : index === 1 ? '2ND' : index === 2 ? '3RD' : `${index + 1}TH`;
                const tr = document.createElement('tr');
                if (index === 0) tr.className = 'top-1';
                
                const gameCodeClean = escapeHtml(row.game_code.toLowerCase());
                const gameName = escapeHtml(row.game_code.toUpperCase());
                const fallbackGame = `https://ui-avatars.com/api/?name=${gameCodeClean}&background=111116&color=00f0ff&font-size=0.4&bold=true&rounded=true`;

                const playerFallback = `https://ui-avatars.com/api/?name=${escapeHtml(row.player_name)}&background=111116&color=00f0ff&bold=true`;
                let playerAvatarUrl = playerFallback;
                if (row.user_id) {
                    const { data: avatarData } = supabaseClient.storage.from('avatars').getPublicUrl(row.user_id);
                    playerAvatarUrl = avatarData.publicUrl;
                }

                const dataFormatada = new Date(row.created_at).toLocaleDateString('pt-BR');

                tr.innerHTML = `
                    <td>${rankLabel}</td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <img src="${playerAvatarUrl}" onerror="this.onerror=null; this.src='${playerFallback}'" style="width: 25px; height: 25px; border-radius: 50%; border: 1px solid var(--neon-cyan); object-fit: cover;" alt="P">
                            <span>${escapeHtml(row.player_name)}</span>
                        </div>
                    </td>
                    <td>
                        <div class="game-cell">
                            <img src="./assets/logos/${gameCodeClean}.png" class="game-logo" onerror="this.onerror=null; this.src='${fallbackGame}'" alt="${gameName}">
                            <span>${gameName}</span>
                        </div>
                    </td>
                    <td>${row.score.toLocaleString()}</td>
                    <td style="color: #888; font-size: 0.7rem;">${dataFormatada}</td>
                `;
                rankingTableBody.appendChild(tr);
            });
        } else {
            rankingTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #888;">Nenhum recorde neste sistema.</td></tr>`;
        }
    } catch (err) { console.error("[SYSTEM] Erro ao carregar ranking:", err.message); }
}

async function submitScore(playerName, gameCode, scoreValue, systemName, userId) {
    try {
        const { error } = await supabaseClient.from('global_ranking').insert([{ 
            player_name: playerName, 
            game_code: gameCode, 
            score: scoreValue, 
            system: systemName,
            user_id: userId 
        }]);
        if (error) throw error;
        fetchGlobalRanking();
    } catch (err) { console.error("[SYSTEM] Erro ao submeter pontuação:", err.message); }
}

function escapeHtml(str) { return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
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
            position: 'fixed', 
            top: '20px',       // Fixado na parte superior
            left: '50%',       // Centrado horizontalmente
            transform: 'translateX(-50%)', 
            color: '#ff2a2a', border: '1px solid #ff2a2a',
            padding: '5px 12px', borderRadius: '4px',
            fontFamily: 'monospace', fontSize: '0.8rem',
            display: 'flex', alignItems: 'center', gap: '8px',
            transition: 'all 0.3s ease', zIndex: '9999',
            backgroundColor: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(4px)'
        });
        document.body.appendChild(gpUI);
    }
}
initGamepadIndicator();

window.addEventListener("gamepadconnected", (e) => {
    const gpUI = document.getElementById('gamepad-indicator');
    const gpText = document.getElementById('gamepad-text');
    if(gpUI && gpText) {
        gpUI.style.color = '#00f0ff';
        gpUI.style.borderColor = '#00f0ff';
        gpUI.style.boxShadow = '0 0 8px rgba(0, 240, 255, 0.5)';
        
        let gamepadName = e.gamepad.id;
        if(gamepadName.length > 15) gamepadName = gamepadName.substring(0, 15) + '...';
        
        gpText.innerText = `P1: ON (${gamepadName})`;
        console.log(`[SYSTEM] Gamepad detetado: ${e.gamepad.id}`);
    }
});

window.addEventListener("gamepaddisconnected", (e) => {
    const gpUI = document.getElementById('gamepad-indicator');
    const gpText = document.getElementById('gamepad-text');
    if(gpUI && gpText) {
        gpUI.style.color = '#ff2a2a';
        gpUI.style.borderColor = '#ff2a2a';
        gpUI.style.boxShadow = 'none';
        gpText.innerText = 'P1: OFF';
        console.log(`[SYSTEM] Gamepad desligado: ${e.gamepad.id}`);
    }
});
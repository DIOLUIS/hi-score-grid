/**
 * HI-SCORE GRID // INSERT COIN ARENA
 * Interface, Áudio, Filtro CRT, Autenticação, Upload de Avatar, Segurança Hash e Supabase
 */

// =========================================
// 1. LIGAÇÃO AO BACKEND (SUPABASE)
// =========================================
const supabaseUrl = 'https://jjsngwebputgcctdsdac.supabase.co';
const supabaseAnonKey = 'sb_publishable_UIMz7ucKnLjFTM7XOAJpKA_YrQgLv2E';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
console.log("[SYSTEM] Conexão Supabase Estabelecida:", supabaseClient);

let currentUser = null; 

// =========================================
// 2. ELEMENTOS DA INTERFACE (DOM)
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
        scoreModalMsg.innerText = `Recorde associado à conta: ${playerName}`;
    } else {
        currentUser = null;
        btnShowLogin.classList.remove('hidden');
        loggedInInfo.classList.add('hidden');
        inputPlayerName.classList.remove('hidden');
        scoreModalMsg.innerText = "Insira as suas iniciais para o Global Ranking:";
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

        if (file.size > 2 * 1024 * 1024) {
            alert("SISTEMA ALERTA: Imagem demasiado pesada. Limite máximo: 2MB.");
            return;
        }

        userAvatarImg.style.opacity = "0.3"; 

        try {
            const { error } = await supabaseClient.storage
                .from('avatars')
                .upload(currentUser.id, file, { upsert: true, cacheControl: '3600' });
            if (error) throw error;

            const { data } = supabaseClient.storage.from('avatars').getPublicUrl(currentUser.id);
            userAvatarImg.src = `${data.publicUrl}?t=${new Date().getTime()}`;
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

// =========================================
// 7. CONTROLOS DO EMULADOR & FIM DE JOGO
// =========================================
btnQuit.addEventListener('click', () => {
    const desejaSair = confirm("SISTEMA ALERTA: Tem a certeza que deseja abortar a missão atual? O seu progresso não guardado será perdido.");
    if (!desejaSair) return; 

    // Esconde e destrói o canvas imediatamente
    sectionEmulator.classList.add('hidden');
    if (canvas) {
        canvas.style.display = 'none';
        canvas.remove();
    }

    // Corta o áudio nativo
    try {
        if (typeof WEBAudio !== 'undefined' && WEBAudio.audioContext) WEBAudio.audioContext.suspend();
        if (window.SDL && window.SDL.audioContext) window.SDL.audioContext.suspend();
    } catch(e) {}

    triggerGameOver(activeRomCode, Math.floor(Math.random() * 150000) + 25000);
});

btnFullscreen.addEventListener('click', () => { if (canvasContainer.requestFullscreen) canvasContainer.requestFullscreen(); });

function triggerGameOver(romCode, scoreAchieved) {
    finalScoreDisplay.innerText = `SCORE: ${scoreAchieved.toLocaleString()}`; scoreModal.classList.remove('hidden');
    if (!currentUser) { setTimeout(() => { inputPlayerName.focus(); inputPlayerName.select(); }, 100); }
}

btnSubmitScore.addEventListener('click', async () => {
    let playerNameToSubmit = (currentUser && currentUser.user_metadata && currentUser.user_metadata.username) ? currentUser.user_metadata.username : (inputPlayerName.value.trim() || 'ANONYMOUS');
    const scoreVal = parseInt(finalScoreDisplay.innerText.replace(/\D/g, '')) || 0;
    
    let userIdToSubmit = currentUser ? currentUser.id : null;

    btnSubmitScore.innerText = "A ENVIAR...";
    await submitScore(playerNameToSubmit, activeRomCode, scoreVal, runningSystemCode, userIdToSubmit);
    
    scoreModal.classList.add('hidden'); window.location.reload();
});
btnSkipScore.addEventListener('click', () => { scoreModal.classList.add('hidden'); window.location.reload(); });

// =========================================
// 8. SEGURANÇA: VALIDAÇÃO HASH SHA-256
// =========================================
// Defina aqui as assinaturas digitais permitidas para cada jogo
const ROM_WHITELIST = {
    'sf2': [
        '622fa72606ac0b07ac83192256e6edf062f61856a0a3f6009befb7d64a7a06b8' // Administrador: Cole a Hash aqui
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
        
        // Calcular Assinatura
        const romHash = await calculateSHA256(arrayBuffer);
        const validHashes = ROM_WHITELIST[activeRomCode];
        
        // Se a ROM não tiver um Hash autorizado (ou se o jogo nem estiver na lista)
        if (!validHashes || !validHashes.includes(romHash)) {
            // Fica vermelho e mostra o código na tela para o Admin copiar
            sectionDrop.style.backgroundColor = "rgba(255, 0, 60, 0.05)";
            dropTitle.innerHTML = `
                <span style="color: var(--neon-pink); font-size: 1.2rem;">⛔ ACESSO BLOQUEADO ⛔</span><br><br>
                <span style="font-size: 0.7rem; color: #fff;">Esta ROM não está autorizada. O Hash detetado foi:</span><br>
                <input type="text" value="${romHash}" style="width: 100%; max-width: 600px; background: #000; color: var(--neon-cyan); border: 1px solid var(--neon-cyan); padding: 15px; margin-top: 15px; text-align: center; font-family: monospace; font-size: 0.8rem; cursor: pointer;" readonly onclick="this.select();">
                <br><br>
                <span style="font-size: 0.6rem; color: #888;">(ADMIN: Clique na caixa acima, faça <strong>Ctrl + C</strong> para copiar e cole na sua Whitelist no app.js)</span>
            `;
            return; // O código pára aqui e não carrega o emulador
        }

        // Passou na segurança, preparar motor
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
                
                // Configuração da Imagem do Jogo
                const gameCodeClean = escapeHtml(row.game_code.toLowerCase());
                const gameName = escapeHtml(row.game_code.toUpperCase());
                const fallbackGame = `https://ui-avatars.com/api/?name=${gameCodeClean}&background=111116&color=00f0ff&font-size=0.4&bold=true&rounded=true`;

                // Configuração da Imagem do Jogador (Avatar)
                const playerFallback = `https://ui-avatars.com/api/?name=${escapeHtml(row.player_name)}&background=111116&color=00f0ff&bold=true`;
                let playerAvatarUrl = playerFallback;
                if (row.user_id) {
                    const { data: avatarData } = supabaseClient.storage.from('avatars').getPublicUrl(row.user_id);
                    playerAvatarUrl = avatarData.publicUrl;
                }

                // Formatação da Data
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
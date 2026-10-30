/**
 * HI-SCORE GRID // INSERT COIN ARENA
 * Interface, Áudio, Filtro CRT Dinâmico, Integração Supabase e Lógica Principal
 */

// =========================================
// 1. LIGAÇÃO AO BACKEND (SUPABASE)
// =========================================
const supabaseUrl = 'https://jjsngwebputgcctdsdac.supabase.co';
const supabaseAnonKey = 'sb_publishable_UIMz7ucKnLjFTM7XOAJpKA_YrQgLv2E';

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
console.log("[SYSTEM] Conexão Supabase Estabelecida:", supabaseClient);


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

// Modal Elements
const scoreModal = document.getElementById('score-modal');
const btnSubmitScore = document.getElementById('btn-submit-score');
const btnSkipScore = document.getElementById('btn-skip-score');
const finalScoreDisplay = document.getElementById('final-score-display');
const inputPlayerName = document.getElementById('input-player-name');

let activeRomCode = 'sf2ce';


// =========================================
// 3. LÓGICA DO SHADER CRT EM TEMPO REAL
// =========================================
btnToggleShader.addEventListener('click', () => {
    canvasContainer.classList.toggle('crt-shader');
    if (canvasContainer.classList.contains('crt-shader')) {
        btnToggleShader.className = "btn-danger";
        btnToggleShader.innerText = "DESLIGAR SHADER";
    } else {
        btnToggleShader.className = "btn-neon";
        btnToggleShader.innerText = "LIGAR SHADER CRT";
    }
});


// =========================================
// 4. DRAG & DROP E SELEÇÃO DE FICHEIRO
// =========================================
btnSelect.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.backgroundColor = 'rgba(0, 240, 255, 0.1)';
});

dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.style.backgroundColor = 'transparent';
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.backgroundColor = 'transparent';
    if (e.dataTransfer.files.length > 0) processRomFile(e.dataTransfer.files[0]);
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) processRomFile(e.target.files[0]);
});


// =========================================
// 5. CONTROLOS DO EMULADOR & FIM DE JOGO
// =========================================
btnQuit.addEventListener('click', () => {
    // Removemos o "confirm" nativo porque o emulador bloqueia esse tipo de popups
    triggerGameOver(activeRomCode, Math.floor(Math.random() * 150000) + 25000);
    
    // Tenta pausar o emulador em pano de fundo para não fazer barulho
    try {
        if (window.CoreModule && window.CoreModule.pauseMainLoop) {
            window.CoreModule.pauseMainLoop();
        }
    } catch(e) {
        console.log("[SYSTEM] Emulador continuou a correr em background.");
    }
});

btnFullscreen.addEventListener('click', () => {
    if (canvasContainer.requestFullscreen) {
        canvasContainer.requestFullscreen();
    }
});

function triggerGameOver(romCode, scoreAchieved) {
    finalScoreDisplay.innerText = `SCORE: ${scoreAchieved.toLocaleString()}`;
    scoreModal.classList.remove('hidden');
    
    // Foca automaticamente a caixa de texto para ser mais rápido escrever o nome
    setTimeout(() => {
        inputPlayerName.focus();
        inputPlayerName.select();
    }, 100);
}

btnSubmitScore.addEventListener('click', async () => {
    const playerName = inputPlayerName.value.trim() || 'ANONYMOUS';
    const scoreVal = parseInt(finalScoreDisplay.innerText.replace(/\D/g, '')) || 0;
    
    btnSubmitScore.innerText = "A ENVIAR...";
    await submitScore(playerName, activeRomCode, scoreVal, 'cps1');
    
    scoreModal.classList.add('hidden');
    window.location.reload();
});

btnSkipScore.addEventListener('click', () => {
    scoreModal.classList.add('hidden');
    window.location.reload();
});


// =========================================
// 6. PROCESSAMENTO DA ROM
// =========================================
async function processRomFile(file) {
    if (!file.name.toLowerCase().endsWith('.zip')) {
        alert("FORMATO INVÁLIDO: O ficheiro deve ser .zip");
        return;
    }

    activeRomCode = file.name.toLowerCase().replace('.zip', '');
    dropTitle.innerText = "A CARREGAR...";
    sectionDrop.classList.add('hidden');
    sectionEmulator.classList.remove('hidden');

    try {
        const arrayBuffer = await file.arrayBuffer();
        const originalZipBuffer = new Uint8Array(arrayBuffer);
        
        bootWebAssemblyCore(activeRomCode, originalZipBuffer);
    } catch (error) {
        console.error(error);
        alert(`Erro ao ler ROM: ${error.message}`);
        window.location.reload();
    }
}


// =========================================
// 7. ARRANQUE DO MOTOR WEB-ASSEMBLY
// =========================================
function bootWebAssemblyCore(romCode, romZipBuffer) {
    if (!window.CoreFS || !window.CoreModule) {
        alert("O motor Arcade ainda está a carregar. Aguarde 2 segundos.");
        return;
    }

    try {
        if (!window.CoreFS.analyzePath('/roms').exists) window.CoreFS.mkdir('/roms');
        window.CoreFS.writeFile(`/roms/${romCode}.zip`, romZipBuffer);
        
        const retroarchConfig = `
audio_latency = "128"
audio_rate_control = "true"
video_vsync = "true"
        `;
        window.CoreFS.writeFile('/retroarch.cfg', retroarchConfig);

        window.CoreModule.callMain(['-c', '/retroarch.cfg', `/roms/${romCode}.zip`]);
        canvas.style.display = "block";
        
    } catch (e) {
        console.error("[SYSTEM] Falha ao iniciar WebAssembly:", e);
    }
}


// =========================================
// 8. INTEGRAÇÃO COM O GLOBAL RANKING (SUPABASE)
// =========================================
async function fetchGlobalRanking() {
    try {
        const { data, error } = await supabaseClient
            .from('global_ranking')
            .select('*')
            .order('score', { ascending: false })
            .limit(10);

        if (error) throw error;

        const rankingTableBody = document.getElementById('ranking-data');
        if (!rankingTableBody) return;

        if (data && data.length > 0) {
            rankingTableBody.innerHTML = '';
            
            data.forEach((row, index) => {
                let rankLabel = `${index + 1}TH`;
                if (index === 0) rankLabel = '1ST';
                else if (index === 1) rankLabel = '2ND';
                else if (index === 2) rankLabel = '3RD';

                const tr = document.createElement('tr');
                if (index === 0) tr.className = 'top-1';

                tr.innerHTML = `
                    <td>${rankLabel}</td>
                    <td>${escapeHtml(row.player_name)}</td>
                    <td>${escapeHtml(row.game_code.toUpperCase())}</td>
                    <td>${row.score.toLocaleString()}</td>
                `;
                rankingTableBody.appendChild(tr);
            });
        }
    } catch (err) {
        console.error("[SYSTEM] Erro ao carregar ranking:", err.message);
    }
}

async function submitScore(playerName, gameCode, scoreValue, systemName) {
    try {
        const { error } = await supabaseClient
            .from('global_ranking')
            .insert([
                { 
                    player_name: playerName, 
                    game_code: gameCode, 
                    score: scoreValue, 
                    system: systemName 
                }
            ]);

        if (error) throw error;
        console.log("[SYSTEM] Pontuação registada com sucesso na nuvem!");
        fetchGlobalRanking();
    } catch (err) {
        console.error("[SYSTEM] Erro ao submeter pontuação:", err.message);
    }
}

function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

window.addEventListener('DOMContentLoaded', () => {
    fetchGlobalRanking();
});
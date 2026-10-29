/**
 * HI-SCORE GRID // INSERT COIN ARENA
 * Interface, Áudio, Filtro CRT Dinâmico, Integração Supabase e Lógica Principal
 */

// =========================================
// 1. LIGAÇÃO AO BACKEND (SUPABASE)
// =========================================
const supabaseUrl = 'https://jjsngwebputgcctdsdac.supabase.co';
const supabaseAnonKey = 'sb_publishable_UIMz7ucKnLjFTM7XOAJpKA_YrQgLv2E';

// Utilizamos "supabaseClient" para evitar conflito com a biblioteca global
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


// =========================================
// 3. LÓGICA DO SHADER CRT EM TEMPO REAL
// =========================================
btnToggleShader.addEventListener('click', () => {
    // Liga ou desliga a classe CSS que cria as scanlines
    canvasContainer.classList.toggle('crt-shader');
    
    // Atualiza o visual do botão consoante o estado
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
// 5. CONTROLOS DO EMULADOR
// =========================================
btnQuit.addEventListener('click', () => {
    if(confirm("Deseja realmente abortar a missão? O progresso não salvo será perdido.")) {
        window.location.reload(); 
    }
});

btnFullscreen.addEventListener('click', () => {
    if (canvasContainer.requestFullscreen) {
        canvasContainer.requestFullscreen();
    }
});


// =========================================
// 6. PROCESSAMENTO DA ROM
// =========================================
async function processRomFile(file) {
    if (!file.name.toLowerCase().endsWith('.zip')) {
        alert("FORMATO INVÁLIDO: O ficheiro deve ser .zip");
        return;
    }

    dropTitle.innerText = "A CARREGAR...";
    sectionDrop.classList.add('hidden');
    sectionEmulator.classList.remove('hidden');

    try {
        const arrayBuffer = await file.arrayBuffer();
        const originalZipBuffer = new Uint8Array(arrayBuffer);
        const romCode = file.name.toLowerCase().replace('.zip', '');
        
        bootWebAssemblyCore(romCode, originalZipBuffer);
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
/**
 * HI-SCORE GRID // INSERT COIN ARENA
 * Fase 2: Motor de Leitura de ROMs Local (In-Memory ArrayBuffer)
 */

// 1. Mapeamento do DOM (Document Object Model)
const dropZone = document.getElementById('rom-drop-zone');
const fileInput = document.getElementById('rom-input');
const btnSelect = document.getElementById('btn-select-rom');
const dropTitle = document.getElementById('drop-title');
const sectionDrop = document.getElementById('drop-zone-section');
const sectionEmulator = document.getElementById('emulator-section');
const btnQuit = document.getElementById('btn-quit');

// 2. Eventos de Interação UX/UI
btnSelect.addEventListener('click', () => {
    fileInput.click(); // Conecta o botão visual ao input oculto
});

// Efeitos visuais de Drag & Drop (Arrastar e Soltar)
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault(); // Necessário para permitir o drop
    dropZone.style.backgroundColor = 'rgba(0, 240, 255, 0.1)';
    dropZone.style.boxShadow = 'inset 0 0 30px rgba(0, 240, 255, 0.3)';
    dropZone.style.borderColor = '#fff';
});

dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    resetDropZoneUI();
});

// 3. Captura do Arquivo
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    resetDropZoneUI();
    
    if (e.dataTransfer.files.length > 0) {
        processRomFile(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        processRomFile(e.target.files[0]);
    }
});

// 4. Reset Visual da Drop Zone
function resetDropZoneUI() {
    dropZone.style.backgroundColor = 'transparent';
    dropZone.style.boxShadow = 'none';
    dropZone.style.borderColor = 'var(--neon-cyan)';
}

// 5. Motor de Leitura na Memória (ArrayBuffer)
function processRomFile(file) {
    // Validação básica de segurança (UX)
    if (!file.name.toLowerCase().endsWith('.zip')) {
        alert("FORMATO INVÁLIDO: Por favor, insira um arquivo .zip compatível com CPS1.");
        return;
    }

    dropTitle.innerText = "LENDO DADOS...";
    dropTitle.style.color = "var(--neon-pink)";

    // Instancia o leitor nativo do navegador
    const reader = new FileReader();

    reader.onload = function(event) {
        // O arquivo agora reside exclusivamente na RAM do cliente
        const arrayBuffer = event.target.result;
        
        // Converte para Uint8Array (formato padrão consumido por emuladores em C/C++ compilados via WebAssembly)
        const romData = new Uint8Array(arrayBuffer);
        
        console.log(`[SYSTEM] Arquivo carregado com sucesso: ${file.name}`);
        console.log(`[SYSTEM] Tamanho alocado na RAM: ${(romData.length / 1024 / 1024).toFixed(2)} MB`);

        // Transição de UI: Oculta Drop Zone e exibe o Canvas do Emulador
        transitionToEmulator();
        
        // TODO (Fase 3): Aqui enviaremos o 'romData' para validação de Hash e injeção no WebAssembly.
    };

    reader.onerror = function() {
        alert("ERRO CRÍTICO: Falha ao ler o arquivo na memória local.");
        dropTitle.innerText = "SISTEMA ATIVO: CPS-1";
        dropTitle.style.color = "var(--neon-cyan)";
    };

    // Inicia a leitura assíncrona do arquivo como buffer binário
    reader.readAsArrayBuffer(file);
}

// 6. Transição de Telas
function transitionToEmulator() {
    sectionDrop.classList.add('hidden');
    sectionEmulator.classList.remove('hidden');
}

// 7. Abortar Missão (Voltar à Drop Zone)
btnQuit.addEventListener('click', () => {
    sectionEmulator.classList.add('hidden');
    sectionDrop.classList.remove('hidden');
    
    // Limpa o input e reseta a UI
    fileInput.value = "";
    dropTitle.innerText = "SISTEMA ATIVO: CPS-1";
    dropTitle.style.color = "var(--neon-cyan)";
    console.log("[SYSTEM] Emulação abortada. Memória liberada.");
});
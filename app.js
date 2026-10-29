/**
 * HI-SCORE GRID // INSERT COIN ARENA
 * Fases 2 e 3: Leitura Local, Hash SHA-1 e Emscripten WASM Bridge
 */

// 1. Mapeamento do DOM
const dropZone = document.getElementById('rom-drop-zone');
const fileInput = document.getElementById('rom-input');
const btnSelect = document.getElementById('btn-select-rom');
const dropTitle = document.getElementById('drop-title');
const sectionDrop = document.getElementById('drop-zone-section');
const sectionEmulator = document.getElementById('emulator-section');
const btnQuit = document.getElementById('btn-quit');

// 2. Eventos de UI (Drag & Drop)
btnSelect.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.backgroundColor = 'rgba(0, 240, 255, 0.1)';
    dropZone.style.boxShadow = 'inset 0 0 30px rgba(0, 240, 255, 0.3)';
    dropZone.style.borderColor = '#fff';
});

dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    resetDropZoneUI();
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    resetDropZoneUI();
    if (e.dataTransfer.files.length > 0) processRomFile(e.dataTransfer.files[0]);
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) processRomFile(e.target.files[0]);
});

function resetDropZoneUI() {
    dropZone.style.backgroundColor = 'transparent';
    dropZone.style.boxShadow = 'none';
    dropZone.style.borderColor = 'var(--neon-cyan)';
}

// 3. Whitelist de Hashes SHA-1 (Anti-Cheat Data)
const VALID_ROMS = {
    "exemplo_de_hash_sha1_aqui": { game: "Street Fighter II' - Champion Edition", rom: "sf2ce" }
};

// 4. Motor Principal (Leitura + Criptografia)
async function processRomFile(file) {
    if (!file.name.toLowerCase().endsWith('.zip')) {
        alert("FORMATO INVÁLIDO: Arquivo deve ser .zip");
        return;
    }

    dropTitle.innerText = "DESCRIPTOGRAFANDO E VALIDANDO...";
    dropTitle.style.color = "var(--neon-pink)";

    try {
        const arrayBuffer = await file.arrayBuffer();
        
        // 4.1 Abre o ZIP na memória e lê os ficheiros
        const zip = await JSZip.loadAsync(arrayBuffer);
        const fileNames = Object.keys(zip.files).filter(name => !zip.files[name].dir).sort();
        
        // 4.2 Concatena os binários
        let totalSize = 0;
        const buffers = [];
        for (const name of fileNames) {
            const fileData = await zip.files[name].async("uint8array");
            buffers.push(fileData);
            totalSize += fileData.length;
        }

        const concatenated = new Uint8Array(totalSize);
        let offset = 0;
        for (const buf of buffers) {
            concatenated.set(buf, offset);
            offset += buf.length;
        }

        // 4.3 Calcula a assinatura digital da ROM (SHA-1)
        const hashBuffer = await crypto.subtle.digest('SHA-1', concatenated);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const sha1Hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        console.log(`[SECURITY] Hash SHA-1 gerado: ${sha1Hash}`);

        // Validação (Comentada para permitir testes de integração agora)
        /*
        if (!VALID_ROMS[sha1Hash]) {
            throw new Error("ROM ADULTERADA OU DESCONHECIDA. Cheat detectado.");
        }
        */
        
        transitionToEmulator();
        
        // 4.4 Envia a ROM para o sistema de ficheiros virtual do WASM
        const originalZipBuffer = new Uint8Array(arrayBuffer);
        const romCode = file.name.toLowerCase().replace('.zip', '');
        console.log(`[SYSTEM] A iniciar núcleo com a ROM: ${romCode}`);
        
        bootWebAssemblyCore(romCode, originalZipBuffer);

    } catch (error) {
        console.error(error);
        alert(`FALHA DE SEGURANÇA: ${error.message}`);
        dropTitle.innerText = "SISTEMA ATIVO: CPS-1";
        dropTitle.style.color = "var(--neon-cyan)";
    }
}

function transitionToEmulator() {
    sectionDrop.classList.add('hidden');
    sectionEmulator.classList.remove('hidden');
}

btnQuit.addEventListener('click', () => {
    sectionEmulator.classList.add('hidden');
    sectionDrop.classList.remove('hidden');
    fileInput.value = "";
    dropTitle.innerText = "SISTEMA ATIVO: CPS-1";
    dropTitle.style.color = "var(--neon-cyan)";
    document.getElementById('emulator-canvas').style.display = "none";
    console.log("[SYSTEM] Emulação abortada. Memória liberada.");
});

// 5. Ponte com o WebAssembly (Emscripten)
var Module = {
    canvas: (function() {
        var canvas = document.getElementById('emulator-canvas');
        canvas.addEventListener("webglcontextlost", function(e) { 
            alert('Contexto WebGL perdido. Recarregue a página.'); 
            e.preventDefault(); 
        }, false);
        return canvas;
    })(),
    noInitialRun: true,
    
    // Mapeamento correto para a pasta core/
    locateFile: function(path) {
        if (path.endsWith('.wasm')) {
            return 'core/' + path;
        }
        return path;
    },
    
    print: function(text) { console.log("[FBNeo] " + text); },
    printErr: function(text) { console.error("[FBNeo] " + text); }
};

// 5. Ponte com o WebAssembly (Emscripten Moderna)
function bootWebAssemblyCore(romCode, romZipBuffer) {
    console.log(`[SYSTEM] Preparando FileSystem Virtual para ${romCode}.zip...`);

    // Verifica se o motor importado no HTML já terminou de carregar
    if (!window.CoreFS || !window.CoreModule) {
        alert("O motor Arcade ainda está a carregar. Aguarde 2 segundos e tente arrastar novamente.");
        return;
    }

    try {
        // Cria a pasta no sistema de ficheiros virtual do emulador
        if (!window.CoreFS.analyzePath('/roms').exists) {
            window.CoreFS.mkdir('/roms');
        }
        
        // Escreve a ROM do Street Fighter na memória
        window.CoreFS.writeFile(`/roms/${romCode}.zip`, romZipBuffer);
        console.log(`[SYSTEM] ROM injetada no VFS: /roms/${romCode}.zip`);
        
        // Puxa o gatilho principal do motor C++
        window.CoreModule.callMain([`/roms/${romCode}.zip`]);
        document.getElementById('emulator-canvas').style.display = "block";
        
    } catch (e) {
        console.error("[SYSTEM] Falha ao iniciar WebAssembly:", e);
    }
}
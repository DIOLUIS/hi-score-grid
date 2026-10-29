/**
 * HI-SCORE GRID // ARCADE CONTROLLER BRIDGE
 * Gere o mapeamento do Teclado e do Comando (Gamepad API)
 */

console.log("[INPUT] Módulo de controlos Arcade inicializado.");

// O núcleo do Libretro/Emscripten escuta as seguintes teclas nativamente:
// Enter (Start), Shift (Insert Coin / Select)
// Setas Direcionais (Movimento)
// Z, X, C, A, S, D (Ação - Socos e Pontapés no CPS-1)

// Memória de estado dos botões do comando para não disparar eventos repetidos
const gamepadState = {};

// Mapeamento do Comando (ex: GameSir) para as Teclas do Emulador
const buttonToKeyMap = {
    0: 'KeyZ',        // A (Soco Fraco)
    1: 'KeyX',        // B (Pontapé Fraco)
    2: 'KeyC',        // X (Soco Médio)
    3: 'KeyV',        // Y (Pontapé Médio)
    8: 'ShiftLeft',   // Select / Ficha (Coin)
    9: 'Enter',       // Start
    12: 'ArrowUp',    // D-Pad Cima
    13: 'ArrowDown',  // D-Pad Baixo
    14: 'ArrowLeft',  // D-Pad Esquerda
    15: 'ArrowRight'  // D-Pad Direita
};

// Dispara um evento de teclado simulado no documento
function simulateKeyEvent(keyCode, type) {
    const event = new KeyboardEvent(type, {
        code: keyCode,
        key: keyCode,
        bubbles: true,
        cancelable: true,
    });
    document.dispatchEvent(event);
}

// O Loop principal que vigia o comando a 60 frames por segundo
function pollGamepad() {
    const gamepads = navigator.getGamepads();
    const pad = gamepads[0]; // Assume o primeiro comando conectado (Player 1)

    if (pad) {
        pad.buttons.forEach((button, index) => {
            const isPressed = button.pressed;
            const wasPressed = gamepadState[index] || false;
            
            const mappedKey = buttonToKeyMap[index];

            if (mappedKey) {
                // Se o botão acabou de ser pressionado
                if (isPressed && !wasPressed) {
                    simulateKeyEvent(mappedKey, 'keydown');
                    gamepadState[index] = true;
                }
                // Se o botão acabou de ser solto
                else if (!isPressed && wasPressed) {
                    simulateKeyEvent(mappedKey, 'keyup');
                    gamepadState[index] = false;
                }
            }
        });
    }

    // Continua a vigiar no próximo frame de animação
    requestAnimationFrame(pollGamepad);
}

// Deteta quando liga o comando
window.addEventListener("gamepadconnected", (e) => {
    console.log(`[INPUT] Comando conectado: ${e.gamepad.id}`);
    pollGamepad(); // Inicia a vigilância
});

window.addEventListener("gamepaddisconnected", (e) => {
    console.log(`[INPUT] Comando desconectado: ${e.gamepad.id}`);
});

// Impede que as setas do teclado façam scroll na página enquanto joga
window.addEventListener("keydown", function(e) {
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].indexOf(e.code) > -1) {
        e.preventDefault();
    }
}, false);
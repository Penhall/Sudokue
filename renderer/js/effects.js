// ============================================
// SISTEMA DE EFEITOS SONOROS E VISUAIS
// ============================================

// Contexto de áudio global
let audioContext = null;

function getAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

// --- Gerador de Tom Simples ---
function playTone(frequency, duration, type = 'sine', volume = 0.3) {
    try {
        const ctx = getAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(volume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
        console.error('Erro ao reproduzir som:', e);
    }
}

// --- 1. Som de VITÓRIA: Melodia Ascendente Alegre ---
function playVictorySound() {
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
        setTimeout(() => playTone(freq, 0.3, 'sine', 0.4), i * 150);
    });
}

// --- 2. Som de DERROTA: Descendente Grave ---
function playDefeatSound() {
    const notes = [300, 250, 200, 150];
    notes.forEach((freq, i) => {
        setTimeout(() => playTone(freq, 0.4, 'sawtooth', 0.3), i * 200);
    });
}

// --- 3. Som de BLOCO 4x4 COMPLETO: Acorde Harmônico ---
function playBlockCompleteSound() {
    playTone(440, 0.2, 'sine', 0.3); // A4
    setTimeout(() => playTone(554.37, 0.2, 'sine', 0.3), 50); // C#5
    setTimeout(() => playTone(659.25, 0.3, 'sine', 0.3), 100); // E5
}

// --- 4. Som de LINHA/COLUNA COMPLETA: Sucesso Médio ---
function playLineCompleteSound() {
    playTone(523.25, 0.15, 'triangle', 0.3); // C5
    setTimeout(() => playTone(659.25, 0.2, 'triangle', 0.3), 100); // E5
}

// --- 5. Som de NÚMERO FINALIZADO: Pop Curto ---
function playNumberCompleteSound() {
    playTone(880, 0.1, 'sine', 0.4); // A5 - som agudo e curto
}

// --- 6. Som de SELEÇÃO: Soft click ao selecionar célula ---
function playSelectSound() {
    playTone(600, 0.05, 'sine', 0.15);
}

// --- 7. Som de CORRETO: Pop brilhante ao acertar número ---
function playCorrectSound() {
    playTone(880, 0.08, 'sine', 0.25);
    setTimeout(() => playTone(1320, 0.06, 'sine', 0.15), 40);
}

// --- 8. Som de ERRO: Buzz ao errar ---
function playErrorSound() {
    playTone(150, 0.15, 'sawtooth', 0.2);
}

// --- 9. Som de RASCUNHO: Soft tick ao alternar modo lápis ---
function playPencilSound() {
    playTone(1000, 0.03, 'sine', 0.1);
}

// --- 10. Som de LIMPAR: Swoosh ao apagar célula ---
function playClearSound() {
    playTone(400, 0.06, 'sine', 0.12);
    setTimeout(() => playTone(300, 0.04, 'sine', 0.1), 30);
}

// --- 11. Som de DICA: Chime de revelação ---
function playHintSound() {
    playTone(1046, 0.1, 'sine', 0.3); // C6 bright chime
}

// --- 12. Som de CLIQUE: UI click genérico para botões ---
function playClickSound() {
    playTone(800, 0.03, 'sine', 0.1);
}

// --- 13. Som de PAUSA: Duas notas descendentes ---
function playPauseSound() {
    playTone(500, 0.08, 'triangle', 0.2);
    setTimeout(() => playTone(350, 0.08, 'triangle', 0.2), 80);
}

// --- 14. Som de RESUME: Duas notas ascendentes ---
function playResumeSound() {
    playTone(350, 0.08, 'triangle', 0.2);
    setTimeout(() => playTone(500, 0.08, 'triangle', 0.2), 80);
}

// --- 15. Som de NOVO JOGO: Fanfarra de abertura ---
function playNewGameSound() {
    playTone(523, 0.12, 'sine', 0.3);
    setTimeout(() => playTone(659, 0.12, 'sine', 0.3), 100);
    setTimeout(() => playTone(784, 0.15, 'sine', 0.3), 200);
}

// ============================================
// EFEITOS VISUAIS
// ============================================

// --- 1. Animação de VITÓRIA: Confetes ---
function showVictoryAnimation() {
    const colors = ['#ffcc00', '#00ff66', '#ffffff', '#ff0000', '#888888', '#ffcc00'];
    const container = document.body;

    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        container.appendChild(confetti);

        setTimeout(() => confetti.remove(), 3500);
    }

    // Adiciona classe de pulse no tabuleiro
    const grid = document.getElementById('grid');
    if (grid) {
        grid.classList.add('victory-animation');
        setTimeout(() => grid.classList.remove('victory-animation'), 3000);
    }
}

// --- 2. Animação de DERROTA: Shake + Flash ---
function showDefeatAnimation() {
    const grid = document.getElementById('grid');
    if (grid) grid.classList.add('defeat-animation');
    document.body.classList.add('defeat-flash');

    setTimeout(() => {
        if (grid) grid.classList.remove('defeat-animation');
        document.body.classList.remove('defeat-flash');
    }, 1200);
}

// --- 3. Animação de BLOCO 4x4 COMPLETO ---
function showBlockCompleteAnimation(blockRow, blockCol) {
    const grid = document.getElementById('grid');
    if (!grid) return;
    const cells = grid.querySelectorAll('.cell');

    for (let r = blockRow; r < blockRow + 4; r++) {
        for (let c = blockCol; c < blockCol + 4; c++) {
            const index = r * 16 + c;
            if (cells[index]) {
                cells[index].classList.add('block-complete');
            }
        }
    }

    setTimeout(() => {
        cells.forEach(cell => cell.classList.remove('block-complete'));
    }, 1000);
}

// --- 4. Animação de LINHA/COLUNA COMPLETA ---
function showLineCompleteAnimation(type, index) {
    const grid = document.getElementById('grid');
    if (!grid) return;
    const cells = grid.querySelectorAll('.cell');

    if (type === 'row') {
        for (let c = 0; c < 16; c++) {
            const cellIndex = index * 16 + c;
            if (cells[cellIndex]) {
                cells[cellIndex].classList.add('line-complete');
            }
        }
    } else if (type === 'col') {
        for (let r = 0; r < 16; r++) {
            const cellIndex = r * 16 + index;
            if (cells[cellIndex]) {
                cells[cellIndex].classList.add('line-complete');
            }
        }
    }

    setTimeout(() => {
        cells.forEach(cell => cell.classList.remove('line-complete'));
    }, 800);
}

// ============================================
// FUNÇÕES DE VERIFICAÇÃO E TRIGGER
// ============================================

// Verifica se um bloco 4x4 está completo
function isBlockComplete(blockRow, blockCol) {
    for (let r = blockRow; r < blockRow + 4; r++) {
        for (let c = blockCol; c < blockCol + 4; c++) {
            if (board[r][c] !== solution[r][c]) return false;
        }
    }
    return true;
}

// Verifica se uma linha está completa
function isRowComplete(row) {
    for (let c = 0; c < 16; c++) {
        if (board[row][c] !== solution[row][c]) return false;
    }
    return true;
}

// Verifica se uma coluna está completa
function isColComplete(col) {
    for (let r = 0; r < 16; r++) {
        if (board[r][col] !== solution[r][col]) return false;
    }
    return true;
}

// Trigger de efeitos após jogada
function triggerEffectsAfterMove(row, col) {
    // Verifica bloco 4x4
    const blockRow = Math.floor(row / 4) * 4;
    const blockCol = Math.floor(col / 4) * 4;
    if (isBlockComplete(blockRow, blockCol)) {
        playBlockCompleteSound();
        showBlockCompleteAnimation(blockRow, blockCol);
    }

    // Verifica linha
    if (isRowComplete(row)) {
        setTimeout(() => {
            playLineCompleteSound();
            showLineCompleteAnimation('row', row);
        }, 300);
    }

    // Verifica coluna
    if (isColComplete(col)) {
        setTimeout(() => {
            playLineCompleteSound();
            showLineCompleteAnimation('col', col);
        }, 600);
    }
}

// Trigger de vitória
function triggerVictoryEffects() {
    playVictorySound();
    showVictoryAnimation();
}

// Trigger de derrota
function triggerDefeatEffects() {
    playDefeatSound();
    showDefeatAnimation();
}

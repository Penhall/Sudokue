// ============================================
// SUDOKUE GAME ENGINE
// Dependencies: solver.js, storage.js, effects.js
// ============================================

const CHARS = ['1','2','3','4','5','6','7','8','9','A','B','C','D','E','F','G'];
let solution = [];
let board = [];
let fixed = [];
let pencilMarks = [];
let selectedCell = null;

let isPencilMode = false;
let mistakes = 0;
let mistakeLimit = 5;
let hintsLeft = 3;

let timerInterval = null;
let secondsElapsed = 0;
let isPaused = false;
let startedAt = null;
let currentDifficulty = 'medium';

// Difficulty config
const DIFFICULTY_CONFIG = {
  easy:    { mistakeLimit: Infinity, label: 'Fácil' },
  medium:  { mistakeLimit: 5,        label: 'Médio' },
  hard:    { mistakeLimit: 3,        label: 'Difícil' },
  expert:  { mistakeLimit: 1,        label: 'Expert' }
};

// Auto-save interval tracker
let autoSaveInterval = null;

// ==========================================
// GERAÇÃO DO SUDOKU (via solver.js)
// ==========================================

function newGame() {
  currentDifficulty = document.getElementById('difficulty').value;

  // Show generating modal for slow generations
  const genModal = document.getElementById('generatingModal');
  const genStatus = document.getElementById('generating-status');
  if (genModal) genModal.classList.add('show');
  if (genStatus) genStatus.textContent = 'Gerando puzzle...';

  // Use setTimeout to let the modal render
  setTimeout(() => {
    try {
      const result = SudokueSolver.generatePuzzle(currentDifficulty);

      solution = result.solution;
      board = result.board;
      fixed = result.fixed;
      pencilMarks = Array.from({length: 16}, () =>
        Array.from({length: 16}, () => new Set())
      );

      // Set difficulty config
      const config = DIFFICULTY_CONFIG[currentDifficulty];
      mistakeLimit = config.mistakeLimit;
      hintsLeft = 3;
      mistakes = 0;
      selectedCell = null;
      isPencilMode = false;
      isPaused = false;
      secondsElapsed = 0;
      startedAt = new Date().toISOString();

      document.getElementById('message').textContent = '';
      document.getElementById('gameOverModal').classList.remove('show');
      document.getElementById('pencil-btn').textContent = 'Rascunho: OFF';
      document.getElementById('pencil-btn').classList.remove('active-mode');
      const pauseBtnNew = document.getElementById('pause-btn');
      if (pauseBtnNew) pauseBtnNew.textContent = '⏸';

      updateDifficultySettings();
      updateHintsUI();
      updateTimerDisplay();
      updatePreview();
      renderGrid();
      updateCounts();
      startTimer();

      // Clear any saved game since we started fresh
      SudokueStorage.clearGameState();

    } catch (e) {
      console.error('Failed to generate puzzle:', e);
      if (genStatus) genStatus.textContent = 'Erro ao gerar. Tente novamente.';
      setTimeout(() => { if (genModal) genModal.classList.remove('show'); }, 2000);
      return;
    }

    if (genModal) genModal.classList.remove('show');

    if (typeof playNewGameSound === 'function') {
      playNewGameSound();
    }

    // Save initial state
    autoSave();
  }, 50);
}

function restartGame() {
  for (let r = 0; r < 16; r++) {
    for (let c = 0; c < 16; c++) {
      if (!fixed[r][c]) {
        board[r][c] = 0;
        pencilMarks[r][c].clear();
      }
    }
  }
  mistakes = 0;
  hintsLeft = 3;
  selectedCell = null;
  isPencilMode = false;
  isPaused = false;
  secondsElapsed = 0;
  startedAt = new Date().toISOString();

  document.getElementById('message').textContent = '';
  document.getElementById('gameOverModal').classList.remove('show');
  document.getElementById('pencil-btn').textContent = 'Rascunho: OFF';
  document.getElementById('pencil-btn').classList.remove('active-mode');
  const pauseBtn = document.getElementById('pause-btn');
  if (pauseBtn) pauseBtn.textContent = '⏸';

  updateHintsUI();
  updateTimerDisplay();
  updatePreview();
  renderGrid();
  updateCounts();
  startTimer();
  autoSave();

  if (typeof playNewGameSound === 'function') {
    playNewGameSound();
  }
}

// ==========================================
// CRONÔMETRO
// ==========================================

function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function startTimer() {
  stopTimer();
  if (isPaused) return;
  timerInterval = setInterval(() => {
    secondsElapsed++;
    updateTimerDisplay();
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimerDisplay() {
  const el = document.getElementById('timer-display');
  if (!el) return;
  if (isPaused) {
    el.textContent = '⏸ PAUSADO';
  } else {
    el.textContent = formatTime(secondsElapsed);
  }
}

function togglePause() {
  isPaused = !isPaused;
  const pauseBtn = document.getElementById('pause-btn');
  if (isPaused) {
    stopTimer();
    if (pauseBtn) pauseBtn.textContent = '▶';
    if (typeof playPauseSound === 'function') {
      playPauseSound();
    }
  } else {
    startTimer();
    if (pauseBtn) pauseBtn.textContent = '⏸';
    if (typeof playResumeSound === 'function') {
      playResumeSound();
    }
  }
  updateTimerDisplay();
}

function restartTimer() {
  secondsElapsed = 0;
  isPaused = false;
  const pauseBtn = document.getElementById('pause-btn');
  if (pauseBtn) pauseBtn.textContent = '⏸';
  updateTimerDisplay();
  startTimer();
}

// ==========================================
// PAINEL DE PREVIEW
// ==========================================

function updatePreview() {
  const previewCell = document.getElementById('preview-cell');
  const infoPosition = document.getElementById('info-position');
  const infoBlock = document.getElementById('info-block');
  const infoStatus = document.getElementById('info-status');

  if (!previewCell) return;

  // Reset classes
  previewCell.className = 'preview-cell';
  previewCell.innerHTML = '';

  if (!selectedCell) {
    previewCell.innerHTML = '<div class="preview-empty">Clique em uma célula</div>';
    if (infoPosition) infoPosition.textContent = '-';
    if (infoBlock) infoBlock.textContent = '-';
    if (infoStatus) infoStatus.textContent = '-';
    return;
  }

  const {r, c} = selectedCell;
  const value = board[r][c];
  const isFixed = fixed[r][c];
  const isCorrect = value !== 0 && value === solution[r][c];
  const isError = value !== 0 && value !== solution[r][c] && !isFixed;
  const blockRow = Math.floor(r / 4) + 1;
  const blockCol = Math.floor(c / 4) + 1;

  if (infoPosition) infoPosition.textContent = `L${r + 1} / C${c + 1}`;
  if (infoBlock) infoBlock.textContent = `B${blockRow}-${blockCol}`;

  let status = 'Vazia';
  if (isFixed) status = 'Fixo';
  else if (isCorrect) status = 'Correto';
  else if (isError) status = 'Errado';
  else if (pencilMarks[r][c].size > 0) status = `${pencilMarks[r][c].size} rascunho(s)`;
  if (infoStatus) infoStatus.textContent = status;

  if (value !== 0) {
    const valSpan = document.createElement('span');
    valSpan.className = 'preview-value';
    valSpan.textContent = CHARS[value - 1];

    if (isFixed) valSpan.classList.add('fixed-value');
    else if (isError) valSpan.classList.add('error-value');
    else valSpan.classList.add('user-value');

    previewCell.appendChild(valSpan);

    if (isFixed) previewCell.classList.add('fixed');
    if (isError) previewCell.classList.add('error');
  } else if (pencilMarks[r][c].size > 0) {
    const miniGrid = document.createElement('div');
    miniGrid.className = 'preview-pencil-grid';
    for (let i = 1; i <= 16; i++) {
      const mark = document.createElement('span');
      mark.className = 'preview-pencil-mark';
      if (pencilMarks[r][c].has(i)) {
        mark.textContent = CHARS[i - 1];
        mark.classList.add('active');
      }
      miniGrid.appendChild(mark);
    }
    previewCell.appendChild(miniGrid);
  } else {
    previewCell.innerHTML = '<div class="preview-empty">Célula vazia</div>';
  }

  previewCell.classList.add('selected-preview');
}

// ==========================================
// LÓGICA DO JOGO
// ==========================================

function updateDifficultySettings() {
  const diff = document.getElementById('difficulty').value;
  const config = DIFFICULTY_CONFIG[diff];
  if (config) {
    mistakeLimit = config.mistakeLimit;
  }
  updateMistakesUI();
}

function onDifficultyChange() {
  if (typeof playClickSound === 'function') {
    playClickSound();
  }
  // Changing difficulty triggers immediate new game
  newGame();
}

function onThemeChange() {
  if (typeof playClickSound === 'function') {
    playClickSound();
  }
  const theme = document.getElementById('theme').value;
  document.body.setAttribute('data-theme', theme);
  localStorage.setItem('sudokue-theme', theme);
}

function renderGrid() {
  const gridEl = document.getElementById('grid');
  gridEl.innerHTML = '';

  for (let r = 0; r < 16; r++) {
    for (let c = 0; c < 16; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';

      // Block borders
      if ((c + 1) % 4 === 0 && c !== 15) cell.classList.add('border-right');
      if ((r + 1) % 4 === 0 && r !== 15) cell.classList.add('border-bottom');

      if (fixed[r][c]) cell.classList.add('fixed');

      if (selectedCell && selectedCell.r === r && selectedCell.c === c) {
        cell.classList.add('selected');
      } else if (selectedCell) {
        const sameBox = Math.floor(r / 4) === Math.floor(selectedCell.r / 4) &&
                      Math.floor(c / 4) === Math.floor(selectedCell.c / 4);
        if (r === selectedCell.r || c === selectedCell.c || sameBox) {
          cell.classList.add('highlight');
        }
        if (r === selectedCell.r) {
          cell.classList.add('row-highlight');
        }
        if (c === selectedCell.c) {
          cell.classList.add('col-highlight');
        }
        const selectedVal = board[selectedCell.r][selectedCell.c];
        if (selectedVal !== 0 && board[r][c] === selectedVal) {
          cell.classList.add('same-number');
          cell.classList.add('value-highlight');
        }
      }

      if (board[r][c] !== 0) {
        cell.textContent = CHARS[board[r][c] - 1];
        if (!fixed[r][c] && board[r][c] !== solution[r][c]) {
          cell.classList.add('error');
        }
      } else if (pencilMarks[r][c].size > 0) {
        const miniGrid = document.createElement('div');
        miniGrid.className = 'pencil-grid';
        for (let i = 1; i <= 16; i++) {
          const mark = document.createElement('span');
          mark.className = 'pencil-mark';
          if (pencilMarks[r][c].has(i)) {
            mark.textContent = CHARS[i - 1];
          }
          miniGrid.appendChild(mark);
        }
        cell.appendChild(miniGrid);
      }

      cell.addEventListener('click', () => {
        selectedCell = {r, c};
        if (typeof playSelectSound === 'function') {
          playSelectSound();
        }
        renderGrid();
        updatePreview();
      });

      gridEl.appendChild(cell);
    }
  }
}

function removePencilMarkFromRelated(row, col, number) {
  for (let c = 0; c < 16; c++) {
    if (c !== col && pencilMarks[row][c].has(number)) pencilMarks[row][c].delete(number);
  }
  for (let r = 0; r < 16; r++) {
    if (r !== row && pencilMarks[r][col].has(number)) pencilMarks[r][col].delete(number);
  }
  const blockRow = Math.floor(row / 4) * 4;
  const blockCol = Math.floor(col / 4) * 4;
  for (let r = blockRow; r < blockRow + 4; r++) {
    for (let c = blockCol; c < blockCol + 4; c++) {
      if ((r !== row || c !== col) && pencilMarks[r][c].has(number)) pencilMarks[r][c].delete(number);
    }
  }
}

function handleInput(val) {
  if (!selectedCell) return;
  if (isPaused) return;
  const {r, c} = selectedCell;
  if (fixed[r][c]) return;

  if (isPencilMode && val !== 0) {
    if (pencilMarks[r][c].has(val)) {
      pencilMarks[r][c].delete(val);
    } else {
      pencilMarks[r][c].add(val);
    }
    renderGrid();
    updatePreview();
    autoSave();
    return;
  }

  if (val === 0) {
    board[r][c] = 0;
    pencilMarks[r][c].clear();
    if (typeof playClearSound === 'function') {
      playClearSound();
    }
  } else {
    if (val === solution[r][c]) {
      board[r][c] = val;
      pencilMarks[r][c].clear();
      removePencilMarkFromRelated(r, c, val);
      if (typeof playCorrectSound === 'function') {
        playCorrectSound();
      }
      if (typeof triggerEffectsAfterMove === 'function') {
        triggerEffectsAfterMove(r, c);
      }
    } else {
      if (typeof playErrorSound === 'function') {
        playErrorSound();
      }
      mistakes++;
      updateMistakesUI();

      const cells = document.querySelectorAll('.cell');
      const index = r * 16 + c;
      if (cells[index]) {
        cells[index].classList.add('error');
        setTimeout(() => {
          if (board[r][c] === 0) cells[index].classList.remove('error');
        }, 500);
      }

      if (mistakes >= mistakeLimit) {
        autoSave();
        triggerGameOver();
        return;
      }
    }
  }

  renderGrid();
  updatePreview();
  updateCounts();
  autoSave();
  checkWin();
}

function togglePencilMode() {
  isPencilMode = !isPencilMode;
  if (typeof playPencilSound === 'function') {
    playPencilSound();
  }
  const btn = document.getElementById('pencil-btn');
  if (isPencilMode) {
    btn.textContent = 'Rascunho: ON';
    btn.classList.add('active-mode');
  } else {
    btn.textContent = 'Rascunho: OFF';
    btn.classList.remove('active-mode');
  }
}

function useHint() {
  if (!selectedCell || hintsLeft <= 0) return;
  const {r, c} = selectedCell;
  if (fixed[r][c]) return;

  if (typeof playHintSound === 'function') {
    playHintSound();
  }

  board[r][c] = solution[r][c];
  fixed[r][c] = true;
  pencilMarks[r][c].clear();

  hintsLeft--;
  updateHintsUI();
  renderGrid();
  updatePreview();
  updateCounts();
  autoSave();
  checkWin();
}

function updateHintsUI() {
  const btn = document.getElementById('hint-btn');
  const countSpan = document.getElementById('hints-count');
  if (countSpan) countSpan.textContent = hintsLeft;

  if (hintsLeft <= 0) {
    if (btn) btn.style.display = 'none';
  } else {
    if (btn) btn.style.display = 'block';
  }
}

function updateMistakesUI() {
  const el = document.getElementById('mistakes-display');
  if (!el) return;
  if (mistakeLimit === Infinity) {
    el.textContent = `Erros: ${mistakes}`;
  } else {
    el.textContent = `Erros: ${mistakes} / ${mistakeLimit}`;
  }
}

function triggerGameOver() {
  stopTimer();
  if (typeof triggerDefeatEffects === 'function') {
    triggerDefeatEffects();
  }
  setTimeout(() => {
    document.getElementById('gameOverModal').classList.add('show');
  }, 1200);
}

function updateCounts() {
  for (let i = 1; i <= 16; i++) {
    let correctCount = 0;
    for (let r = 0; r < 16; r++) {
      for (let c = 0; c < 16; c++) {
        if (board[r][c] === i && board[r][c] === solution[r][c]) {
          correctCount++;
        }
      }
    }

    let missing = 16 - correctCount;
    const btn = document.getElementById(`btn-${i}`);
    const countEl = document.getElementById(`count-${i}`);

    if (countEl) countEl.textContent = `(${missing})`;

    if (btn) {
      if (missing === 0) {
        if (!btn.classList.contains('completed')) {
          btn.classList.add('completed');
          btn.disabled = true;
          if (typeof playNumberCompleteSound === 'function') {
            playNumberCompleteSound();
          }
        }
      } else {
        if (btn.classList.contains('completed')) {
          btn.classList.remove('completed');
          btn.disabled = false;
        }
      }
    }
  }
}

function checkWin() {
  for (let r = 0; r < 16; r++) {
    for (let c = 0; c < 16; c++) {
      if (board[r][c] !== solution[r][c]) return;
    }
  }
  stopTimer();
  SudokueStorage.clearGameState(); // Don't need to resume a won game
  if (typeof triggerVictoryEffects === 'function') {
    triggerVictoryEffects();
  }
  document.getElementById('message').textContent = 'Parabéns! Você completou o Sudoku!';
}

function initNumpad() {
  const numpad = document.getElementById('numpad');
  numpad.innerHTML = '';

  CHARS.forEach((char, index) => {
    const btn = document.createElement('button');
    btn.className = 'num-btn';
    btn.id = `btn-${index + 1}`;
    btn.innerHTML = `<span class="char">${char}</span><span class="count" id="count-${index + 1}">(16)</span>`;
    btn.addEventListener('click', () => handleInput(index + 1));
    numpad.appendChild(btn);
  });
}

// ==========================================
// TECLADO
// ==========================================

document.addEventListener('keydown', (e) => {
  if (!selectedCell) return;
  if (isPaused) return;

  const key = e.key;

  if (key === 'ArrowUp') { e.preventDefault(); selectedCell.r = Math.max(0, selectedCell.r - 1); if (typeof playSelectSound === 'function') playSelectSound(); renderGrid(); updatePreview(); return; }
  if (key === 'ArrowDown') { e.preventDefault(); selectedCell.r = Math.min(15, selectedCell.r + 1); if (typeof playSelectSound === 'function') playSelectSound(); renderGrid(); updatePreview(); return; }
  if (key === 'ArrowLeft') { e.preventDefault(); selectedCell.c = Math.max(0, selectedCell.c - 1); if (typeof playSelectSound === 'function') playSelectSound(); renderGrid(); updatePreview(); return; }
  if (key === 'ArrowRight') { e.preventDefault(); selectedCell.c = Math.min(15, selectedCell.c + 1); if (typeof playSelectSound === 'function') playSelectSound(); renderGrid(); updatePreview(); return; }

  if (key === 'Backspace' || key === 'Delete') { e.preventDefault(); handleInput(0); return; }
  if (key === '0') { e.preventDefault(); handleInput(0); return; }

  if (key >= '1' && key <= '9') { e.preventDefault(); handleInput(parseInt(key)); return; }
  if (key >= 'a' && key <= 'g') { e.preventDefault(); handleInput(key.charCodeAt(0) - 97 + 10); return; }
  if (key >= 'A' && key <= 'G') { e.preventDefault(); handleInput(key.charCodeAt(0) - 65 + 10); return; }
});

// ==========================================
// PERSISTÊNCIA (save/load)
// ==========================================

function getGameStateObject() {
  return {
    board: board.map(row => [...row]),
    solution: solution.map(row => [...row]),
    fixed: fixed.map(row => [...row]),
    pencilMarks: pencilMarks,
    mistakes: mistakes,
    mistakeLimit: mistakeLimit,
    hintsLeft: hintsLeft,
    secondsElapsed: secondsElapsed,
    difficulty: currentDifficulty,
    startedAt: startedAt || new Date().toISOString(),
    savedAt: new Date().toISOString()
  };
}

function autoSave() {
  const state = getGameStateObject();
  SudokueStorage.saveGameState(state);
}

function loadGameState(state) {
  board = state.board;
  solution = state.solution;
  fixed = state.fixed;
  pencilMarks = state.pencilMarks;
  mistakes = state.mistakes;
  mistakeLimit = state.mistakeLimit;
  hintsLeft = state.hintsLeft;
  currentDifficulty = state.difficulty;
  startedAt = state.startedAt;

  // Calculate elapsed time (saved + time since save)
  const savedAt = new Date(state.savedAt);
  const now = new Date();
  const additionalSeconds = Math.floor((now - savedAt) / 1000);
  secondsElapsed = state.secondsElapsed + additionalSeconds;

  selectedCell = null;
  isPencilMode = false;
  isPaused = false;

  // Update UI
  document.getElementById('difficulty').value = currentDifficulty;
  document.getElementById('message').textContent = '';
  document.getElementById('gameOverModal').classList.remove('show');
  document.getElementById('pencil-btn').textContent = 'Rascunho: OFF';
  document.getElementById('pencil-btn').classList.remove('active-mode');
  const pauseBtnLoad = document.getElementById('pause-btn');
  if (pauseBtnLoad) pauseBtnLoad.textContent = '⏸';

  updateHintsUI();
  updateTimerDisplay();
  updatePreview();
  renderGrid();
  updateCounts();
  startTimer();
  autoSave();
}

function continueSavedGame() {
  document.getElementById('savedGameModal').classList.remove('show');
  const state = SudokueStorage.loadGameState();
  if (state) {
    loadGameState(state);
  } else {
    newGame();
  }
}

function discardSavedGame() {
  document.getElementById('savedGameModal').classList.remove('show');
  SudokueStorage.clearGameState();
  newGame();
}

function checkForSavedGame() {
  if (SudokueStorage.hasSavedGame()) {
    const state = SudokueStorage.loadGameState();
    if (state) {
      // Populate saved game modal
      const config = DIFFICULTY_CONFIG[state.difficulty] || DIFFICULTY_CONFIG.medium;
      document.getElementById('saved-difficulty').textContent = config.label;
      document.getElementById('saved-time').textContent = formatTime(state.secondsElapsed);
      if (state.mistakeLimit === Infinity) {
        document.getElementById('saved-mistakes').textContent = `${state.mistakes} (ilimitado)`;
      } else {
        document.getElementById('saved-mistakes').textContent = `${state.mistakes} / ${state.mistakeLimit}`;
      }
      document.getElementById('savedGameModal').classList.add('show');
      return true;
    }
  }
  return false;
}

// ==========================================
// ELECTRON MENU EVENTS
// ==========================================

if (window.electronAPI) {
  window.electronAPI.onMenuNewGame(() => {
    newGame();
  });

  window.electronAPI.onMenuSaveGame(() => {
    autoSave();
  });

  window.electronAPI.onMenuDifficulty((difficulty) => {
    document.getElementById('difficulty').value = difficulty;
    newGame();
  });
}

// ==========================================
// INICIALIZAÇÃO
// ==========================================

function init() {
  console.log('Sudokue: Inicializando...');

  // Load saved theme
  const savedTheme = localStorage.getItem('sudokue-theme');
  if (savedTheme) {
    document.body.setAttribute('data-theme', savedTheme);
    const themeSelect = document.getElementById('theme');
    if (themeSelect) themeSelect.value = savedTheme;
  }

  initNumpad();

  // Check for saved game first
  const hasSave = checkForSavedGame();

  if (!hasSave) {
    // No saved game — start fresh with medium difficulty
    document.getElementById('difficulty').value = 'medium';
    updateDifficultySettings();
    newGame();
  }

  // Auto-save on window close
  window.addEventListener('beforeunload', () => {
    autoSave();
  });

  // Auto-save every 30 seconds
  autoSaveInterval = setInterval(() => {
    autoSave();
  }, 30000);
}

// DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

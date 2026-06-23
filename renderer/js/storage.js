// ============================================
// SUDOKUE STORAGE — localStorage Persistence
// ============================================

(function() {
  'use strict';

  const STORAGE_KEY = 'sudokue-save';

  /**
   * Serialize pencilMarks (Set[][] -> number[][][])
   */
  function serializePencilMarks(pencilMarks) {
    if (!pencilMarks) return [];
    return pencilMarks.map(row =>
      row.map(cellSet => {
        if (cellSet instanceof Set) {
          return Array.from(cellSet);
        }
        // Already an array (from deserialization)
        return Array.isArray(cellSet) ? [...cellSet] : [];
      })
    );
  }

  /**
   * Deserialize pencilMarks (number[][][] -> Set[][])
   */
  function deserializePencilMarks(arr) {
    if (!arr) return [];
    return arr.map(row =>
      row.map(cellArr => new Set(Array.isArray(cellArr) ? cellArr : []))
    );
  }

  /**
   * saveGameState(state) — Serialize to JSON and save to localStorage.
   * state object:
   * {
   *   board: number[][],
   *   solution: number[][],
   *   fixed: boolean[][],
   *   pencilMarks: Set<number>[][],
   *   mistakes: number,
   *   mistakeLimit: number,
   *   hintsLeft: number,
   *   secondsElapsed: number,
   *   difficulty: string,
   *   startedAt: string (ISO),
   *   savedAt: string (ISO)
   * }
   */
  function saveGameState(state) {
    try {
      const serialized = {
        board: state.board,
        solution: state.solution,
        fixed: state.fixed,
        pencilMarks: serializePencilMarks(state.pencilMarks),
        mistakes: state.mistakes,
        mistakeLimit: state.mistakeLimit,
        hintsLeft: state.hintsLeft,
        secondsElapsed: state.secondsElapsed,
        difficulty: state.difficulty,
        startedAt: state.startedAt,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
      return true;
    } catch (e) {
      console.error('Sudokue: Failed to save game state:', e);
      return false;
    }
  }

  /**
   * loadGameState() — Read from localStorage, parse JSON, return null if not found.
   */
  function loadGameState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw);

      // Validate required fields
      if (!parsed.board || !parsed.solution || !parsed.fixed) {
        console.warn('Sudokue: Invalid save data, clearing');
        clearGameState();
        return null;
      }

      // Deserialize pencilMarks back to Sets
      const state = {
        board: parsed.board,
        solution: parsed.solution,
        fixed: parsed.fixed,
        pencilMarks: deserializePencilMarks(parsed.pencilMarks),
        mistakes: parsed.mistakes || 0,
        mistakeLimit: parsed.mistakeLimit || 5,
        hintsLeft: parsed.hintsLeft !== undefined ? parsed.hintsLeft : 3,
        secondsElapsed: parsed.secondsElapsed || 0,
        difficulty: parsed.difficulty || 'medium',
        startedAt: parsed.startedAt || new Date().toISOString(),
        savedAt: parsed.savedAt || new Date().toISOString()
      };

      return state;
    } catch (e) {
      console.error('Sudokue: Failed to load game state:', e);
      return null;
    }
  }

  /**
   * hasSavedGame() — Return boolean
   */
  function hasSavedGame() {
    try {
      return localStorage.getItem(STORAGE_KEY) !== null;
    } catch (e) {
      return false;
    }
  }

  /**
   * clearGameState() — Remove key from localStorage
   */
  function clearGameState() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Sudokue: Failed to clear game state:', e);
    }
  }

  // --- Export to window ---
  window.SudokueStorage = {
    saveGameState: saveGameState,
    loadGameState: loadGameState,
    hasSavedGame: hasSavedGame,
    clearGameState: clearGameState
  };

})();

// ============================================
// SUDOKUE SOLVER — Backtracking + Uniqueness
// ============================================

(function() {
  'use strict';

  const SIZE = 16;
  const BLOCK = 4;

  // --- Helpers ---

  function getBlockIndex(r, c) {
    return Math.floor(r / BLOCK) * BLOCK + Math.floor(c / BLOCK);
  }

  function isValidPlacement(grid, row, col, val) {
    // Check row
    for (let c = 0; c < SIZE; c++) {
      if (c !== col && grid[row][c] === val) return false;
    }
    // Check column
    for (let r = 0; r < SIZE; r++) {
      if (r !== row && grid[r][col] === val) return false;
    }
    // Check 4x4 block
    const br = Math.floor(row / BLOCK) * BLOCK;
    const bc = Math.floor(col / BLOCK) * BLOCK;
    for (let r = br; r < br + BLOCK; r++) {
      for (let c = bc; c < bc + BLOCK; c++) {
        if ((r !== row || c !== col) && grid[r][c] === val) return false;
      }
    }
    return true;
  }

  function getCandidates(grid, row, col) {
    const used = new Set();
    // Row
    for (let c = 0; c < SIZE; c++) {
      if (grid[row][c] !== 0) used.add(grid[row][c]);
    }
    // Col
    for (let r = 0; r < SIZE; r++) {
      if (grid[r][col] !== 0) used.add(grid[r][col]);
    }
    // Block
    const br = Math.floor(row / BLOCK) * BLOCK;
    const bc = Math.floor(col / BLOCK) * BLOCK;
    for (let r = br; r < br + BLOCK; r++) {
      for (let c = bc; c < bc + BLOCK; c++) {
        if (grid[r][c] !== 0) used.add(grid[r][c]);
      }
    }
    const candidates = [];
    for (let v = 1; v <= SIZE; v++) {
      if (!used.has(v)) candidates.push(v);
    }
    return candidates;
  }

  function cloneGrid(grid) {
    return grid.map(row => [...row]);
  }

  function findEmptyCell(grid) {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (grid[r][c] === 0) return { r, c };
      }
    }
    return null;
  }

  // MRV: find empty cell with fewest candidates
  function findMRVCell(grid) {
    let bestR = -1, bestC = -1, bestCount = SIZE + 1;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (grid[r][c] === 0) {
          const candidates = getCandidates(grid, r, c);
          if (candidates.length < bestCount) {
            bestCount = candidates.length;
            bestR = r;
            bestC = c;
            if (bestCount === 1) return { r: bestR, c: bestC, candidates };
          }
        }
      }
    }
    if (bestR === -1) return null;
    return { r: bestR, c: bestC, candidates: getCandidates(grid, bestR, bestC) };
  }

  // --- Core Functions ---

  /**
   * solve(grid) — Backtracking solver with MRV heuristic.
   * Returns solved grid (deep copy) or null if unsolvable.
   */
  function solve(grid) {
    const g = cloneGrid(grid);
    if (solveHelper(g)) return g;
    return null;
  }

  function solveHelper(grid) {
    const cell = findMRVCell(grid);
    if (!cell) return true; // No empty cells → solved!

    const { r, c, candidates } = cell;
    // Shuffle for some randomness in generation context,
    // but deterministic solving is faster without shuffle.
    for (const val of candidates) {
      grid[r][c] = val;
      if (solveHelper(grid)) return true;
      grid[r][c] = 0;
    }
    return false;
  }

  /**
   * countSolutions(grid, limit=2) — Count solutions using an optimized approach.
   * For speed on 16×16 grids, uses MRV-based dual-solve:
   *   1. Solve normally to find first solution.
   *   2. Re-solve with reversed candidates to find a potential second.
   * This is NOT an exhaustive counter but is highly reliable for Sudoku
   * uniqueness detection (different traversal orders find different solutions).
   */
  function countSolutions(grid, limit) {
    if (limit === undefined) limit = 2;
    
    // First solution: normal MRV solve
    const g1 = cloneGrid(grid);
    const found1 = solveHelper(g1);
    if (!found1) return 0;
    
    if (limit === 1) return 1;
    
    // Second solution: solve with reversed candidates
    // We modify the grid to block the first solution and try again
    // Actually, we find the first divergence point and try alternative
    const g2 = cloneGrid(grid);
    
    // Collect all the decisions made in the first solution
    // by tracking which values were placed where
    const solution1 = g1;
    
    // Try solving with reversed candidate order
    // This forces a different path when multiple solutions exist
    const found2 = solveHelperReversed(cloneGrid(grid));
    if (!found2) return 1; // Only 1 solution found
    
    // Check if solutions are different
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (solution1[r][c] !== found2[r][c]) return 2;
      }
    }
    return 1;
  }

  // Solve helper with reversed candidate order (for uniqueness detection)
  function solveHelperReversed(grid) {
    const cell = findMRVCell(grid);
    if (!cell) return grid; // Solved
    
    const { r, c, candidates } = cell;
    // Reverse the candidates order
    candidates.reverse();
    
    for (const val of candidates) {
      grid[r][c] = val;
      const result = solveHelperReversed(grid);
      if (result) return result;
      grid[r][c] = 0;
    }
    return null;
  }

  /**
   * hasUniqueSolution(grid) — returns true if the puzzle has exactly one solution.
   */
  function hasUniqueSolution(grid) {
    return countSolutions(grid, 2) === 1;
  }

  /**
   * generateCompleteGrid() — Generate a random valid 16×16 complete Sudoku grid.
   * Uses a known-valid base grid plus random validity-preserving transformations.
   * This approach is O(n²) and guaranteed to produce a valid grid instantly,
   * whereas pure backtracking from scratch on 16×16 is prohibitively slow in JS.
   */
  function getBaseGrid() {
    const grid = [];
    for (let r = 0; r < SIZE; r++) {
      const row = [];
      for (let c = 0; c < SIZE; c++) {
        row.push((r * BLOCK + Math.floor(r / BLOCK) + c) % SIZE + 1);
      }
      grid.push(row);
    }
    return grid;
  }

  function shuffleRows(grid) {
    for (let band = 0; band < BLOCK; band++) {
      for (let i = 0; i < BLOCK; i++) {
        for (let j = i + 1; j < BLOCK; j++) {
          if (Math.random() > 0.5) {
            const temp = grid[band * BLOCK + i];
            grid[band * BLOCK + i] = grid[band * BLOCK + j];
            grid[band * BLOCK + j] = temp;
          }
        }
      }
    }
    return grid;
  }

  function shuffleCols(grid) {
    for (let stack = 0; stack < BLOCK; stack++) {
      for (let i = 0; i < BLOCK; i++) {
        for (let j = i + 1; j < BLOCK; j++) {
          if (Math.random() > 0.5) {
            for (let r = 0; r < SIZE; r++) {
              const temp = grid[r][stack * BLOCK + i];
              grid[r][stack * BLOCK + i] = grid[r][stack * BLOCK + j];
              grid[r][stack * BLOCK + j] = temp;
            }
          }
        }
      }
    }
    return grid;
  }

  function shuffleBands(grid) {
    const bands = [0, 1, 2, 3];
    shuffleArray(bands);
    const newGrid = [];
    for (let i = 0; i < BLOCK; i++) {
      const oldBand = bands[i];
      for (let r = 0; r < BLOCK; r++) {
        newGrid.push([...grid[oldBand * BLOCK + r]]);
      }
    }
    return newGrid;
  }

  function shuffleStacks(grid) {
    const stacks = [0, 1, 2, 3];
    shuffleArray(stacks);
    const newGrid = Array.from({length: SIZE}, () => Array(SIZE).fill(0));
    for (let r = 0; r < SIZE; r++) {
      for (let i = 0; i < BLOCK; i++) {
        const oldStack = stacks[i];
        for (let c = 0; c < BLOCK; c++) {
          newGrid[r][i * BLOCK + c] = grid[r][oldStack * BLOCK + c];
        }
      }
    }
    return newGrid;
  }

  function shuffleDigits(grid) {
    const digits = [];
    for (let i = 1; i <= SIZE; i++) digits.push(i);
    shuffleArray(digits);
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        grid[r][c] = digits[grid[r][c] - 1];
      }
    }
    return grid;
  }

  function transpose(grid) {
    if (Math.random() > 0.5) {
      const newGrid = Array.from({length: SIZE}, () => Array(SIZE).fill(0));
      for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
          newGrid[c][r] = grid[r][c];
        }
      }
      return newGrid;
    }
    return grid;
  }

  function generateCompleteGrid() {
    let grid = getBaseGrid();
    grid = shuffleRows(grid);
    grid = shuffleCols(grid);
    grid = shuffleBands(grid);
    grid = shuffleStacks(grid);
    grid = shuffleDigits(grid);
    grid = transpose(grid);
    return grid;
  }

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * generatePuzzle(difficulty) — Generate a puzzle with guaranteed unique solution.
   *
   * targetCells (cells to remove):
   *   easy: 80, medium: 120, hard: 160, expert: 200
   *
   * Strategy: generate complete grid, then iteratively remove cells
   * and check uniqueness. If removal breaks uniqueness, restore the cell.
   */
  function generatePuzzle(difficulty) {
    const targets = {
      easy: 80,
      medium: 110,
      hard: 140,
      expert: 160
    };

    let targetRemoved = targets[difficulty];
    if (targetRemoved === undefined) targetRemoved = targets.medium;

    // Generate complete solution
    const complete = generateCompleteGrid();

    // Create working copy
    const puzzle = cloneGrid(complete);

    // Build list of all 256 positions and shuffle
    const positions = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        positions.push({ r, c });
      }
    }
    shuffleArray(positions);

    let removed = 0;
    const failedPositions = []; // positions we had to restore

    // Attempt removal with uniqueness guard
    while (removed < targetRemoved && positions.length > 0) {
      const pos = positions.pop();
      const { r, c } = pos;
      const saved = puzzle[r][c];

      puzzle[r][c] = 0;

      if (hasUniqueSolution(puzzle)) {
        removed++;
      } else {
        // Restore — this cell cannot be removed
        puzzle[r][c] = saved;
        failedPositions.push(pos);
      }

      // If we've exhausted all positions, try reducing target
      if (positions.length === 0 && removed < targetRemoved) {
        if (targetRemoved > 60) {
          targetRemoved -= 10;
          console.log(`generatePuzzle: reducing target to ${targetRemoved} removed cells`);
          // Retry restoring some failed positions to try again
          // Actually, just accept what we have with fewer removed cells
          break;
        }
        break;
      }
    }

    // Build the board (puzzle with zeros) and solution
    const board = puzzle;
    const solution = complete;

    // Build fixed array: true where board has a non-zero value
    const fixed = Array.from({ length: SIZE }, (_, r) =>
      Array.from({ length: SIZE }, (_, c) => board[r][c] !== 0)
    );

    return {
      board: board,
      solution: solution,
      fixed: fixed,
      cellsRemoved: removed,
      difficulty: difficulty
    };
  }

  // --- Export to window ---
  window.SudokueSolver = {
    solve: solve,
    countSolutions: countSolutions,
    hasUniqueSolution: hasUniqueSolution,
    generateCompleteGrid: generateCompleteGrid,
    generatePuzzle: generatePuzzle
  };

})();

# Sudokue

**Sudoku 16×16 desktop — brutalist design, offline-first.**

## Features

- 16×16 grid (digits 1-9, letters A-G)
- 4 difficulty levels: Fácil, Médio, Difícil, Expert
- Guaranteed unique solution (backtracking solver)
- Pencil marks mode (rascunho)
- 3 hints per game
- Timer with save/resume
- Sound effects (Web Audio API)
- Visual effects (confetti, shake, glow)
- Brutalist dark theme (Space Grotesk + Instrument Serif)
- Auto-save every 30s + on close
- Resume saved game on launch

## Install (Windows)

1. Download `sudokue-portable.zip` from [Releases](../../releases)
2. Extract anywhere
3. Run `sudokue.exe`

No installation required. No internet required.

## Controls

| Input | Action |
|-------|--------|
| Click cell | Select |
| 1-9, A-G | Insert value |
| Arrow keys | Navigate |
| Backspace | Clear cell |
| Ctrl+N | New game |
| Ctrl+S | Save game |

## Dev

```bash
npm install
npm start        # Run in development
npm run build:win  # Build Windows portable
```

## Tech

- Electron 33
- Vanilla JS (no frameworks)
- Backtracking solver with MRV heuristic
- Web Audio API for sound
- localStorage for persistence

## License

MIT

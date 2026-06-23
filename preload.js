const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => '1.0.0',
  platform: process.platform,

  onMenuNewGame: (callback) => {
    const { ipcRenderer } = require('electron');
    ipcRenderer.on('menu-new-game', () => callback());
  },
  onMenuSaveGame: (callback) => {
    const { ipcRenderer } = require('electron');
    ipcRenderer.on('menu-save-game', () => callback());
  },
  onMenuDifficulty: (callback) => {
    const { ipcRenderer } = require('electron');
    ipcRenderer.on('menu-difficulty', (_event, difficulty) => callback(difficulty));
  }
});

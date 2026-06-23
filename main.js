const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0a0a0a',
    title: 'Sudokue',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  const menuTemplate = [
    {
      label: 'Jogo',
      submenu: [
        {
          label: 'Novo Jogo',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow.webContents.send('menu-new-game')
        },
        {
          label: 'Salvar Jogo',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow.webContents.send('menu-save-game')
        },
        { type: 'separator' },
        { role: 'quit', label: 'Sair' }
      ]
    },
    {
      label: 'Dificuldade',
      submenu: [
        {
          label: 'Fácil',
          type: 'radio',
          click: () => mainWindow.webContents.send('menu-difficulty', 'easy')
        },
        {
          label: 'Médio',
          type: 'radio',
          checked: true,
          click: () => mainWindow.webContents.send('menu-difficulty', 'medium')
        },
        {
          label: 'Difícil',
          type: 'radio',
          click: () => mainWindow.webContents.send('menu-difficulty', 'hard')
        },
        {
          label: 'Expert',
          type: 'radio',
          click: () => mainWindow.webContents.send('menu-difficulty', 'expert')
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

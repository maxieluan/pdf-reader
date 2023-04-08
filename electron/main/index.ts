import { app, BrowserWindow, shell, ipcMain, BrowserView } from 'electron'
import { release } from 'node:os'
import { join } from 'node:path'

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.js    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.DIST_ELECTRON = join(__dirname, '..')
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist')
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? join(process.env.DIST_ELECTRON, '../public')
  : process.env.DIST

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null
// Here, you can also use other preload
const preload = join(__dirname, '../preload/index.js')
const url = process.env.VITE_DEV_SERVER_URL
const indexHtml = join(process.env.DIST, 'index.html')

const views = {
  default: null,
  internet: null,
  tabbar: null,
}

async function createWindow() {  
  const defaultView = new BrowserView({
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      nodeIntegration: true,
      contextIsolation: false,
    },
  })
  const internetView = new BrowserView(
    {
      webPreferences: {
        preload,
        // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
        // Consider using contextBridge.exposeInMainWorld
        // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
        nodeIntegration: true,
        contextIsolation: false,
      },
    },
  )

  // Tab bar doesn't need a preload. Otherwise, it takes a long time to load
  const tabbarView = new BrowserView({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  views.default = defaultView
  views.internet = internetView
  views.tabbar = tabbarView

  win = new BrowserWindow({
    title: 'Main window',
    icon: join(process.env.PUBLIC, 'favicon.ico'),
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) { // electron-vite-vue#298
    tabbarView.webContents.loadFile(join(process.env.PUBLIC, 'tabbar.html'))
    defaultView.webContents.loadURL(url)
    // Open devTool if the app is not packaged
    // defaultView.webContents.openDevTools()
  } else {
    tabbarView.webContents.loadFile(join(process.env.DIST, 'tabbar.html'))
    defaultView.webContents.loadFile(indexHtml)
  }

  // Test actively push message to the Electron-Renderer
  defaultView.webContents.on('did-finish-load', () => {
    defaultView?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  defaultView.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })
  // win.webContents.on('will-navigate', (event, url) => { }) #344

  function handleResize() {
    const { width, height } = win.getBounds()
    const viewsHeight = height - 50
    
    tabbarView.setBounds({x: 0, y: viewsHeight - 50, width, height: 50})
    defaultView.setBounds({x: 0, y: 0, width, height: viewsHeight - 50})
    internetView.setBounds({x: 0, y: 0, width, height: viewsHeight - 50})
  }
  
  handleResize()

  win.on('resize', () => {
    handleResize()
  })
}

app.whenReady().then(createWindow).then(() => {
  // manually trigger a resize, otherwise, the views will not be rendered. Don't know why
  win.setSize(win.getSize()[0], win.getSize()[1] + 1)
  win?.addBrowserView(views.default)
  win?.addBrowserView(views.tabbar)
})

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

ipcMain.on('change-view', (event, viewName) => {
  const view = views[viewName]
  if (view) {
    // don't remove tabbar
    win?.removeBrowserView(views.default)
    win?.removeBrowserView(views.internet)
    win?.addBrowserView(view)
  }
})
import { app, protocol, BrowserWindow, Menu, shell, MenuItemConstructorOptions } from 'electron'
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer'
import Debug from 'debug'
import * as path from 'path'
import { format as formatUrl } from 'url'

import * as Hyperfile from '../renderer/hyperfile'

const log = Debug('pushpin:electron')

protocol.registerStandardSchemes(['pushpin'])

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: BrowserWindow | null = null

const createWindow = async () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 1000,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false,
    },
  })

  protocol.registerHttpProtocol('pushpin', (req, cb) => {
    // we don't want to use loadURL because we don't want to reset the whole app state
    // so we use the workspace manipulation function here
    mainWindow && mainWindow.webContents.send('loadDocumentUrl', req.url)
  })

  protocol.registerBufferProtocol(
    'hyperfile',
    async (request, callback) => {
      try {
        if (Hyperfile.isHyperfileUrl(request.url)) {
          const data = await Hyperfile.fetch(request.url)
          callback(Buffer.from(data))
        }
      } catch (e) {
        log(e)
      }
    },
    (error) => {
      if (error) {
        log('Failed to register protocol')
      }
    }
  )
  const isDevelopment = process.env.NODE_ENV !== 'production'

  if (isDevelopment) {
    mainWindow.webContents.openDevTools()
  }

  if (isDevelopment) {
    mainWindow.loadURL(`http://localhost:8080`)
  } else {
    mainWindow.loadURL(
      formatUrl({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file',
        slashes: true,
      })
    )
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.on('devtools-opened', () => {
    mainWindow && mainWindow.focus()
    setImmediate(() => {
      mainWindow && mainWindow.focus()
    })
  })

  function isSafeishURL(url: string) {
    return url.startsWith('http:') || url.startsWith('https:')
  }

  mainWindow.webContents.on('will-navigate', (event, url) => {
    // we only allow pushpin links to navigate
    // to avoid ever being in a position where we're loading rando files
    // or URLs within the app and getting stranded there
    if (
      isDevelopment &&
      url.startsWith(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`)
    ) {
      return
    }

    if (!url.startsWith('pushpin://')) {
      event.preventDefault()
    }
    if (isSafeishURL(url)) {
      shell.openExternal(url)
    }
  })

  mainWindow.webContents.on('new-window', (event, url) => {
    // we only allow pushpin links to navigate
    // to avoid ever being in a position where we're loading rando files
    // or URLs within the app and getting stranded there
    // NB: i don't think we actually use new-window pushpin links, but
    //     this will hopefully guard it if for some reason we do in the future
    if (!url.startsWith('pushpin://')) {
      event.preventDefault()
    }
    if (isSafeishURL(url)) {
      shell.openExternal(url)
    }
  })

  // Menubar template
  const template: MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New',
          accelerator: 'CmdOrCtrl+N',
          click: (_item, focusedWindow) => {
            focusedWindow.webContents.send('newDocument')
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [{ role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }],
    },
    {
      label: 'Develop',
      submenu: [
        {
          label: 'Refresh',
          accelerator: 'CmdOrCtrl+R',
          click: (_item, focusedWindow) => {
            focusedWindow.webContents.reload()
          },
        },
        {
          label: 'Open Inspector',
          accelerator: 'CmdOrCtrl+Option+I',
          click: (_item, focusedWindow) => {
            focusedWindow.webContents.toggleDevTools()
          },
        },
      ],
    },
  ]

  // macOS requires first menu item be name of the app
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [{ role: 'about' }, { role: 'quit' }],
    })
  }

  // Create the menubar
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  // Install DevTools if in dev mode. Open dev tools if indicated by env.
  const isDevMode = process.execPath.match(/[\\/]electron/)
  const openDevTools = process.env.OPEN_DEV_TOOLS
  if (isDevMode) {
    await installExtension(REACT_DEVELOPER_TOOLS)
    if (openDevTools) {
      mainWindow.webContents.openDevTools()
    }
  }

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

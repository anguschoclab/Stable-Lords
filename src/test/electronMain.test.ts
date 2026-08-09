import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockState = vi.hoisted(() => {
  const browserWindowInstance: Record<string, any> = {
    loadURL: vi.fn().mockResolvedValue(undefined),
    loadFile: vi.fn().mockResolvedValue(undefined),
    webContents: {
      openDevTools: vi.fn(),
      on: vi.fn(),
      send: vi.fn(),
      executeJavaScript: vi.fn().mockResolvedValue('preload loaded'),
    },
    on: vi.fn(),
    getBounds: vi.fn().mockReturnValue({ x: 0, y: 0, width: 1400, height: 900 }),
    show: vi.fn(),
    hide: vi.fn(),
    focus: vi.fn(),
    isVisible: vi.fn().mockReturnValue(true),
    close: vi.fn(),
  };
  const trayInstance: Record<string, any> = {
    setToolTip: vi.fn(),
    setContextMenu: vi.fn(),
    on: vi.fn(),
    destroy: vi.fn(),
  };
  return {
    browserWindowInstance,
    trayInstance,
    capturedMenuTemplate: null as any[] | null,
    capturedTrayTemplate: null as any[] | null,
    appHandlers: {} as Record<string, (...args: any[]) => void>,
    dialogShowSave: vi.fn().mockResolvedValue({ canceled: true, filePath: '' }),
    dialogShowOpen: vi.fn().mockResolvedValue({ canceled: true, filePaths: [] }),
  };
});

vi.mock('electron', () => ({
  app: {
    isPackaged: false,
    getName: vi.fn().mockReturnValue('Stable Lords'),
    getVersion: vi.fn().mockReturnValue('2.1.0'),
    getPath: vi.fn().mockReturnValue('/tmp/test-user-data'),
    whenReady: vi.fn().mockResolvedValue(undefined),
    on: vi.fn((event: string, handler: (...args: any[]) => void) => {
      mockState.appHandlers[event] = handler;
    }),
    quit: vi.fn(),
  },
  BrowserWindow: vi.fn(() => mockState.browserWindowInstance),
  ipcMain: { handle: vi.fn() },
  Menu: {
    buildFromTemplate: vi.fn((template: any[]) => {
      // Detect if this is the tray template (has "Show Stable Lords") or the app menu
      if (template.some((item) => item.label === 'Show Stable Lords')) {
        mockState.capturedTrayTemplate = template;
      } else {
        mockState.capturedMenuTemplate = template;
      }
      return template;
    }),
    setApplicationMenu: vi.fn(),
  },
  dialog: {
    showSaveDialog: mockState.dialogShowSave,
    showOpenDialog: mockState.dialogShowOpen,
  },
  shell: { openExternal: vi.fn() },
  Tray: vi.fn(() => mockState.trayInstance),
  nativeImage: { createFromPath: vi.fn().mockReturnValue({}) },
  Notification: vi.fn().mockImplementation(() => ({ show: vi.fn() })),
  session: {
    defaultSession: { setPermissionRequestHandler: vi.fn() },
  },
}));

vi.mock('fs/promises', () => ({
  access: vi.fn().mockRejectedValue(new Error('not found')),
  readFile: vi.fn().mockResolvedValue('{}'),
  writeFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
  readdir: vi.fn().mockResolvedValue([]),
  unlink: vi.fn().mockResolvedValue(undefined),
}));

import {
  createWindow,
  createMenu,
  createTray,
  _getMainWindow,
  _setMainWindow,
  _getTray,
  _setTray,
} from '../../electron/main';

function findMenuItem(template: any[] | null, label: string): any | null {
  if (!template) return null;
  for (const item of template) {
    if (item.label === label) return item;
    if (item.submenu) {
      const found = findMenuItem(item.submenu, label);
      if (found) return found;
    }
  }
  return null;
}

describe('electron/main.ts behavioral tests', () => {
  beforeEach(() => {
    _setMainWindow(null);
    _setTray(null);
    vi.clearAllMocks();
  });

  describe('createWindow', () => {
    it('sets mainWindow to a BrowserWindow instance', () => {
      expect(_getMainWindow()).toBeNull();
      createWindow();
      expect(_getMainWindow()).not.toBeNull();
      expect(_getMainWindow()).toBe(mockState.browserWindowInstance);
    });

    it('registers lifecycle event handlers on the window', () => {
      createWindow();
      const win = _getMainWindow();
      expect(win).not.toBeNull();
      expect(win!.on).toHaveBeenCalledWith('resize', expect.any(Function));
      expect(win!.on).toHaveBeenCalledWith('move', expect.any(Function));
      expect(win!.on).toHaveBeenCalledWith('closed', expect.any(Function));
    });

    it('sets mainWindow to null on closed event', () => {
      createWindow();
      expect(_getMainWindow()).not.toBeNull();
      // Simulate the closed event
      const closedCall = mockState.browserWindowInstance.on.mock.calls.find(
        ([event]: [string]) => event === 'closed'
      );
      expect(closedCall).toBeDefined();
      const closedHandler = closedCall![1];
      closedHandler();
      expect(_getMainWindow()).toBeNull();
    });
  });

  describe('createMenu — Export/Import Save click handlers', () => {
    it('Export Save handler no-ops safely when mainWindow is null', async () => {
      _setMainWindow(null);
      createMenu();
      const exportItem = findMenuItem(mockState.capturedMenuTemplate, 'Export Save');
      expect(exportItem).not.toBeNull();
      expect(exportItem.click).toBeDefined();
      // Should not throw and should not call dialog
      await exportItem.click();
      expect(mockState.dialogShowSave).not.toHaveBeenCalled();
    });

    it('Export Save handler calls showSaveDialog when mainWindow is set', async () => {
      _setMainWindow(mockState.browserWindowInstance as any);
      createMenu();
      const exportItem = findMenuItem(mockState.capturedMenuTemplate, 'Export Save');
      await exportItem.click();
      expect(mockState.dialogShowSave).toHaveBeenCalledWith(
        mockState.browserWindowInstance,
        expect.objectContaining({ filters: expect.any(Array) })
      );
    });

    it('Import Save handler no-ops safely when mainWindow is null', async () => {
      _setMainWindow(null);
      createMenu();
      const importItem = findMenuItem(mockState.capturedMenuTemplate, 'Import Save');
      expect(importItem).not.toBeNull();
      await importItem.click();
      expect(mockState.dialogShowOpen).not.toHaveBeenCalled();
    });

    it('Import Save handler calls showOpenDialog when mainWindow is set', async () => {
      _setMainWindow(mockState.browserWindowInstance as any);
      createMenu();
      const importItem = findMenuItem(mockState.capturedMenuTemplate, 'Import Save');
      await importItem.click();
      expect(mockState.dialogShowOpen).toHaveBeenCalledWith(
        mockState.browserWindowInstance,
        expect.objectContaining({ filters: expect.any(Array) })
      );
    });
  });

  describe('createTray — click handler', () => {
    it('creates a window when mainWindow is null', () => {
      _setMainWindow(null);
      createTray();
      expect(_getTray()).not.toBeNull();
      // Get the click handler from tray.on
      const trayClickCall = mockState.trayInstance.on.mock.calls.find(
        ([event]: [string]) => event === 'click'
      );
      expect(trayClickCall).toBeDefined();
      const clickHandler = trayClickCall![1] as () => void;
      // Before click, mainWindow is null
      expect(_getMainWindow()).toBeNull();
      clickHandler();
      // After click, createWindow should have been called
      expect(_getMainWindow()).not.toBeNull();
    });

    it('hides window when mainWindow exists and is visible', () => {
      _setMainWindow(mockState.browserWindowInstance as any);
      mockState.browserWindowInstance.isVisible.mockReturnValue(true);
      createTray();
      const trayClickCall = mockState.trayInstance.on.mock.calls.find(
        ([event]: [string]) => event === 'click'
      );
      const clickHandler = trayClickCall![1] as () => void;
      clickHandler();
      expect(mockState.browserWindowInstance.hide).toHaveBeenCalled();
    });

    it('shows and focuses window when mainWindow exists and is not visible', () => {
      _setMainWindow(mockState.browserWindowInstance as any);
      mockState.browserWindowInstance.isVisible.mockReturnValue(false);
      createTray();
      const trayClickCall = mockState.trayInstance.on.mock.calls.find(
        ([event]: [string]) => event === 'click'
      );
      const clickHandler = trayClickCall![1] as () => void;
      clickHandler();
      expect(mockState.browserWindowInstance.show).toHaveBeenCalled();
      expect(mockState.browserWindowInstance.focus).toHaveBeenCalled();
    });
  });

  describe('before-quit handler', () => {
    it('destroys tray when tray is non-null', () => {
      _setTray(mockState.trayInstance as any);
      // The before-quit handler is registered via app.on('before-quit', ...)
      // But since we mock app.on, we capture it in appHandlers
      // Note: app.on is called at module top level, so it should be captured
      const handler = mockState.appHandlers['before-quit'];
      expect(handler).toBeDefined();
      handler!();
      expect(mockState.trayInstance.destroy).toHaveBeenCalled();
    });

    it('does not throw when tray is null', () => {
      _setTray(null);
      const handler = mockState.appHandlers['before-quit'];
      expect(handler).toBeDefined();
      expect(() => handler!()).not.toThrow();
    });
  });
});

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
  BrowserWindow: vi.fn(function () {
    return mockState.browserWindowInstance;
  }),
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
  Tray: vi.fn(function () {
    return mockState.trayInstance;
  }),
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

import { ipcMain as mockIpcMain } from 'electron';
import * as mockFs from 'fs/promises';

import {
  createWindow,
  createMenu,
  createTray,
  _getMainWindow,
  _setMainWindow,
  _getTray,
  _setTray,
  validateAndMigrateState,
  registerIPCHandlers,
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
    // Re-establish mock return values after clearAllMocks
    mockState.browserWindowInstance.loadURL.mockResolvedValue(undefined);
    mockState.browserWindowInstance.loadFile.mockResolvedValue(undefined);
    mockState.browserWindowInstance.isVisible.mockReturnValue(true);
    mockState.browserWindowInstance.webContents.executeJavaScript.mockResolvedValue(
      'preload loaded'
    );
    mockState.dialogShowSave.mockResolvedValue({ canceled: true, filePath: '' });
    mockState.dialogShowOpen.mockResolvedValue({ canceled: true, filePaths: [] });
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

  // ───────────────────────────────────────────────────────────────────────────
  // Suite: validateAndMigrateState — pure function unit tests
  // ───────────────────────────────────────────────────────────────────────────
  describe('validateAndMigrateState', () => {
    const CURRENT_VERSION = '2.1.0-hardened';

    it('returns { valid: true, data } when meta.version matches SAVE_STATE_VERSION', () => {
      const state = { meta: { version: CURRENT_VERSION, gameName: 'Test' }, week: 1 };
      const result = validateAndMigrateState(state);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.data).toEqual(state);
      }
    });

    it('returns { valid: false, reason: "incompatible" } when meta.version does not match and no migration exists', () => {
      const state = { meta: { version: '0.9.0-old', gameName: 'Test' }, week: 1 };
      const result = validateAndMigrateState(state);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toBe('incompatible');
      }
    });

    it('returns { valid: false, reason: "malformed" } when meta.version is missing', () => {
      const state = { meta: { gameName: 'Test' }, week: 1 };
      const result = validateAndMigrateState(state);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toBe('malformed');
      }
    });

    it('returns { valid: false, reason: "malformed" } when meta.version is not a string', () => {
      const state = { meta: { version: 123, gameName: 'Test' }, week: 1 };
      const result = validateAndMigrateState(state);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toBe('malformed');
      }
    });

    it('returns { valid: false, reason: "malformed" } when meta is missing entirely', () => {
      const state = { week: 1 };
      const result = validateAndMigrateState(state);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toBe('malformed');
      }
    });

    it('returns { valid: false, reason: "malformed" } when state is null', () => {
      const result = validateAndMigrateState(null);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toBe('malformed');
      }
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Suite: load-game IPC handler — version check + .bak backup
  // ───────────────────────────────────────────────────────────────────────────
  describe('load-game IPC handler', () => {
    let ipcHandlers: Record<string, (...args: any[]) => any>;

    beforeEach(() => {
      ipcHandlers = {};
      // Capture ipcMain.handle registrations
      vi.mocked(mockIpcMain.handle).mockImplementation(
        (channel: string, handler: (...args: any[]) => any) => {
          ipcHandlers[channel] = handler;
          return undefined as any;
        }
      );
      registerIPCHandlers();
    });

    it('returns { success: true, data } for a valid-version save', async () => {
      const validState = JSON.stringify({
        meta: { version: '2.1.0-hardened', gameName: 'Test' },
        week: 1,
      });
      vi.mocked(mockFs.readFile).mockResolvedValue(validState);
      vi.mocked(mockFs.access).mockResolvedValue(undefined);

      const result = await ipcHandlers['load-game']!({}, 'slot1');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(JSON.parse(validState));
    });

    it('returns { success: false, error: "Incompatible save version" } for a mismatched version', async () => {
      const oldState = JSON.stringify({
        meta: { version: '0.9.0-old', gameName: 'Test' },
        week: 1,
      });
      vi.mocked(mockFs.readFile).mockResolvedValue(oldState);
      vi.mocked(mockFs.access).mockResolvedValue(undefined);

      const result = await ipcHandlers['load-game']!({}, 'slot1');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Incompatible save version');
    });

    it('writes .bak file on version mismatch', async () => {
      const oldState = JSON.stringify({
        meta: { version: '0.9.0-old', gameName: 'Test' },
        week: 1,
      });
      const writeSpy = vi.fn().mockResolvedValue(undefined);
      vi.mocked(mockFs.readFile).mockResolvedValue(oldState);
      vi.mocked(mockFs.access).mockResolvedValue(undefined);
      vi.mocked(mockFs.writeFile).mockImplementation(writeSpy);

      await ipcHandlers['load-game']!({}, 'slot1');

      // Verify writeFile was called with a .bak path
      const bakCall = writeSpy.mock.calls.find(
        (call: any[]) => typeof call[0] === 'string' && call[0].endsWith('.json.bak')
      );
      expect(bakCall).toBeDefined();
      expect(bakCall![1]).toBe(oldState);
    });

    it('returns { success: false, error: "Save file not found" } for missing file (regression guard)', async () => {
      vi.mocked(mockFs.access).mockRejectedValue(new Error('not found'));

      const result = await ipcHandlers['load-game']!({}, 'slot1');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Save file not found');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Suite: save-game IPC handler — stamps meta.version
  // ───────────────────────────────────────────────────────────────────────────
  describe('save-game IPC handler', () => {
    let ipcHandlers: Record<string, (...args: any[]) => any>;

    beforeEach(() => {
      ipcHandlers = {};
      vi.mocked(mockIpcMain.handle).mockImplementation(
        (channel: string, handler: (...args: any[]) => any) => {
          ipcHandlers[channel] = handler;
          return undefined as any;
        }
      );
      registerIPCHandlers();
    });

    it('stamps meta.version with SAVE_STATE_VERSION before writing to disk', async () => {
      const state = {
        meta: { gameName: 'Test', version: 'old-version', createdAt: '2024-01-01' },
        week: 1,
      };
      const writeSpy = vi.fn().mockResolvedValue(undefined);
      vi.mocked(mockFs.writeFile).mockImplementation(writeSpy);
      vi.mocked(mockFs.mkdir).mockResolvedValue(undefined);

      const result = await ipcHandlers['save-game']!({}, 'slot1', state);
      expect(result.success).toBe(true);

      const writtenJson = writeSpy.mock.calls[0]![1] as string;
      const writtenState = JSON.parse(writtenJson);
      expect(writtenState.meta.version).toBe('2.1.0-hardened');
    });

    it('stamps meta.version even when meta is missing', async () => {
      const state = { week: 1, year: 1 };
      const writeSpy = vi.fn().mockResolvedValue(undefined);
      vi.mocked(mockFs.writeFile).mockImplementation(writeSpy);
      vi.mocked(mockFs.mkdir).mockResolvedValue(undefined);

      const result = await ipcHandlers['save-game']!({}, 'slot1', state);
      expect(result.success).toBe(true);

      const writtenJson = writeSpy.mock.calls[0]![1] as string;
      const writtenState = JSON.parse(writtenJson);
      expect(writtenState.meta.version).toBe('2.1.0-hardened');
    });
  });
});

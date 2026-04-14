import { contextBridge, ipcRenderer } from 'electron';
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // File system operations
    saveGame: (slotId, state) => ipcRenderer.invoke('save-game', slotId, state),
    loadGame: (slotId) => ipcRenderer.invoke('load-game', slotId),
    listSaves: () => ipcRenderer.invoke('list-saves'),
    deleteSave: (slotId) => ipcRenderer.invoke('delete-save', slotId),
    // Archive operations
    archiveBoutLog: (year, season, boutId, logData) => ipcRenderer.invoke('archive-bout-log', year, season, boutId, logData),
    retrieveBoutLog: (year, season, boutId) => ipcRenderer.invoke('retrieve-bout-log', year, season, boutId),
    archiveGazette: (season, week, markdown) => ipcRenderer.invoke('archive-gazette', season, week, markdown),
    retrieveGazette: (season, week) => ipcRenderer.invoke('retrieve-gazette', season, week),
    // Store operations (electron-store)
    storeGet: (key) => ipcRenderer.invoke('store-get', key),
    storeSet: (key, value) => ipcRenderer.invoke('store-set', key, value),
    storeDelete: (key) => ipcRenderer.invoke('store-delete', key),
    // App info
    getAppInfo: () => ipcRenderer.invoke('get-app-info'),
    // Notifications
    showNotification: (options) => ipcRenderer.invoke('show-notification', options),
    // Menu event listeners
    onMenuNewGame: (callback) => {
        const handler = () => callback();
        ipcRenderer.on('menu-new-game', handler);
        return () => ipcRenderer.removeListener('menu-new-game', handler);
    },
    onMenuSaveGame: (callback) => {
        const handler = () => callback();
        ipcRenderer.on('menu-save-game', handler);
        return () => ipcRenderer.removeListener('menu-save-game', handler);
    },
    onMenuLoadGame: (callback) => {
        const handler = () => callback();
        ipcRenderer.on('menu-load-game', handler);
        return () => ipcRenderer.removeListener('menu-load-game', handler);
    },
    onMenuExportSave: (callback) => {
        const handler = (_event, filePath) => callback(filePath);
        ipcRenderer.on('menu-export-save', handler);
        return () => ipcRenderer.removeListener('menu-export-save', handler);
    },
    onMenuImportSave: (callback) => {
        const handler = (_event, filePath) => callback(filePath);
        ipcRenderer.on('menu-import-save', handler);
        return () => ipcRenderer.removeListener('menu-import-save', handler);
    },
    onMenuAbout: (callback) => {
        const handler = () => callback();
        ipcRenderer.on('menu-about', handler);
        return () => ipcRenderer.removeListener('menu-about', handler);
    },
});

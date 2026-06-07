declare global {
  interface Window {
    // Howler.js global configuration (initialized as empty object for Electron compatibility)
    HowlerGlobal?: Record<string, unknown>;

    // Electron IPC bridge (inferred from usage patterns)
    electronAPI?: {
      // Game state management
      saveGame: (slotId: string, state: unknown) => Promise<{ success: boolean; error?: string }>;
      loadGame: (slotId: string) => Promise<{ success: boolean; data?: unknown; error?: string }>;
      deleteSave: (slotId: string) => Promise<{ success: boolean }>;
      listSaves: () => Promise<{ success: boolean; data?: string[]; error?: string }>;

      // Bout log archiving
      archiveBoutLog: (
        year: number,
        season: number,
        boutId: string,
        logData: string[]
      ) => Promise<{ success: boolean; error?: string }>;
      retrieveBoutLog: (
        year: number,
        season: number,
        boutId: string
      ) => Promise<{ success: boolean; data?: string[]; error?: string }>;

      // Gazette archiving
      archiveGazette: (
        season: number,
        week: number,
        markdown: string
      ) => Promise<{ success: boolean; error?: string }>;
      retrieveGazette: (
        season: number,
        week: number
      ) => Promise<{ success: boolean; data?: string; error?: string }>;

      // Simple key-value store
      storeGet: (key: string) => Promise<unknown>;
      storeSet: (key: string, value: unknown) => Promise<{ success: boolean }>;
      storeDelete: (key: string) => Promise<{ success: boolean }>;

      // App info
      getAppInfo: () => Promise<{ name: string; version: string; platform: string }>;

      // Notifications
      showNotification: (options: {
        title: string;
        body: string;
      }) => Promise<{ success: boolean; error?: string }>;
    };

    // Seasonal flavor strings (documented but not yet implemented)
    SL_FLAVOR?: {
      spring: string[];
      summer: string[];
      fall: string[];
      winter: string[];
    };
  }
}

export {};

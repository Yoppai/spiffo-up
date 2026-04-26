import { create } from 'zustand';
import type { ServerRecord } from '../types/index.js';

interface ServersState {
  servers: ServerRecord[];
  selectedServerId: string | null;
  setServers: (servers: ServerRecord[]) => void;
  selectServer: (serverId: string | null) => void;
}

export const useServersStore = create<ServersState>((set) => ({
  servers: [],
  selectedServerId: null,
  setServers: (servers) => set({ servers }),
  selectServer: (selectedServerId) => set({ selectedServerId }),
}));

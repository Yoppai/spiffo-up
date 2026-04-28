import { create } from 'zustand';
import type { ServerRecord } from '../types/index.js';

export const seedServers: ServerRecord[] = [
  {
    id: 'main',
    name: 'main',
    provider: 'gcp',
    status: 'running',
    instanceType: 'e2-standard-2',
    playersOnline: 12,
    playersMax: 20,
    branch: 'stable',
    publicIp: '34.120.45.67',
  },
  {
    id: 'pvp',
    name: 'PvP',
    provider: 'gcp',
    status: 'provisioning',
    instanceType: 'n2-standard-4',
    playersOnline: null,
    playersMax: null,
    branch: 'unstable',
    publicIp: '34.120.45.68',
  },
  {
    id: 'dev',
    name: 'dev',
    provider: 'gcp',
    status: 'stopped',
    instanceType: 'e2-standard-2',
    playersOnline: null,
    playersMax: null,
    branch: 'stable',
    publicIp: '34.120.45.69',
  },
  {
    id: 'archived-1',
    name: 'old-server',
    provider: 'gcp',
    status: 'archived',
    instanceType: 'e2-standard-2',
    playersOnline: null,
    playersMax: null,
    branch: 'stable',
    publicIp: null,
    region: 'us-central1',
    zone: 'us-central1-a',
    projectId: 'old-project-123',
    staticIp: '34.120.45.100',
    gamePort: null,
    queryPort: null,
    rconPort: null,
    publicRconEnabled: false,
    allowedRconCidrs: ['10.0.0.0/8'],
    backupPath: '/backups/old-server-20240115.tar.gz',
    backupSize: 2147483648,
    archivedAt: '2024-01-15T10:30:00Z',
    createdAt: '2023-06-01T08:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
];

function createSeedServers(): ServerRecord[] {
  return seedServers.map((server) => ({ ...server }));
}

interface ServersState {
  servers: ServerRecord[];
  selectedServerId: string | null;
  setServers: (servers: ServerRecord[]) => void;
  selectServer: (serverId: string | null) => void;
  selectServerByIndex: (index: number) => void;
  resetServers: () => void;
}

export const useServersStore = create<ServersState>((set) => ({
  servers: createSeedServers(),
  selectedServerId: null,
  setServers: (servers) => set({ servers }),
  selectServer: (selectedServerId) => set({ selectedServerId }),
  selectServerByIndex: (index) =>
    set((state) => ({ selectedServerId: state.servers[index]?.id ?? state.selectedServerId })),
  resetServers: () => set({ servers: createSeedServers(), selectedServerId: null }),
}));

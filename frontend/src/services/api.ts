import { GeoJSONFeatureCollection, Territory, TerritoryHistory, Source, WSMessage } from '../types';
import { initialMapFeatures, initialDiffs, initialSources } from '../data/defaultMapData';

const API_HOST = import.meta.env.VITE_API_URL || '';
export const BASE_URL = API_HOST ? `${API_HOST}/api/v1` : '';

const getWsUrl = () => {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  if (API_HOST) {
    return `${API_HOST.replace(/^http/, 'ws')}/ws`;
  }
  return null;
};

const WS_URL = getWsUrl();

export async function fetchViewsCount(): Promise<number> {
  if (!BASE_URL) {
    return 470293;
  }
  try {
    const res = await fetch(`${BASE_URL}/views`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return typeof data.views === 'number' ? data.views : 470293;
  } catch (err) {
    return 470293;
  }
}

export async function fetchMapFeatures(): Promise<GeoJSONFeatureCollection> {
  if (!BASE_URL) {
    return initialMapFeatures;
  }
  try {
    const res = await fetch(`${BASE_URL}/map`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return initialMapFeatures;
  }
}

export async function fetchHistory(targetDate?: string): Promise<TerritoryHistory[]> {
  if (!BASE_URL) {
    return initialDiffs;
  }
  try {
    const url = targetDate ? `${BASE_URL}/history?date=${encodeURIComponent(targetDate)}` : `${BASE_URL}/history`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return initialDiffs;
  }
}

export async function fetchDiffs(): Promise<TerritoryHistory[]> {
  if (!BASE_URL) {
    return initialDiffs;
  }
  try {
    const url = `${BASE_URL}/diffs`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return initialDiffs;
  }
}

export async function fetchSources(): Promise<Source[]> {
  if (!BASE_URL) {
    return initialSources;
  }
  try {
    const res = await fetch(`${BASE_URL}/sources`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return initialSources;
  }
}

export async function submitModerationProposal(proposal: any): Promise<TerritoryHistory> {
  if (!BASE_URL) {
    throw new Error('API server is not configured');
  }
  const res = await fetch(`${BASE_URL}/moderation/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(proposal),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function approveProposal(historyId: string, moderatorName: string = 'Chief_Moderator'): Promise<Territory> {
  if (!BASE_URL) {
    throw new Error('API server is not configured');
  }
  const res = await fetch(`${BASE_URL}/moderation/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ history_id: historyId, moderator_name: moderatorName }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function importKML(kmlContent: string, author: string = 'Web_Editor'): Promise<{ success: boolean; imported_count: number; features: any[] }> {
  if (!BASE_URL) {
    throw new Error('API server is not configured');
  }
  const res = await fetch(`${BASE_URL}/kml/import?author=${encodeURIComponent(author)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/xml' },
    body: kmlContent,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export class WebSocketService {
  private socket: WebSocket | null = null;
  private listeners: Array<(msg: WSMessage) => void> = [];
  private reconnectTimer: any = null;
  private retryCount = 0;
  private maxRetries = 3;

  connect() {
    if (!WS_URL) {
      return;
    }

    if (this.retryCount >= this.maxRetries) {
      return;
    }

    try {
      this.socket = new WebSocket(WS_URL);

      this.socket.onopen = () => {
        this.retryCount = 0;
      };

      this.socket.onmessage = (event) => {
        try {
          const data: WSMessage = JSON.parse(event.data);
          this.listeners.forEach((fn) => fn(data));
        } catch (e) {}
      };

      this.socket.onclose = () => {
        this.reconnect();
      };

      this.socket.onerror = () => {
        this.socket?.close();
      };
    } catch (e) {
      this.reconnect();
    }
  }

  private reconnect() {
    if (!WS_URL || this.retryCount >= this.maxRetries) return;
    clearTimeout(this.reconnectTimer);
    this.retryCount++;
    const delay = Math.min(5000 * Math.pow(2, this.retryCount - 1), 30000);
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  subscribe(listener: (msg: WSMessage) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((fn) => fn !== listener);
    };
  }
}

export const wsService = new WebSocketService();

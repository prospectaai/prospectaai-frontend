import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SseService {
  private controller: AbortController | null = null;
  private isConnecting = false;
  private connected = false;

  constructor(private auth: AuthService) {}

  connect(): void {
    if (this.isConnecting) return;
    if (!this.auth.isBrowser()) return;
    const token = this.auth.getToken();
    const expired = this.auth.isTokenExpired();
    if (!token || expired) {
      this.auth.logoutExpired();
      return;
    }

    this.isConnecting = true;
    this.controller = new AbortController();
    const signal = this.controller.signal;
    const url = `${this.auth.getApiUrl()}/api/v1/notification/stream`;

    fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream',
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store',
      signal
    }).then(async (response) => {
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          this.auth.logoutExpired();
        }
        throw new Error(`SSE connection failed: ${response.status}`);
      }
      const reader = response.body?.getReader();
      if (!reader) throw new Error('SSE stream not readable');
      this.connected = true;
      this.isConnecting = false;
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
          const raw = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          this.handleEvent(raw);
        }
      }
    }).catch((err) => {
      this.isConnecting = false;
      this.connected = false;
      // Tentativa de reconexão simples
      setTimeout(() => {
        const t = this.auth.getToken();
        if (t && !this.auth.isTokenExpired()) {
          this.connect();
        }
      }, 3000);
    });
  }

  disconnect(): void {
    try { this.controller?.abort(); } catch {}
    this.controller = null;
    this.isConnecting = false;
    this.connected = false;
  }

  private handleEvent(chunk: string): void {
    // Parse básico de text/event-stream
    const lines = chunk.split('\n');
    let eventName: string | null = null;
    let dataLines: string[] = [];
    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventName = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trim());
      }
      // Ignora id:, retry:, etc. para simplicidade
    }
    const data = dataLines.join('\n');
    if (eventName === 'connected') {
      try {
        window.alert(data || 'Conectado ao SSE');
      } catch {}
    }
    // Aqui podemos rotear outros eventos conforme necessário
  }
}

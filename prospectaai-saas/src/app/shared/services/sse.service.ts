import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { NotificationsService, NotificationItem } from './notifications.service';
import { TasksService } from './tasks.service';
import { AsyncTaskPanelDto } from '../dtos/async-task-panel.dto';

@Injectable({
  providedIn: 'root'
})
export class SseService {
  private controller: AbortController | null = null;
  private isConnecting = false;
  private connected = false;

  constructor(private auth: AuthService, private notifs: NotificationsService, private tasks: TasksService) {}

  connect(): void {
    if (this.isConnecting) return;
    if (!this.auth.isBrowser()) return;
    this.isConnecting = true;
    this.auth.validateToken().subscribe({
      next: (valid) => {
        if (!valid) {
          this.isConnecting = false;
          this.connected = false;
          return;
        }
        const token = this.auth.getToken();
        this.controller = new AbortController();
        const signal = this.controller.signal;
        const url = `${this.auth.getApiUrl()}/api/v1/notification/stream`;
        fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'text/event-stream',
            'Authorization': `Bearer ${token || ''}`
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
        }).catch(() => {
          this.isConnecting = false;
          this.connected = false;
          setTimeout(() => {
            const t = this.auth.getToken();
            if (t && !this.auth.isTokenExpired()) {
              this.connect();
            }
          }, 3000);
        });
      },
      error: () => {
        this.isConnecting = false;
        this.connected = false;
      }
    });
  }

  disconnect(): void {
    try { this.controller?.abort(); } catch {}
    this.controller = null;
    this.isConnecting = false;
    this.connected = false;

    const token = this.auth.getToken();
    const expired = this.auth.isTokenExpired();
    if (token && !expired) {
      const url = `${this.auth.getApiUrl()}/api/v1/notification/disconnect`;
      fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).catch(() => {}).then((resp) => {
        if (resp && (resp.status === 401 || resp.status === 403)) {
          this.auth.logoutExpired();
        }
      });
    }
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
      return;
    }
    if (eventName === 'USER_NOTIFICATION') {
      try {
        const obj = JSON.parse(data) as NotificationItem;
        if (obj && obj.id) {
          this.notifs.addNotification(obj);
        }
      } catch {}
    }
    if (eventName === 'COMPLETE_TASK_ON_PANEL') {
      try {
        const obj = JSON.parse(data) as AsyncTaskPanelDto;
        this.tasks.upsertFromDto(obj);
      } catch {}
    }
    // Aqui podemos rotear outros eventos conforme necessário
  }
}

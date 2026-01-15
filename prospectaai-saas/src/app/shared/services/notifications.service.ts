import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';

export interface NotificationItem {
  id: string;
  title: string;
  datetime: string;
  sentLabel: string;
  icon?: string;
  content?: string;
  link?: string;
  read: boolean;
}

export interface NotificationPageResponse {
  items: NotificationItem[];
  totalUnread: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private items = signal<NotificationItem[]>([]);
  private page = signal<number>(0);
  private limit = signal<number>(10);
  private totalUnread = signal<number>(0);
  private isLoading = signal<boolean>(false);
  private hasMore = signal<boolean>(true);
  private expanded = signal<Set<string>>(new Set());
  private readIds = signal<Set<string>>(new Set());

  enableBrowserNotifications = signal<boolean>(false);
  enableSound = signal<boolean>(true);

  public itemsSig = this.items.asReadonly();

  getUnreadCount(): number {
    return this.totalUnread();
  }

  getUnreadLimited(limit = 5): NotificationItem[] {
    return this.items().filter(n => !n.read).slice(0, limit);
  }

  getReadLimited(limit = 5): NotificationItem[] {
    return this.items().filter(n => n.read).slice(0, limit);
  }

  hasMoreUnread(limit = 5): boolean {
    return this.items().filter(n => !n.read).length > limit;
  }

  hasMoreRead(limit = 5): boolean {
    return this.items().filter(n => n.read).length > limit;
  }

  markRead(id: string): void {
    this.items.update(arr => arr.map(n => n.id === id ? { ...n, read: true } : n));
    const set = new Set(this.readIds());
    set.add(id);
    this.readIds.set(set);
    this.persistReadIds();
    const unread = this.items().filter(n => !n.read).length;
    this.totalUnread.set(unread);
    const url = `${this.auth.getApiUrl()}/api/v1/notification/item/${id}/read`;
    const tk = this.auth.getToken();
    const headers = tk ? new HttpHeaders({ Authorization: `Bearer ${tk}` }) : new HttpHeaders();
    this.http.patch<void>(url, null, { headers }).subscribe({ next: () => {}, error: () => {} });
  }

  toggleBrowserNotifications(): void {
    this.enableBrowserNotifications.update(v => !v);
  }

  toggleSound(): void {
    this.enableSound.update(v => !v);
  }

  listPage(): NotificationItem[] {
    return this.items();
  }

  isExpanded(id: string): boolean {
    return this.expanded().has(id);
  }

  toggleExpanded(id: string): void {
    const set = new Set(this.expanded());
    if (set.has(id)) set.delete(id); else set.add(id);
    this.expanded.set(set);
  }

  collapseAll(): void {
    this.expanded.set(new Set());
  }

  markAllUnreadAsRead(): void {
    const unreadIds = this.items().filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) {
      this.totalUnread.set(0);
      return;
    }
    this.items.update(arr => arr.map(n => unreadIds.includes(n.id) ? { ...n, read: true } : n));
    const set = new Set(this.readIds());
    unreadIds.forEach(id => set.add(id));
    this.readIds.set(set);
    this.persistReadIds();
    this.totalUnread.set(0);
    const base = `${this.auth.getApiUrl()}/api/v1/notification/item/`;
    unreadIds.forEach(id => {
      const url = `${base}${id}/read`;
      const tk = this.auth.getToken();
      const headers = tk ? new HttpHeaders({ Authorization: `Bearer ${tk}` }) : new HttpHeaders();
      this.http.patch<void>(url, null, { headers }).subscribe({ next: () => {}, error: () => {} });
    });
  }

  loadMore(): void {
    if (this.isLoading() || !this.hasMore()) return;
    const nextPage = this.page() + 1;
    this.fetchPage(nextPage, this.limit());
  }

  constructor(private http: HttpClient, private auth: AuthService) {
    this.loadReadIds();
  }

  loadInitial(limit = 10): void {
    this.items.set([]);
    this.page.set(0);
    this.limit.set(limit);
    this.totalUnread.set(0);
    this.hasMore.set(true);
    this.fetchPage(0, limit);
  }

  fetchPage(page: number, limit: number): void {
    if (!this.auth.isBrowser()) return;
    this.isLoading.set(true);
    const params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    const url = `${this.auth.getApiUrl()}/api/v1/notification/items`;
    this.http.get<any>(url, { params }).subscribe({
      next: (res) => {
        let items: NotificationItem[] = [];
        let totalUnread = this.totalUnread();
        if (Array.isArray(res)) {
          items = res as NotificationItem[];
          totalUnread = items.filter(n => !n.read).length;
        } else if (res && Array.isArray(res.items)) {
          items = res.items as NotificationItem[];
          totalUnread = typeof res.totalUnread === 'number' ? res.totalUnread : items.filter(n => !n.read).length;
        }
        const readSet = this.readIds();
        items = items.map(n => readSet.has(n.id) ? { ...n, read: true } : n);
        totalUnread = items.filter(n => !n.read).length;
        if (items.length < limit) this.hasMore.set(false);
        this.page.set(page);
        this.items.update(curr => curr.concat(items));
        this.totalUnread.set(totalUnread);
      },
      error: () => {},
      complete: () => {
        this.isLoading.set(false);
      }
    });
  }

  addNotification(item: NotificationItem): void {
    const readSet = this.readIds();
    const mapped = readSet.has(item.id) ? { ...item, read: true } : item;
    this.items.update(curr => {
      const idx = curr.findIndex(n => n.id === mapped.id);
      if (idx !== -1) {
        curr[idx] = mapped;
        return [...curr];
      }
      return [mapped, ...curr];
    });
    const unread = this.items().filter(n => !n.read).length;
    this.totalUnread.set(unread);
    this.playSound();
    this.showOsNotification(mapped);
  }

  clearCache(): void {
    try {
      if (this.auth.isBrowser()) {
        localStorage.removeItem('notifs_read_ids');
      }
    } catch {}
    this.items.set([]);
    this.page.set(0);
    this.limit.set(10);
    this.totalUnread.set(0);
    this.hasMore.set(true);
    this.expanded.set(new Set());
    this.readIds.set(new Set());
  }

  private persistReadIds(): void {
    try {
      if (!this.auth.isBrowser()) return;
      const arr = Array.from(this.readIds());
      localStorage.setItem('notifs_read_ids', JSON.stringify(arr));
    } catch {}
  }

  private loadReadIds(): void {
    try {
      if (!this.auth.isBrowser()) return;
      const raw = localStorage.getItem('notifs_read_ids');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        this.readIds.set(new Set(parsed));
        const readSet = this.readIds();
        this.items.update(arr => arr.map(n => readSet.has(n.id) ? { ...n, read: true } : n));
        const unread = this.items().filter(n => !n.read).length;
        this.totalUnread.set(unread);
      }
    } catch {}
  }

  private playSound(): void {
    try {
      if (!this.enableSound()) return;
      if (typeof window === 'undefined') return;
      const audio = new Audio('/notification_sound.mp3');
      audio.play().catch(() => {});
    } catch {}
  }

  private showOsNotification(item: NotificationItem): void {
    try {
      if (!this.enableBrowserNotifications()) return;
      if (typeof window === 'undefined') return;
      if (!('Notification' in window)) return;
      if (Notification.permission === 'granted') {
        new Notification(item.title || 'Notificação', {
          body: item.content || item.sentLabel || '',
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(item.title || 'Notificação', {
              body: item.content || item.sentLabel || '',
            });
          }
        });
      }
    } catch {}
  }
}

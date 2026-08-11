import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly toasts = signal<ToastItem[]>([]);
  private nextId = 0;

  readonly items = this.toasts.asReadonly();

  constructor(private readonly router: Router) {}

  success(message: string): void {
    this.show({ message, type: 'success' });
  }

  error(message: string): void {
    this.show({ message, type: 'error' });
  }

  info(message: string): void {
    this.show({ message, type: 'info' });
  }

  warning(message: string): void {
    this.show({ message, type: 'warning' });
  }

  dismiss(id: number): void {
    this.toasts.update(items => items.filter(item => item.id !== id));
  }

  private show(item: Omit<ToastItem, 'id'>): void {
    const toast: ToastItem = { ...item, id: this.nextId++ };
    this.toasts.update(items => [...items, toast]);

    setTimeout(() => this.dismiss(toast.id), 4000);
  }
}

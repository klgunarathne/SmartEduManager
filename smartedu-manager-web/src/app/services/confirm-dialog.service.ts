import { Injectable, signal } from '@angular/core';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmDialogService {
  private dialogData = signal<ConfirmDialogData | null>(null);
  private resolveFn: ((confirmed: boolean) => void) | null = null;

  dialogData$ = this.dialogData.asReadonly();

  confirm(data: ConfirmDialogData): Promise<boolean> {
    this.dialogData.set(data);
    
    return new Promise((resolve) => {
      this.resolveFn = resolve;
    });
  }

  confirmDelete(itemName: string): Promise<boolean> {
    return this.confirm({
      title: 'Confirm Delete',
      message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });
  }

  confirmAction(title: string, message: string, type: 'danger' | 'warning' | 'info' = 'warning'): Promise<boolean> {
    return this.confirm({
      title,
      message,
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      type
    });
  }

  confirmResult(confirmed: boolean): void {
    this.dialogData.set(null);
    if (this.resolveFn) {
      this.resolveFn(confirmed);
      this.resolveFn = null;
    }
  }
}

import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

export interface ConfirmState {
  open: boolean;
  options: ConfirmOptions;
  resolve: ((value: boolean) => void) | null;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmDialogService {
  private readonly state = signal<ConfirmState>({
    open: false,
    options: {
      title: 'Confirm',
      message: '',
      confirmText: 'Yes',
      cancelText: 'Cancel',
      danger: false
    },
    resolve: null
  });

  readonly dialog = this.state.asReadonly();

  confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise(resolve => {
      this.state.set({
        open: true,
        options: {
          title: options.title ?? 'Confirm',
          message: options.message,
          confirmText: options.confirmText ?? 'Yes',
          cancelText: options.cancelText ?? 'Cancel',
          danger: options.danger ?? false
        },
        resolve
      });
    });
  }

  onConfirm(): void {
    const { resolve } = this.state();
    if (resolve) {
      resolve(true);
    }
    this.close();
  }

  onCancel(): void {
    const { resolve } = this.state();
    if (resolve) {
      resolve(false);
    }
    this.close();
  }

  private close(): void {
    this.state.set({
      open: false,
      options: {
        title: 'Confirm',
        message: '',
        confirmText: 'Yes',
        cancelText: 'Cancel',
        danger: false
      },
      resolve: null
    });
  }
}

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dialog-backdrop" *ngIf="dialog().open" (click)="onCancel()">
      <div class="dialog-card" (click="$event.stopPropagation()">
        <h2>{{ dialog().options.title }}</h2>
        <p>{{ dialog().options.message }}</p>
        <div class="dialog-actions">
          <button class="secondary-btn" type="button" (click)="onCancel()">{{ dialog().options.cancelText }}</button>
          <button class="primary-btn" type="button" [class.danger]="dialog().options.danger" (click)="onConfirm()">
            {{ dialog().options.confirmText }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dialog-backdrop {
      position: fixed;
      inset: 0;
      z-index: 50;
      display: grid;
      place-items: center;
      padding: 20px;
      background: rgba(15, 23, 42, 0.55);
    }

    .dialog-card {
      width: min(420px, 100%);
      padding: 24px;
      border-radius: 24px;
      background: white;
      box-shadow: 0 24px 80px rgba(15, 23, 42, 0.28);
    }

    .dialog-card h2 {
      margin: 0 0 10px;
      font-size: 1.2rem;
    }

    .dialog-card p {
      margin: 0 0 20px;
      color: #475569;
      line-height: 1.6;
    }

    .dialog-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
    }

    .secondary-btn,
    .primary-btn {
      min-height: 44px;
      border: 0;
      border-radius: 14px;
      padding: 0 16px;
      font: inherit;
      font-weight: 800;
      cursor: pointer;
    }

    .secondary-btn {
      border: 1px solid #dbe4f0;
      background: white;
      color: #334155;
    }

    .primary-btn {
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: white;
    }

    .primary-btn.danger {
      background: linear-gradient(135deg, #dc2626, #b91c1c);
    }
  `]
})
export class ConfirmDialogComponent {
  private readonly confirmService = inject(ConfirmDialogService);
  readonly dialog = this.confirmService.dialog;

  onConfirm(): void {
    this.confirmService.onConfirm();
  }

  onCancel(): void {
    this.confirmService.onCancel();
  }
}

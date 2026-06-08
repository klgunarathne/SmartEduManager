import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (confirmService.dialogData$()) {
      <div class="dialog-overlay" (click)="cancel()">
        <div class="dialog-content" [class]="'dialog-' + confirmService.dialogData$()?.type" (click)="$event.stopPropagation()">
          <div class="dialog-icon">
            @switch (confirmService.dialogData$()?.type) {
              @case ('danger') { <i class="fas fa-exclamation-triangle"></i> }
              @case ('warning') { <i class="fas fa-exclamation-circle"></i> }
              @default { <i class="fas fa-question-circle"></i> }
            }
          </div>
          <h3 class="dialog-title">{{ confirmService.dialogData$()?.title }}</h3>
          <p class="dialog-message">{{ confirmService.dialogData$()?.message }}</p>
          <div class="dialog-actions">
            <button class="btn-cancel" (click)="cancel()">
              {{ confirmService.dialogData$()?.cancelText || 'Cancel' }}
            </button>
            <button class="btn-confirm" [class]="'btn-' + confirmService.dialogData$()?.type" (click)="confirm()">
              {{ confirmService.dialogData$()?.confirmText || 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.2s;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    .dialog-content {
      background: white;
      border-radius: 20px;
      padding: 32px;
      max-width: 400px;
      width: 90%;
      text-align: center;
      animation: scaleIn 0.3s;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
    }
    
    @keyframes scaleIn {
      from {
        transform: scale(0.9);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }
    
    .dialog-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-size: 28px;
    }
    
    .dialog-danger .dialog-icon {
      background: #fee2e2;
      color: #dc2626;
    }
    
    .dialog-warning .dialog-icon {
      background: #fef3c7;
      color: #d97706;
    }
    
    .dialog-info .dialog-icon {
      background: #dbeafe;
      color: #2563eb;
    }
    
    .dialog-title {
      font-size: 20px;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 12px;
    }
    
    .dialog-message {
      color: #64748b;
      font-size: 14px;
      margin: 0 0 24px;
      line-height: 1.6;
    }
    
    .dialog-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
    }
    
    .btn-cancel, .btn-confirm {
      padding: 12px 24px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      border: none;
    }
    
    .btn-cancel {
      background: #f1f5f9;
      color: #64748b;
    }
    
    .btn-cancel:hover {
      background: #e2e8f0;
    }
    
    .btn-confirm {
      background: #6366f1;
      color: white;
    }
    
    .btn-confirm:hover {
      background: #4f46e5;
    }
    
    .btn-danger {
      background: #dc2626;
    }
    
    .btn-danger:hover {
      background: #b91c1c;
    }
    
    .btn-warning {
      background: #d97706;
    }
    
    .btn-warning:hover {
      background: #b45309;
    }
  `]
})
export class ConfirmDialogComponent {
  confirmService = inject(ConfirmDialogService);

  confirm(): void {
    this.confirmService.confirmResult(true);
  }

  cancel(): void {
    this.confirmService.confirmResult(false);
  }
}

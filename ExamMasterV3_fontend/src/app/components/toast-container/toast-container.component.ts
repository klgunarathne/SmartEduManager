import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastItem } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" *ngIf="items().length > 0">
      @for (toast of items(); track toast.id) {
        <div class="toast" [class]="'toast-' + toast.type" (click)="dismiss(toast.id)">
          <span class="toast-message">{{ toast.message }}</span>
          <button class="toast-close" type="button" (click)="$event.stopPropagation(); dismiss(toast.id)">×</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 50;
      display: grid;
      gap: 10px;
      max-width: min(380px, calc(100vw - 32px));
    }

    .toast {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 16px;
      color: white;
      font-weight: 800;
      box-shadow: 0 12px 30px rgba(15, 23, 42, 0.18);
      cursor: pointer;
    }

    .toast-success { background: #16a34a; }
    .toast-error { background: #dc2626; }
    .toast-info { background: #2563eb; }
    .toast-warning { background: #d97706; }

    .toast-close {
      background: transparent;
      border: 0;
      color: white;
      font-size: 1.1rem;
      cursor: pointer;
      font-weight: 900;
    }

    @media (max-width: 480px) {
      .toast-container {
        left: 16px;
        right: 16px;
        max-width: none;
      }
    }
  `]
})
export class ToastContainerComponent {
  private readonly toastService = inject(ToastService);
  readonly items = this.toastService.items;

  dismiss(id: number): void {
    this.toastService.dismiss(id);
  }
}

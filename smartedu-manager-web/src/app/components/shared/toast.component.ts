import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts$(); track toast.id) {
        <div class="toast" [class]="'toast-' + toast.type" (click)="toastService.remove(toast.id)">
          <div class="toast-icon">
            @switch (toast.type) {
              @case ('success') { <i class="fas fa-check-circle"></i> }
              @case ('error') { <i class="fas fa-times-circle"></i> }
              @case ('warning') { <i class="fas fa-exclamation-triangle"></i> }
              @case ('info') { <i class="fas fa-info-circle"></i> }
            }
          </div>
          <span class="toast-message">{{ toast.message }}</span>
          <button class="toast-close" (click)="toastService.remove(toast.id); $event.stopPropagation()">
            <i class="fas fa-times"></i>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 400px;
    }
    
    .toast {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 12px;
      background: white;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      animation: slideIn 0.3s ease-out;
      cursor: pointer;
      transition: transform 0.2s;
    }
    
    .toast:hover {
      transform: translateX(-4px);
    }
    
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    .toast-icon {
      font-size: 20px;
      display: flex;
      align-items: center;
    }
    
    .toast-success .toast-icon { color: #10b981; }
    .toast-error .toast-icon { color: #ef4444; }
    .toast-warning .toast-icon { color: #f59e0b; }
    .toast-info .toast-icon { color: #3b82f6; }
    
    .toast-message {
      flex: 1;
      font-size: 14px;
      color: #1e293b;
    }
    
    .toast-close {
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
    }
    
    .toast-close:hover {
      color: #64748b;
    }
    
    .toast-success {
      border-left: 4px solid #10b981;
    }
    
    .toast-error {
      border-left: 4px solid #ef4444;
    }
    
    .toast-warning {
      border-left: 4px solid #f59e0b;
    }
    
    .toast-info {
      border-left: 4px solid #3b82f6;
    }
  `]
})
export class ToastComponent {
  toastService = inject(ToastService);
}

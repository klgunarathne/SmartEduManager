import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-instructor-assignments',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2>Assignments</h2>
        <p>Manage assignments</p>
      </div>
      <div class="placeholder-card">
        <i class="fas fa-tasks"></i>
        <p>Assignments management coming soon</p>
      </div>
    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 24px; }
    .page-header h2 { font-size: 24px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
    .page-header p { color: #64748b; font-size: 14px; }
    .placeholder-card { background: white; border-radius: 16px; padding: 60px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .placeholder-card i { font-size: 48px; color: #94a3b8; margin-bottom: 16px; }
    .placeholder-card p { color: #64748b; }
  `]
})
export class InstructorAssignmentsComponent {}

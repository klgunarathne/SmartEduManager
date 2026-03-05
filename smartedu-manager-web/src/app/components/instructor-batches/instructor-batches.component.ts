import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BatchService, Batch } from '../../services/batch.service';

@Component({
  selector: 'app-instructor-batches',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2>Batches</h2>
        <p>Manage your batches</p>
      </div>
      
      @if (isLoading()) {
        <div class="loading">
          <i class="fas fa-spinner fa-spin"></i>
          <p>Loading batches...</p>
        </div>
      } @else {
        <div class="table-card">
          <table class="data-table">
            <thead>
              <tr>
                <th>Batch Code</th>
                <th>Course</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Duration</th>
                <th>Students</th>
              </tr>
            </thead>
            <tbody>
              @for (batch of batches(); track batch.batchId) {
                <tr>
                  <td><span class="badge">{{ batch.batchCode }}</span></td>
                  <td>{{ batch.courseName }}</td>
                  <td>{{ batch.startDate | date:'mediumDate' }}</td>
                  <td>{{ batch.endDate | date:'mediumDate' }}</td>
                  <td>{{ batch.duration }} days</td>
                  <td><span class="badge info">View</span></td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="empty">No batches found</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 24px; }
    .page-header h2 { font-size: 24px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
    .page-header p { color: #64748b; font-size: 14px; }
    .loading { text-align: center; padding: 60px; color: #64748b; }
    .loading i { font-size: 40px; margin-bottom: 12px; }
    .table-card { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 16px 20px; text-align: left; border-bottom: 1px solid #f1f5f9; }
    .data-table th { background: #f8fafc; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; }
    .badge { padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; background: #e0e7ff; color: #6366f1; }
    .badge.info { background: #dcfce7; color: #16a34a; }
    .empty { text-align: center; padding: 40px; color: #94a3b8; }
  `]
})
export class InstructorBatchesComponent implements OnInit {
  batches = signal<Batch[]>([]);
  isLoading = signal(true);

  constructor(private batchService: BatchService) {}

  ngOnInit(): void {
    this.loadBatches();
  }

  private loadBatches(): void {
    this.batchService.getBatches().subscribe({
      next: (data) => {
        this.batches.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }
}

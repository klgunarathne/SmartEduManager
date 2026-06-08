import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BatchService, Batch, CreateBatchDto, UpdateBatchDto } from '../../services/batch.service';
import { CourseService, Course } from '../../services/course.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';

@Component({
  selector: 'app-instructor-batches',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-content">
          <h2>Batches</h2>
          <p>Manage your batches</p>
        </div>
        <button class="btn-primary" (click)="openCreateModal()">
          <i class="fas fa-plus"></i> Add Batch
        </button>
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
                <th>Actions</th>
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
                  <td>
                    <div class="action-buttons">
                      <button class="action-btn edit" title="Edit" (click)="openEditModal(batch)">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="action-btn delete" title="Delete" (click)="deleteBatch(batch)">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
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

    @if (showModal()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ isEditing() ? 'Edit Batch' : 'Add New Batch' }}</h3>
            <button class="modal-close" (click)="closeModal()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <form (ngSubmit)="saveBatch()">
              <div class="form-group">
                <label>Batch Code</label>
                <input type="text" [(ngModel)]="formData.batchCode" name="batchCode" required>
              </div>
              <div class="form-group">
                <label>Course</label>
                <select [(ngModel)]="formData.courseId" name="courseId" required>
                  <option [value]="0">Select Course</option>
                  @for (course of courses(); track course.courseId) {
                    <option [value]="course.courseId">{{ course.courseName }}</option>
                  }
                </select>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Start Date</label>
                  <input type="date" [(ngModel)]="formData.startDate" name="startDate" required>
                </div>
                <div class="form-group">
                  <label>End Date</label>
                  <input type="date" [(ngModel)]="formData.endDate" name="endDate" required>
                </div>
              </div>
              <div class="modal-actions">
                <button type="button" class="btn-secondary" (click)="closeModal()">Cancel</button>
                <button type="submit" class="btn-primary" [disabled]="saving()">
                  @if (saving()) {
                    <i class="fas fa-spinner fa-spin"></i>
                  }
                  {{ isEditing() ? 'Update' : 'Create' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 24px; }
    
    .page-header {
      display: flex; justify-content: space-between; align-items: center;
      background: linear-gradient(135deg, #1e293b, #0f172a); border-radius: 20px;
      padding: 24px 30px; color: white;
    }
    .header-content h2 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
    .header-content p { opacity: 0.8; font-size: 14px; }
    
    .btn-primary {
      display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px;
      background: #6366f1; color: white; border: none; border-radius: 10px;
      font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.3s;
    }
    .btn-primary:hover { background: #4f46e5; }
    .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
    .btn-secondary {
      display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px;
      background: #f1f5f9; color: #64748b; border: none; border-radius: 10px;
      font-size: 14px; font-weight: 600; cursor: pointer;
    }

    .loading { text-align: center; padding: 60px; color: #64748b; }
    .loading i { font-size: 40px; margin-bottom: 12px; }
    .table-card { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 16px 20px; text-align: left; border-bottom: 1px solid #f1f5f9; }
    .data-table th { background: #f8fafc; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; }
    .badge { padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; background: #e0e7ff; color: #6366f1; }
    .empty { text-align: center; padding: 40px; color: #94a3b8; }

    .action-buttons { display: flex; gap: 8px; }
    .action-btn {
      width: 36px; height: 36px; border: none; border-radius: 10px;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: all 0.3s;
    }
    .action-btn.edit { background: #f1f5f9; color: #64748b; }
    .action-btn.edit:hover { background: #fef3c7; color: #d97706; }
    .action-btn.delete { background: #f1f5f9; color: #64748b; }
    .action-btn.delete:hover { background: #fee2e2; color: #dc2626; }

    .modal-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
      z-index: 1000;
    }
    .modal-content {
      background: white; border-radius: 20px; width: 90%; max-width: 500px;
      max-height: 90vh; overflow-y: auto;
    }
    .modal-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 20px 24px; border-bottom: 1px solid #f1f5f9;
    }
    .modal-header h3 { font-size: 18px; font-weight: 600; color: #1e293b; margin: 0; }
    .modal-close { background: none; border: none; font-size: 20px; cursor: pointer; color: #94a3b8; }
    .modal-body { padding: 24px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; font-size: 13px; font-weight: 500; color: #64748b; margin-bottom: 6px; }
    .form-group input, .form-group select {
      width: 100%; padding: 10px 14px; border: 2px solid #e2e8f0; border-radius: 10px;
      font-size: 14px;
    }
    .form-group input:focus, .form-group select:focus { outline: none; border-color: #6366f1; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
  `]
})
export class InstructorBatchesComponent implements OnInit {
  private batchService = inject(BatchService);
  private courseService = inject(CourseService);
  private toast = inject(ToastService);
  private confirmDialog = inject(ConfirmDialogService);

  batches = signal<Batch[]>([]);
  courses = signal<Course[]>([]);
  isLoading = signal(true);
  
  showModal = signal(false);
  isEditing = signal(false);
  saving = signal(false);
  editingBatchId: number | null = null;

  formData: CreateBatchDto = {
    batchCode: '',
    courseId: 0,
    startDate: '',
    endDate: ''
  };

  ngOnInit(): void {
    this.loadCourses();
    this.loadBatches();
  }

  private loadCourses(): void {
    this.courseService.getCourses().subscribe({
      next: (data) => this.courses.set(data)
    });
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

  openCreateModal(): void {
    this.isEditing.set(false);
    this.editingBatchId = null;
    this.formData = { batchCode: '', courseId: 0, startDate: '', endDate: '' };
    this.showModal.set(true);
  }

  openEditModal(batch: Batch): void {
    this.isEditing.set(true);
    this.editingBatchId = batch.batchId;
    this.formData = {
      batchCode: batch.batchCode,
      courseId: batch.courseId,
      startDate: batch.startDate.split('T')[0],
      endDate: batch.endDate.split('T')[0]
    };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveBatch(): void {
    this.saving.set(true);
    
    if (this.isEditing() && this.editingBatchId) {
      const updateData: UpdateBatchDto = this.formData;
      this.batchService.updateBatch(this.editingBatchId, updateData).subscribe({
        next: () => {
          this.loadBatches();
          this.closeModal();
          this.saving.set(false);
          this.toast.success('Batch updated successfully');
        },
        error: () => {
          this.saving.set(false);
          this.toast.error('Failed to update batch');
        }
      });
    } else {
      this.batchService.createBatch(this.formData).subscribe({
        next: () => {
          this.loadBatches();
          this.closeModal();
          this.saving.set(false);
          this.toast.success('Batch created successfully');
        },
        error: () => {
          this.saving.set(false);
          this.toast.error('Failed to create batch');
        }
      });
    }
  }

  async deleteBatch(batch: Batch): Promise<void> {
    const confirmed = await this.confirmDialog.confirmDelete(batch.batchCode);
    if (confirmed) {
      this.batchService.deleteBatch(batch.batchId).subscribe({
        next: () => {
          this.batches.update(list => list.filter(b => b.batchId !== batch.batchId));
          this.toast.success('Batch deleted successfully');
        },
        error: () => {
          this.toast.error('Failed to delete batch');
        }
      });
    }
  }
}

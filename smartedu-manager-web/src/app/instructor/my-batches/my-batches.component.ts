import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { BatchService } from '../../core/services/batch.service';
import { CourseService } from '../../core/services/course.service';
import { Batch, Course, CreateBatchDto } from '../../core/models';

@Component({
  selector: 'app-my-batches',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="batches-container mt-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="mb-1"><i class="fas fa-users me-2"></i>My Batches</h2>
          <p class="text-muted mb-0">Create and manage batches for your courses</p>
        </div>
      </div>

      <div class="card mb-4">
        <div class="card-header bg-success text-white">
          <h5 class="mb-0"><i class="fas fa-plus-circle me-2"></i>Create New Batch</h5>
        </div>
        <div class="card-body">
          <form [formGroup]="batchForm" (ngSubmit)="onSubmit()">
            <div class="row">
              <div class="col-md-6 mb-3">
                <label for="batchCode" class="form-label">Batch Code *</label>
                <input type="text" class="form-control" id="batchCode" formControlName="batchCode" placeholder="e.g., BATCH-2025-01">
              </div>

              <div class="col-md-6 mb-3">
                <label for="courseId" class="form-label">Course *</label>
                <select class="form-select" id="courseId" formControlName="courseId">
                  <option value="">Select Course</option>
                  <option *ngFor="let course of courses()" [value]="course.courseId">
                    {{ course.courseName }}
                  </option>
                </select>
              </div>

              <div class="col-md-6 mb-3">
                <label for="startDate" class="form-label">Start Date *</label>
                <input type="date" class="form-control" id="startDate" formControlName="startDate">
              </div>

              <div class="col-md-6 mb-3">
                <label for="endDate" class="form-label">End Date *</label>
                <input type="date" class="form-control" id="endDate" formControlName="endDate">
              </div>

              <div class="col-md-6 mb-3">
                <label for="duration" class="form-label">Duration (months) *</label>
                <input type="number" class="form-control" id="duration" formControlName="duration">
              </div>
            </div>

            <div class="mt-3">
              <button type="submit" class="btn btn-success" [disabled]="batchForm.invalid || isLoading()">
                <i *ngIf="!isLoading()" class="fas fa-plus"></i>
                <span *ngIf="isLoading()" class="spinner-border spinner-border-sm me-1"></span>
                Create Batch
              </button>
            </div>
          </form>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h5 class="mb-0"><i class="fas fa-list me-2"></i>My Batches</h5>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover table-striped" *ngIf="batches().length > 0; else noData">
              <thead class="table-light">
                <tr>
                  <th><i class="fas fa-code me-1"></i>Batch Code</th>
                  <th><i class="fas fa-book me-1"></i>Course</th>
                  <th><i class="fas fa-calendar me-1"></i>Start Date</th>
                  <th><i class="fas fa-calendar me-1"></i>End Date</th>
                  <th><i class="fas fa-clock me-1"></i>Duration</th>
                  <th><i class="fas fa-cogs me-1"></i>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let b of batches()">
                  <td>{{ b.batchCode }}</td>
                  <td>{{ b.courseName }}</td>
                  <td>{{ b.startDate | date:'mediumDate' }}</td>
                  <td>{{ b.endDate | date:'mediumDate' }}</td>
                  <td>{{ b.duration }} months</td>
                  <td>
                    <a [routerLink]="['/instructor/my-students']" [queryParams]="{batchId: b.batchId}" class="btn btn-sm btn-success">
                      <i class="fas fa-users"></i>
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>

            <ng-template #noData>
              <div class="text-center py-5">
                <i class="fas fa-users fa-4x text-muted mb-3"></i>
                <p class="text-muted">No batches found</p>
              </div>
            </ng-template>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card { border-radius: 8px; }
    .table { margin-bottom: 0; }
  `]
})
export class MyBatchesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private batchService = inject(BatchService);
  private courseService = inject(CourseService);
  private fb = inject(FormBuilder);

  batches = signal<Batch[]>([]);
  courses = signal<Course[]>([]);
  isLoading = signal<boolean>(false);

  batchForm: FormGroup = this.fb.group({
    batchCode: ['', Validators.required],
    courseId: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    duration: ['', [Validators.required, Validators.min(1)]]
  });

  ngOnInit(): void {
    this.loadBatches();
    this.loadCourses();
  }

  loadBatches(): void {
    this.batchService.getBatches().subscribe({
      next: (data) => { this.batches.set(data); }
    });
  }

  loadCourses(): void {
    this.courseService.getCourses().subscribe({
      next: (data) => { this.courses.set(data); }
    });
  }

  onSubmit(): void {
    if (this.batchForm.invalid) return;
    this.isLoading.set(true);
    const formData: CreateBatchDto = {
      ...this.batchForm.value,
      startDate: this.formatDate(this.batchForm.value.startDate),
      endDate: this.formatDate(this.batchForm.value.endDate)
    };

    this.batchService.createBatch(formData).subscribe({
      next: () => {
        this.batchForm.reset();
        this.loadBatches();
        this.isLoading.set(false);
      },
      error: () => { this.isLoading.set(false); }
    });
  }

  private formatDate(date: Date | string): string {
    if (date instanceof Date) return date.toISOString().split('T')[0];
    return typeof date === 'string' ? date.split('T')[0] : date;
  }
}

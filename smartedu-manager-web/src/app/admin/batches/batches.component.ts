import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { BatchService } from '../../core/services/batch.service';
import { CourseService } from '../../core/services/course.service';
import { CenterService } from '../../core/services/center.service';
import { Batch, Course, Center, CreateBatchDto, UpdateBatchDto } from '../../core/models';

@Component({
  selector: 'app-batches',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './batches.component.html',
  styleUrls: ['./batches.component.scss']
})
export class BatchesComponent implements OnInit {
  private batchService = inject(BatchService);
  private courseService = inject(CourseService);
  private centerService = inject(CenterService);
  private fb = inject(FormBuilder);

  batches = signal<Batch[]>([]);
  courses = signal<Course[]>([]);
  centers = signal<Center[]>([]);
  isLoading = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  editingId = signal<number | null>(null);

  batchForm: FormGroup = this.fb.group({
    batchCode: ['', [Validators.required, Validators.maxLength(100)]],
    batchName: [''],
    courseId: ['', Validators.required],
    centerId: [''],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    duration: ['', [Validators.required, Validators.min(1)]],
    maxCapacity: [30]
  });

  ngOnInit(): void {
    this.loadBatches();
    this.loadCourses();
    this.loadCenters();
  }

  loadBatches(): void {
    this.isLoading.set(true);
    this.batchService.getBatches().subscribe({
      next: (data) => { this.batches.set(data); this.isLoading.set(false); },
      error: () => { this.isLoading.set(false); }
    });
  }

  loadCourses(): void {
    this.courseService.getCourses().subscribe({
      next: (data) => this.courses.set(data),
      error: () => {}
    });
  }

  loadCenters(): void {
    this.centerService.getCenters().subscribe({
      next: (data) => this.centers.set(data),
      error: () => {}
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

    if (this.isEditing() && this.editingId() !== null) {
      this.batchService.updateBatch(this.editingId()!, formData as UpdateBatchDto).subscribe({
        next: () => { this.resetForm(); this.loadBatches(); },
        error: () => { this.isLoading.set(false); }
      });
    } else {
      this.batchService.createBatch(formData).subscribe({
        next: () => { this.resetForm(); this.loadBatches(); },
        error: () => { this.isLoading.set(false); }
      });
    }
  }

  editBatch(batch: Batch): void {
    this.isEditing.set(true);
    this.editingId.set(batch.batchId);
    this.batchForm.patchValue({
      batchCode: batch.batchCode,
      batchName: batch.batchName || '',
      courseId: batch.courseId,
      centerId: batch.centerId || '',
      startDate: this.formatDateForInput(batch.startDate),
      endDate: this.formatDateForInput(batch.endDate),
      duration: batch.duration,
      maxCapacity: batch.maxCapacity || 30
    });
  }

  deleteBatch(id: number): void {
    if (confirm('Delete this batch?')) {
      this.isLoading.set(true);
      this.batchService.deleteBatch(id).subscribe({
        next: () => { this.loadBatches(); },
        error: () => { this.isLoading.set(false); }
      });
    }
  }

  cancelEdit(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.batchForm.reset({ maxCapacity: 30 });
    this.isEditing.set(false);
    this.editingId.set(null);
    this.isLoading.set(false);
  }

  private formatDate(date: Date | string): string {
    if (date instanceof Date) return date.toISOString().split('T')[0];
    return typeof date === 'string' ? date.split('T')[0] : date;
  }

  private formatDateForInput(date: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }
}

import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { AssignmentService } from '../../core/services/assignment.service';
import { CourseService } from '../../core/services/course.service';
import { Assignment, Course, CreateAssignmentDto } from '../../core/models';

@Component({
  selector: 'app-assignments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="assignments-container mt-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="mb-1"><i class="fas fa-tasks me-2"></i>Assignments</h2>
          <p class="text-muted mb-0">Create and manage assignments for your courses</p>
        </div>
      </div>

      <div class="card mb-4">
        <div class="card-header bg-success text-white">
          <h5 class="mb-0"><i class="fas fa-plus-circle me-2"></i>Create Assignment</h5>
        </div>
        <div class="card-body">
          <form [formGroup]="assignmentForm" (ngSubmit)="onSubmit()">
            <div class="row">
              <div class="col-md-6 mb-3">
                <label for="title" class="form-label">Title *</label>
                <input type="text" class="form-control" id="title" formControlName="title">
              </div>

              <div class="col-md-6 mb-3">
                <label for="courseId" class="form-label">Course *</label>
                <select class="form-select" id="courseId" formControlName="courseId">
                  <option value="">Select Course</option>
                  <option *ngFor="let c of courses()" [value]="c.courseId">{{ c.courseName }}</option>
                </select>
              </div>

              <div class="col-md-6 mb-3">
                <label for="maxMarks" class="form-label">Max Marks *</label>
                <input type="number" class="form-control" id="maxMarks" formControlName="maxMarks">
              </div>

              <div class="col-md-6 mb-3">
                <label for="dueDate" class="form-label">Due Date *</label>
                <input type="date" class="form-control" id="dueDate" formControlName="dueDate">
              </div>

              <div class="col-12 mb-3">
                <label for="description" class="form-label">Description *</label>
                <textarea class="form-control" id="description" formControlName="description" rows="3"></textarea>
              </div>
            </div>

            <div class="mt-3">
              <button type="submit" class="btn btn-success" [disabled]="assignmentForm.invalid || isLoading()">
                <i *ngIf="!isLoading()" class="fas fa-plus"></i>
                <span *ngIf="isLoading()" class="spinner-border spinner-border-sm me-1"></span>
                Create Assignment
              </button>
            </div>
          </form>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h5 class="mb-0"><i class="fas fa-list me-2"></i>Assignments List</h5>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover table-striped" *ngIf="assignments().length > 0; else noData">
              <thead class="table-light">
                <tr>
                  <th><i class="fas fa-heading me-1"></i>Title</th>
                  <th><i class="fas fa-book me-1"></i>Course</th>
                  <th><i class="fas fa-star me-1"></i>Marks</th>
                  <th><i class="fas fa-calendar me-1"></i>Due Date</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let a of assignments()">
                  <td>{{ a.title }}</td>
                  <td>{{ a.courseName }}</td>
                  <td>{{ a.maxMarks }}</td>
                  <td>{{ a.dueDate | date:'mediumDate' }}</td>
                </tr>
              </tbody>
            </table>

            <ng-template #noData>
              <div class="text-center py-5">
                <i class="fas fa-tasks fa-4x text-muted mb-3"></i>
                <p class="text-muted">No assignments found</p>
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
export class AssignmentsComponent implements OnInit {
  private assignmentService = inject(AssignmentService);
  private courseService = inject(CourseService);
  private fb = inject(FormBuilder);

  assignments = signal<Assignment[]>([]);
  courses = signal<Course[]>([]);
  isLoading = signal<boolean>(false);

  assignmentForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    courseId: ['', Validators.required],
    maxMarks: ['', [Validators.required, Validators.min(1)]],
    dueDate: ['', Validators.required]
  });

  ngOnInit(): void {
    this.loadAssignments();
    this.loadCourses();
  }

  loadAssignments(): void {
    this.assignmentService.getAssignments().subscribe({
      next: (data) => { this.assignments.set(data); }
    });
  }

  loadCourses(): void {
    this.courseService.getCourses().subscribe({
      next: (data) => { this.courses.set(data); }
    });
  }

  onSubmit(): void {
    if (this.assignmentForm.invalid) return;
    this.isLoading.set(true);
    const formData: CreateAssignmentDto = {
      ...this.assignmentForm.value,
      dueDate: this.formatDate(this.assignmentForm.value.dueDate)
    };
    this.assignmentService.createAssignment(formData).subscribe({
      next: () => {
        this.assignmentForm.reset();
        this.loadAssignments();
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

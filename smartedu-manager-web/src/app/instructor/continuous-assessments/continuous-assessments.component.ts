import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { ContinuousAssessmentService } from '../../core/services/continuous-assessment.service';
import { StudentService } from '../../core/services/student.service';
import { ContinuousAssessment, Student, CreateContinuousAssessmentDto } from '../../core/models';

@Component({
  selector: 'app-continuous-assessments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="assessments-container mt-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="mb-1"><i class="fas fa-clipboard-check me-2"></i>Continuous Assessments</h2>
          <p class="text-muted mb-0">Record and manage student assessments</p>
        </div>
      </div>

      <div class="card mb-4">
        <div class="card-header bg-success text-white">
          <h5 class="mb-0"><i class="fas fa-plus-circle me-2"></i>Record Assessment</h5>
        </div>
        <div class="card-body">
          <form [formGroup]="assessmentForm" (ngSubmit)="onSubmit()">
            <div class="row">
              <div class="col-md-6 mb-3">
                <label for="studentId" class="form-label">Student *</label>
                <select class="form-select" id="studentId" formControlName="studentId">
                  <option value="">Select Student</option>
                  <option *ngFor="let s of students()" [value]="s.studentId">
                    {{ s.nameWithInitials }} ({{ s.misNo }})
                  </option>
                </select>
              </div>

              <div class="col-md-6 mb-3">
                <label for="moduleTaskId" class="form-label">Module Task ID *</label>
                <input type="number" class="form-control" id="moduleTaskId" formControlName="moduleTaskId">
              </div>

              <div class="col-md-6 mb-3">
                <label for="assessmentMark" class="form-label">Assessment Mark *</label>
                <select class="form-select" id="assessmentMark" formControlName="assessmentMark">
                  <option value="">Select Mark</option>
                  <option value="C">C - Competent</option>
                  <option value="NYC">NYC - Not Yet Competent</option>
                </select>
              </div>

              <div class="col-md-6 mb-3">
                <label for="assessorNotes" class="form-label">Notes</label>
                <input type="text" class="form-control" id="assessorNotes" formControlName="assessorNotes">
              </div>
            </div>

            <div class="mt-3">
              <button type="submit" class="btn btn-success" [disabled]="assessmentForm.invalid || isLoading()">
                <i *ngIf="!isLoading()" class="fas fa-save"></i>
                <span *ngIf="isLoading()" class="spinner-border spinner-border-sm me-1"></span>
                Save Assessment
              </button>
            </div>
          </form>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h5 class="mb-0"><i class="fas fa-list me-2"></i>Assessments List</h5>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover table-striped" *ngIf="assessments().length > 0; else noData">
              <thead class="table-light">
                <tr>
                  <th><i class="fas fa-user me-1"></i>Student</th>
                  <th><i class="fas fa-tasks me-1"></i>Task</th>
                  <th><i class="fas fa-star me-1"></i>Mark</th>
                  <th><i class="fas fa-calendar me-1"></i>Date</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let a of assessments()">
                  <td>{{ a.studentName }}</td>
                  <td>{{ a.moduleTaskName }}</td>
                  <td>
                    <span [class.text-success]="a.assessmentMark === 'C'" [class.text-danger]="a.assessmentMark === 'NYC'" class="fw-bold">
                      {{ a.assessmentMark }}
                    </span>
                  </td>
                  <td>{{ a.assessmentDate | date:'mediumDate' }}</td>
                </tr>
              </tbody>
            </table>

            <ng-template #noData>
              <div class="text-center py-5">
                <i class="fas fa-clipboard-check fa-4x text-muted mb-3"></i>
                <p class="text-muted">No assessments recorded</p>
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
export class ContinuousAssessmentsComponent implements OnInit {
  private assessmentService = inject(ContinuousAssessmentService);
  private studentService = inject(StudentService);
  private fb = inject(FormBuilder);

  assessments = signal<ContinuousAssessment[]>([]);
  students = signal<Student[]>([]);
  isLoading = signal<boolean>(false);

  assessmentForm: FormGroup = this.fb.group({
    studentId: ['', Validators.required],
    moduleTaskId: ['', Validators.required],
    assessmentMark: ['', Validators.required],
    assessorNotes: ['']
  });

  ngOnInit(): void {
    this.loadAssessments();
    this.loadStudents();
  }

  loadAssessments(): void {
    this.assessmentService.getAllAssessments().subscribe({
      next: (data) => { this.assessments.set(data); }
    });
  }

  loadStudents(): void {
    this.studentService.getStudents().subscribe({
      next: (data) => { this.students.set(data); }
    });
  }

  onSubmit(): void {
    if (this.assessmentForm.invalid) return;
    this.isLoading.set(true);
    const formData: CreateContinuousAssessmentDto = this.assessmentForm.value;
    this.assessmentService.createAssessment(formData).subscribe({
      next: () => {
        this.assessmentForm.reset();
        this.loadAssessments();
        this.isLoading.set(false);
      },
      error: () => { this.isLoading.set(false); }
    });
  }
}

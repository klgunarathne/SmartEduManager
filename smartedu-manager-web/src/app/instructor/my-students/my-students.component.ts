import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { StudentService } from '../../core/services/student.service';
import { BatchService } from '../../core/services/batch.service';
import { Student, Batch, CreateStudentDto } from '../../core/models';

@Component({
  selector: 'app-my-students',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="students-container mt-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="mb-1"><i class="fas fa-user-graduate me-2"></i>My Students</h2>
          <p class="text-muted mb-0">Manage students in your batches</p>
        </div>
      </div>

      <div class="card mb-4">
        <div class="card-header bg-success text-white">
          <h5 class="mb-0"><i class="fas fa-plus-circle me-2"></i>Add New Student</h5>
        </div>
        <div class="card-body">
          <form [formGroup]="studentForm" (ngSubmit)="onSubmit()">
            <div class="row">
              <div class="col-md-6 mb-3">
                <label for="misNo" class="form-label">MIS No *</label>
                <input type="text" class="form-control" id="misNo" formControlName="misNo">
              </div>

              <div class="col-md-6 mb-3">
                <label for="batchId" class="form-label">Batch *</label>
                <select class="form-select" id="batchId" formControlName="batchId">
                  <option value="">Select Batch</option>
                  <option *ngFor="let batch of batches()" [value]="batch.batchId">
                    {{ batch.batchCode }} - {{ batch.courseName }}
                  </option>
                </select>
              </div>

              <div class="col-md-6 mb-3">
                <label for="nameWithInitials" class="form-label">Name with Initials *</label>
                <input type="text" class="form-control" id="nameWithInitials" formControlName="nameWithInitials">
              </div>

              <div class="col-md-6 mb-3">
                <label for="fullName" class="form-label">Full Name *</label>
                <input type="text" class="form-control" id="fullName" formControlName="fullName">
              </div>

              <div class="col-md-6 mb-3">
                <label for="nicNo" class="form-label">NIC No *</label>
                <input type="text" class="form-control" id="nicNo" formControlName="nicNo">
              </div>

              <div class="col-md-6 mb-3">
                <label for="gender" class="form-label">Gender *</label>
                <select class="form-select" id="gender" formControlName="gender">
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div class="col-md-6 mb-3">
                <label for="telephone" class="form-label">Telephone *</label>
                <input type="text" class="form-control" id="telephone" formControlName="telephone">
              </div>

              <div class="col-md-6 mb-3">
                <label for="email" class="form-label">Email</label>
                <input type="email" class="form-control" id="email" formControlName="email">
              </div>

              <div class="col-12 mb-3">
                <label for="address" class="form-label">Address *</label>
                <textarea class="form-control" id="address" formControlName="address" rows="2"></textarea>
              </div>
            </div>

            <div class="mt-3">
              <button type="submit" class="btn btn-success" [disabled]="studentForm.invalid || isLoading()">
                <i *ngIf="!isLoading()" class="fas fa-plus"></i>
                <span *ngIf="isLoading()" class="spinner-border spinner-border-sm me-1"></span>
                Add Student
              </button>
            </div>
          </form>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h5 class="mb-0"><i class="fas fa-list me-2"></i>Students List</h5>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover table-striped" *ngIf="students().length > 0; else noData">
              <thead class="table-light">
                <tr>
                  <th><i class="fas fa-id-card me-1"></i>MIS No</th>
                  <th><i class="fas fa-user me-1"></i>Name</th>
                  <th><i class="fas fa-user-tag me-1"></i>Full Name</th>
                  <th><i class="fas fa-users me-1"></i>Batch</th>
                  <th><i class="fas fa-venus-mars me-1"></i>Gender</th>
                  <th><i class="fas fa-envelope me-1"></i>Email</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let s of students()">
                  <td>{{ s.misNo }}</td>
                  <td>{{ s.nameWithInitials }}</td>
                  <td>{{ s.fullName }}</td>
                  <td>{{ s.batchCode }}</td>
                  <td>{{ s.gender }}</td>
                  <td>{{ s.email }}</td>
                </tr>
              </tbody>
            </table>

            <ng-template #noData>
              <div class="text-center py-5">
                <i class="fas fa-user-graduate fa-4x text-muted mb-3"></i>
                <p class="text-muted">No students found</p>
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
export class MyStudentsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private studentService = inject(StudentService);
  private batchService = inject(BatchService);
  private fb = inject(FormBuilder);

  students = signal<Student[]>([]);
  batches = signal<Batch[]>([]);
  isLoading = signal<boolean>(false);

  studentForm: FormGroup = this.fb.group({
    misNo: ['', Validators.required],
    nameWithInitials: ['', Validators.required],
    fullName: ['', Validators.required],
    nicNo: ['', Validators.required],
    gender: ['', Validators.required],
    address: ['', Validators.required],
    telephone: ['', Validators.required],
    email: [''],
    batchId: ['', Validators.required]
  });

  ngOnInit(): void {
    this.loadStudents();
    this.loadBatches();
  }

  loadStudents(): void {
    this.studentService.getStudents().subscribe({
      next: (data) => { this.students.set(data); }
    });
  }

  loadBatches(): void {
    this.batchService.getBatches().subscribe({
      next: (data) => { this.batches.set(data); }
    });
  }

  onSubmit(): void {
    if (this.studentForm.invalid) return;
    this.isLoading.set(true);
    this.studentService.createStudent(this.studentForm.value as CreateStudentDto).subscribe({
      next: () => {
        this.studentForm.reset();
        this.loadStudents();
        this.isLoading.set(false);
      },
      error: () => { this.isLoading.set(false); }
    });
  }
}

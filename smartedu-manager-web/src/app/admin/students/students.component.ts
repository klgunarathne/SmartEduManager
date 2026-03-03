import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { StudentService } from '../../core/services/student.service';
import { BatchService } from '../../core/services/batch.service';
import { Student, Batch, CreateStudentDto, UpdateStudentDto } from '../../core/models';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './students.component.html',
  styleUrls: ['./students.component.scss']
})
export class StudentsComponent implements OnInit {
  private studentService = inject(StudentService);
  private batchService = inject(BatchService);
  private fb = inject(FormBuilder);

  students = signal<Student[]>([]);
  batches = signal<Batch[]>([]);
  isLoading = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  editingId = signal<number | null>(null);

  studentForm: FormGroup = this.fb.group({
    misNo: ['', Validators.required],
    nameWithInitials: ['', Validators.required],
    fullName: ['', Validators.required],
    nicNo: ['', Validators.required],
    gender: ['', Validators.required],
    address: ['', Validators.required],
    telephone: ['', Validators.required],
    email: [''],
    batchId: ['', Validators.required],
    gsDivision: [''],
    agDivision: ['']
  });

  ngOnInit(): void {
    this.loadStudents();
    this.loadBatches();
  }

  loadStudents(): void {
    this.isLoading.set(true);
    this.studentService.getStudents().subscribe({
      next: (data) => { this.students.set(data); this.isLoading.set(false); },
      error: () => { this.isLoading.set(false); }
    });
  }

  loadBatches(): void {
    this.batchService.getBatches().subscribe({
      next: (data) => this.batches.set(data),
      error: () => {}
    });
  }

  onSubmit(): void {
    if (this.studentForm.invalid) return;
    this.isLoading.set(true);
    const formData: CreateStudentDto = this.studentForm.value;

    if (this.isEditing() && this.editingId() !== null) {
      this.studentService.updateStudent(this.editingId()!, formData as UpdateStudentDto).subscribe({
        next: () => { this.resetForm(); this.loadStudents(); },
        error: () => { this.isLoading.set(false); }
      });
    } else {
      this.studentService.createStudent(formData).subscribe({
        next: () => { this.resetForm(); this.loadStudents(); },
        error: () => { this.isLoading.set(false); }
      });
    }
  }

  editStudent(student: Student): void {
    this.isEditing.set(true);
    this.editingId.set(student.studentId);
    this.studentForm.patchValue(student);
  }

  deleteStudent(id: number): void {
    if (confirm('Delete this student?')) {
      this.isLoading.set(true);
      this.studentService.deleteStudent(id).subscribe({
        next: () => { this.loadStudents(); },
        error: () => { this.isLoading.set(false); }
      });
    }
  }

  resetForm(): void {
    this.studentForm.reset();
    this.isEditing.set(false);
    this.editingId.set(null);
    this.isLoading.set(false);
  }
}

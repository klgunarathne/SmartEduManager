import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';

import { InstructorService } from '../../core/services/instructor.service';
import { Instructor, CreateInstructorDto, UpdateInstructorDto } from '../../core/models';

@Component({
  selector: 'app-instructors',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatCardModule
  ],
  templateUrl: './instructors.component.html',
  styleUrls: ['./instructors.component.scss']
})
export class InstructorsComponent implements OnInit {
  private instructorService = inject(InstructorService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  instructors = signal<Instructor[]>([]);
  isLoading = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  editingId = signal<number | null>(null);

  displayedColumns: string[] = ['epfNo', 'fullName', 'nic', 'email', 'phone', 'actions'];

  instructorForm: FormGroup = this.fb.group({
    epfNo: ['', [Validators.required, Validators.maxLength(50)]],
    fullName: ['', [Validators.required, Validators.maxLength(100)]],
    nic: ['', [Validators.required, Validators.maxLength(20)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    phone: ['', [Validators.required, Validators.maxLength(20)]]
  });

  ngOnInit(): void {
    this.loadInstructors();
  }

  loadInstructors(): void {
    this.isLoading.set(true);
    this.instructorService.getInstructors().subscribe({
      next: (data) => {
        this.instructors.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.showError('Failed to load instructors');
        this.isLoading.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.instructorForm.invalid) return;

    this.isLoading.set(true);
    const formData: CreateInstructorDto = this.instructorForm.value;

    if (this.isEditing() && this.editingId() !== null) {
      this.instructorService.updateInstructor(this.editingId()!, formData as UpdateInstructorDto).subscribe({
        next: () => {
          this.showSuccess('Instructor updated successfully');
          this.resetForm();
          this.loadInstructors();
        },
        error: () => {
          this.showError('Failed to update instructor');
          this.isLoading.set(false);
        }
      });
    } else {
      this.instructorService.createInstructor(formData).subscribe({
        next: () => {
          this.showSuccess('Instructor created successfully');
          this.resetForm();
          this.loadInstructors();
        },
        error: () => {
          this.showError('Failed to create instructor');
          this.isLoading.set(false);
        }
      });
    }
  }

  editInstructor(instructor: Instructor): void {
    this.isEditing.set(true);
    this.editingId.set(instructor.instructorId);
    this.instructorForm.patchValue({
      epfNo: instructor.epfNo,
      fullName: instructor.fullName,
      nic: instructor.nic,
      email: instructor.email,
      phone: instructor.phone
    });
  }

  deleteInstructor(id: number): void {
    if (confirm('Are you sure you want to delete this instructor?')) {
      this.isLoading.set(true);
      this.instructorService.deleteInstructor(id).subscribe({
        next: () => {
          this.showSuccess('Instructor deleted successfully');
          this.loadInstructors();
        },
        error: () => {
          this.showError('Failed to delete instructor');
          this.isLoading.set(false);
        }
      });
    }
  }

  resetForm(): void {
    this.instructorForm.reset();
    this.isEditing.set(false);
    this.editingId.set(null);
    this.isLoading.set(false);
  }

  cancelEdit(): void {
    this.resetForm();
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000, panelClass: ['success-snackbar'] });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000, panelClass: ['error-snackbar'] });
  }
}

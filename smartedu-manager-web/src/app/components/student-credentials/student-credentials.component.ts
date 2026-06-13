import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentService, Student } from '../../services/student.service';
import { StudentAuthService, GenerateCredentialsDto, StudentCredentials } from '../../services/student-auth.service';
import { BatchService, Batch } from '../../services/batch.service';

@Component({
  selector: 'app-student-credentials',
  imports: [CommonModule, FormsModule],
  templateUrl: './student-credentials.component.html',
  styleUrl: './student-credentials.component.scss'
})
export class StudentCredentialsComponent implements OnInit {
  batches = signal<Batch[]>([]);
  students = signal<Student[]>([]);
  selectedBatchId = signal<number | null>(null);
  selectedStudents = signal<number[]>([]);
  generatedCredentials = signal<StudentCredentials[]>([]);
  isLoadingBatches = signal(false);
  isLoadingStudents = signal(false);
  isGenerating = signal(false);
  defaultPassword = '';
  generateRandom = true;

  constructor(
    private batchService: BatchService,
    private studentService: StudentService,
    private authService: StudentAuthService
  ) {}

  ngOnInit(): void {
    this.loadBatches();
  }

  loadBatches() {
    this.isLoadingBatches.set(true);
    this.batchService.getActiveBatches().subscribe({
      next: (batches) => {
        this.batches.set(batches);
        this.isLoadingBatches.set(false);
      },
      error: (err) => {
        console.error('Error loading active batches, loading all batches:', err);
        // Fallback to all batches if /active fails
        this.batchService.getBatches().subscribe({
          next: (allBatches) => {
            this.batches.set(allBatches);
            this.isLoadingBatches.set(false);
          },
          error: () => {
            this.isLoadingBatches.set(false);
          }
        });
      }
    });
  }

  onBatchChange() {
    if (this.selectedBatchId()) {
      this.loadStudents(this.selectedBatchId()!);
    }
  }

  loadStudents(batchId: number) {
    this.isLoadingStudents.set(true);
    this.studentService.getStudentsByBatch(batchId).subscribe({
      next: (students) => {
        this.students.set(students);
        this.selectedStudents.set(students.map(s => s.id));
        this.isLoadingStudents.set(false);
      },
      error: () => {
        this.isLoadingStudents.set(false);
      }
    });
  }

  toggleAllStudents(checked: boolean) {
    if (checked) {
      this.selectedStudents.set(this.students().map(s => s.id));
    } else {
      this.selectedStudents.set([]);
    }
  }

  toggleStudent(studentId: number, checked: boolean) {
    const current = this.selectedStudents();
    if (checked) {
      this.selectedStudents.set([...current, studentId]);
    } else {
      this.selectedStudents.set(current.filter(id => id !== studentId));
    }
  }

  isAllSelected(): boolean {
    const students = this.students();
    const selected = this.selectedStudents();
    return students.length > 0 && selected.length === students.length;
  }

  generate() {
    const dto: GenerateCredentialsDto = {
      batchId: this.selectedBatchId() || undefined,
      studentIds: this.selectedStudents().length > 0 ? this.selectedStudents() : undefined,
      defaultPassword: !this.generateRandom ? this.defaultPassword : undefined,
      generateRandomPassword: this.generateRandom
    };

    this.isGenerating.set(true);
    this.authService.generateCredentials(dto).subscribe({
      next: (credentials) => {
        this.generatedCredentials.set(credentials);
        this.isGenerating.set(false);
      },
      error: () => {
        this.isGenerating.set(false);
      }
    });
  }

  downloadCsv() {
    const credentials = this.generatedCredentials();
    if (credentials.length === 0) return;

    const header = 'Student ID,Student Name,Username,Password,Status\n';
    const rows = credentials.map(c => 
      `${c.studentId},${c.studentName},"${c.username}","${c.password}",${c.status}`
    ).join('\n');
    
    const csvContent = header + rows;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student-credentials-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  copyToClipboard(cred: StudentCredentials) {
    const text = `Username: ${cred.username}\nPassword: ${cred.password}`;
    navigator.clipboard.writeText(text).then(() => {
      console.log('Credentials copied to clipboard');
    });
  }

  deleteCredential(credential: StudentCredentials) {
    this.generatedCredentials.update(list => 
      list.filter(c => c.studentId !== credential.studentId)
    );
  }

  clearAllCredentials() {
    if (confirm('Are you sure you want to clear all generated credentials from this view?')) {
      this.generatedCredentials.set([]);
    }
  }
}
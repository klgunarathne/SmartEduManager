import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentService, Student } from '../../services/student.service';
import { StudentAuthService, GenerateCredentialsDto, StudentCredentials } from '../../services/student-auth.service';
import { BatchService, Batch } from '../../services/batch.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-student-credentials',
  imports: [CommonModule, FormsModule],
  templateUrl: './student-credentials.component.html',
  styleUrl: './student-credentials.component.scss'
})
export class StudentCredentialsComponent implements OnInit {
  private toast = inject(ToastService);

  batches = signal<Batch[]>([]);
  students = signal<Student[]>([]);
  selectedBatchId = signal<number | null>(null);
  selectedStudents = signal<number[]>([]);
  generatedCredentials = signal<StudentCredentials[]>([]);
  allGeneratedCredentials = signal<StudentCredentials[]>([]);
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
    // Load all batches (not just active) so instructors can manage credentials from any batch
    this.batchService.getBatches().subscribe({
      next: (batches) => {
        this.batches.set(batches);
        this.isLoadingBatches.set(false);
      },
      error: (err) => {
        console.error('Error loading batches:', err);
        this.isLoadingBatches.set(false);
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
        this.checkExistingCredentials(students);
        this.isLoadingStudents.set(false);
      },
      error: () => {
        this.isLoadingStudents.set(false);
        this.toast.error('Failed to load students');
      }
    });
  }

  checkExistingCredentials(students: Student[]) {
    const nicNoList = students.map(s => s.nicNo).filter(Boolean);
    if (nicNoList.length === 0) return;
    
    this.authService.checkUserExists(nicNoList).subscribe({
      next: (existing) => {
        const nicToStudent = new Map(students.map((s, i) => [s.nicNo, i]));
        const existingCredentials: StudentCredentials[] = [];
        
        nicNoList.forEach((nic, index) => {
          const student = students[nicToStudent.get(nic)!];
          existingCredentials.push({
            studentId: student.id,
            studentName: student.fullName,
            username: nic,
            password: '',
            email: student.email || '',
            status: existing[index] ? 'Exists' : 'Not Generated'
          });
        });
        
        // Merge with all generated credentials but avoid duplicates
        this.allGeneratedCredentials.update(all => {
          const merged = [...all];
          existingCredentials.forEach(cred => {
            if (!merged.some(c => c.studentId === cred.studentId)) {
              merged.push(cred);
            }
          });
          return merged;
        });
        
        // Always show all accumulated credentials in the table
        this.generatedCredentials.set(this.allGeneratedCredentials());
      },
      error: () => {}
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
        // Merge with all generated credentials
        this.allGeneratedCredentials.update(all => {
          const merged = [...all];
          credentials.forEach(cred => {
            const existingIndex = merged.findIndex(c => c.studentId === cred.studentId);
            if (existingIndex >= 0) {
              merged[existingIndex] = cred;
            } else {
              merged.push(cred);
            }
          });
          return merged;
        });
        this.generatedCredentials.set(this.allGeneratedCredentials());
        this.isGenerating.set(false);
        const createdCount = credentials.filter(c => c.status === 'Created').length;
        if (createdCount > 0) {
          this.toast.success(`Generated credentials for ${createdCount} students`);
        }
      },
      error: (error) => {
        this.isGenerating.set(false);
        this.toast.error('Failed to generate credentials: ' + (error.error?.message || error.message));
      }
    });
  }

  downloadCsv() {
    const credentials = this.allGeneratedCredentials();
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
    
    this.toast.success('CSV file downloaded');
  }

  copyToClipboard(cred: StudentCredentials) {
    const text = `Username: ${cred.username}\nPassword: ${cred.password}`;
    navigator.clipboard.writeText(text).then(() => {
      this.toast.success('Credentials copied to clipboard');
    });
  }

  deleteCredential(credential: StudentCredentials) {
    this.allGeneratedCredentials.update(list => 
      list.filter(c => c.studentId !== credential.studentId)
    );
    this.generatedCredentials.set(this.allGeneratedCredentials());
  }

  clearAllCredentials() {
    const credentials = this.allGeneratedCredentials();
    if (credentials.length === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${credentials.length} student users? They will be permanently removed from the system.`)) {
      return;
    }
    
    const usernames = credentials.map(c => c.username);
    this.authService.deleteUsers(usernames).subscribe({
      next: (result) => {
        this.allGeneratedCredentials.set([]);
        this.generatedCredentials.set([]);
        this.toast.success(`Deleted ${result.deletedCount} users`);
      },
      error: () => {
        this.allGeneratedCredentials.set([]);
        this.generatedCredentials.set([]);
        this.toast.error('Users removed from view. Some may have failed to delete on server.');
      }
    });
  }
}
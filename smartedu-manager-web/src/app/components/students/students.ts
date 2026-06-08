import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentService, Student, CreateStudentDto, UpdateStudentDto } from '../../services/student.service';
import { BatchService, Batch } from '../../services/batch.service';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './students.html',
  styleUrl: './students.scss'
})
export class StudentsComponent implements OnInit {
  showModal = signal(false);
  modalMode = signal<'add' | 'edit'>('add');
  editingStudentId: number | null = null;

  searchTerm = signal('');
  currentPage = signal(1);
  pageSize = 10;

  selectedStudent: Partial<CreateStudentDto> = this.getEmptyStudent();
  batches = signal<Batch[]>([]);

  constructor(
    private studentService: StudentService,
    private batchService: BatchService
  ) {}

  ngOnInit(): void {
    this.studentService.getStudents().subscribe();
    this.batchService.getBatches().subscribe({
      next: (data) => this.batches.set(data)
    });
  }

  private getEmptyStudent(): CreateStudentDto {
    return {
      misNo: '',
      nameWithInitials: '',
      fullName: '',
      nicNo: '',
      gender: '',
      address: '',
      telephone: '',
      email: '',
      batchId: 0,
      gsDivision: '',
      agDivision: ''
    };
  }

  openAddModal(): void {
    this.selectedStudent = this.getEmptyStudent();
    this.modalMode.set('add');
    this.showModal.set(true);
  }

  openEditModal(student: Student): void {
    this.editingStudentId = student.id;
    this.selectedStudent = {
      misNo: student.misNo,
      nameWithInitials: student.nameWithInitials,
      fullName: student.fullName,
      nicNo: student.nicNo,
      gender: student.gender,
      address: student.address,
      telephone: student.telephone,
      email: student.email,
      batchId: student.batchId
    };
    this.modalMode.set('edit');
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingStudentId = null;
    this.selectedStudent = this.getEmptyStudent();
  }

  saveStudent(): void {
    if (this.modalMode() === 'add') {
      this.studentService.createStudent(this.selectedStudent as CreateStudentDto).subscribe({
        next: () => this.closeModal(),
        error: (error) => alert('Failed to create student: ' + (error.error?.message || error.message))
      });
    } else if (this.editingStudentId) {
      this.studentService.updateStudent(this.editingStudentId, this.selectedStudent as UpdateStudentDto).subscribe({
        next: () => this.closeModal(),
        error: (error) => alert('Failed to update student: ' + (error.error?.message || error.message))
      });
    }
  }

  deleteStudent(student: Student): void {
    if (confirm(`Are you sure you want to delete ${student.nameWithInitials}?`)) {
      this.studentService.deleteStudent(student.id).subscribe({
        next: () => {},
        error: (error) => alert('Failed to delete student')
      });
    }
  }

  get students(): Student[] {
    return this.studentService.students();
  }

  get isLoading(): boolean {
    return this.studentService.isLoading();
  }

  get filteredStudents(): Student[] {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.students;
    return this.students.filter(s => 
      s.nameWithInitials?.toLowerCase().includes(term) ||
      s.misNo?.toLowerCase().includes(term) ||
      s.nicNo?.toLowerCase().includes(term) ||
      s.fullName?.toLowerCase().includes(term)
    );
  }

  get paginatedStudents(): Student[] {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredStudents.slice(start, start + this.pageSize);
  }

  totalPagesCount(): number {
    return Math.ceil(this.filteredStudents.length / this.pageSize);
  }

  prevPage(): void {
    if (this.currentPage() > 1) this.currentPage.update(p => p - 1);
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPagesCount()) this.currentPage.update(p => p + 1);
  }
}
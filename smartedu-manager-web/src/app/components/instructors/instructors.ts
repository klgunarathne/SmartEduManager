import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InstructorService, Instructor, CreateInstructor } from '../../services/instructor.service';

@Component({
  selector: 'app-instructors',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './instructors.html',
  styleUrl: './instructors.scss'
})
export class InstructorsComponent implements OnInit {
  showModal = signal(false);
  modalMode = signal<'add' | 'edit'>('add');
  
  searchTerm = signal('');
  currentPage = signal(1);
  pageSize = 10;

  selectedInstructor: CreateInstructor = this.getEmptyInstructor();

  constructor(private instructorService: InstructorService) {}

  ngOnInit(): void {
    this.instructorService.getInstructors().subscribe();
  }

  private getEmptyInstructor(): CreateInstructor {
    return {
      epfNo: '',
      fullName: '',
      nic: '',
      email: '',
      phone: ''
    };
  }

  openAddModal(): void {
    this.selectedInstructor = this.getEmptyInstructor();
    this.modalMode.set('add');
    this.showModal.set(true);
  }

  openEditModal(instructor: Instructor): void {
    this.selectedInstructor = {
      epfNo: instructor.epfNo,
      fullName: instructor.fullName,
      nic: instructor.nic,
      email: instructor.email,
      phone: instructor.phone
    };
    this.modalMode.set('edit');
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedInstructor = this.getEmptyInstructor();
  }

  saveInstructor(): void {
    if (this.modalMode() === 'add') {
      this.instructorService.createInstructor(this.selectedInstructor).subscribe({
        next: () => this.closeModal(),
        error: (error) => alert('Failed to create instructor: ' + (error.error?.message || error.message))
      });
    } else {
      const instructor = this.instructorService.instructors().find(i => i.epfNo === this.selectedInstructor.epfNo);
      if (instructor) {
        this.instructorService.updateInstructor(instructor.instructorId, this.selectedInstructor).subscribe({
          next: () => this.closeModal(),
          error: (error) => alert('Failed to update instructor: ' + (error.error?.message || error.message))
        });
      }
    }
  }

  deleteInstructor(instructor: Instructor): void {
    if (confirm(`Are you sure you want to delete ${instructor.fullName}?`)) {
      this.instructorService.deleteInstructor(instructor.instructorId).subscribe({
        next: () => {},
        error: () => alert('Failed to delete instructor')
      });
    }
  }

  get instructors(): Instructor[] {
    return this.instructorService.instructors();
  }

  get isLoading(): boolean {
    return this.instructorService.isLoading();
  }

  get filteredInstructors(): Instructor[] {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.instructors;
    return this.instructors.filter(i => 
      i.fullName?.toLowerCase().includes(term) ||
      i.epfNo?.toLowerCase().includes(term) ||
      i.email?.toLowerCase().includes(term) ||
      i.nic?.toLowerCase().includes(term)
    );
  }

  get paginatedInstructors(): Instructor[] {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredInstructors.slice(start, start + this.pageSize);
  }

  totalPagesCount(): number {
    return Math.ceil(this.filteredInstructors.length / this.pageSize);
  }

  prevPage(): void {
    if (this.currentPage() > 1) this.currentPage.update(p => p - 1);
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPagesCount()) this.currentPage.update(p => p + 1);
  }

  getInitials(name: string): string {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '';
  }

  getAvatarColor(name: string): string {
    const colors = [
      'linear-gradient(135deg, #6366f1, #8b5cf6)',
      'linear-gradient(135deg, #10b981, #34d399)',
      'linear-gradient(135deg, #f59e0b, #fbbf24)',
      'linear-gradient(135deg, #ec4899, #f472b6)',
      'linear-gradient(135deg, #3b82f6, #60a5fa)'
    ];
    const index = name?.charCodeAt(0) || 0;
    return colors[index % colors.length];
  }
}

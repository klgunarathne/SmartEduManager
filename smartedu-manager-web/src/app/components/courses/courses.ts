import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CourseService, Course, CreateCourse } from '../../services/course.service';
import { CenterService, Center } from '../../services/center.service';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './courses.html',
  styleUrl: './courses.scss'
})
export class CoursesComponent implements OnInit {
  showModal = signal(false);
  modalMode = signal<'add' | 'edit'>('add');
  
  searchTerm = signal('');
  currentPage = signal(1);
  pageSize = 10;

  selectedCourse: CreateCourse = this.getEmptyCourse();
  centers = signal<Center[]>([]);

  constructor(
    private courseService: CourseService,
    private centerService: CenterService
  ) {}

  ngOnInit(): void {
    this.courseService.getCourses().subscribe();
    this.centerService.getCenters().subscribe({
      next: (data) => this.centers.set(data)
    });
  }

  private getEmptyCourse(): CreateCourse {
    return {
      courseName: '',
      description: '',
      duration: 0,
      courseFee: 0,
      centerId: 0
    };
  }

  openAddModal(): void {
    this.selectedCourse = this.getEmptyCourse();
    this.modalMode.set('add');
    this.showModal.set(true);
  }

  openEditModal(course: Course): void {
    this.selectedCourse = {
      courseName: course.courseName,
      description: course.description,
      duration: course.duration,
      courseFee: course.courseFee,
      centerId: course.centerId
    };
    this.modalMode.set('edit');
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedCourse = this.getEmptyCourse();
  }

  saveCourse(): void {
    if (this.modalMode() === 'add') {
      this.courseService.createCourse(this.selectedCourse).subscribe({
        next: () => this.closeModal(),
        error: (error) => alert('Failed to create course: ' + (error.error?.message || error.message))
      });
    } else {
      const course = this.courseService.courses().find(c => c.courseName === this.selectedCourse.courseName);
      if (course) {
        this.courseService.updateCourse(course.courseId, this.selectedCourse).subscribe({
          next: () => this.closeModal(),
          error: (error) => alert('Failed to update course: ' + (error.error?.message || error.message))
        });
      }
    }
  }

  deleteCourse(course: Course): void {
    if (confirm(`Are you sure you want to delete ${course.courseName}?`)) {
      this.courseService.deleteCourse(course.courseId).subscribe({
        next: () => {},
        error: (error) => alert('Failed to delete course')
      });
    }
  }

  get courses(): Course[] {
    return this.courseService.courses();
  }

  get isLoading(): boolean {
    return this.courseService.isLoading();
  }

  get filteredCourses(): Course[] {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.courses;
    return this.courses.filter(c => 
      c.courseName?.toLowerCase().includes(term) ||
      c.description?.toLowerCase().includes(term) ||
      c.centerName?.toLowerCase().includes(term)
    );
  }

  get paginatedCourses(): Course[] {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredCourses.slice(start, start + this.pageSize);
  }

  totalPagesCount(): number {
    return Math.ceil(this.filteredCourses.length / this.pageSize);
  }

  prevPage(): void {
    if (this.currentPage() > 1) this.currentPage.update(p => p - 1);
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPagesCount()) this.currentPage.update(p => p + 1);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(amount);
  }
}

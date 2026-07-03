import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CourseService, Course, CreateCourse, UpdateCourse, CourseNC } from '../../services/course.service';
import { InstructorService, Instructor } from '../../services/instructor.service';
import { CenterService, Center } from '../../services/center.service';
import { ToastService } from '../../services/toast.service';
import { NcsService, NCS } from '../../services/ncs.service';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './courses.html',
  styleUrl: './courses.scss'
})
export class CoursesComponent implements OnInit {
  private toast = inject(ToastService);

  showModal = signal(false);
  modalMode = signal<'add' | 'edit'>('add');
  editingCourseId: number | null = null;

  searchTerm = signal('');
  currentPage = signal(1);
  pageSize = 10;

  selectedCourse: UpdateCourse = this.getEmptyCourse();
  selectedInstructorIds: number[] = [];
  instructors = signal<Instructor[]>([]);
  centers = signal<Center[]>([]);
  ncsList = signal<CourseNC[]>([]);
  allNCS = signal<NCS[]>([]);
  selectedNCSIds: number[] = [];

  constructor(
    private courseService: CourseService,
    private instructorService: InstructorService,
    private centerService: CenterService,
    private ncsService: NcsService
  ) {}

  ngOnInit(): void {
    this.courseService.getCourses().subscribe();
    this.instructorService.getInstructors().subscribe({
      next: (data) => this.instructors.set(data)
    });
    this.centerService.getCenters().subscribe({
      next: (data) => this.centers.set(data)
    });
    this.ncsService.getNCS().subscribe({
      next: (data) => this.allNCS.set(data)
    });
  }

  private getEmptyCourse(): UpdateCourse {
    return {
      courseName: '',
      description: '',
      duration: 0,
      courseFee: 0,
      centerId: 0,
      instructorIds: []
    };
  }

  openAddModal(): void {
    this.selectedCourse = this.getEmptyCourse();
    this.selectedInstructorIds = [];
    this.selectedNCSIds = [];
    this.modalMode.set('add');
    this.showModal.set(true);
  }

  openEditModal(course: Course): void {
    this.editingCourseId = course.courseId;
    this.selectedCourse = {
      courseName: course.courseName,
      description: course.description,
      duration: course.duration,
      courseFee: course.courseFee,
      centerId: course.centerId,
      instructorIds: [...course.instructorIds]
    };
    this.selectedInstructorIds = [...course.instructorIds];
    this.ncsList.set(course.ncs || []);
    this.selectedNCSIds = [...(course.ncs?.map(n => n.id) || [])];
    this.modalMode.set('edit');
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingCourseId = null;
    this.selectedCourse = this.getEmptyCourse();
    this.selectedInstructorIds = [];
    this.ncsList.set([]);
    this.selectedNCSIds = [];
  }

  saveCourse(): void {
    const course = this.selectedCourse;
    if (!course.courseName?.trim() || !course.description?.trim() || !course.duration || !course.courseFee || !course.centerId) {
      this.toast.warning('Please fill all required fields and select a center');
      return;
    }
    
    course.instructorIds = this.selectedInstructorIds;
    if (this.editingCourseId) {
      (course as any).ncsIds = this.selectedNCSIds;
    }
    
    if (this.modalMode() === 'add') {
      this.courseService.createCourse(course as CreateCourse).subscribe({
        next: () => {
          this.closeModal();
          this.toast.success('Course created successfully');
        },
        error: (error) => {
          console.error('Failed to create course:', error);
          this.toast.error('Failed to create course: ' + (error.error?.message || error.message));
        }
      });
    } else if (this.editingCourseId) {
      this.courseService.updateCourse(this.editingCourseId, course).subscribe({
        next: () => {
          this.ncsList.set(this.allNCS().filter(n => this.selectedNCSIds.includes(n.id)).map(n => ({
            id: n.id,
            version: n.version,
            name: n.name,
            updatedDate: n.updatedDate
          })));
          this.closeModal();
          this.toast.success('Course updated successfully');
        },
        error: (error) => {
          console.error('Failed to update course:', error);
          this.toast.error('Failed to update course: ' + (error.error?.message || error.message));
        }
      });
    }
  }

  toggleInstructor(instructorId: number): void {
    const index = this.selectedInstructorIds.indexOf(instructorId);
    if (index === -1) {
      this.selectedInstructorIds.push(instructorId);
    } else {
      this.selectedInstructorIds.splice(index, 1);
    }
  }

  isInstructorSelected(instructorId: number): boolean {
    return this.selectedInstructorIds.includes(instructorId);
  }

  toggleNCS(ncsId: number): void {
    const index = this.selectedNCSIds.indexOf(ncsId);
    if (index === -1) {
      this.selectedNCSIds.push(ncsId);
    } else {
      this.selectedNCSIds.splice(index, 1);
    }
  }

  isNCSSelected(ncsId: number): boolean {
    return this.selectedNCSIds.includes(ncsId);
  }

  deleteCourse(course: Course): void {
    if (confirm(`Are you sure you want to delete ${course.courseName}?`)) {
      this.courseService.deleteCourse(course.courseId).subscribe({
        next: () => {
          this.toast.success('Course deleted successfully');
        },
        error: (error) => {
          console.error('Failed to delete course:', error);
          this.toast.error('Failed to delete course');
        }
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
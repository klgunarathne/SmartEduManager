import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CourseService } from '../../core/services/course.service';
import { CenterService } from '../../core/services/center.service';
import { Course, Center, CreateCourseDto, UpdateCourseDto } from '../../core/models';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.scss']
})
export class CoursesComponent implements OnInit {
  private courseService = inject(CourseService);
  private centerService = inject(CenterService);
  private fb = inject(FormBuilder);

  courses = signal<Course[]>([]);
  centers = signal<Center[]>([]);
  isLoading = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  editingId = signal<number | null>(null);

  courseForm: FormGroup = this.fb.group({
    courseName: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', Validators.required],
    duration: ['', [Validators.required, Validators.min(1)]],
    courseFee: ['', [Validators.required, Validators.min(0)]],
    centerId: ['', Validators.required]
  });

  ngOnInit(): void {
    this.loadCourses();
    this.loadCenters();
  }

  loadCourses(): void {
    this.isLoading.set(true);
    this.courseService.getCourses().subscribe({
      next: (data) => { this.courses.set(data); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  loadCenters(): void {
    this.centerService.getCenters().subscribe({
      next: (data) => this.centers.set(data),
      error: () => {}
    });
  }

  onSubmit(): void {
    if (this.courseForm.invalid) return;
    this.isLoading.set(true);
    const formData: CreateCourseDto = this.courseForm.value;

    if (this.isEditing() && this.editingId() !== null) {
      this.courseService.updateCourse(this.editingId()!, formData as UpdateCourseDto).subscribe({
        next: () => { this.resetForm(); this.loadCourses(); },
        error: () => this.isLoading.set(false)
      });
    } else {
      this.courseService.createCourse(formData).subscribe({
        next: () => { this.resetForm(); this.loadCourses(); },
        error: () => this.isLoading.set(false)
      });
    }
  }

  editCourse(course: Course): void {
    this.isEditing.set(true);
    this.editingId.set(course.courseId);
    this.courseForm.patchValue({
      courseName: course.courseName,
      description: course.description,
      duration: course.duration,
      courseFee: course.courseFee,
      centerId: course.centerId
    });
  }

  deleteCourse(id: number): void {
    if (confirm('Are you sure you want to delete this course?')) {
      this.isLoading.set(true);
      this.courseService.deleteCourse(id).subscribe({
        next: () => this.loadCourses(),
        error: () => this.isLoading.set(false)
      });
    }
  }

  resetForm(): void {
    this.courseForm.reset();
    this.isEditing.set(false);
    this.editingId.set(null);
    this.isLoading.set(false);
  }

  cancelEdit(): void {
    this.resetForm();
  }
}

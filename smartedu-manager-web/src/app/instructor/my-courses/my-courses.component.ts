import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { CourseInstructorService } from '../../core/services/course-instructor.service';
import { CourseService } from '../../core/services/course.service';
import { Course } from '../../core/models';

@Component({
  selector: 'app-my-courses',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="courses-container mt-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="mb-1"><i class="fas fa-book me-2"></i>My Courses</h2>
          <p class="text-muted mb-0">View courses assigned to you</p>
        </div>
      </div>

      <div class="row" *ngIf="!isLoading(); else loading">
        <div class="col-md-6 col-lg-4 mb-4" *ngFor="let course of myCourses()">
          <div class="card h-100">
            <div class="card-header bg-success text-white">
              <h5 class="mb-0"><i class="fas fa-book me-2"></i>{{ course.courseName }}</h5>
            </div>
            <div class="card-body">
              <p class="card-text">{{ course.description }}</p>
              <div class="course-info">
                <div class="mb-2">
                  <i class="fas fa-building me-2"></i><strong>Center:</strong> {{ course.centerName }}
                </div>
                <div class="mb-2">
                  <i class="fas fa-clock me-2"></i><strong>Duration:</strong> {{ course.duration }} months
                </div>
                <div class="mb-2">
                  <i class="fas fa-dollar-sign me-2"></i><strong>Fee:</strong> {{ course.courseFee | currency }}
                </div>
              </div>
            </div>
            <div class="card-footer bg-transparent">
              <a [routerLink]="['/instructor/my-batches']" [queryParams]="{courseId: course.courseId}" class="btn btn-success">
                <i class="fas fa-users me-1"></i> View Batches
              </a>
            </div>
          </div>
        </div>

        <div class="col-12" *ngIf="myCourses().length === 0">
          <div class="text-center py-5">
            <i class="fas fa-book-open fa-4x text-muted mb-3"></i>
            <p class="text-muted">No courses assigned to you yet.</p>
          </div>
        </div>
      </div>

      <ng-template #loading>
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .course-info div { color: #666; }
    .card { transition: transform 0.2s; }
    .card:hover { transform: translateY(-4px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
  `]
})
export class MyCoursesComponent implements OnInit {
  private courseInstructorService = inject(CourseInstructorService);
  private courseService = inject(CourseService);

  myCourses = signal<Course[]>([]);
  isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.loadMyCourses();
  }

  loadMyCourses(): void {
    this.courseInstructorService.getCourseInstructors().subscribe({
      next: (data) => {
        const courseIds = [...new Set(data.map(ci => ci.courseId))];
        this.loadCoursesDetails(courseIds);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  loadCoursesDetails(courseIds: number[]): void {
    this.courseService.getCourses().subscribe({
      next: (allCourses) => {
        this.myCourses.set(allCourses.filter(c => courseIds.includes(c.courseId)));
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }
}

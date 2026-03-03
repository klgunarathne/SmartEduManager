import { Routes } from '@angular/router';
import { instructorGuard } from '../core/guards/role.guard';

export const INSTRUCTOR_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'my-courses',
    pathMatch: 'full'
  },
  {
    path: 'my-courses',
    loadComponent: () => import('./my-courses/my-courses.component').then(m => m.MyCoursesComponent),
    canActivate: [instructorGuard]
  },
  {
    path: 'my-batches',
    loadComponent: () => import('./my-batches/my-batches.component').then(m => m.MyBatchesComponent),
    canActivate: [instructorGuard]
  },
  {
    path: 'my-students',
    loadComponent: () => import('./my-students/my-students.component').then(m => m.MyStudentsComponent),
    canActivate: [instructorGuard]
  },
  {
    path: 'assignments',
    loadComponent: () => import('./assignments/assignments.component').then(m => m.AssignmentsComponent),
    canActivate: [instructorGuard]
  },
  {
    path: 'continuous-assessments',
    loadComponent: () => import('./continuous-assessments/continuous-assessments.component').then(m => m.ContinuousAssessmentsComponent),
    canActivate: [instructorGuard]
  }
];

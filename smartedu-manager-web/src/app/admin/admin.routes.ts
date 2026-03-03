import { Routes } from '@angular/router';
import { adminGuard } from '../core/guards/role.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'centers',
    pathMatch: 'full'
  },
  {
    path: 'centers',
    loadComponent: () => import('./centers/centers.component').then(m => m.CentersComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'courses',
    loadComponent: () => import('./courses/courses.component').then(m => m.CoursesComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'instructors',
    loadComponent: () => import('./instructors/instructors.component').then(m => m.InstructorsComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'batches',
    loadComponent: () => import('./batches/batches.component').then(m => m.BatchesComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'students',
    loadComponent: () => import('./students/students.component').then(m => m.StudentsComponent),
    canActivate: [adminGuard]
  }
];

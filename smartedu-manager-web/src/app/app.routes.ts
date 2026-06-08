import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { InstructorDashboardComponent } from './components/instructor-dashboard/instructor-dashboard.component';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';

const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.checkAuthStatus()) {
    return true;
  }
  router.navigate(['/login']);
  return false;
};

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: AdminDashboardComponent
      },
      {
        path: 'students',
        loadComponent: () => import('./components/students/students').then(m => m.StudentsComponent)
      },
      {
        path: 'instructors',
        loadComponent: () => import('./components/instructors/instructors').then(m => m.InstructorsComponent)
      },
      {
        path: 'courses',
        loadComponent: () => import('./components/courses/courses').then(m => m.CoursesComponent)
      },
      {
        path: 'batches',
        loadComponent: () => import('./components/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'centers',
        loadComponent: () => import('./components/centers/centers').then(m => m.CentersComponent)
      },
      {
        path: 'assignments',
        loadComponent: () => import('./components/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./components/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./components/user-manager/user-manager').then(m => m.UserManagerComponent)
      },
      {
        path: 'attendance',
        loadComponent: () => import('./components/attendance/attendance').then(m => m.AttendanceComponent)
      }
    ]
  },
  {
    path: 'instructor',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: InstructorDashboardComponent
      },
      {
        path: 'batches',
        loadComponent: () => import('./components/instructor-batches/instructor-batches.component').then(m => m.InstructorBatchesComponent)
      },
      {
        path: 'students',
        loadComponent: () => import('./components/instructor-students/instructor-students.component').then(m => m.InstructorStudentsComponent)
      },
      {
        path: 'assignments',
        loadComponent: () => import('./components/instructor-assignments/instructor-assignments.component').then(m => m.InstructorAssignmentsComponent)
      },
      {
        path: 'continuous-assessments',
        loadComponent: () => import('./components/instructor-continuous-assessments/instructor-continuous-assessments.component').then(m => m.InstructorContinuousAssessmentsComponent)
      },
      {
        path: 'ncs',
        loadComponent: () => import('./components/instructors/instructors').then(m => m.InstructorsComponent)
      },
      {
        path: 'modules',
        loadComponent: () => import('./components/instructors/instructors').then(m => m.InstructorsComponent)
      },
      {
        path: 'attendance',
        loadComponent: () => import('./components/attendance/attendance').then(m => m.AttendanceComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];

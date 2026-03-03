import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AdminComponent } from './admin/admin.component';
import { InstructorComponent } from './instructor/instructor.component';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard, instructorGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    title: 'Login - SmartEdu Manager',
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
    title: 'Dashboard - SmartEdu Manager',
  },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [authGuard, adminGuard],
    title: 'Admin - SmartEdu Manager',
    children: [
      { path: '', redirectTo: 'centers', pathMatch: 'full' },
      { 
        path: 'centers', 
        loadComponent: () => import('./admin/centers/centers.component').then(m => m.CentersComponent) 
      },
      { 
        path: 'courses', 
        loadComponent: () => import('./admin/courses/courses.component').then(m => m.CoursesComponent) 
      },
      { 
        path: 'instructors', 
        loadComponent: () => import('./admin/instructors/instructors.component').then(m => m.InstructorsComponent) 
      },
      { 
        path: 'batches', 
        loadComponent: () => import('./admin/batches/batches.component').then(m => m.BatchesComponent) 
      },
      { 
        path: 'students', 
        loadComponent: () => import('./admin/students/students.component').then(m => m.StudentsComponent) 
      },
      { path: 'user-manager', component: UserManagementComponent },
    ],
  },
  {
    path: 'instructor',
    component: InstructorComponent,
    canActivate: [authGuard, instructorGuard],
    title: 'Instructor - SmartEdu Manager',
    children: [
      { path: '', redirectTo: 'my-courses', pathMatch: 'full' },
      { 
        path: 'my-courses', 
        loadComponent: () => import('./instructor/my-courses/my-courses.component').then(m => m.MyCoursesComponent) 
      },
      { 
        path: 'my-batches', 
        loadComponent: () => import('./instructor/my-batches/my-batches.component').then(m => m.MyBatchesComponent) 
      },
      { 
        path: 'my-students', 
        loadComponent: () => import('./instructor/my-students/my-students.component').then(m => m.MyStudentsComponent) 
      },
      { 
        path: 'assignments', 
        loadComponent: () => import('./instructor/assignments/assignments.component').then(m => m.AssignmentsComponent) 
      },
      { 
        path: 'continuous-assessments', 
        loadComponent: () => import('./instructor/continuous-assessments/continuous-assessments.component').then(m => m.ContinuousAssessmentsComponent) 
      },
    ],
  },
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/dashboard',
  },
];

import { Routes } from '@angular/router';
import { StudentLoginComponent } from './components/student-login/student-login.component';
import { ExamDashboardComponent } from './components/exam-dashboard/exam-dashboard.component';
import { generateCredentialsGuard } from './guards/generate-credentials.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: StudentLoginComponent },
  { 
    path: 'exam', 
    component: ExamDashboardComponent,
    canActivate: [generateCredentialsGuard]
  }
];

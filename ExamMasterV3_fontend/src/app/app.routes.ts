import { Routes } from '@angular/router';
import { StudentLoginComponent } from './components/student-login/student-login.component';
import { ExamDashboardComponent } from './components/exam-dashboard/exam-dashboard.component';
import { ExamTakingComponent } from './components/exam-taking/exam-taking.component';
import { ExamResultsComponent } from './components/exam-results/exam-results.component';
import { generateCredentialsGuard } from './guards/generate-credentials.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: StudentLoginComponent },
  { 
    path: 'exam', 
    component: ExamDashboardComponent,
    canActivate: [generateCredentialsGuard]
  },
  {
    path: 'exam/:id',
    component: ExamTakingComponent,
    canActivate: [generateCredentialsGuard]
  },
  {
    path: 'exam/:examId/result/:resultId',
    component: ExamResultsComponent,
    canActivate: [generateCredentialsGuard]
  }
];

import { Routes } from '@angular/router';
import { StudentLoginComponent } from './components/student-login/student-login.component';
import { ExamDashboardComponent } from './components/exam-dashboard/exam-dashboard.component';
import { ExamInstructionsComponent } from './components/exam-instructions/exam-instructions.component';
import { ExamTakingComponent } from './components/exam-taking/exam-taking.component';
import { ExamReviewComponent } from './components/exam-review/exam-review.component';
import { ExamResultsComponent } from './components/exam-results/exam-results.component';
import { ExamHistoryComponent } from './components/exam-history/exam-history.component';
import { authGuard, loginGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: StudentLoginComponent, canActivate: [loginGuard] },
  { path: 'exam', component: ExamDashboardComponent, canActivate: [authGuard] },
  { path: 'exam/:id/instructions', component: ExamInstructionsComponent, canActivate: [authGuard] },
  { path: 'exam/:id', component: ExamTakingComponent, canActivate: [authGuard] },
  { path: 'exam/:examId/review', component: ExamReviewComponent, canActivate: [authGuard] },
  { path: 'exam/:examId/result/:resultId', component: ExamResultsComponent, canActivate: [authGuard] },
  { path: 'exam/history', component: ExamHistoryComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '/login' }
];

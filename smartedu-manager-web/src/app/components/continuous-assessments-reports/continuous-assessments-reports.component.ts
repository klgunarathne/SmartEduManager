import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-continuous-assessments-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './continuous-assessments-reports.component.html',
  styleUrl: './continuous-assessments-reports.component.scss'
})
export class ContinuousAssessmentsReportsComponent implements OnInit {
  private readonly API_URL = environment.apiUrl;
  private toast = inject(ToastService);

  batches = signal<any[]>([]);
  selectedBatchId = signal(0);
  modules = signal<any[]>([]);
  selectedModuleId = signal<number | null>(null);
  reportData = signal<any | null>(null);
  isLoading = signal(false);

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<any[]>((`${this.API_URL}/batches`)).subscribe({
      next: (data) => {
        this.batches.set(data);
        if (data.length > 0) {
          const today = this.getTodayDate();
          const current = data.find((b: any) => b.startDate && b.endDate && b.startDate <= today && b.endDate >= today);
          this.selectedBatchId.set(current ? current.batchId : data[0].batchId);
        }
      }
    });

    this.http.get<any[]>((`${this.API_URL}/modules`)).subscribe({
      next: (data) => this.modules.set(data)
    });
  }

  generateReport(): void {
    const batchId = this.selectedBatchId();
    const moduleId = this.selectedModuleId();

    if (!moduleId) {
      this.toast.error('Please select a module');
      return;
    }

    this.isLoading.set(true);

    forkJoin([
      this.http.get<any[]>((`${this.API_URL}/modules`)),
      this.http.get<any[]>((`${this.API_URL}/moduletasks`)),
      this.http.get<any[]>((`${this.API_URL}/continuousassessments/batch/${batchId}`)),
      this.http.get<any[]>((`${this.API_URL}/students/batch/${batchId}`))
    ]).subscribe({
      next: ([allModules, allTasks, assessments, students]) => {
        this.modules.set(allModules);

        const moduleMap = new Map<number, any>();
        allModules.forEach((m: any) => moduleMap.set(m.id, m));

        const moduleTasks = allTasks
          .filter((t: any) => {
            const mid = t.moduleId !== undefined ? t.moduleId : t.module_id;
            return Number(mid) === moduleId;
          })
          .map((t: any) => {
            const mid = t.moduleId !== undefined ? t.moduleId : t.module_id;
            const mod = moduleMap.get(Number(mid));
            return {
              id: t.id,
              taskNo: t.taskNo !== undefined ? t.taskNo : t.task_no,
              taskName: t.taskName !== undefined ? t.taskName : t.task_name,
              moduleId: Number(mid),
              moduleName: mod?.moduleName || 'Unknown',
              moduleNo: mod?.moduleNo || ''
            };
          });

        const moduleInfo = allModules.find((m: any) => m.id === moduleId);

        const results = assessments.map((a: any) => ({
          id: a.id,
          studentId: a.studentId !== undefined ? a.studentId : a.student_id,
          moduleTaskId: a.moduleTaskId !== undefined ? a.moduleTaskId : a.module_task_id,
          assessmentMark: a.assessmentMark !== undefined ? a.assessmentMark : a.assessment_mark,
          assessmentDate: a.assessmentDate !== undefined ? a.assessmentDate : a.assessment_date,
          competencyDate: a.competencyDate !== undefined ? a.competencyDate : a.competency_date,
          assessorNotes: a.assessorNotes !== undefined ? a.assessorNotes : a.assessor_notes
        }));

        this.reportData.set({
          moduleId: moduleId ?? 0,
          moduleNo: moduleInfo?.moduleNo || '',
          moduleName: moduleInfo?.moduleName || '',
          tasks: moduleTasks,
          students: students.map((s: any) => ({
            id: s.studentId !== undefined ? s.studentId : (s.id !== undefined ? s.id : s.student_id),
            misNo: s.misNo !== undefined ? s.misNo : s.mis_no,
            nameWithInitials: s.nameWithInitials !== undefined ? s.nameWithInitials : s.name
          })),
          results
        });
        this.isLoading.set(false);
      },
      error: () => { this.isLoading.set(false); }
    });
  }

  onBatchChange(): void {
    this.reportData.set(null);
  }

  onModuleChange(): void {
    this.reportData.set(null);
  }

  printReport(): void {
    window.print();
  }

  getMarkColor(mark: string | null | undefined): string {
    if (mark === 'C') return '#16a34a';
    if (mark === 'NYC') return '#dc2626';
    return '#64748b';
  }

  hasAssessment(studentId: number, taskId: number): boolean {
    const data = this.reportData();
    return data ? data.results.some((r: any) => r.studentId === studentId && r.moduleTaskId === taskId) : false;
  }

  getAssessmentMark(studentId: number, taskId: number): string {
    const data = this.reportData();
    if (!data) return '';
    const result = data.results.find((r: any) => r.studentId === studentId && r.moduleTaskId === taskId);
    return result?.assessmentMark || '';
  }

  getAssessmentDate(studentId: number, taskId: number): string | null {
    const data = this.reportData();
    if (!data) return null;
    const result = data.results.find((r: any) => r.studentId === studentId && r.moduleTaskId === taskId);
    return result?.assessmentDate || null;
  }

  getFormattedDate(date: string | null | undefined): string {
    if (!date) return '-';
    const parts = date.split('T');
    return parts[0] || date;
  }

  private getTodayDate(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
}
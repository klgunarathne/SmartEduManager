import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../services/toast.service';

interface Module {
  id: number;
  moduleNo: string;
  moduleName: string;
}

interface Task {
  id: number;
  taskNo: string;
  taskName: string;
  moduleId: number;
}

interface AssessmentResult {
  taskId: number;
  studentId: number;
  assessmentMark: string | null;
  competencyDate: string | null;
}

interface ModuleReport {
  moduleId: number;
  moduleNo: string;
  moduleName: string;
  tasks: Task[];
  students: { studentId: number; studentName: string; misNo: string }[];
  results: AssessmentResult[];
}

interface Batch {
  batchId: number;
  batchCode: string;
  courseId: number;
  courseName: string;
  startDate?: string;
  endDate?: string;
}

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

  batches = signal<Batch[]>([]);
  selectedBatchId = signal(0);
  modules = signal<Module[]>([]);
  selectedModuleId = signal<number | null>(null);
  reportData = signal<ModuleReport | null>(null);
  isLoading = signal(false);

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadBatches();
  }

  loadBatches(): void {
    this.http.get<Batch[]>(`${this.API_URL}/batches`).subscribe({
      next: (data) => {
        this.batches.set(data);
        if (data.length > 0) {
          const today = this.getTodayDate();
          const current = data.find(b => b.startDate && b.endDate && b.startDate <= today && b.endDate >= today);
          this.selectedBatchId.set(current ? current.batchId : data[0].batchId);
          this.loadModules();
        }
      }
    });
  }

  loadModules(): void {
    this.http.get<any[]>(`${this.API_URL}/modules`).subscribe({
      next: (data) => {
        const batchId = this.selectedBatchId();
        const batch = this.batches().find(b => b.batchId === batchId);
        const courseId = batch?.courseId;
        
        if (courseId) {
          this.http.get<any[]>(`${this.API_URL}/ncs/course/${courseId}`).subscribe({
            next: (ncsData) => {
              const allModules: Module[] = [];
              ncsData.forEach(ncs => {
                ncs.modules?.forEach((m: any) => {
                  allModules.push({
                    id: m.id,
                    moduleNo: m.moduleNo,
                    moduleName: m.moduleName
                  });
                });
              });
              this.modules.set(allModules);
            }
          });
        }
      }
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

    this.http.get<any[]>(`${this.API_URL}/moduletasks`).subscribe({
      next: (tasks) => {
        const moduleTasks = tasks.filter(t => t.moduleId === moduleId);
        
        this.http.get<any[]>(`${this.API_URL}/continuousassessments/batch/${batchId}`).subscribe({
          next: (assessments) => {
            this.http.get<any[]>(`${this.API_URL}/students/batch/${batchId}`).subscribe({
              next: (students) => {
                const moduleInfo = this.modules().find(m => m.id === moduleId);
                const results: AssessmentResult[] = assessments
                  .filter((a: any) => moduleTasks.some((t: any) => t.id === a.moduleTaskId))
                  .map((a: any) => ({
                    taskId: a.moduleTaskId,
                    studentId: a.studentId,
                    assessmentMark: a.assessmentMark,
                    competencyDate: a.competencyDate
                  }));

                this.reportData.set({
                  moduleId: moduleId ?? 0,
                  moduleNo: moduleInfo?.moduleNo ?? '',
                  moduleName: moduleInfo?.moduleName ?? '',
                  tasks: moduleTasks.map((t: any) => ({ id: t.id, taskNo: t.taskNo, taskName: t.taskName, moduleId: t.moduleId })),
                  students: students.map((s: any) => ({
                    studentId: s.studentId,
                    studentName: s.nameWithInitials,
                    misNo: s.misNo
                  })),
                  results
                });
                this.isLoading.set(false);
              },
              error: () => { this.isLoading.set(false); }
            });
          },
          error: () => { this.isLoading.set(false); }
        });
      },
      error: () => { this.isLoading.set(false); }
    });
  }

  onBatchChange(): void {
    this.loadModules();
    this.reportData.set(null);
  }

  onModuleChange(): void {
    this.reportData.set(null);
  }

  printReport(): void {
    window.print();
  }

  getMarkColor(mark: string | null): string {
    if (mark === 'C') return '#16a34a';
    if (mark === 'NYC') return '#dc2626';
    return '#64748b';
  }

  hasAssessment(studentId: number, taskId: number): boolean {
    return this.reportData()?.results.some(r => r.studentId === studentId && r.taskId === taskId) ?? false;
  }

  getAssessmentMark(studentId: number, taskId: number): string {
    return this.reportData()?.results.find(r => r.studentId === studentId && r.taskId === taskId)?.assessmentMark ?? '';
  }

  getCompetencyDate(studentId: number, taskId: number): string | null {
    return this.reportData()?.results.find(r => r.studentId === studentId && r.taskId === taskId)?.competencyDate ?? null;
  }

  getCCount(studentId: number): number {
    return this.reportData()?.results.filter(r => r.studentId === studentId && r.assessmentMark === 'C').length ?? 0;
  }

  getNYCCount(studentId: number): number {
    return this.reportData()?.results.filter(r => r.studentId === studentId && r.assessmentMark === 'NYC').length ?? 0;
  }

  private getTodayDate(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
}
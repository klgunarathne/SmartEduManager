import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../services/toast.service';
import { ExportService } from '../../services/export.service';
import { forkJoin } from 'rxjs';

interface ModuleTask {
  id: number;
  taskNo: string;
  taskName: string;
  moduleId: number;
  moduleName?: string;
  moduleNo?: string;
}

interface AssessmentRecord {
  id: number;
  studentId: number;
  moduleTaskId: number;
  assessmentMark: string;
  assessmentDate: string;
  competencyDate: string | null;
  assessorNotes: string;
}

interface Student {
  id: number;
  misNo: string;
  nameWithInitials: string;
}

interface Batch {
  batchId: number;
  batchCode: string;
  courseId: number;
  courseName: string;
  startDate: string;
  endDate: string;
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
  private exportService = inject(ExportService);

  batches = signal<Batch[]>([]);
  selectedBatchId = signal(0);
  modules = signal<any[]>([]);
  selectedModuleId = signal<number | null>(null);
  reportData = signal<{
    moduleId: number;
    moduleNo: string;
    moduleName: string;
    tasks: ModuleTask[];
    students: Student[];
    results: AssessmentRecord[];
  } | null>(null);
  isLoading = signal(false);

  private allModules: any[] = [];
  private allTasks: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadBatches();
  }

  loadBatches(): void {
    this.http.get<any[]>(`${this.API_URL}/batches`).subscribe({
      next: (data) => {
        this.batches.set(data);
        if (data.length > 0) {
          const today = this.getTodayDate();
          const current = data.find(b => b.startDate && b.endDate && b.startDate <= today && b.endDate >= today);
          this.selectedBatchId.set(current ? current.batchId : data[0].batchId);
          this.loadData();
        }
      }
    });
  }

  onBatchChange(): void {
    this.reportData.set(null);
    this.selectedModuleId.set(null);
    if (this.selectedBatchId() > 0) {
      this.loadData();
    }
  }

  onModuleChange(): void {
    this.reportData.set(null);
    if (this.selectedBatchId() > 0 && this.selectedModuleId() !== null) {
      this.generateReport();
    }
  }

  private loadData(): void {
    this.isLoading.set(true);

    forkJoin([
      this.http.get<any[]>(`${this.API_URL}/modules`),
      this.http.get<any[]>(`${this.API_URL}/moduletasks`),
      this.http.get<any[]>(`${this.API_URL}/continuousassessments/batch/${this.selectedBatchId()}`),
      this.http.get<any[]>(`${this.API_URL}/students/batch/${this.selectedBatchId()}`)
    ]).subscribe({
      next: ([modulesData, tasksData, assessmentsData, studentsData]) => {
        this.allModules = modulesData;
        this.allTasks = tasksData;
        this.modules.set(modulesData);

        const moduleMap = new Map<number, any>();
        modulesData.forEach((m: any) => moduleMap.set(m.id, m));

        const enrichedTasks = tasksData.map((t: any) => {
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

        const moduleInfo = moduleMap.get(Number(this.selectedModuleId()));

        const normalizedAssessments = assessmentsData.map((a: any) => ({
          id: a.id,
          studentId: a.studentId !== undefined ? a.studentId : a.student_id,
          moduleTaskId: a.moduleTaskId !== undefined ? a.moduleTaskId : a.module_task_id,
          assessmentMark: a.assessmentMark !== undefined ? a.assessmentMark : a.assessment_mark,
          assessmentDate: a.assessmentDate !== undefined ? a.assessmentDate : a.assessment_date,
          competencyDate: a.competencyDate !== undefined ? a.competencyDate : a.competency_date,
          assessorNotes: a.assessorNotes !== undefined ? a.assessorNotes : a.assessor_notes
        }));

        const normalizedStudents = studentsData.map((s: any) => ({
          id: s.studentId !== undefined ? s.studentId : (s.id !== undefined ? s.id : s.student_id),
          misNo: s.misNo !== undefined ? s.misNo : s.mis_no,
          nameWithInitials: s.nameWithInitials !== undefined ? s.nameWithInitials : s.name
        }));

        this.reportData.set({
          moduleId: moduleInfo?.id || 0,
          moduleNo: moduleInfo?.moduleNo || '',
          moduleName: moduleInfo?.moduleName || '',
          tasks: moduleInfo ? enrichedTasks.filter(t => t.moduleId === moduleInfo.id) : enrichedTasks,
          students: normalizedStudents,
          results: normalizedAssessments
        });
        this.isLoading.set(false);
      },
      error: () => { this.isLoading.set(false); }
    });
  }

  generateReport(): void {
    if (this.selectedBatchId() === 0) return;
    this.loadData();
  }

  printReport(): void {
    window.print();
  }

  hasAssessment(studentId: number, taskId: number): boolean {
    const data = this.reportData();
    return data ? data.results.some((r: AssessmentRecord) => r.studentId === studentId && r.moduleTaskId === taskId) : false;
  }

  getAssessment(studentId: number, taskId: number): AssessmentRecord | undefined {
    const data = this.reportData();
    if (!data) return undefined;
    return data.results.find((r: AssessmentRecord) => r.studentId === studentId && r.moduleTaskId === taskId);
  }

  getAssessmentMark(studentId: number, taskId: number): string {
    return this.getAssessment(studentId, taskId)?.assessmentMark || '';
  }

  getAssessmentDate(studentId: number, taskId: number): string | null {
    return this.getAssessment(studentId, taskId)?.assessmentDate || null;
  }

  getSelectedBatchCode(): string {
    const batch = this.batches().find(b => b.batchId === this.selectedBatchId());
    return batch?.batchCode || '';
  }

  getFormattedDate(date: string | null | undefined): string {
    if (!date) return '-';
    const parts = date.split('T')[0].split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      const y = parts[0].slice(-2);
      const m = String(Number(parts[1])).replace(/^0+/, '') || '0';
      const d = String(Number(parts[2])).replace(/^0+/, '') || '0';
      return `${y}/${m}/${d}`;
    }
    return date;
  }

  getMarkColor(mark: string | null | undefined): string {
    if (mark === 'C') return '#16a34a';
    if (mark === 'NYC') return '#dc2626';
    return '#64748b';
  }

  exportToPdf(): void {
    const data = this.reportData();
    if (!data) return;

    const rows = data.students.map((student, index) => {
      const row: Record<string, string | number | null | undefined> = { SN: index + 1, Student: student.nameWithInitials };
      data.tasks.forEach((task) => {
        const assessment = data.results.find(
          (r) => r.studentId === student.id && r.moduleTaskId === task.id
        );
        const mark = assessment?.assessmentMark || '';
        const date = assessment ? this.getFormattedDate(assessment.assessmentDate) : '-';
        row[`Task ${task.taskNo}`] = `${mark} ${date}`;
      });
      return row;
    });

    this.exportService.exportPdf({
      title: `${data.moduleNo} - ${data.moduleName} - ${this.getSelectedBatchCode()}`,
      headers: ['SN', 'Student', ...data.tasks.map((task) => `Task ${task.taskNo}`)],
      rows
    });
  }

  exportToExcel(): void {
    const data = this.reportData();
    if (!data) return;

    const rows = data.students.map((student, index) => {
      const row: Record<string, string | number | null | undefined> = { SN: index + 1, Student: student.nameWithInitials };
      data.tasks.forEach((task) => {
        const assessment = data.results.find(
          (r) => r.studentId === student.id && r.moduleTaskId === task.id
        );
        const mark = assessment?.assessmentMark || '';
        const date = assessment ? this.getFormattedDate(assessment.assessmentDate) : '-';
        row[`Task ${task.taskNo}`] = `${mark} ${date}`;
      });
      return row;
    });

    this.exportService.exportExcel({
      title: `${data.moduleNo} - ${data.moduleName} - ${this.getSelectedBatchCode()}`,
      headers: ['SN', 'Student', ...data.tasks.map((task) => `Task ${task.taskNo}`)],
      rows
    });
  }

  private getTodayDate(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
}

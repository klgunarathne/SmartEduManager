import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

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
  selector: 'app-instructor-continuous-assessments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './instructor-continuous-assessments.component.html',
  styleUrl: './instructor-continuous-assessments.component.scss'
})
export class InstructorContinuousAssessmentsComponent implements OnInit {
  private readonly API_URL = environment.apiUrl;

  batches = signal<Batch[]>([]);
  selectedBatchId = signal(0);
  students = signal<Student[]>([]);
  tasks = signal<ModuleTask[]>([]);
  assessments = signal<AssessmentRecord[]>([]);
  selectedModuleId = signal(0);

  isLoading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

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
          this.loadStudents();
          this.loadTasks();
          this.loadAssessments();
        }
      }
    });
  }

  onBatchChange(): void {
    this.loadStudents();
    this.loadTasks();
    this.loadAssessments();
  }

  loadStudents(): void {
    const batchId = this.selectedBatchId();
    if (!batchId) { this.students.set([]); return; }
    this.http.get<any[]>(`${this.API_URL}/students/batch/${batchId}`).subscribe({
      next: (data) => {
        this.students.set(data.map(s => ({ id: s.studentId, misNo: s.misNo, nameWithInitials: s.nameWithInitials })));
      }
    });
  }

  loadTasks(): void {
    const batchId = this.selectedBatchId();
    if (!batchId) { this.tasks.set([]); return; }

    this.http.get<ModuleTask[]>(`${this.API_URL}/moduletasks`).subscribe({
      next: (allTasks) => {
        this.http.get<any[]>(`${this.API_URL}/modules`).subscribe({
          next: (allModules) => {
            const moduleMap = new Map<number, any>();
            allModules.forEach(m => moduleMap.set(m.id, m));

            const enriched = allTasks.map(t => {
              const mod = moduleMap.get(t.moduleId);
              return {
                ...t,
                moduleName: mod?.moduleName || 'Unknown',
                moduleNo: mod?.moduleNo || ''
              };
            });
            this.tasks.set(enriched);
          }
        });
      }
    });
  }

  loadAssessments(): void {
    const batchId = this.selectedBatchId();
    if (!batchId) { this.assessments.set([]); return; }
    this.http.get<AssessmentRecord[]>(`${this.API_URL}/continuousassessments/batch/${batchId}`).subscribe({
      next: (data) => this.assessments.set(data),
      error: (err) => console.error('Failed to load assessments:', err)
    });
  }

  getMark(studentId: number, taskId: number): AssessmentRecord | undefined {
    return this.assessments().find(a => a.studentId === studentId && a.moduleTaskId === taskId);
  }

  setMark(studentId: number, taskId: number, mark: string): void {
    this.isLoading.set(true);
    const existing = this.getMark(studentId, taskId);

    if (existing) {
      this.http.put(`${this.API_URL}/continuousassessments/${existing.id}`, {
        assessmentMark: mark,
        assessmentDate: existing.assessmentDate,
        assessorNotes: existing.assessorNotes
      }, { responseType: 'text' }).subscribe({
        next: () => {
          this.assessments.update(list => list.map(a =>
            a.id === existing.id ? { ...a, assessmentMark: mark } : a
          ));
          this.isLoading.set(false);
          this.showSuccess('Assessment updated');
        },
        error: () => { this.isLoading.set(false); this.showError('Failed to update'); }
      });
    } else {
      this.http.post<AssessmentRecord>(`${this.API_URL}/continuousassessments/student/${studentId}/task/${taskId}`, {
        assessmentMark: mark,
        assessmentDate: this.getTodayDate(),
        assessorNotes: ''
      }).subscribe({
        next: (res) => {
          this.assessments.update(list => [...list, res]);
          this.isLoading.set(false);
          this.showSuccess('Assessment saved');
        },
        error: () => { this.isLoading.set(false); this.showError('Failed to save'); }
      });
    }
  }

  getFilteredTasks(): ModuleTask[] {
    const modId = this.selectedModuleId();
    if (!modId) return this.tasks();
    return this.tasks().filter(t => t.moduleId === modId);
  }

  getGroupedTasks(): { moduleId: number; moduleName: string; moduleNo: string; tasks: ModuleTask[] }[] {
    const tasks = this.getFilteredTasks();
    const groups = new Map<number, { moduleId: number; moduleName: string; moduleNo: string; tasks: ModuleTask[] }>();
    tasks.forEach(t => {
      const key = t.moduleId;
      if (!groups.has(key)) {
        groups.set(key, { moduleId: t.moduleId, moduleName: t.moduleName || 'Unknown', moduleNo: t.moduleNo || '', tasks: [] });
      }
      groups.get(key)!.tasks.push(t);
    });
    return Array.from(groups.values());
  }

  onModuleFilterChange(value: string): void {
    this.selectedModuleId.set(Number(value));
  }

  private showSuccess(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(''), 2500);
  }

  private showError(msg: string): void {
    this.errorMessage.set(msg);
    setTimeout(() => this.errorMessage.set(''), 3000);
  }

  private getTodayDate(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
}

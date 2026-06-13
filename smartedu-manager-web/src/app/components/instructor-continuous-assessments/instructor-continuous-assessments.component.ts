import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../services/toast.service';

interface ModuleTask {
  id: number;
  taskNo: string;
  taskName: string;
  moduleId: number;
  moduleName?: string;
  moduleNo?: string;
  originalAssessmentDate?: string;
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
  selector: 'app-instructor-continuous-assessments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './instructor-continuous-assessments.component.html',
  styleUrl: './instructor-continuous-assessments.component.scss'
})
export class InstructorContinuousAssessmentsComponent implements OnInit {
  private readonly API_URL = environment.apiUrl;
  private toast = inject(ToastService);

  batches = signal<Batch[]>([]);
  selectedBatchId = signal(0);
  students = signal<Student[]>([]);
  tasks = signal<ModuleTask[]>([]);
  assessments = signal<AssessmentRecord[]>([]);
  selectedModuleId = signal(0);

  isLoading = signal(false);

  originalDateInput = signal<{ [taskId: number]: string }>({});

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
                moduleNo: mod?.moduleNo || '',
                originalAssessmentDate: t.originalAssessmentDate || undefined
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
    const task = this.tasks().find(t => t.id === taskId);

    if (existing) {
      const payload: any = {
        assessmentMark: mark,
        assessmentDate: existing.assessmentDate,
        competencyDate: existing.competencyDate,
        assessorNotes: existing.assessorNotes
      };

      if (mark === 'C' && !existing.competencyDate) {
        payload.competencyDate = existing.assessmentDate;
      } else if (mark === 'NYC') {
        payload.competencyDate = null;
      }

      this.http.put(`${this.API_URL}/continuousassessments/${existing.id}`, payload, { responseType: 'text' }).subscribe({
        next: () => {
          this.assessments.update(list => list.map(a =>
            a.id === existing.id ? { ...a, assessmentMark: mark, competencyDate: payload.competencyDate } : a
          ));
          this.isLoading.set(false);
          this.toast.success('Assessment updated');
        },
        error: () => { this.isLoading.set(false); this.toast.error('Failed to update assessment'); }
      });
    } else {
      const assessmentDate = task?.originalAssessmentDate || this.getTodayDate();
      const competencyDate = mark === 'C' ? assessmentDate : null;

      this.http.post<AssessmentRecord>(`${this.API_URL}/continuousassessments`, {
        studentId,
        moduleTaskId: taskId,
        assessmentMark: mark,
        assessmentDate,
        competencyDate,
        assessorNotes: ''
      }).subscribe({
        next: (res: AssessmentRecord) => {
          this.assessments.update(list => [...list, res]);
          this.isLoading.set(false);
          this.toast.success('Assessment saved');
        },
        error: () => { this.isLoading.set(false); this.toast.error('Failed to save assessment'); }
      });
    }
  }

  setCompetencyDate(studentId: number, taskId: number, competencyDate: string): void {
    this.isLoading.set(true);
    const existing = this.getMark(studentId, taskId);
    if (!existing) {
      this.isLoading.set(false);
      this.toast.error('No assessment record found');
      return;
    }

    this.http.put(`${this.API_URL}/continuousassessments/${existing.id}`, {
      assessmentMark: existing.assessmentMark,
      assessmentDate: existing.assessmentDate,
      competencyDate: competencyDate ? new Date(competencyDate).toISOString() : null,
      assessorNotes: existing.assessorNotes
    }, { responseType: 'text' }).subscribe({
      next: () => {
        this.assessments.update(list => list.map(a =>
          a.id === existing.id ? { ...a, competencyDate: competencyDate ? new Date(competencyDate).toISOString() : null } : a
        ));
        this.isLoading.set(false);
        this.toast.success('Competency date updated');
      },
      error: () => {
        this.isLoading.set(false);
        this.toast.error('Failed to update competency date');
      }
    });
  }

  setAssessmentDate(studentId: number, taskId: number, assessmentDate: string): void {
    this.isLoading.set(true);
    const existing = this.getMark(studentId, taskId);
    if (!existing) {
      this.isLoading.set(false);
      this.toast.error('No assessment record found');
      return;
    }

    this.http.put(`${this.API_URL}/continuousassessments/${existing.id}`, {
      assessmentMark: existing.assessmentMark,
      assessmentDate: new Date(assessmentDate).toISOString(),
      competencyDate: existing.competencyDate,
      assessorNotes: existing.assessorNotes
    }, { responseType: 'text' }).subscribe({
      next: () => {
        this.assessments.update(list => list.map(a =>
          a.id === existing.id ? { ...a, assessmentDate: new Date(assessmentDate).toISOString() } : a
        ));
        this.isLoading.set(false);
        this.toast.success('Assessment date updated');
      },
      error: () => {
        this.isLoading.set(false);
        this.toast.error('Failed to update assessment date');
      }
    });
  }

  setOriginalDate(taskId: number): void {
    const dateStr = this.originalDateInput()[taskId];
    if (!dateStr) { this.toast.error('Please select a date'); return; }

    this.isLoading.set(true);
    this.http.put(`${this.API_URL}/moduletasks/${taskId}/original-date`, {
      originalAssessmentDate: dateStr
    }, { responseType: 'text' }).subscribe({
      next: () => {
        this.tasks.update(list => list.map(t =>
          t.id === taskId ? { ...t, originalAssessmentDate: dateStr } : t
        ));

        this.assessments.update(list => list.map(a => {
          if (a.moduleTaskId === taskId) {
            return { ...a, competencyDate: dateStr };
          }
          return a;
        }));

        this.isLoading.set(false);
        this.toast.success('Original date set for all students');
      },
      error: () => { 
        this.isLoading.set(false); 
        this.toast.error('Failed to set original date'); 
      }
    });
  }

  clearOriginalDate(taskId: number): void {
    this.isLoading.set(true);
    this.http.put(`${this.API_URL}/moduletasks/${taskId}/original-date`, {
      originalAssessmentDate: null
    }, { responseType: 'text' }).subscribe({
      next: () => {
        this.tasks.update(list => list.map(t =>
          t.id === taskId ? { ...t, originalAssessmentDate: undefined } : t
        ));

        this.assessments.update(list => list.map(a => {
          if (a.moduleTaskId === taskId) {
            return { ...a, competencyDate: null };
          }
          return a;
        }));

        this.isLoading.set(false);
        this.toast.success('Original date cleared');
      },
      error: () => { 
        this.isLoading.set(false); 
        this.toast.error('Failed to clear original date'); 
      }
    });
  }

  getFilteredTasks(): ModuleTask[] {
    const modId = this.selectedModuleId();
    if (!modId) return this.tasks();
    return this.tasks().filter(t => t.moduleId === modId);
  }

  getAllGroupedTasks(): { moduleId: number; moduleName: string; moduleNo: string; tasks: ModuleTask[] }[] {
    const groups = new Map<number, { moduleId: number; moduleName: string; moduleNo: string; tasks: ModuleTask[] }>();
    this.tasks().forEach(t => {
      const key = t.moduleId;
      if (!groups.has(key)) {
        groups.set(key, { moduleId: t.moduleId, moduleName: t.moduleName || 'Unknown', moduleNo: t.moduleNo || '', tasks: [] });
      }
      groups.get(key)!.tasks.push(t);
    });
    return Array.from(groups.values());
  }

  getGroupedTasksForFilter(): { moduleId: number; moduleName: string; moduleNo: string }[] {
    return this.getAllGroupedTasks().map(g => ({ moduleId: g.moduleId, moduleName: g.moduleName, moduleNo: g.moduleNo }));
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

  onOriginalDateInput(taskId: number, value: string): void {
    this.originalDateInput.update(current => ({ ...current, [taskId]: value }));
  }

  private getTodayDate(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  getAssessmentDateValue(assessmentDate: string | undefined): string {
    if (!assessmentDate) return '';
    const parts = assessmentDate.split('T');
    return parts[0] ?? assessmentDate;
  }
}

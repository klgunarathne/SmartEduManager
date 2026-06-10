import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Assignment {
  id: number;
  assignmentName: string;
  coveringModule: string;
}

interface AssignmentMark {
  id: number;
  marks: number;
  assignmentDate: string;
  assignmentId: number;
  studentId: number;
  studentName: string;
  assignmentName: string;
  coveringModule: string;
}

interface Student {
  id: number;
  misNo: string;
  nameWithInitials: string;
}

type ActiveTab = 'assignments' | 'marks';

@Component({
  selector: 'app-instructor-assignments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './instructor-assignments.component.html',
  styleUrl: './instructor-assignments.component.scss'
})
export class InstructorAssignmentsComponent implements OnInit {
  private readonly API_URL = environment.apiUrl;

  activeTab = signal<ActiveTab>('assignments');

  assignments = signal<Assignment[]>([]);
  selectedAssignmentId = signal(0);
  assignmentMarks = signal<AssignmentMark[]>([]);
  students = signal<Student[]>([]);
  batches = signal<{ batchId: number; batchCode: string }[]>([]);
  selectedBatchId = signal(0);

  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  newAssignmentName = '';
  newCoveringModule = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadBatches();
  }

  loadBatches(): void {
    this.http.get<any[]>(`${this.API_URL}/batches`).subscribe({
      next: (data) => {
        this.batches.set(data.map(b => ({ batchId: b.batchId, batchCode: b.batchCode })));
        if (data.length > 0) {
          const today = this.getTodayDate();
          const current = data.find(b => b.startDate && b.endDate && b.startDate <= today && b.endDate >= today);
          this.selectedBatchId.set(current ? current.batchId : data[0].batchId);
          this.loadStudents();
          this.loadAssignments();
        }
      }
    });
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

  loadAssignments(): void {
    this.isLoading.set(true);
    this.http.get<Assignment[]>(`${this.API_URL}/assignments`).subscribe({
      next: (data) => { this.assignments.set(data); this.isLoading.set(false); },
      error: () => { this.errorMessage.set('Failed to load assignments'); this.isLoading.set(false); }
    });
  }

  loadAssignmentMarks(assignmentId: number): void {
    this.selectedAssignmentId.set(assignmentId);
    this.isLoading.set(true);
    this.http.get<AssignmentMark[]>(`${this.API_URL}/assignmentmarks/assignment/${assignmentId}`).subscribe({
      next: (data) => { this.assignmentMarks.set(data); this.isLoading.set(false); },
      error: () => { this.errorMessage.set('Failed to load assignment marks'); this.isLoading.set(false); }
    });
  }

  selectAssignmentAndShowMarks(assignment: Assignment): void {
    this.loadAssignmentMarks(assignment.id);
    this.activeTab.set('marks');
  }

  createAssignment(): void {
    if (!this.newAssignmentName.trim() || !this.newCoveringModule.trim()) return;
    this.isLoading.set(true);
    this.http.post<Assignment>(`${this.API_URL}/assignments`, {
      assignmentName: this.newAssignmentName.trim(),
      coveringModule: this.newCoveringModule.trim()
    }).subscribe({
      next: () => {
        this.newAssignmentName = '';
        this.newCoveringModule = '';
        this.loadAssignments();
        this.successMessage.set('Assignment created');
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: () => { this.errorMessage.set('Failed to create assignment'); this.isLoading.set(false); }
    });
  }

  deleteAssignment(id: number, name: string): void {
    if (!confirm(`Delete assignment "${name}"?`)) return;
    this.http.delete(`${this.API_URL}/assignments/${id}`, { responseType: 'text' }).subscribe({
      next: () => this.loadAssignments(),
      error: () => this.errorMessage.set('Failed to delete assignment')
    });
  }

  getMarkValue(studentId: number): number {
    const existing = this.assignmentMarks().find(m => m.studentId === studentId && m.assignmentId === this.selectedAssignmentId());
    return existing ? existing.marks : 0;
  }

  isMarkSaved(studentId: number): boolean {
    return this.assignmentMarks().some(m => m.studentId === studentId && m.assignmentId === this.selectedAssignmentId());
  }

  saveMark(studentId: number, _input: HTMLInputElement | null): void {
    const marksValue = this.getMarkValue(studentId);
    const assignmentId = this.selectedAssignmentId();
    const existing = this.assignmentMarks().find(m => m.studentId === studentId && m.assignmentId === assignmentId);

    this.isLoading.set(true);

    if (existing && existing.id !== 0) {
      this.http.put(`${this.API_URL}/assignmentmarks/${existing.id}`, {
        marks: marksValue,
        assignmentDate: existing.assignmentDate
      }, { responseType: 'text' }).subscribe({
        next: () => {
          this.assignmentMarks.update(list => list.map(m => m.id === existing.id ? { ...m, marks: marksValue } : m));
          this.isLoading.set(false);
          this.successMessage.set('Mark updated');
          setTimeout(() => this.successMessage.set(''), 2000);
        },
        error: () => { this.errorMessage.set('Failed to update mark'); this.isLoading.set(false); }
      });
    } else {
      const createDto = {
        marks: marksValue,
        assignmentDate: this.getTodayDate(),
        assignmentId,
        studentId
      };
      this.http.post<AssignmentMark>(`${this.API_URL}/assignmentmarks`, createDto).subscribe({
        next: (res) => {
          this.assignmentMarks.update(list => [...list, res]);
          this.isLoading.set(false);
          this.successMessage.set('Mark saved');
          setTimeout(() => this.successMessage.set(''), 2000);
        },
        error: () => { this.errorMessage.set('Failed to save mark'); this.isLoading.set(false); }
      });
    }
  }

  deleteMark(studentId: number): void {
    const assignmentId = this.selectedAssignmentId();
    const existing = this.assignmentMarks().find(m => m.studentId === studentId && m.assignmentId === assignmentId);
    if (!existing) return;
    if (!confirm('Delete this mark?')) return;
    this.http.delete(`${this.API_URL}/assignmentmarks/${existing.id}`, { responseType: 'text' }).subscribe({
      next: () => {
        this.assignmentMarks.update(list => list.filter(m => !(m.studentId === studentId && m.assignmentId === assignmentId)));
        this.successMessage.set('Mark deleted');
        setTimeout(() => this.successMessage.set(''), 2000);
      },
      error: () => this.errorMessage.set('Failed to delete mark')
    });
  }

  onMarkInput(studentId: number, event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value || '0', 10);
    const assignmentId = this.selectedAssignmentId();
    this.assignmentMarks.update(list => {
      const existing = list.find(m => m.studentId === studentId && m.assignmentId === assignmentId);
      if (existing) {
        return list.map(m => m.studentId === studentId && m.assignmentId === assignmentId ? { ...m, marks: value } : m);
      }
      const student = this.students().find(s => s.id === studentId);
      const assignment = this.assignments().find(a => a.id === assignmentId);
      return [...list, {
        id: 0,
        marks: value,
        assignmentDate: '',
        assignmentId,
        studentId,
        studentName: student?.nameWithInitials || '',
        assignmentName: assignment?.assignmentName || '',
        coveringModule: assignment?.coveringModule || ''
      } as AssignmentMark];
    });
  }

  private getTodayDate(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
}

import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { of, Observable } from 'rxjs';
import { AttendanceService, Attendance } from '../../services/attendance.service';
import { BatchService, Batch } from '../../services/batch.service';
import { StudentService, Student } from '../../services/student.service';
import { ToastService } from '../../services/toast.service';
import { ExportService } from '../../services/export.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-daily-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './daily-attendance.component.html',
  styleUrl: './daily-attendance.component.scss'
})
export class DailyAttendanceComponent implements OnInit {
  selectedBatchId = signal(0);
  selectedDate = signal(this.getTodayDate());
  searchQuery = signal('');
  isSaving = signal(false);
  saveProgress = signal(0);
  saveTotal = signal(0);
  
  batches = signal<Batch[]>([]);
  students = signal<Student[]>([]);
  filteredStudents = signal<Student[]>([]);
  attendanceRecords = signal<Attendance[]>([]);
  attendanceMap = signal<Map<number, 'present' | 'absent'>>(new Map());

  constructor(
    private attendanceService: AttendanceService,
    private batchService: BatchService,
    private studentService: StudentService,
    private router: Router,
    private route: ActivatedRoute,
    private exportService: ExportService
  ) {}

  private toast = inject(ToastService);

  goBack(): void {
    this.router.navigate(['/instructor/attendance']);
  }

  ngOnInit(): void {
    this.loadBatches();
  }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  loadBatches(): void {
    this.batchService.getBatches().subscribe({
      next: (data) => {
        this.batches.set(data);
        const currentBatchId = this.batchService.currentBatchId();
        if (currentBatchId > 0) {
          this.selectedBatchId.set(currentBatchId);
          this.loadStudentsForBatch();
        }
      }
    });
  }

  loadStudentsForBatch(): void {
    const batchId = this.selectedBatchId();
    if (batchId > 0) {
      this.studentService.getStudentsByBatch(batchId).subscribe({
        next: (data) => {
          this.students.set(this.sortStudentsByNumber(data));
          this.applyFilter();
          this.loadTodaysAttendance();
        }
      });
    } else {
      this.students.set([]);
      this.filteredStudents.set([]);
      this.attendanceMap.set(new Map());
    }
  }

  private sortStudentsByNumber(students: Student[]): Student[] {
    return [...students].sort((a, b) => {
      const numA = a.studentNumber ?? Number.MAX_SAFE_INTEGER;
      const numB = b.studentNumber ?? Number.MAX_SAFE_INTEGER;
      return numA - numB;
    });
  }

  loadTodaysAttendance(): void {
    const batchId = this.selectedBatchId();
    const date = this.selectedDate();
    
    if (batchId > 0) {
      this.attendanceService.getAttendanceByBatch(batchId).subscribe({
        next: (data) => {
          const normalizeDate = (dateStr: string): string => {
            const parts = dateStr.split('-');
            if (parts.length === 3) {
              const year = parts[0];
              const month = parts[1].padStart(2, '0');
              const day = parts[2].split('T')[0].padStart(2, '0');
              return `${year}-${month}-${day}`;
            }
            return dateStr;
          };
          const todaysRecords = data.filter(a => normalizeDate(a.date) === date);
          this.attendanceRecords.set(todaysRecords);
          const map = new Map<number, 'present' | 'absent'>();
          todaysRecords.forEach(a => map.set(a.studentId, a.isPresent ? 'present' : 'absent'));
          this.attendanceMap.set(map);
        }
      });
    }
  }

  applyFilter(): void {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) {
      this.filteredStudents.set(this.students());
      return;
    }
    
    this.filteredStudents.set(
      this.students().filter(s => 
        s.nameWithInitials.toLowerCase().includes(query) ||
        s.misNo.toLowerCase().includes(query) ||
        s.fullName.toLowerCase().includes(query)
      )
    );
  }

  onDateChange(): void {
    this.loadTodaysAttendance();
  }

  getAttendanceStatus(studentId: number): 'present' | 'absent' | 'none' {
    if (this.attendanceMap().has(studentId)) {
      return this.attendanceMap().get(studentId)!;
    }
    return 'none';
  }

  toggleAttendance(studentId: number): void {
    const current = this.attendanceMap().get(studentId);
    const newStatus: 'present' | 'absent' = current === 'present' ? 'absent' : 'present';
    const updated = new Map(this.attendanceMap());
    updated.set(studentId, newStatus);
    this.attendanceMap.set(updated);
  }

  markAll(isPresent: boolean): void {
    const map = new Map(this.attendanceMap());
    const status: 'present' | 'absent' = isPresent ? 'present' : 'absent';
    this.students().forEach(s => map.set(s.id, status));
    this.attendanceMap.set(map);
  }

  saveAttendance(): void {
    const batchId = this.selectedBatchId();
    const date = this.selectedDate();

    const studentsToSave = this.students().filter(student => {
      const status = this.attendanceMap().get(student.id);
      return !!status;
    });

    if (studentsToSave.length === 0) return;

    this.isSaving.set(true);
    this.saveProgress.set(0);
    this.saveTotal.set(studentsToSave.length);

    let saved = 0;
    let failed = 0;
    let completed = 0;
    const total = studentsToSave.length;

    studentsToSave.forEach(student => {
      const status = this.attendanceMap().get(student.id)!;
      const existingRecord = this.attendanceRecords().find(r => r.studentId === student.id);
      const request$: Observable<string | Attendance> = existingRecord
        ? this.attendanceService.updateAttendanceByStudent(date, student.id, batchId, status === 'present')
        : this.attendanceService.markAttendance(student.id, batchId, date, status === 'present');

      const sub = request$.subscribe({
        next: (value) => {
          saved++;
          completed++;
          this.saveProgress.set(completed);
          if (!existingRecord) {
            this.attendanceRecords.update(list => [...list, {
              attendanceId: value && typeof value === 'object' && 'attendanceId' in value ? (value as Attendance).attendanceId : 0,
              studentId: student.id,
              studentName: student.nameWithInitials,
              misNo: student.misNo,
              batchId: batchId,
              batchCode: '',
              date: date,
              isPresent: status === 'present'
            }]);
          }
        },
        error: () => {
          failed++;
          completed++;
          this.saveProgress.set(completed);
          console.error('Error saving attendance for student:', student.id);
        }
      });
    });

    setTimeout(() => {
      this.isSaving.set(false);
      this.saveProgress.set(0);
      this.saveTotal.set(0);

      if (saved > 0 && failed === 0) {
        this.toast.success(`Attendance saved for ${saved} students`);
      } else if (saved > 0) {
        this.toast.warning(`Saved ${saved} students, ${failed} failed`);
      } else {
        this.toast.error(`Failed to save attendance for all ${failed} students`);
      }
    }, 500);
  }

   get formattedDate(): string {
    const date = new Date(this.selectedDate());
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  get presentCount(): number {
    return this.students().filter(s => this.attendanceMap().get(s.id) === 'present').length;
  }

  get absentCount(): number {
    return this.students().filter(s => this.attendanceMap().get(s.id) === 'absent').length;
  }

  get hasChanges(): boolean {
    return this.students().some(s => {
      const current = this.attendanceMap().get(s.id);
      if (!current) {
        return false;
      }

      const existing = this.attendanceRecords().find(r => r.studentId === s.id);
      return existing?.isPresent !== (current === 'present');
    });
  }

  get isLoading(): boolean {
    return this.attendanceService.isLoading() || this.batchService.isLoading() || this.studentService.isLoading();
  }

  get todayDate(): string {
    return this.getTodayDate();
  }

  exportToPdf(): void {
    if (!this.selectedBatchId()) return;

    const batch = this.batches().find(b => b.batchId === this.selectedBatchId());
    const title = batch ? `${batch.batchCode} - Daily Attendance` : 'Daily Attendance';

    const headers = ['SN', 'Student No', 'Student', 'MIS No', 'Status'];
    const rows = this.students().map((student, index) => {
      const status = this.getAttendanceStatus(student.id);
      return {
        SN: index + 1,
        'Student No': student.studentNumber ?? '-',
        Student: student.nameWithInitials,
        'MIS No': student.misNo,
        Status: status === 'present' ? 'Present' : status === 'absent' ? 'Absent' : 'Not Marked'
      };
    });

    this.exportService.exportPdf({ title, headers, rows });
  }

  exportToExcel(): void {
    if (!this.selectedBatchId()) return;

    const batch = this.batches().find(b => b.batchId === this.selectedBatchId());
    const title = batch ? `${batch.batchCode} - Daily Attendance` : 'Daily Attendance';

    const headers = ['SN', 'Student No', 'Student', 'MIS No', 'Status'];
    const rows = this.students().map((student, index) => {
      const status = this.getAttendanceStatus(student.id);
      return {
        SN: index + 1,
        'Student No': student.studentNumber ?? '-',
        Student: student.nameWithInitials,
        'MIS No': student.misNo,
        Status: status === 'present' ? 'Present' : status === 'absent' ? 'Absent' : 'Not Marked'
      };
    });

    this.exportService.exportExcel({ title, headers, rows });
  }
}
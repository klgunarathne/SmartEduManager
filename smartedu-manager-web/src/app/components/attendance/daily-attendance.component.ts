import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
          this.students.set(data);
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
    let saved = 0;
    let failed = 0;
    
    this.students().forEach(student => {
      const status = this.attendanceMap().get(student.id);
      if (status) {
        const existingRecord = this.attendanceRecords().find(r => r.studentId === student.id);
        if (existingRecord) {
          this.attendanceService.updateAttendanceByStudent(date, student.id, batchId, status === 'present').subscribe({
            next: () => saved++,
            error: (err) => {
              failed++;
              console.error('Error updating attendance:', err);
            }
          });
        } else {
          this.attendanceService.markAttendance(student.id, batchId, date, status === 'present').subscribe({
            next: () => {
              saved++;
              this.attendanceRecords.update(list => [...list, {
                attendanceId: 0,
                studentId: student.id,
                studentName: student.nameWithInitials,
                misNo: student.misNo,
                batchId: batchId,
                batchCode: '',
                date: date,
                isPresent: status === 'present'
              }]);
            },
            error: (err) => {
              failed++;
              console.error('Error saving attendance:', err);
            }
          });
        }
      }
    });
    
    setTimeout(() => {
      if (saved > 0 && failed === 0) {
        this.toast.success(`Attendance saved for ${saved} students`);
      } else if (saved > 0) {
        this.toast.warning(`Saved ${saved} students, ${failed} failed`);
      } else if (failed > 0) {
        this.toast.error(`Failed to save attendance for ${failed} students`);
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

    const headers = ['SN', 'Student', 'MIS No', 'Status'];
    const rows = this.students().map((student, index) => {
      const status = this.getAttendanceStatus(student.id);
      return {
        SN: index + 1,
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

    const headers = ['SN', 'Student', 'MIS No', 'Status'];
    const rows = this.students().map((student, index) => {
      const status = this.getAttendanceStatus(student.id);
      return {
        SN: index + 1,
        Student: student.nameWithInitials,
        'MIS No': student.misNo,
        Status: status === 'present' ? 'Present' : status === 'absent' ? 'Absent' : 'Not Marked'
      };
    });

    this.exportService.exportExcel({ title, headers, rows });
  }
}
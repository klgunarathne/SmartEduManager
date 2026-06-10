import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService, BatchAttendanceSummary, Attendance } from '../../services/attendance.service';
import { BatchService, Batch } from '../../services/batch.service';
import { StudentService, Student } from '../../services/student.service';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent implements OnInit {
  reportType = signal<'monthly' | 'batch'>('monthly');

  selectedBatchId = signal(0);
  selectedMonth = signal(new Date().getMonth());
  selectedYear = signal(new Date().getFullYear());
  monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  batches = signal<Batch[]>([]);
  students = signal<Student[]>([]);

  monthlyGrid = signal<{ days: string[]; rows: { studentId: number; studentName: string; misNo: string; attendances: (boolean | null)[] }[] } | null>(null);
  monthlyReport = signal<BatchAttendanceSummary[]>([]);
  batchReport = signal<BatchAttendanceSummary[]>([]);

  constructor(
    private attendanceService: AttendanceService,
    private batchService: BatchService,
    private studentService: StudentService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadBatches();
  }

  loadBatches(): void {
    this.batchService.getBatches().subscribe({
      next: (data) => {
        this.batches.set(data);
        if (data.length > 0) {
          const today = this.getTodayDate();
          const current = data.find(b => b.startDate && b.endDate && b.startDate <= today && b.endDate >= today);
          this.selectedBatchId.set(current ? current.batchId : data[0].batchId);
          this.generateMonthlyReport();
        }
      }
    });
  }

  generateMonthlyReport(): void {
    const batchId = this.selectedBatchId();
    const month = this.selectedMonth() + 1;
    const year = this.selectedYear();
    const monthStr = String(month).padStart(2, '0');

    this.studentService.getStudentsByBatch(batchId).subscribe({
      next: (students) => {
        this.students.set(students);

        this.attendanceService.getAttendanceByBatch(batchId).subscribe({
          next: (allRecords) => {
            const normalized = allRecords.map(r => ({ ...r, date: this.normalizeDate(r.date) }));
            const monthRecords = normalized.filter(r => r.date.startsWith(`${year}-${monthStr}`));

            const daysInMonth = new Date(year, month - 1, 0).getDate();
            const workingDays = this.attendanceService.settings().workingDays;

            const days: string[] = [];
            for (let d = 1; d <= daysInMonth; d++) {
              const date = new Date(year, month - 1, d);
              const dayOfWeek = date.getDay();
              const dayStr = `${year}-${monthStr}-${String(d).padStart(2, '0')}`;
              if (workingDays.includes(dayOfWeek) || monthRecords.some(r => r.date === dayStr)) {
                days.push(dayStr);
              }
            }

            const rowMap = new Map<number, { studentName: string; misNo: string; fill: (boolean | null)[] }>();
            monthRecords.forEach(r => {
              const idx = days.indexOf(r.date);
              if (!rowMap.has(r.studentId)) {
                rowMap.set(r.studentId, {
                  studentName: r.studentName,
                  misNo: r.misNo,
                  fill: days.map(() => null)
                });
              }
              if (idx !== -1) {
                rowMap.get(r.studentId)!.fill[idx] = r.isPresent;
              }
            });

            const rows = students.map(s => {
              const base = rowMap.get(s.id);
              return {
                studentId: s.id,
                studentName: base ? base.studentName : s.nameWithInitials,
                misNo: base ? base.misNo : s.misNo,
                attendances: base
                  ? base.fill
                  : days.map(() => null)
              };
            });

            this.monthlyGrid.set({ days, rows });
            this.monthlyReport.set([]);
          }
        });
      }
    });
  }

  generateBatchReport(): void {
    const batchId = this.selectedBatchId();
    const startDate = '2000-01-01';
    const endDate = '2030-12-31';

    this.attendanceService.getBatchAttendanceSummary(batchId, startDate, endDate).subscribe({
      next: (data) => {
        console.log('Batch report data:', data);
        this.batchReport.set(data);
      },
      error: (err) => console.error('Batch report error:', err)
    });
  }

  goBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  printReport(): void {
    window.print();
  }

  calcPercent(present: number, total: number): number {
    return total > 0 ? Math.round((present / total) * 100) : 0;
  }

  getAveragePercentage(): number {
    const grid = this.monthlyGrid();
    if (!grid || grid.rows.length === 0) return 0;

    let totalPresent = 0;
    let totalMarked = 0;

    grid.rows.forEach(row => {
      totalPresent += row.attendances.filter(a => a === true).length;
      totalMarked += row.attendances.filter(a => a === true || a === false).length;
    });

    return totalMarked > 0 ? Math.round((totalPresent / totalMarked) * 100) : 0;
  }

  getAveragePresent(): number {
    const grid = this.monthlyGrid();
    if (!grid || grid.rows.length === 0) return 0;
    return grid.rows.reduce((sum, row) => sum + row.attendances.filter(a => a === true).length, 0);
  }

  getAverageTotal(): number {
    const grid = this.monthlyGrid();
    if (!grid || grid.rows.length === 0) return 0;
    return grid.rows.reduce((sum, row) => sum + row.attendances.filter(a => a === true || a === false).length, 0);
  }

  exportPdf(): void {
    console.log('Exporting PDF...');
  }

  exportExcel(): void {
    console.log('Exporting Excel...');
  }

  get isLoading(): boolean {
    return this.attendanceService.isLoading() || this.batchService.isLoading() || this.studentService.isLoading();
  }

  private getTodayDate(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  private normalizeDate(dateStr: string): string {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const month = parts[1].padStart(2, '0');
      const day = parts[2].split('T')[0].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return dateStr;
  }
}

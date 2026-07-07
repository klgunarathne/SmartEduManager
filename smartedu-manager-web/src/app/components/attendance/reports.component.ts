import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService, BatchAttendanceSummary, Attendance } from '../../services/attendance.service';
import { BatchService, Batch } from '../../services/batch.service';
import { StudentService, Student } from '../../services/student.service';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { ExportService } from '../../services/export.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent implements OnInit {
  reportType = signal<'monthly' | 'batch'>('monthly');

  selectedBatchId = 0;
  selectedMonth = new Date().getMonth();
  selectedYear = new Date().getFullYear();
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
    private route: ActivatedRoute,
    private exportService: ExportService
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
          this.selectedBatchId = current ? current.batchId : data[0].batchId;
          this.generateMonthlyReport();
        }
      }
    });
  }

  generateMonthlyReport(): void {
    const batchId = Number(this.selectedBatchId);
    const selectedMonth = Number(this.selectedMonth);
    const month = selectedMonth + 1;
    const year = Number(this.selectedYear);
    const monthStr = String(month).padStart(2, '0');

    this.studentService.getStudentsByBatch(batchId).subscribe({
      next: (students) => {
        this.students.set(students);

        this.attendanceService.getMonthlyReportData(batchId, year, month).subscribe({
          next: (monthRecords) => {
            const normalized = monthRecords.map(r => ({ ...r, date: this.normalizeDate(r.date) }));

            const daysInMonth = new Date(year, month - 1, 0).getDate();
            const workingDays = this.attendanceService.settings().workingDays;

            const days: string[] = [];
            for (let d = 1; d <= daysInMonth; d++) {
              const date = new Date(year, month - 1, d);
              const dayOfWeek = date.getDay();
              const dayStr = `${year}-${monthStr}-${String(d).padStart(2, '0')}`;
              if (workingDays.includes(dayOfWeek) || normalized.some(r => r.date === dayStr)) {
                days.push(dayStr);
              }
            }

            const rowMap = new Map<number, { studentName: string; misNo: string; fill: (boolean | null)[] }>();
            normalized.forEach(r => {
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
    const batchId = this.selectedBatchId;
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
    if (this.reportType() === 'monthly') {
      const grid = this.monthlyGrid();
      if (!grid || grid.rows.length === 0) return;

      const title = 'Monthly Attendance Report';
      const dayHeaders = grid.days.map(d => d.split('-')[2]);
      const headers = ['SN', 'Student', ...dayHeaders, 'Total', 'Present', 'Absent', '%'];
      const rows = grid.rows.map((row, index) => {
        const total = row.attendances.filter(a => a === true || a === false).length;
        const present = row.attendances.filter(a => a === true).length;
        const absent = row.attendances.filter(a => a === false).length;
        const dayValues = row.attendances.map(a => a === true ? 1 : a === false ? 0 : '');
        return [index + 1, row.studentName, ...dayValues, total, present, absent, `${this.calcPercent(present, total)}%`];
      });

      const avgTotal = this.getAverageTotal();
      const avgPresent = this.getAveragePresent();
      const avgAbsent = avgTotal - avgPresent;
      const avgPercent = `${this.getAveragePercentage()}%`;
      const emptyDays = grid.days.map(() => '');
      rows.push(['', 'Average', ...emptyDays, avgTotal, avgPresent, avgAbsent, avgPercent]);

      this.exportService.exportPdf({ title, headers, rows, orientation: 'landscape' });
    } else if (this.reportType() === 'batch') {
      if (this.batchReport().length === 0) return;

      const batch = this.batches().find(b => b.batchId === this.selectedBatchId);
      const title = batch ? `${batch.batchCode} - Batch Attendance Summary` : 'Batch Attendance Summary';
      const headers = ['SN', 'Student', 'MIS No', 'Total Days', 'Present', 'Absent', 'Percentage', 'Status'];
      const rows = this.batchReport().map((record, index) => ({
        SN: index + 1,
        Student: record.studentName,
        'MIS No': record.misNo,
        'Total Days': record.totalDays,
        Present: record.presentCount,
        Absent: record.absentCount,
        Percentage: `${record.attendancePercentage}%`,
        Status: record.attendancePercentage >= 75 ? 'Eligible' : 'Not Eligible'
      }));

      this.exportService.exportPdf({ title, headers, rows });
    }
  }

  exportExcel(): void {
    if (this.reportType() === 'monthly') {
      const grid = this.monthlyGrid();
      if (!grid || grid.rows.length === 0) return;

      const title = 'Monthly Attendance Report';
      const dayHeaders = grid.days.map(d => d.split('-')[2]);
      const headers = ['SN', 'Student', ...dayHeaders, 'Total', 'Present', 'Absent', '%'];
      const rows = grid.rows.map((row, index) => {
        const total = row.attendances.filter(a => a === true || a === false).length;
        const present = row.attendances.filter(a => a === true).length;
        const absent = row.attendances.filter(a => a === false).length;
        const dayValues = row.attendances.map(a => a === true ? 1 : a === false ? 0 : '');
        const rowObj: Record<string, any> = { SN: index + 1, Student: row.studentName };
        dayHeaders.forEach((day, i) => rowObj[day] = dayValues[i]);
        rowObj['Total'] = total;
        rowObj['Present'] = present;
        rowObj['Absent'] = absent;
        rowObj['%'] = `${this.calcPercent(present, total)}%`;
        return rowObj;
      });

      const avgRow: Record<string, any> = { SN: '', Student: 'Average' };
      dayHeaders.forEach((day) => avgRow[day] = '');
      avgRow['Total'] = this.getAverageTotal();
      avgRow['Present'] = this.getAveragePresent();
      avgRow['Absent'] = avgRow['Total'] - avgRow['Present'];
      avgRow['%'] = `${this.getAveragePercentage()}%`;
      rows.push(avgRow);

      this.exportService.exportExcel({ title, headers, rows });
    } else if (this.reportType() === 'batch') {
      if (this.batchReport().length === 0) return;

      const batch = this.batches().find(b => b.batchId === this.selectedBatchId);
      const title = batch ? `${batch.batchCode} - Batch Attendance Summary` : 'Batch Attendance Summary';
      const headers = ['SN', 'Student', 'MIS No', 'Total Days', 'Present', 'Absent', 'Percentage', 'Status'];
      const rows = this.batchReport().map((record, index) => ({
        SN: index + 1,
        Student: record.studentName,
        'MIS No': record.misNo,
        'Total Days': record.totalDays,
        Present: record.presentCount,
        Absent: record.absentCount,
        Percentage: `${record.attendancePercentage}%`,
        Status: record.attendancePercentage >= 75 ? 'Eligible' : 'Not Eligible'
      }));

      this.exportService.exportExcel({ title, headers, rows });
    }
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

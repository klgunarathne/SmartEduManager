import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService, StudentAttendanceSummary, Attendance, MonthlyAttendanceData } from '../../services/attendance.service';
import { BatchService, Batch } from '../../services/batch.service';
import { StudentService, Student } from '../../services/student.service';
import { Router, ActivatedRoute } from '@angular/router';
import { CalendarComponent } from './calendar.component';

@Component({
  selector: 'app-student-summary',
  standalone: true,
  imports: [CommonModule, FormsModule, CalendarComponent],
  templateUrl: './student-summary.component.html',
  styleUrl: './student-summary.component.scss'
})
export class StudentSummaryComponent implements OnInit {
  selectedBatchId = signal(0);
  selectedStudentId = signal(0);
  startDate = signal(this.getMonthAgoDate());
  endDate = signal(this.getTodayDate());
  calendarMonth = signal(new Date().getMonth());
  calendarYear = signal(new Date().getFullYear());

  batches = signal<Batch[]>([]);
  students = signal<Student[]>([]);
  summary = signal<StudentAttendanceSummary | null>(null);
  attendanceHistory = signal<Attendance[]>([]);
  monthlyData = signal<MonthlyAttendanceData | null>(null);
  batchAttendance = signal<Attendance[]>([]);

  dayStatusMap = computed(() => {
    const map = new Map<string, 'present' | 'absent' | 'no-class' | 'none'>();
    if (this.monthlyData()) {
      this.monthlyData()!.days.forEach(d => map.set(d.date, d.status));
    }
    return map;
  });

  workingDays = computed(() => this.attendanceService.settings().workingDays);

  constructor(
    public attendanceService: AttendanceService,
    private batchService: BatchService,
    private studentService: StudentService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadBatches();
  }

  goBack(): void {
    this.router.navigate(['/instructor/attendance']);
  }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getMonthAgoDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  }

  loadBatches(): void {
    this.batchService.getBatches().subscribe({
      next: (data) => this.batches.set(data)
    });
  }

  onBatchChange(): void {
    const batchId = this.selectedBatchId();
    if (batchId > 0) {
      this.studentService.getStudentsByBatch(batchId).subscribe({
        next: (data) => {
          this.students.set(data);
          this.selectedStudentId.set(0);
          this.summary.set(null);
          this.attendanceHistory.set([]);
          this.monthlyData.set(null);
          this.batchAttendance.set([]);
        }
      });
    } else {
      this.students.set([]);
      this.summary.set(null);
      this.attendanceHistory.set([]);
      this.monthlyData.set(null);
    }
  }

  loadStudentSummary(): void {
    const studentId = this.selectedStudentId();
    const start = this.startDate();
    const end = this.endDate();
    const batchId = this.selectedBatchId();

    if (studentId > 0 && batchId > 0) {
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
          
          this.batchAttendance.set(data);
          const studentAttendances = data.filter(a => a.studentId === studentId);
          const filtered = studentAttendances.filter(a => {
            const normalizedApiDate = normalizeDate(a.date);
            return normalizedApiDate >= start && normalizedApiDate <= end;
          });
          
          const presentDays = filtered.filter(a => a.isPresent).length;
          const absentDays = filtered.filter(a => !a.isPresent).length;
          const totalDays = presentDays + absentDays;
          
          const student = studentAttendances[0];
          this.summary.set({
            studentId,
            studentName: student?.studentName || '',
            misNo: student?.misNo || '',
            batchId: batchId,
            batchCode: '',
            totalDays,
            presentDays,
            absentDays,
            attendancePercentage: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0
          });
          
          this.attendanceHistory.set(
            studentAttendances.sort((a, b) => normalizeDate(b.date).localeCompare(normalizeDate(a.date)))
          );
          
          this.loadMonthlyData();
        }
      });
    }
  }

  loadMonthlyData(): void {
    const studentId = this.selectedStudentId();
    const month = this.calendarMonth();
    const year = this.calendarYear();
    const numericMonth = typeof month === 'string' ? parseInt(month, 10) : month;
    const numericYear = typeof year === 'string' ? parseInt(year, 10) : year;
    
    if (studentId > 0 && this.batchAttendance().length > 0) {
      const monthStr = String(numericMonth + 1).padStart(2, '0');
      
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
      
      const monthAttendances = this.batchAttendance().filter(a => 
        a.studentId === studentId && normalizeDate(a.date).startsWith(`${numericYear}-${monthStr}`)
      );
      
      const daysInMonth = new Date(numericYear, numericMonth + 1, 0).getDate();
      const workingDays = this.workingDays();
      const student = monthAttendances[0];
      
      const days: any[] = [];
      let presentDays = 0;
      let absentDays = 0;
      let noClassDays = 0;
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(numericYear, numericMonth, day);
        const dateStrPadded = `${numericYear}-${monthStr}-${String(day).padStart(2, '0')}`;
        const attendance = monthAttendances.find(a => normalizeDate(a.date) === dateStrPadded);
        
        let status: 'present' | 'absent' | 'no-class' | 'none' = 'none';
        if (attendance) {
          status = attendance.isPresent ? 'present' : 'absent';
        } else if (!workingDays.includes(date.getDay())) {
          status = 'no-class';
        }
        
        days.push({ date: dateStrPadded, day, status });
        
        if (status === 'present') presentDays++;
        else if (status === 'absent') absentDays++;
        else if (status === 'no-class') noClassDays++;
      }
      
      this.monthlyData.set({
        studentId,
        studentName: student?.studentName || '',
        year: numericYear,
        month: numericMonth,
        days,
        totalDays: presentDays + absentDays,
        presentDays,
        absentDays,
        noClassDays,
        attendancePercentage: presentDays + absentDays > 0 ? Math.round((presentDays / (presentDays + absentDays)) * 100) : 0
      });
    }
  }

  prevMonth(): void {
    const month = this.calendarMonth();
    const numericMonth = typeof month === 'string' ? parseInt(month, 10) : month;
    const newMonth = numericMonth - 1;
    if (newMonth < 0) {
      this.calendarMonth.set(11);
      this.calendarYear.update(y => y - 1);
    } else {
      this.calendarMonth.set(newMonth);
    }
    this.loadMonthlyData();
  }

  nextMonth(): void {
    const month = this.calendarMonth();
    const numericMonth = typeof month === 'string' ? parseInt(month, 10) : month;
    const newMonth = numericMonth + 1;
    if (newMonth > 11) {
      this.calendarMonth.set(0);
      this.calendarYear.update(y => y + 1);
    } else {
      this.calendarMonth.set(newMonth);
    }
    this.loadMonthlyData();
  }

  formatDisplayDate(dateStr: string): string {
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
    const normalizedDate = normalizeDate(dateStr);
    const date = new Date(normalizedDate);
    return date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  }

  get isLoading(): boolean {
    return this.attendanceService.isLoading() || this.batchService.isLoading() || this.studentService.isLoading();
  }
}
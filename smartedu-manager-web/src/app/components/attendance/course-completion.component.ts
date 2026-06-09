import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService, CourseCompletionReport } from '../../services/attendance.service';
import { BatchService, Batch } from '../../services/batch.service';

@Component({
  selector: 'app-course-completion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './course-completion.component.html',
  styleUrl: './course-completion.component.scss'
})
export class CourseCompletionComponent implements OnInit {
  selectedBatchId = signal(0);
  minimumPercentage = signal(75);
  report = signal<CourseCompletionReport | null>(null);

  batches = signal<Batch[]>([]);

  constructor(
    public attendanceService: AttendanceService,
    private batchService: BatchService
  ) {}

  ngOnInit(): void {
    this.loadBatches();
    this.minimumPercentage.set(this.attendanceService.settings().minimumAttendancePercentage);
  }

  loadBatches(): void {
    this.batchService.getBatches().subscribe({
      next: (data) => this.batches.set(data)
    });
  }

  generateReport(): void {
    const batchId = this.selectedBatchId();
    
    this.attendanceService.generateCourseCompletionReport(batchId).subscribe({
      next: (data) => this.report.set(data)
    });
  }

  isEligible(percentage: number): boolean {
    return percentage >= this.minimumPercentage();
  }

  isBelowMinimum(percentage: number): boolean {
    return percentage < this.minimumPercentage();
  }

  get eligibleCount(): number {
    return this.report()?.studentReports.filter(s => this.isEligible(s.attendancePercentage)).length || 0;
  }

  get notEligibleCount(): number {
    return this.report()?.studentReports.filter(s => !this.isEligible(s.attendancePercentage)).length || 0;
  }

  printReport(): void {
    window.print();
  }

  exportPdf(): void {
    console.log('Exporting PDF...');
  }

  exportExcel(): void {
    console.log('Exporting Excel...');
  }

  get isLoading(): boolean {
    return this.attendanceService.isLoading() || this.batchService.isLoading();
  }
}
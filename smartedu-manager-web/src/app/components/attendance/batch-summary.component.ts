import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService, BatchAttendanceSummary } from '../../services/attendance.service';
import { BatchService, Batch } from '../../services/batch.service';

@Component({
  selector: 'app-batch-summary',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './batch-summary.component.html',
  styleUrl: './batch-summary.component.scss'
})
export class BatchSummaryComponent implements OnInit {
  selectedBatchId = signal(0);
  searchQuery = signal('');
  sortField = signal<'studentName' | 'presentCount' | 'attendancePercentage'>('attendancePercentage');
  sortDirection = signal<'asc' | 'desc'>('desc');
  currentPage = signal(1);
  itemsPerPage = 10;

  batches = signal<Batch[]>([]);
  attendanceSummary = signal<BatchAttendanceSummary[]>([]);
  filteredSummary = signal<BatchAttendanceSummary[]>([]);

  constructor(
    public attendanceService: AttendanceService,
    private batchService: BatchService
  ) {}

  ngOnInit(): void {
    this.loadBatches();
  }

  loadBatches(): void {
    this.batchService.getBatches().subscribe({
      next: (data) => this.batches.set(data)
    });
  }

  onBatchChange(): void {
    const batchId = this.selectedBatchId();
    if (batchId > 0) {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      
      this.attendanceService.getBatchAttendanceSummary(batchId, start, end).subscribe({
        next: (data) => {
          this.attendanceSummary.set(data);
          this.applyFilterAndSort();
        }
      });
    } else {
      this.attendanceSummary.set([]);
      this.filteredSummary.set([]);
    }
  }

  applyFilterAndSort(): void {
    let data = [...this.attendanceSummary()];
    
    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      data = data.filter(s => 
        s.studentName.toLowerCase().includes(query) ||
        s.misNo.toLowerCase().includes(query)
      );
    }

    data.sort((a, b) => {
      const aVal = a[this.sortField()];
      const bVal = b[this.sortField()];
      const result = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return this.sortDirection() === 'asc' ? result : -result;
    });

    this.filteredSummary.set(data);
    this.currentPage.set(1);
  }

  sortBy(field: 'studentName' | 'presentCount' | 'attendancePercentage'): void {
    if (this.sortField() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }
    this.applyFilterAndSort();
  }

  get paginatedData(): BatchAttendanceSummary[] {
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    return this.filteredSummary().slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredSummary().length / this.itemsPerPage);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage.set(page);
    }
  }

  get pages(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  get totalPresent(): number {
    return this.attendanceSummary().reduce((sum, s) => sum + s.presentCount, 0);
  }

  get totalAbsent(): number {
    return this.attendanceSummary().reduce((sum, s) => sum + s.absentCount, 0);
  }

  get batchAverage(): number {
    if (this.attendanceSummary().length === 0) return 0;
    const total = this.attendanceSummary().reduce((sum, s) => sum + s.attendancePercentage, 0);
    return Math.round(total / this.attendanceSummary().length);
  }

  get lowAttendanceCount(): number {
    const minPercent = this.attendanceService.settings().minimumAttendancePercentage;
    return this.attendanceSummary().filter(s => s.attendancePercentage < minPercent).length;
  }

  get isLoading(): boolean {
    return this.attendanceService.isLoading() || this.batchService.isLoading();
  }
}
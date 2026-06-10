import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type DayStatus = 'present' | 'absent' | 'no-class' | 'none';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss'
})
export class CalendarComponent {
  monthSignal = signal(0);
  yearSignal = signal(new Date().getFullYear());
  dayStatusMapSignal = signal<Map<string, DayStatus>>(new Map());
  workingDaysSignal = signal<number[]>([1, 2, 3, 4, 5, 6]);

  @Input() set month(value: number | string) { this.monthSignal.set(typeof value === 'string' ? parseInt(value, 10) : value); }
  @Input() set year(value: number | string) { this.yearSignal.set(typeof value === 'string' ? parseInt(value, 10) : value); }
  @Input() set dayStatusMap(value: Map<string, DayStatus>) { this.dayStatusMapSignal.set(value); }
  @Input() set workingDays(value: number[]) { this.workingDaysSignal.set(value); }
  
  @Input() showLegend = true;
  @Input() showNavigation = true;
  @Output() prevMonth = new EventEmitter<void>();
  @Output() nextMonth = new EventEmitter<void>();

  days = computed(() => {
    const year = this.yearSignal();
    const month = this.monthSignal();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(new Date(year, month, -(i)));
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    const remainingCells = 7 - (days.length % 7);
    for (let i = 1; i < remainingCells; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  });

  dayStatuses = computed(() => {
    const dayStatusMap = this.dayStatusMapSignal();
    const workingDays = this.workingDaysSignal();
    
    return this.days().map(date => {
      const dateStr = this.formatDate(date);
      const status = dayStatusMap.get(dateStr);
      if (status) return status;
      
      const dayOfWeek = date.getDay();
      if (!workingDays.includes(dayOfWeek)) return 'no-class';
      
      return 'none';
    });
  });

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  getMonthName(): string {
    const date = new Date(this.yearSignal(), this.monthSignal(), 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  get currentMonth(): number {
    return this.monthSignal();
  }
}
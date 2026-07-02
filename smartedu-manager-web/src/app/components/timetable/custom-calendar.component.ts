import { Component, ChangeDetectionStrategy, signal, computed, input, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseScheduleService, CourseSession } from '../../services/course-schedule.service';
import { BatchService } from '../../services/batch.service';

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  batchId: number;
  batchCode: string;
  courseName?: string;
  color: string;
  sessionType: string;
  status: string;
  description?: string;
  instructorName?: string;
  centerName?: string;
  moduleName?: string;
  isPublished?: boolean;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

@Component({
  selector: 'app-custom-calendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
  templateUrl: './custom-calendar.component.html',
  styleUrl: './custom-calendar.component.scss'
})
export class CustomCalendarComponent implements OnInit {
  readonly selectedBatchId = input(0);
  readonly eventClick = output<CalendarEvent>();
  readonly dateDblClick = output<Date>();

  isLoading = signal(true);
  currentDate = signal(new Date());
  selectedDate = signal<Date | null>(null);
  currentView = signal<'month' | 'week'>('month');
  todayDate = signal(new Date());

  batches = signal<Array<{ batchId: number; batchCode: string; courseName: string }>>([]);
  sessions = signal<CourseSession[]>([]);
  events = signal<CalendarEvent[]>([]);

  weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  timeSlots = Array.from({ length: 11 }, (_, i) => i + 8); // 8AM to 6PM

  headerDateLabel = computed(() => {
    const date = this.currentDate();
    const view = this.currentView();
    if (view === 'month') {
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    const start = this.getWeekStart();
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  });

  calendarDays = computed(() => {
    const date = this.currentDate();
    const view = this.currentView();
    const today = new Date();
    const selected = this.selectedDate();

    if (view === 'week') {
      return this.getWeekDays(date, today, selected);
    }

    // Month view
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: CalendarDay[] = [];
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    for (let i = startDay; i > 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false, isToday: false, isSelected: false });
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const currentMonthDate = new Date(year, month, i);
      days.push({
        date: currentMonthDate,
        isCurrentMonth: true,
        isToday: this.isSameDay(currentMonthDate, today),
        isSelected: selected ? this.isSameDay(currentMonthDate, selected) : false
      });
    }

    const remainingDays = 7 - (days.length % 7);
    if (remainingDays < 7) {
      for (let i = 1; i <= remainingDays; i++) {
        const nextDate = new Date(year, month + 1, i);
        days.push({ date: nextDate, isCurrentMonth: false, isToday: false, isSelected: false });
      }
    }

    return days;
  });

  weekDayDates = computed(() => {
    const start = this.getWeekStart();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  });

  constructor(
    private batchService: BatchService,
    private scheduleService: CourseScheduleService
  ) {}

  ngOnInit(): void {
    this.loadBatches();
  }

  private loadBatches(): void {
    this.batchService.getInstructorBatches().subscribe({
      next: () => {
        this.batches.set(this.batchService.batches());
        this.loadSessions();
      },
      error: () => {
        this.isLoading.set(false);
        this.loadSessions();
      }
    });
  }

  private loadSessions(): void {
    this.isLoading.set(true);
    const date = this.currentDate();
    const view = this.currentView();

    let start: Date, end: Date;
    if (view === 'month') {
      start = new Date(date.getFullYear(), date.getMonth(), 1);
      end = new Date(date.getFullYear(), date.getMonth() + 2, 0);
    } else {
      start = this.getWeekStart();
      end = new Date(start);
      end.setDate(end.getDate() + 14);
    }

    const batchId = this.selectedBatchId();

    this.scheduleService.getSessions(batchId || undefined, start.toISOString(), end.toISOString()).subscribe({
      next: (data) => {
        this.sessions.set(data);
        this.transformEvents(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  private transformEvents(sessions: CourseSession[]): void {
    const calendarEvents: CalendarEvent[] = sessions.map(s => ({
      id: String(s.appointmentId),
      title: s.text,
      start: new Date(s.startDateTime),
      end: new Date(s.endDateTime),
      batchId: s.batchId,
      batchCode: s.batchCode || '',
      courseName: s.courseName,
      color: this.getSessionColor(s),
      sessionType: s.sessionType || 'Theory',
      status: s.status || 'Scheduled',
      description: s.description,
      instructorName: s.instructorName,
      centerName: s.centerName,
      moduleName: s.moduleName,
      isPublished: s.isPublished
    }));
    this.events.set(calendarEvents);
  }

  private getSessionColor(session: CourseSession): string {
    if (session.color) return session.color;
    const colors: Record<string, string> = {
      'Theory': '#3b82f6',
      'Practical': '#10b981',
      'Exam': '#ef4444',
      'Assessment': '#f59e0b',
      'Orientation': '#8b5cf6'
    };
    return colors[session.sessionType || 'Theory'] || '#6366f1';
  }

  private isSameDay(a: Date, b: Date): boolean {
    return a.getDate() === b.getDate() &&
           a.getMonth() === b.getMonth() &&
           a.getFullYear() === b.getFullYear();
  }

  isSameDayPublic(a: Date, b: Date): boolean {
    return this.isSameDay(a, b);
  }

  private getWeekStart(): Date {
    const date = new Date(this.currentDate());
    const day = date.getDay() || 7;
    const diff = date.getDate() - day + 1;
    return new Date(date.setDate(diff));
  }

  private getWeekDays(date: Date, today: Date, selected: Date | null): CalendarDay[] {
    const days: CalendarDay[] = [];
    const weekStart = this.getWeekStart();

    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(weekStart);
      currentDay.setDate(weekStart.getDate() + i);
      days.push({
        date: currentDay,
        isCurrentMonth: true,
        isToday: this.isSameDay(currentDay, today),
        isSelected: selected ? this.isSameDay(currentDay, selected) : false
      });
    }

    return days;
  }

  getDayEvents(date: Date): CalendarEvent[] {
    return this.events().filter(e => this.isSameDay(e.start, date));
  }

  getWeekEvents(dayIndex: number): CalendarEvent[] {
    const weekDates = this.weekDayDates();
    const day = weekDates[dayIndex];
    if (!day) return [];
    return this.events().filter(e => this.isSameDay(e.start, day));
  }

  getEventPosition(event: CalendarEvent): { top: number; height: number } {
    const startHour = event.start.getHours() + event.start.getMinutes() / 60;
    const endHour = event.end.getHours() + event.end.getMinutes() / 60;
    const top = ((startHour - 8) / 10) * 100;
    const height = Math.max(((endHour - startHour) / 10) * 100, 6);
    return { top, height };
  }

  getEventLeft(): number {
    return this.selectedBatchId() ? 0 : 0;
  }

  getEventWidth(): number {
    return this.selectedBatchId() ? 100 : 100 / this.batches().length;
  }

  prevPeriod(): void {
    const date = this.currentDate();
    const view = this.currentView();
    if (view === 'month') {
      this.currentDate.set(new Date(date.getFullYear(), date.getMonth() - 1, 1));
    } else {
      date.setDate(date.getDate() - 7);
      this.currentDate.set(date);
    }
    this.loadSessions();
  }

  nextPeriod(): void {
    const date = this.currentDate();
    const view = this.currentView();
    if (view === 'month') {
      this.currentDate.set(new Date(date.getFullYear(), date.getMonth() + 1, 1));
    } else {
      date.setDate(date.getDate() + 7);
      this.currentDate.set(date);
    }
    this.loadSessions();
  }

  today(): void {
    this.currentDate.set(new Date());
    this.loadSessions();
  }

  setView(view: 'month' | 'week'): void {
    this.currentView.set(view);
    this.loadSessions();
  }

  selectDay(day: CalendarDay): void {
    if (day.isCurrentMonth) {
      this.selectedDate.set(day.date);
    }
  }

  dblClickDay(day: CalendarDay): void {
    if (day.isCurrentMonth) {
      this.dateDblClick.emit(day.date);
    }
  }

  refresh(): void {
    this.loadSessions();
  }

  formatEventTime(event: CalendarEvent): string {
    return event.start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }
}
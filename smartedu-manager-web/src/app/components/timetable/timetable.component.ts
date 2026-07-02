import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomCalendarComponent, CalendarEvent } from './custom-calendar.component';
import { CourseScheduleService, CourseSession, CreateSessionDto, UpdateSessionDto } from '../../services/course-schedule.service';
import { BatchService } from '../../services/batch.service';
import { ModulesService, ModuleTask } from '../../services/modules.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-timetable',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomCalendarComponent],
  templateUrl: './timetable.component.html',
  styleUrl: './timetable.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimetableComponent {
  batches = signal<Array<{ batchId: number; batchCode: string; courseName: string }>>([]);
  moduleTasks = signal<ModuleTask[]>([]);
  selectedBatchId = signal<number>(0);

  showModal = signal(false);
  modalMode = signal<'create' | 'edit' | 'view'>('create');
  editingSession = signal<CourseSession | null>(null);
  showDeleteConfirm = signal(false);
  deletingSessionId = signal<number>(0);

  formData: CreateSessionDto = {
    text: '',
    description: '',
    batchId: 0,
    sessionType: 'Theory',
    allDay: false,
    startDateTime: '',
    endDateTime: ''
  };

  errorMessage = signal<string>('');

  readonly sessionTypes: Array<{ value: string; label: string }> = [
    { value: 'Theory', label: 'Lecture' },
    { value: 'Practical', label: 'Practical' },
    { value: 'Assignment', label: 'Assignment' }
  ];

  constructor(
    private batchService: BatchService,
    private scheduleService: CourseScheduleService,
    private modulesService: ModulesService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadBatches();
    this.loadModuleTasks();
  }

  private loadBatches(): void {
    this.batchService.getInstructorBatches().subscribe({
      next: () => {
        this.batches.set(this.batchService.batches());
        if (this.batches().length > 0 && this.selectedBatchId() === 0) {
          this.selectedBatchId.set(this.batches()[0].batchId);
        }
      },
      error: () => {}
    });
  }

  private loadModuleTasks(): void {
    this.modulesService.getModules().subscribe({
      next: (modules) => {
        const allTasks: ModuleTask[] = [];
        modules.forEach(m => allTasks.push(...m.tasks));
        this.moduleTasks.set(allTasks);
      },
      error: () => {}
    });
  }

  onEventClick(event: CalendarEvent): void {
    const session = this.scheduleService.sessions().find(s => String(s.appointmentId) === event.id);
    if (session) {
      this.openViewModal(session);
    } else {
      this.openViewModalFromEvent(event);
    }
  }

  onDateDblClick(date: Date): void {
    const currentBatchId = this.batchService.currentBatchId() || this.batches()[0]?.batchId;
    const startDateTime = new Date(date);
    startDateTime.setHours(9, 0, 0, 0); // Default to 9 AM
    const endDateTime = new Date(date);
    endDateTime.setHours(11, 0, 0, 0); // Default to 11 AM (2 hour session)

    this.formData = {
      text: '',
      description: '',
      batchId: currentBatchId || 0,
      sessionType: 'Theory',
      allDay: false,
      startDateTime: startDateTime.toISOString().slice(0, 16),
      endDateTime: endDateTime.toISOString().slice(0, 16)
    };
    this.modalMode.set('create');
    this.editingSession.set(null);
    this.errorMessage.set('');
    this.showModal.set(true);
  }

  private openViewModalFromEvent(event: CalendarEvent): void {
    const session: CourseSession = {
      appointmentId: parseInt(event.id, 10),
      text: event.title,
      description: event.description,
      batchId: event.batchId,
      batchCode: event.batchCode,
      startDateTime: event.start.toISOString(),
      endDateTime: event.end.toISOString(),
      allDay: false,
      sessionType: event.sessionType as any,
      status: event.status,
      color: event.color
    } as CourseSession;

    this.openViewModal(session);
  }

  openCreateModal(): void {
    const currentBatchId = this.batchService.currentBatchId() || this.batches()[0]?.batchId;
    this.formData = {
      text: '',
      description: '',
      batchId: currentBatchId || 0,
      sessionType: 'Theory',
      allDay: false,
      startDateTime: new Date().toISOString().slice(0, 16),
      endDateTime: new Date(Date.now() + 120 * 60000).toISOString().slice(0, 16)
    };
    this.modalMode.set('create');
    this.editingSession.set(null);
    this.errorMessage.set('');
    this.showModal.set(true);
  }

  openViewModal(session: CourseSession): void {
    this.editingSession.set(session);
    this.formData = {
      text: session.text,
      description: session.description || '',
      batchId: session.batchId,
      startDateTime: session.startDateTime.slice(0, 16),
      endDateTime: session.endDateTime.slice(0, 16),
      allDay: session.allDay,
      sessionType: session.sessionType,
      status: session.status,
      recurrenceRule: session.recurrenceRule,
      recurrenceException: session.recurrenceException,
      color: session.color || '',
      isPublished: session.isPublished
    };
    this.modalMode.set('view');
    this.errorMessage.set('');
    this.showModal.set(true);
  }

  openEditModal(session: CourseSession): void {
    this.editingSession.set(session);
    this.formData = {
      text: session.text,
      description: session.description || '',
      batchId: session.batchId,
      startDateTime: session.startDateTime.slice(0, 16),
      endDateTime: session.endDateTime.slice(0, 16),
      allDay: session.allDay,
      sessionType: session.sessionType
    };
    this.modalMode.set('edit');
    this.errorMessage.set('');
    this.showModal.set(true);
  }

  confirmDelete(): void {
    const session = this.editingSession();
    if (session) {
      this.deletingSessionId.set(session.appointmentId);
      this.showDeleteConfirm.set(true);
    }
  }

  executeDelete(): void {
    const id = this.deletingSessionId();
    this.scheduleService.deleteSession(id).subscribe({
      next: () => {
        this.showDeleteConfirm.set(false);
        this.deletingSessionId.set(0);
        this.showModal.set(false);
      },
      error: () => {
        this.showDeleteConfirm.set(false);
        this.deletingSessionId.set(0);
      }
    });
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
    this.deletingSessionId.set(0);
  }

  submitForm(): void {
    this.errorMessage.set('');

    if (!this.formData.text.trim()) {
      this.errorMessage.set('Session title is required');
      return;
    }
    if (!this.formData.batchId) {
      this.errorMessage.set('Batch is required');
      return;
    }
    if (!this.formData.startDateTime || !this.formData.endDateTime) {
      this.errorMessage.set('Start and end date/time are required');
      return;
    }

    const start = new Date(this.formData.startDateTime);
    const end = new Date(this.formData.endDateTime);

    if (end <= start) {
      this.errorMessage.set('End time must be after start time');
      return;
    }

    if (this.modalMode() === 'create') {
      this.createSession();
    } else {
      this.updateSession();
    }
  }

  private createSession(): void {
    const dto: CreateSessionDto = { ...this.formData };
    const sessionType = dto.sessionType || 'Theory';
    const color = this.getColorFromType(sessionType);

    this.scheduleService.createSession({ ...dto, color }).subscribe({
      next: () => {
        this.showModal.set(false);
      }
    });
  }

  private updateSession(): void {
    const session = this.editingSession();
    if (!session) return;

    const dto: UpdateSessionDto = { ...this.formData };

    this.scheduleService.updateSession(session.appointmentId, dto).subscribe({
      next: () => {
        this.showModal.set(false);
        this.editingSession.set(null);
      }
    });
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingSession.set(null);
    this.formData = {
      text: '',
      description: '',
      batchId: 0,
      sessionType: 'Theory',
      allDay: false,
      startDateTime: '',
      endDateTime: ''
    };
  }

  onBackdropClick(): void {
    if (this.modalMode() === 'view') {
      this.closeModal();
    }
  }

  getSessionTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'Theory': 'fa-book',
      'Practical': 'fa-laptop-code',
      'Exam': 'fa-file-alt',
      'Assessment': 'fa-clipboard-check',
      'Orientation': 'fa-compass'
    };
    return icons[type] || 'fa-calendar';
  }

  getSessionStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      'Scheduled': 'badge bg-info',
      'Completed': 'badge bg-success',
      'Cancelled': 'badge bg-danger'
    };
    return classes[status] || 'badge bg-secondary';
  }

  getEventColor(session: CourseSession | CreateSessionDto | { sessionType: string; color?: string }): string {
    if ('color' in session && session.color) return session.color;
    return this.getColorFromType(session.sessionType || 'Theory');
  }

  onExport(): void {
    this.toast.info('Export feature coming soon!');
  }

  private getColorFromType(type: string): string {
    const colors: Record<string, string> = {
      'Theory': '#3b82f6',
      'Practical': '#10b981',
      'Exam': '#ef4444',
      'Assessment': '#f59e0b',
      'Orientation': '#8b5cf6'
    };
    return colors[type] || '#6366f1';
  }

  getTodayLabel(): string {
    const now = new Date();
    return now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  onPrint(): void {
    window.print();
  }

  onBatchChange(): void {
    // The custom calendar will react to selectedBatchId changes via signal
  }
}
import { Component, signal, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  FullCalendarModule,
  FullCalendarComponent
} from '@fullcalendar/angular';
import {
  CalendarOptions,
  EventInput,
  DateSelectArg,
  EventClickArg,
  EventDropArg,
  EventChangeArg
} from '@fullcalendar/core';
import { ResourceInput } from '@fullcalendar/resource';

import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import multimonthPlugin from '@fullcalendar/multimonth';

import { CourseScheduleService, CourseSession, CreateSessionDto, UpdateSessionDto } from '../../services/course-schedule.service';
import { BatchService, Batch } from '../../services/batch.service';
import { ModulesService, ModuleTask } from '../../services/modules.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-timetable',
  standalone: true,
  imports: [CommonModule, FormsModule, FullCalendarModule],
  templateUrl: './timetable.component.html',
  styleUrl: './timetable.component.scss'
})
export class TimetableComponent implements AfterViewInit {
  @ViewChild('fullCalendar') fullCalendarComponent!: FullCalendarComponent;

  calendarOptions: CalendarOptions = {
    plugins: [resourceTimelinePlugin, dayGridPlugin, timeGridPlugin, interactionPlugin, multimonthPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: false,
    slotMinTime: '08:00:00',
    slotMaxTime: '18:00:00',
    slotDuration: '02:00:00',
    slotLabelInterval: '02:00:00',
    slotLabelFormat: { hour: '2-digit', minute: '2-digit', hour12: true },
    allDaySlot: false,
    height: 'auto',
    contentHeight: 'auto',
    lazyFetching: true,
    forceEventDuration: true,
    eventDisplay: 'block',
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    },
    dayMaxEvents: true,
    selectable: true,
    editable: true,
    droppable: false,
    nowIndicator: true,
    weekends: false,
    businessHours: {
      daysOfWeek: [1, 2, 3, 4, 5],
      startTime: '08:00',
      endTime: '17:00'
    },
    datesSet: (arg: any) => {
      const start = arg.start.toISOString();
      const end = arg.end.toISOString();
      this.loadSessions(start, end);
    }
  };

  sessions = signal<CourseSession[]>([]);
  batches = signal<Array<{ batchId: number; batchCode: string; courseName: string }>>([]);
  moduleTasks = signal<ModuleTask[]>([]);

  currentView = signal<string>('dayGridMonth');
  resourceGroup = signal<string>('batch');
  selectedBatchId = signal<number>(0);

  isLoading = signal(false);
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

  readonly views = [
    { id: 'dayGridMonth', label: 'Calendar', icon: 'fa-calendar-days' },
    { id: 'multiMonthYear', label: 'Year', icon: 'fa-calendar-plus' }
  ];

  constructor(
    private batchService: BatchService,
    private scheduleService: CourseScheduleService,
    private modulesService: ModulesService,
    private toast: ToastService
  ) {}

  ngAfterViewInit(): void {
    this.loadCurrentBatch();
    this.loadBatches();
    this.loadModuleTasks();
  }

  private loadCurrentBatch(): void {
    this.batchService.getCurrentBatch().subscribe({
      next: () => {
        this.refreshCalendar();
      },
      error: () => {
        this.loadBatches();
      }
    });
  }

  private loadBatches(): void {
    this.batchService.getInstructorBatches().subscribe({
      next: () => {
        this.batches.set(this.batchService.batches());
        if (this.batchService.currentBatchId() > 0 && this.selectedBatchId() === 0) {
          this.selectedBatchId.set(this.batchService.currentBatchId());
        } else if (this.selectedBatchId() === 0 && this.batches().length > 0) {
          this.selectedBatchId.set(this.batches()[0].batchId);
        }
        this.refreshCalendar();
      },
      error: () => {}
    });
  }

  private refreshCalendar(): void {
    if (this.fullCalendarComponent) {
      const api = this.fullCalendarComponent.getApi();
      api.refetchEvents();
    }
  }

  private loadSessions(start: string, end: string): void {
    this.isLoading.set(true);
    this.scheduleService.getSessions(this.selectedBatchId() || undefined, start, end).subscribe({
      next: (data) => {
        this.sessions.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  onDateSelect = (arg: DateSelectArg): void => {
    const calendar = this.fullCalendarComponent?.getApi();
    const view = calendar?.view?.type || '';
    let start = arg.start;
    let end = arg.end;

    if (view.startsWith('resourceTimeline')) {
      start = arg.start;
      end = arg.end || new Date(start.getTime() + 120 * 60000);
    } else {
      end = arg.end || new Date(start.getTime() + 120 * 60000);
    }

    this.openCreateModal(start, end);
  };

  onEventClick = (arg: EventClickArg): void => {
    const session = this.sessions().find(s => s.appointmentId === Number(arg.event.id));
    if (session) {
      this.openViewModal(session);
    }
  };

  onEventDrop = async (arg: EventDropArg): Promise<void> => {
    const sessionId = Number(arg.event.id);
    const start = arg.event.start!;
    const end = arg.event.end || new Date(start.getTime() + 120 * 60000);

    const resource = (arg.event as any)._resource;
    if (!resource) {
      arg.revert();
      this.toast.error('Please assign a batch resource');
      return;
    }

    const resourceId = resource.id;
    const updates = this.buildResourceUpdates(resourceId);

    try {
      await this.scheduleService.checkConflicts({
        batchId: updates.batchId || this.getBatchIdFromEvent(arg.event),
        startDateTime: start.toISOString(),
        endDateTime: end.toISOString(),
        excludeSessionId: sessionId
      }).toPromise();

      this.scheduleService.updateSession(sessionId, {
        startDateTime: start.toISOString(),
        endDateTime: end.toISOString(),
        ...updates
      }).subscribe({
        next: () => this.refreshCalendar(),
        error: () => arg.revert()
      });
    } catch (err) {
      arg.revert();
      this.toast.warning('Cannot move session: conflict detected');
    }
  };

  onEventResize = async (arg: EventChangeArg): Promise<void> => {
    const sessionId = Number(arg.event.id);
    const start = arg.event.start!;
    const end = arg.event.end || new Date(start.getTime() + 120 * 60000);

    const resource = (arg.event as any)._resource;
    if (!resource) {
      arg.revert();
      this.toast.error('Please assign a batch resource');
      return;
    }

    const resourceId = resource.id;
    const updates = this.buildResourceUpdates(resourceId);

    try {
      await this.scheduleService.checkConflicts({
        batchId: this.getBatchIdFromEvent(arg.event),
        startDateTime: start.toISOString(),
        endDateTime: end.toISOString(),
        excludeSessionId: sessionId
      }).toPromise();

      this.scheduleService.updateSession(sessionId, {
        startDateTime: start.toISOString(),
        endDateTime: end.toISOString(),
        ...updates
      }).subscribe({
        next: () => this.refreshCalendar(),
        error: () => arg.revert()
      });
    } catch (err) {
      arg.revert();
      this.toast.warning('Cannot resize session: conflict detected');
    }
  };

  private buildResourceUpdates(resourceId: string | number): Partial<UpdateSessionDto> {
    const id = String(resourceId);
    const updates: Partial<UpdateSessionDto> = {};

    if (id.startsWith('batch-')) {
      const batchId = Number(id.replace('batch-', ''));
      const batch = this.batches().find(b => b.batchId === batchId);
      if (batch) updates.batchId = batch.batchId;
    }

    return updates;
  }

  private getBatchIdFromEvent(event: any): number {
    const session = this.sessions().find(s => s.appointmentId === Number(event.id));
    return session?.batchId || 1;
  }

  changeView(viewId: string): void {
    this.currentView.set(viewId);
    const calendar = this.fullCalendarComponent?.getApi();
    if (calendar) calendar.changeView(viewId);
  }

  changeGroup(group: string): void {
    this.resourceGroup.set(group);
    this.refreshCalendar();
  }

  onBatchFilterChange(): void {
    this.refreshCalendar();
  }

  getCalendarOptions(): CalendarOptions {
    const group = this.resourceGroup();
    const selectedBatch = this.selectedBatchId();
    let resourceData: ResourceInput[] = [];

    resourceData = this.batches().map(b => ({
      id: `batch-${b.batchId}`,
      title: `${b.batchCode} - ${b.courseName}`,
      batchId: b.batchId,
      eventColor: b.batchId % 2 === 0 ? '#3b82f6' : '#6366f1'
    }));

    if (selectedBatch > 0) {
      resourceData = resourceData.filter(r => (r as any).batchId === selectedBatch);
    }

    const sessionTypeColorFn = (session: CourseSession): string => {
      if (session.color) return session.color;
      const colors: Record<string, string> = {
        'Theory': '#3b82f6',
        'Practical': '#10b981',
        'Exam': '#ef4444',
        'Assessment': '#f59e0b',
        'Orientation': '#8b5cf6'
      };
      const type = session.sessionType || 'Theory';
      return colors[type] || '#6366f1';
    };

    const events: EventInput[] = this.sessions().map(s => ({
      id: String(s.appointmentId),
      title: s.text,
      start: s.startDateTime,
      end: s.endDateTime,
      allDay: s.allDay,
      resourceId: `batch-${s.batchId}`,
      backgroundColor: sessionTypeColorFn(s),
      borderColor: sessionTypeColorFn(s),
      textColor: '#ffffff',
      extendedProps: {
        description: s.description,
        batchCode: s.batchCode,
        courseName: s.courseName,
        instructorName: s.instructorName,
        centerName: s.centerName,
        moduleName: s.moduleName,
        sessionType: s.sessionType,
        status: s.status,
        isPublished: s.isPublished,
        items: s.items
      }
    }));

    return {
      ...this.calendarOptions,
      initialView: this.currentView(),
      events,
      resources: resourceData,
      resourceGroupField: 'batchId',
      resourceOrder: 'title',
      datesSet: (arg: any) => {
        this.loadSessions(arg.start.toISOString(), arg.end.toISOString());
      },
      select: this.onDateSelect,
      eventClick: this.onEventClick,
      eventDrop: this.onEventDrop,
      eventResize: this.onEventResize,
      selectAllow: (arg: any) => {
        if (!arg.end) return false;
        const diff = (arg.end.getTime() - arg.start.getTime()) / 60000;
        const durationHours = diff / 60;
        return durationHours === 2;
      },
      eventContent: (arg: any) => {
        const el = document.createElement('div');
        el.className = 'fc-event-custom';

        const title = document.createElement('div');
        title.className = 'fc-event-title';
        title.textContent = arg.event.title || 'Untitled Session';

        const meta = document.createElement('div');
        meta.className = 'fc-event-meta';
        const ext = arg.event.extendedProps;
        meta.textContent = ext.batchCode || '';

        el.appendChild(title);
        el.appendChild(meta);

        const dom = { domNodes: [el] };
        return dom;
      },
      resourceAreaColumns: [
        {
          headerContent: (arg: any) => {
            const el = document.createElement('span');
            el.innerHTML = `<i class="fas fa-users me-2"></i>${arg.text}`;
            return { domNodes: [el] };
          },
          field: 'title'
        }
      ]
    };
  }

  openCreateModal(start?: Date, end?: Date): void {
    const currentBatchId = this.batchService.currentBatchId() || this.batches()[0]?.batchId;
    const batch = currentBatchId || 0;
    this.formData = {
      text: '',
      description: '',
      batchId: batch,
      sessionType: 'Theory',
      allDay: false,
      startDateTime: start ? start.toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      endDateTime: end ? end.toISOString().slice(0, 16) : new Date(Date.now() + 120 * 60000).toISOString().slice(0, 16)
    };
    this.loadModuleTasks();
    this.modalMode.set('create');
    this.editingSession.set(null);
    this.errorMessage.set('');
    this.showModal.set(true);
    if (batch > 0 && this.selectedBatchId() === 0) {
      this.selectedBatchId.set(batch);
    }
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
        this.refreshCalendar();
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
    const color = dto.sessionType === 'Practical' ? '#10b981' :
                  dto.sessionType === 'Exam' ? '#ef4444' :
                  dto.sessionType === 'Assessment' ? '#f59e0b' :
                  dto.sessionType === 'Orientation' ? '#8b5cf6' : '#3b82f6';

    this.scheduleService.createSession({ ...dto, color }).subscribe({
      next: () => {
        this.showModal.set(false);
        this.refreshCalendar();
      }
    });
  }

  private updateSession(): void {
    const session = this.editingSession();
    if (!session) return;

    const dto: UpdateSessionDto = {
      ...this.formData
    };

    this.scheduleService.updateSession(session.appointmentId, dto).subscribe({
      next: () => {
        this.showModal.set(false);
        this.editingSession.set(null);
        this.refreshCalendar();
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

  getEventColor(session: CourseSession | CreateSessionDto): string {
    if ('color' in session && session.color) return session.color;
    const colors: Record<string, string> = {
      'Theory': '#3b82f6',
      'Practical': '#10b981',
      'Exam': '#ef4444',
      'Assessment': '#f59e0b',
      'Orientation': '#8b5cf6'
    };
    const type = ('sessionType' in session && session.sessionType) ? session.sessionType : 'Theory';
    return colors[type] || '#6366f1';
  }

  getTodayLabel(): string {
    const now = new Date();
    return now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  onTodayClick(): void {
    const calendar = this.fullCalendarComponent?.getApi();
    if (calendar) calendar.today();
  }

  onPrev(): void {
    const calendar = this.fullCalendarComponent?.getApi();
    if (calendar) calendar.prev();
  }

  onNext(): void {
    const calendar = this.fullCalendarComponent?.getApi();
    if (calendar) calendar.next();
  }

  getHeaderDateLabel(): string {
    const calendar = this.fullCalendarComponent?.getApi();
    if (!calendar) return '';
    const view = calendar.view;
    const current = view.currentStart;
    const end = view.currentEnd;

    const format = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const viewType = this.currentView();
    if (viewType.includes('Day')) return format(current);
    if (viewType.includes('Week')) return `${format(current)} - ${format(new Date(end.getTime() - 1))}`;
    if (viewType.includes('Month') || viewType.includes('multiMonth')) {
      return current.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    return format(current);
  }

  onPrint(): void {
    window.print();
  }

  onExport(): void {
    this.toast.info('Export feature coming soon!');
  }

  toNumber(value: string): number {
    return parseInt(value, 10);
  }
}

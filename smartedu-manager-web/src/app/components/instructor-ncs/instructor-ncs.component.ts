import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NcsService, NCS } from '../../services/ncs.service';
import { ModulesService, Module } from '../../services/modules.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { InstructorService } from '../../services/instructor.service';
import { CourseService, Course } from '../../services/course.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-instructor-ncs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-left">
          <h2>NCS & Modules</h2>
          <p>View curriculum for your assigned course</p>
        </div>
        @if (assignedCourseIds().length > 0) {
          <select [(ngModel)]="selectedCourseId" (ngModelChange)="onCourseChange($event)" style="margin-left: auto; padding: 8px 12px; border-radius: 6px; border: 1px solid #d1d5db;">
            @for (courseId of assignedCourseIds(); track courseId) {
              <option [value]="courseId">{{ getCourseName(courseId) }}</option>
            }
          </select>
        }
      </div>

      @if (!assignedCourseIds().length) {
        <div class="empty-state-card">
          <i class="fas fa-exclamation-circle"></i>
          <h3>No Course Assigned</h3>
          <p>You haven't been assigned to any course yet. Please contact your administrator.</p>
        </div>
      } @else {
        <div class="tabs-container">
          <button class="tab-btn" [class.active]="activeTab() === 'ncs'" (click)="setTab('ncs')">
            <i class="fas fa-book"></i> NCS
          </button>
          <button class="tab-btn" [class.active]="activeTab() === 'modules'" (click)="setTab('modules')">
            <i class="fas fa-layer-group"></i> Modules
          </button>
          <button class="tab-btn" [class.active]="activeTab() === 'tasks'" (click)="setTab('tasks')">
            <i class="fas fa-tasks"></i> Tasks
          </button>
        </div>

        <div class="filters-section">
          <div class="search-box">
            <i class="fas fa-search"></i>
            <input type="text" [placeholder]="activeTab() === 'ncs' ? 'Search NCS...' : activeTab() === 'modules' ? 'Search modules...' : 'Search tasks...'" 
                   [ngModel]="searchTerm()" (ngModelChange)="searchTerm.set($event)">
          </div>
          @if (activeTab() === 'ncs') {
            <span class="filter-info">{{ filteredNCS().length }} NCS records found</span>
          }
          @if (activeTab() === 'modules') {
            <span class="filter-info">{{ filteredModules().length }} modules found</span>
          }
          @if (activeTab() === 'tasks') {
            <span class="filter-info">{{ filteredTasks().length }} tasks found</span>
          }
        </div>

        @if (activeTab() === 'ncs') {
          <div class="table-card">
            @if (isLoading()) {
              <div class="loading-overlay">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Loading NCS...</span>
              </div>
            }
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Version</th>
                    <th>Name</th>
                    <th>Updated Date</th>
                    <th>Modules</th>
                  </tr>
                </thead>
                <tbody>
                  @for (ncs of filteredNCS(); track ncs.id) {
                    <tr>
                      <td><span class="badge badge-info">{{ ncs.version }}</span></td>
                      <td>{{ ncs.name }}</td>
                      <td>{{ ncs.updatedDate | date:'mediumDate' }}</td>
                      <td><span class="badge badge-secondary">{{ ncs.modules.length }}</span></td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="4" class="empty-state">
                        <i class="fas fa-book"></i>
                        <p>No NCS records found for your course</p>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        @if (activeTab() === 'modules') {
          <div class="table-card">
            @if (isLoading()) {
              <div class="loading-overlay">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Loading modules...</span>
              </div>
            }
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Module No</th>
                    <th>Module Name</th>
                    <th>NCS</th>
                    <th>Theory Hours</th>
                    <th>Practical Hours</th>
                  </tr>
                </thead>
                <tbody>
                  @for (module of filteredModules(); track module.id) {
                    <tr>
                      <td><span class="badge badge-info">{{ module.moduleNo }}</span></td>
                      <td>{{ module.moduleName }}</td>
                      <td>{{ getNCSName(module.ncsId) }}</td>
                      <td>{{ module.theoryHours }} hrs</td>
                      <td>{{ module.practicalHours }} hrs</td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="5" class="empty-state">
                        <i class="fas fa-layer-group"></i>
                        <p>No modules found for your course</p>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        @if (activeTab() === 'tasks') {
          <div class="table-card">
            @if (isLoading()) {
              <div class="loading-overlay">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Loading tasks...</span>
              </div>
            }
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Task No</th>
                    <th>Task Name</th>
                    <th>Module</th>
                  </tr>
                </thead>
                <tbody>
                  @for (task of filteredTasks(); track task.id) {
                    <tr>
                      <td><span class="badge badge-info">{{ task.taskNo }}</span></td>
                      <td>{{ task.taskName }}</td>
                      <td>{{ getModuleName(task.moduleId) }}</td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="3" class="empty-state">
                        <i class="fas fa-tasks"></i>
                        <p>No tasks found for your course</p>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 16px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; padding: 0 0 12px 0; border-bottom: 1px solid #e5e7eb; }
    .page-header .header-left h2 { font-size: 22px; font-weight: 600; color: #111827; margin: 0 0 2px 0; }
    .page-header .header-left p { color: #6b7280; font-size: 12px; margin: 0; }
    .course-badge { background: #e0e7ff; color: #6366f1; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .tabs-container { display: flex; gap: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px; }
    .tab-btn { padding: 8px 16px; border: none; background: #f3f4f6; border-radius: 6px; cursor: pointer; font-size: 14px; }
    .tab-btn.active { background: #6366f1; color: white; }
    .filters-section { display: flex; align-items: center; gap: 12px; }
    .search-box { position: relative; flex: 1; max-width: 300px; }
    .search-box i { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #6b7280; }
    .search-box input { width: 100%; padding: 8px 10px 8px 30px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px; }
    .filter-info { font-size: 12px; color: #6b7280; }
    .empty-state-card { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 40px; text-align: center; color: #dc2626; }
    .empty-state-card i { font-size: 40px; margin-bottom: 12px; }
    .table-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; }
    .table-responsive { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #f3f4f6; }
    .data-table th { background: #f9fafb; font-size: 12px; font-weight: 600; color: #374151; }
    .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
    .badge-info { background: #e0e7ff; color: #6366f1; }
    .badge-secondary { background: #f3f4f6; color: #6b7280; }
    .empty-state { text-align: center; padding: 40px; color: #9ca3af; }
    .loading-overlay { display: flex; align-items: center; gap: 8px; padding: 20px; color: #6b7280; }
  `]
})
export class InstructorNcsComponent implements OnInit {
  private ncsService = inject(NcsService);
  private modulesService = inject(ModulesService);
  private authService = inject(AuthService);
  private instructorService = inject(InstructorService);
  private toast = inject(ToastService);
  private http = inject(HttpClient);
  private courseService = inject(CourseService);

  activeTab = signal<'ncs' | 'modules' | 'tasks'>('ncs');
  searchTerm = signal('');
  isLoading = signal(false);

  assignedCourseIds = signal<number[]>([]);
  selectedCourseId = signal<number | null>(null);
  tasks = signal<any[]>([]);

  ngOnInit(): void {
    this.loadInstructorCourses();
    this.loadCourses();
  }

  private loadInstructorCourses(): void {
    const user = this.authService.getUser();
    if (user?.roles.includes('Instructor') && !user.roles.includes('Admin')) {
      this.instructorService.getInstructors().subscribe({
        next: (instructors) => {
          const instructor = instructors.find(i => i.email?.toLowerCase() === user.email?.toLowerCase());
          if (instructor?.courseIds?.length) {
            this.assignedCourseIds.set(instructor.courseIds);
            this.selectedCourseId.set(instructor.courseIds[0]);
            this.loadNCSByCourse(instructor.courseIds[0]);
          }
        },
        error: () => {
          this.toast.error('Failed to load instructor data');
        }
      });
    }
  }

  onCourseChange(courseId: number): void {
    this.selectedCourseId.set(courseId);
    this.loadNCSByCourse(courseId);
  }

  private loadNCSByCourse(courseId: number): void {
    this.isLoading.set(true);
    this.ncsService.getNCSByCourse(courseId).subscribe({
      next: (data) => {
        this.ncsService.ncsList.set(data);
        this.loadModules();
        this.loadTasks();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading NCS:', err);
        this.isLoading.set(false);
      }
    });
  }

  private loadCourses(): void {
    this.courseService.getCourses().subscribe();
  }

  private loadModules(): void {
    this.modulesService.getModules().subscribe();
  }

  private loadTasks(): void {
    this.http.get<any[]>(`${environment.apiUrl}/moduletasks`).subscribe({
      next: (data) => this.tasks.set(data)
    });
  }

  setTab(tab: 'ncs' | 'modules' | 'tasks'): void {
    this.activeTab.set(tab);
  }

  getNCSName(ncsId: number): string {
    const ncs = this.ncsService.ncsList().find(n => n.id === ncsId);
    return ncs?.name || 'Unknown NCS';
  }

  getCourseName(courseId: number): string {
    const course = this.courseService.courses().find(c => c.courseId === courseId);
    return course?.courseName || 'Unknown Course';
  }

  getModuleName(moduleId: number): string {
    const module = this.modulesService.modules().find(m => m.id === moduleId);
    return module?.moduleName || 'Unknown Module';
  }

  filteredNCS = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const list = this.ncsService.ncsList();
    if (!term) return list;
    return list.filter(n => 
      n.name?.toLowerCase().includes(term) ||
      n.version?.toLowerCase().includes(term)
    );
  });

  filteredModules = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const modules = this.modulesService.modules();
    const ncsList = this.ncsService.ncsList();
    
    const courseNcsIds = ncsList.map(n => n.id);
    let list = modules.filter(m => courseNcsIds.includes(m.ncsId));
    
    if (!term) return list;
    return list.filter(m =>
      m.moduleName?.toLowerCase().includes(term) ||
      m.moduleNo?.toLowerCase().includes(term)
    );
  });

  filteredTasks = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const modules = this.modulesService.modules();
    const moduleIds = modules.map(m => m.id);
    let list = this.tasks().filter(t => moduleIds.includes(t.moduleId));
    
    if (!term) return list;
    return list.filter(t =>
      t.taskNo?.toLowerCase().includes(term) ||
      t.taskName?.toLowerCase().includes(term)
    );
  });
}
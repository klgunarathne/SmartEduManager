import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InstructorService, Instructor, CreateInstructor } from '../../services/instructor.service';
import { CourseService, Course } from '../../services/course.service';
import { NcsService, NCS, CreateNCS } from '../../services/ncs.service';
import { ModulesService, Module, CreateModule } from '../../services/modules.service';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-instructors',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './instructors.html',
  styleUrl: './instructors.scss'
})
export class InstructorsComponent implements OnInit {
  activeTab = signal<'instructors' | 'ncs' | 'modules' | 'tasks'>('instructors');

  showInstructorModal = signal(false);
  instructorModalMode = signal<'add' | 'edit'>('add');

  showNCSModal = signal(false);
  ncsModalMode = signal<'add' | 'edit'>('add');

  showModuleModal = signal(false);
  moduleModalMode = signal<'add' | 'edit'>('add');

  showTaskModal = signal(false);
  taskModalMode = signal<'add' | 'edit'>('add');

  searchTerm = signal('');
  currentPage = signal(1);
  pageSize = 10;

  selectedInstructor: CreateInstructor = this.getEmptyInstructor();
  selectedNCS: CreateNCS = this.getEmptyNCS();
  selectedModule: CreateModule = this.getEmptyModule();
  selectedNCSForModules: NCS | null = null;
  selectedTask: any = this.getEmptyTask();

  tasks = signal<any[]>([]);
  selectedModuleForTasks = signal<number>(0);

  get isInstructor(): boolean {
    return this.authService.isInstructor();
  }

  constructor(
    private instructorService: InstructorService,
    private courseService: CourseService,
    private ncsService: NcsService,
    private modulesService: ModulesService,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    if (this.isInstructor) {
      this.activeTab.set('ncs');
      this.loadNCS();
      this.loadModules();
    } else {
      this.loadInstructors();
      this.loadNCS();
      this.loadModules();
    }
    this.loadCourses();
    this.loadTasks();
  }

  private loadInstructors(): void {
    this.instructorService.getInstructors().subscribe();
  }

  private loadCourses(): void {
    this.courseService.getCourses().subscribe();
  }

  private loadNCS(): void {
    this.ncsService.getNCS().subscribe();
  }

  private loadModules(): void {
    this.modulesService.getModules().subscribe();
  }

  private loadTasks(): void {
    this.http.get<any[]>(`${environment.apiUrl}/moduletasks`).subscribe({
      next: (data) => this.tasks.set(data)
    });
  }

  private getEmptyInstructor(): CreateInstructor {
    return { epfNo: '', fullName: '', nic: '', email: '', phone: '' };
  }

  private getEmptyNCS(): CreateNCS {
    return { version: '', name: '', updatedDate: new Date().toISOString().split('T')[0], courseId: 0 };
  }

  private getEmptyModule(): CreateModule {
    return { moduleNo: '', moduleName: '', theoryHours: 0, practicalHours: 0, ncsId: 0 };
  }

  private getEmptyTask(): any {
    return { taskNo: '', taskName: '', moduleId: 0 };
  }

  setTab(tab: 'instructors' | 'ncs' | 'modules' | 'tasks'): void {
    this.activeTab.set(tab);
    this.currentPage.set(1);
    this.searchTerm.set('');
  }

  openAddInstructorModal(): void {
    this.selectedInstructor = this.getEmptyInstructor();
    this.instructorModalMode.set('add');
    this.showInstructorModal.set(true);
  }

  openEditInstructorModal(instructor: Instructor): void {
    this.selectedInstructor = {
      epfNo: instructor.epfNo,
      fullName: instructor.fullName,
      nic: instructor.nic,
      email: instructor.email,
      phone: instructor.phone
    };
    this.instructorModalMode.set('edit');
    this.showInstructorModal.set(true);
  }

  closeInstructorModal(): void {
    this.showInstructorModal.set(false);
    this.selectedInstructor = this.getEmptyInstructor();
  }

  saveInstructor(): void {
    if (this.instructorModalMode() === 'add') {
      this.instructorService.createInstructor(this.selectedInstructor).subscribe({
        next: () => this.closeInstructorModal(),
        error: (error) => alert('Failed to create instructor: ' + (error.error?.message || error.message))
      });
    } else {
      const instructor = this.instructorService.instructors().find(i => i.epfNo === this.selectedInstructor.epfNo);
      if (instructor) {
        this.instructorService.updateInstructor(instructor.instructorId, this.selectedInstructor).subscribe({
          next: () => this.closeInstructorModal(),
          error: (error) => alert('Failed to update instructor: ' + (error.error?.message || error.message))
        });
      }
    }
  }

  deleteInstructor(instructor: Instructor): void {
    if (confirm(`Are you sure you want to delete ${instructor.fullName}?`)) {
      this.instructorService.deleteInstructor(instructor.instructorId).subscribe({
        next: () => {},
        error: () => alert('Failed to delete instructor')
      });
    }
  }

  openAddNCSModal(): void {
    this.selectedNCS = this.getEmptyNCS();
    this.ncsModalMode.set('add');
    this.showNCSModal.set(true);
  }

  openEditNCSModal(ncs: NCS): void {
    this.selectedNCS = {
      version: ncs.version,
      name: ncs.name,
      updatedDate: ncs.updatedDate.split('T')[0],
      courseId: ncs.courseId
    };
    this.ncsModalMode.set('edit');
    this.showNCSModal.set(true);
  }

  closeNCSModal(): void {
    this.showNCSModal.set(false);
    this.selectedNCS = this.getEmptyNCS();
  }

  saveNCS(): void {
    if (this.ncsModalMode() === 'add') {
      this.ncsService.createNCS(this.selectedNCS).subscribe({
        next: () => this.closeNCSModal(),
        error: (error) => alert('Failed to create NCS: ' + (error.error?.message || error.message))
      });
    } else {
      const ncs = this.ncsService.ncsList().find(n => n.name === this.selectedNCS.name && n.courseId === this.selectedNCS.courseId);
      if (ncs) {
        this.ncsService.updateNCS(ncs.id, this.selectedNCS).subscribe({
          next: () => this.closeNCSModal(),
          error: (error) => alert('Failed to update NCS: ' + (error.error?.message || error.message))
        });
      }
    }
  }

  deleteNCS(ncs: NCS): void {
    if (confirm(`Are you sure you want to delete ${ncs.name}?`)) {
      this.ncsService.deleteNCS(ncs.id).subscribe({
        next: () => {},
        error: () => alert('Failed to delete NCS')
      });
    }
  }

  openAddModuleModal(): void {
    this.selectedModule = this.getEmptyModule();
    this.moduleModalMode.set('add');
    this.showModuleModal.set(true);
  }

  openEditModuleModal(module: Module): void {
    this.selectedModule = {
      moduleNo: module.moduleNo,
      moduleName: module.moduleName,
      theoryHours: module.theoryHours,
      practicalHours: module.practicalHours,
      ncsId: module.ncsId
    };
    this.moduleModalMode.set('edit');
    this.showModuleModal.set(true);
  }

  closeModuleModal(): void {
    this.showModuleModal.set(false);
    this.selectedModule = this.getEmptyModule();
  }

  saveModule(): void {
    if (this.selectedModule.ncsId === 0) {
      alert('Please select an NCS');
      return;
    }

    if (this.moduleModalMode() === 'add') {
      this.modulesService.createModule(this.selectedModule).subscribe({
        next: () => this.closeModuleModal(),
        error: (error) => alert('Failed to create module: ' + (error.error?.message || error.message))
      });
    } else {
      const module = this.modulesService.modules().find(m => m.moduleNo === this.selectedModule.moduleNo && m.ncsId === this.selectedModule.ncsId);
      if (module) {
        this.modulesService.updateModule(module.id, this.selectedModule).subscribe({
          next: () => this.closeModuleModal(),
          error: (error) => alert('Failed to update module: ' + (error.error?.message || error.message))
        });
      }
    }
  }

  deleteModule(module: Module): void {
    if (confirm(`Are you sure you want to delete ${module.moduleName}?`)) {
      this.modulesService.deleteModule(module.id).subscribe({
        next: () => {},
        error: () => alert('Failed to delete module')
      });
    }
  }

  openAddTaskModal(): void {
    this.selectedTask = this.getEmptyTask();
    this.taskModalMode.set('add');
    this.showTaskModal.set(true);
  }

  openEditTaskModal(task: any): void {
    this.selectedTask = { ...task };
    this.taskModalMode.set('edit');
    this.showTaskModal.set(true);
  }

  closeTaskModal(): void {
    this.showTaskModal.set(false);
    this.selectedTask = this.getEmptyTask();
  }

  saveTask(): void {
    if (!this.selectedTask.taskNo.trim() || !this.selectedTask.taskName.trim() || this.selectedTask.moduleId === 0) {
      alert('Please fill all fields and select a module');
      return;
    }

    const isEdit = this.taskModalMode() === 'edit';
    const url = `${environment.apiUrl}/moduletasks${isEdit ? '/' + this.selectedTask.id : ''}`;
    const method = isEdit ? 'put' : 'post';

    this.http[method](url, this.selectedTask, { responseType: 'text' }).subscribe({
      next: () => {
        this.closeTaskModal();
        this.loadTasks();
      },
      error: () => alert('Failed to save task')
    });
  }

  deleteTask(task: any): void {
    if (!confirm(`Delete task "${task.taskNo} - ${task.taskName}"?`)) return;
    this.http.delete(`${environment.apiUrl}/moduletasks/${task.id}`, { responseType: 'text' }).subscribe({
      next: () => this.loadTasks(),
      error: () => alert('Failed to delete task')
    });
  }

  get instructors(): Instructor[] {
    return this.instructorService.instructors();
  }

  get courses(): Course[] {
    return this.courseService.courses();
  }

  get ncsList(): NCS[] {
    return this.ncsService.ncsList();
  }

  get modules(): Module[] {
    return this.modulesService.modules();
  }

  get filteredTasks(): any[] {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.tasks();
    return this.tasks().filter(t =>
      t.taskNo?.toLowerCase().includes(term) ||
      t.taskName?.toLowerCase().includes(term)
    );
  }

  get isLoading(): boolean {
    return this.instructorService.isLoading() || this.ncsService.isLoading() || this.modulesService.isLoading();
  }

  get filteredInstructors(): Instructor[] {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.instructors;
    return this.instructors.filter(i =>
      i.fullName?.toLowerCase().includes(term) ||
      i.epfNo?.toLowerCase().includes(term) ||
      i.email?.toLowerCase().includes(term) ||
      i.nic?.toLowerCase().includes(term)
    );
  }

  get filteredNCS(): NCS[] {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.ncsList;
    return this.ncsList.filter(n =>
      n.name?.toLowerCase().includes(term) ||
      n.version?.toLowerCase().includes(term) ||
      n.courseName?.toLowerCase().includes(term)
    );
  }

  get filteredModules(): Module[] {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.modules;
    return this.modules.filter(m =>
      m.moduleName?.toLowerCase().includes(term) ||
      m.moduleNo?.toLowerCase().includes(term)
    );
  }

  get paginatedInstructors(): Instructor[] {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredInstructors.slice(start, start + this.pageSize);
  }

  get paginatedNCS(): NCS[] {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredNCS.slice(start, start + this.pageSize);
  }

  get paginatedModules(): Module[] {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredModules.slice(start, start + this.pageSize);
  }

  get paginatedTasks(): any[] {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredTasks.slice(start, start + this.pageSize);
  }

  totalPagesCount(): number {
    const items = this.activeTab() === 'instructors' ? this.filteredInstructors :
                  this.activeTab() === 'ncs' ? this.filteredNCS :
                  this.activeTab() === 'tasks' ? this.filteredTasks : this.filteredModules;
    return Math.ceil(items.length / this.pageSize);
  }

  prevPage(): void {
    if (this.currentPage() > 1) this.currentPage.update(p => p - 1);
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPagesCount()) this.currentPage.update(p => p + 1);
  }

  getInitials(name: string): string {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '';
  }

  getAvatarColor(name: string): string {
    const colors = [
      'linear-gradient(135deg, #6366f1, #8b5cf6)',
      'linear-gradient(135deg, #10b981, #34d399)',
      'linear-gradient(135deg, #f59e0b, #fbbf24)',
      'linear-gradient(135deg, #ec4899, #f472b6)',
      'linear-gradient(135deg, #3b82f6, #60a5fa)'
    ];
    const index = name?.charCodeAt(0) || 0;
    return colors[index % colors.length];
  }

  getNCSCourseName(courseId: number): string {
    const course = this.courses.find(c => c.courseId === courseId);
    return course?.courseName || 'Unknown Course';
  }

  getModuleNCSName(ncsId: number): string {
    const ncs = this.ncsList.find(n => n.id === ncsId);
    return ncs?.name || 'Unknown NCS';
  }

  getModuleName(moduleId: number): string {
    const module = this.modules.find(m => m.id === moduleId);
    return module?.moduleName || 'Unknown Module';
  }
}

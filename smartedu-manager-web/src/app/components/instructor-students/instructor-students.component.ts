import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentService, Student, CreateStudentDto, UpdateStudentDto, STUDENT_FIELDS, CsvStudentRow, CsvMapping } from '../../services/student.service';
import { BatchService, Batch } from '../../services/batch.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { concatMap, finalize, from } from 'rxjs';

@Component({
  selector: 'app-instructor-students',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-content">
          <h2>Students</h2>
          <p>Manage and view all students</p>
        </div>
        <div class="header-actions">
          <div class="stat">
            <span class="stat-value">{{ students().length }}</span>
            <span class="stat-label">Total Students</span>
          </div>
          <button class="btn-csv" (click)="openCsvUploadModal()">
            <i class="fas fa-file-csv"></i> Import CSV
          </button>
          <button class="btn-primary" (click)="openCreateModal()">
            <i class="fas fa-plus"></i> Add Student
          </button>
        </div>
      </div>

      <div class="filters-section">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input 
            type="text" 
            placeholder="Search by name, MIS No, or NIC..." 
            [(ngModel)]="searchTerm" 
            (input)="filterStudents()"
          >
        </div>
        <div class="filter-group">
          <select [(ngModel)]="selectedBatchId" (change)="loadStudents()">
            <option [value]="0">All Batches</option>
            @for (batch of batches(); track batch.batchId) {
              <option [value]="batch.batchId">{{ batch.batchCode }}</option>
            }
          </select>
        </div>
      </div>
      
      @if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading students...</p>
        </div>
      } @else if (filteredStudents().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">
            <i class="fas fa-user-graduate"></i>
          </div>
          <h3>No Students Found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      } @else {
        <div class="table-card">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>MIS No</th>
                  <th>NIC</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Batch</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (student of filteredStudents(); track student.id) {
                  <tr>
                    <td>
                      <div class="student-info">
                        <div class="student-avatar">
                          <i class="fas fa-user"></i>
                        </div>
                        <div class="student-details">
                          <span class="student-name">{{ student.nameWithInitials }}</span>
                        </div>
                      </div>
                    </td>
                    <td><span class="mis-badge">{{ student.misNo }}</span></td>
                    <td>{{ student.nicNo }}</td>
                    <td>{{ student.email }}</td>
                    <td>{{ student.telephone }}</td>
                    <td><span class="batch-badge">{{ student.batchCode }}</span></td>
                    <td>
                      <div class="action-buttons">
                        <button class="action-btn edit" title="Edit" (click)="openEditModal(student)">
                          <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" title="Delete" (click)="deleteStudent(student)">
                          <i class="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>

    @if (showModal()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ isEditing() ? 'Edit Student' : 'Add New Student' }}</h3>
            <button class="modal-close" (click)="closeModal()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <form (ngSubmit)="saveStudent()">
              <div class="form-row">
                <div class="form-group">
                  <label>MIS No</label>
                  <input type="text" [(ngModel)]="formData.misNo" name="misNo" required>
                </div>
                <div class="form-group">
                  <label>Batch</label>
                  <select [(ngModel)]="formData.batchId" name="batchId" required>
                    <option [value]="0">Select Batch</option>
                    @for (batch of batches(); track batch.batchId) {
                      <option [value]="batch.batchId">{{ batch.batchCode }}</option>
                    }
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Name with Initials</label>
                  <input type="text" [(ngModel)]="formData.nameWithInitials" name="nameWithInitials" required>
                </div>
                <div class="form-group">
                  <label>Full Name</label>
                  <input type="text" [(ngModel)]="formData.fullName" name="fullName" required>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>NIC No</label>
                  <input type="text" [(ngModel)]="formData.nicNo" name="nicNo" required>
                </div>
                <div class="form-group">
                  <label>Gender</label>
                  <select [(ngModel)]="formData.gender" name="gender" required>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label>Address</label>
                <input type="text" [(ngModel)]="formData.address" name="address" required>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Telephone</label>
                  <input type="text" [(ngModel)]="formData.telephone" name="telephone" required>
                </div>
                <div class="form-group">
                  <label>Email</label>
                  <input type="email" [(ngModel)]="formData.email" name="email">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>GS Division</label>
                  <input type="text" [(ngModel)]="formData.gsDivision" name="gsDivision">
                </div>
                <div class="form-group">
                  <label>AG Division</label>
                  <input type="text" [(ngModel)]="formData.agDivision" name="agDivision">
                </div>
              </div>
              <div class="modal-actions">
                <button type="button" class="btn-secondary" (click)="closeModal()">Cancel</button>
                <button type="submit" class="btn-primary" [disabled]="saving()">
                  @if (saving()) {
                    <i class="fas fa-spinner fa-spin"></i>
                  }
                  {{ isEditing() ? 'Update' : 'Create' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }

    @if (showCsvModal()) {
      <div class="modal-overlay" (click)="closeCsvModal()">
        <div class="modal-content modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ csvStep() === 1 ? 'Upload CSV File' : 'Map CSV Columns' }}</h3>
            <button class="modal-close" (click)="closeCsvModal()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            @if (csvStep() === 1) {
              <div class="csv-upload-step">
                <div class="form-group">
                  <label>Select Batch</label>
                  <select [(ngModel)]="csvBatchId" name="csvBatchId">
                    <option [value]="0">Select Batch</option>
                    @for (batch of batches(); track batch.batchId) {
                      <option [value]="batch.batchId">{{ batch.batchCode }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label>Upload CSV File</label>
                  <div class="file-upload-area" (click)="fileInput.click()" (dragover)="onDragOver($event)" (drop)="onDrop($event)">
                    @if (csvFile()) {
                      <div class="file-selected">
                        <i class="fas fa-file-csv"></i>
                        <span>{{ csvFileName() }}</span>
                        <button type="button" class="btn-remove" (click)="removeCsvFile($event)">
                          <i class="fas fa-times"></i>
                        </button>
                      </div>
                    } @else {
                      <i class="fas fa-cloud-upload-alt"></i>
                      <p>Click or drag CSV file here</p>
                      <span class="file-hint">Supported: .csv files</span>
                    }
                    <input #fileInput type="file" accept=".csv" (change)="onFileSelected($event)" hidden>
                  </div>
                </div>
                <div class="modal-actions">
                  <button type="button" class="btn-secondary" (click)="closeCsvModal()">Cancel</button>
                  <button type="button" class="btn-primary" [disabled]="!csvFile() || csvBatchId() === 0" (click)="processCsvFile()">
                    Preview & Map
                  </button>
                </div>
              </div>
            } @else {
              <div class="csv-mapping-step">
                <p class="mapping-info">Map each CSV column to the corresponding student field. Required fields are marked with *.</p>
                <div class="mapping-table-container">
                  <table class="mapping-table">
                    <thead>
                      <tr>
                        <th>CSV Column</th>
                        <th>Preview</th>
                        <th>Map to Student Field</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (header of csvHeaders(); track header; let i = $index) {
                        <tr>
                          <td>{{ header }}</td>
                          <td class="preview-cell">{{ getCsvPreview(i) }}</td>
                          <td>
                            <select [ngModel]="csvMapping()[header]" (ngModelChange)="updateMapping(header, $event)">
                              <option value="">-- Ignore --</option>
                              @for (field of studentFields; track field.name) {
                                <option [value]="field.name">{{ field.label }}{{ field.required ? ' *' : '' }}</option>
                              }
                            </select>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
                <div class="import-progress" *ngIf="importing()">
                  <div class="progress-bar">
                    <div class="progress-fill" [style.width.%]="importProgress()"></div>
                  </div>
                  <p>Importing: {{ importSuccess() }} / {{ csvData().length }} students</p>
                </div>
                <div class="import-results" *ngIf="importComplete()">
                  <div class="result success">
                    <i class="fas fa-check-circle"></i>
                    <span>Successfully imported {{ importSuccess() }} students</span>
                  </div>
                  @if (importFailed() > 0) {
                    <div class="result error">
                      <i class="fas fa-exclamation-circle"></i>
                      <span>Failed to import {{ importFailed() }} students</span>
                    </div>
                  }
                </div>
                <div class="modal-actions">
                  <button type="button" class="btn-secondary" (click)="goToCsvStep(1)" [disabled]="importing()">Back</button>
                  <button type="button" class="btn-primary" (click)="importStudents()" [disabled]="importing() || importComplete()">
                    Import Students
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 24px; }
    
    .page-header {
      display: flex; justify-content: space-between; align-items: center;
      background: linear-gradient(135deg, #1e293b, #0f172a); border-radius: 20px;
      padding: 24px 30px; color: white;
    }
    .header-content h2 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
    .header-content p { opacity: 0.8; font-size: 14px; }
    .header-actions { display: flex; align-items: center; gap: 24px; }
    .stat { text-align: right; }
    .stat-value { display: block; font-size: 28px; font-weight: 700; }
    .stat-label { opacity: 0.8; font-size: 13px; }
    
    .btn-primary {
      display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px;
      background: #6366f1; color: white; border: none; border-radius: 10px;
      font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.3s;
    }
    .btn-primary:hover { background: #4f46e5; transform: translateY(-1px); }
    .btn-csv {
      display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px;
      background: #10b981; color: white; border: none; border-radius: 10px;
      font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.3s;
    }
    .btn-csv:hover { background: #059669; transform: translateY(-1px); }
    .btn-secondary {
      display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px;
      background: #f1f5f9; color: #64748b; border: none; border-radius: 10px;
      font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.3s;
    }
    .btn-secondary:hover { background: #e2e8f0; }

    .filters-section {
      display: flex; gap: 16px; background: white; padding: 20px;
      border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .search-box { position: relative; flex: 1; max-width: 500px; }
    .search-box i { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
    .search-box input {
      width: 100%; padding: 14px 16px 14px 48px; border: 2px solid #e2e8f0;
      border-radius: 12px; font-size: 14px; transition: all 0.3s;
    }
    .search-box input:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
    .filter-group select {
      padding: 14px 20px; border: 2px solid #e2e8f0; border-radius: 12px;
      font-size: 14px; cursor: pointer; min-width: 180px;
    }
    .filter-group select:focus { outline: none; border-color: #6366f1; }

    .loading-state { text-align: center; padding: 80px; background: white; border-radius: 16px; }
    .spinner {
      width: 48px; height: 48px; border: 4px solid #f1f5f9; border-top-color: #6366f1;
      border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-state p { color: #64748b; }

    .empty-state { text-align: center; padding: 80px; background: white; border-radius: 16px; }
    .empty-icon { width: 80px; height: 80px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
    .empty-icon i { font-size: 32px; color: #94a3b8; }
    .empty-state h3 { font-size: 18px; font-weight: 600; color: #1e293b; margin-bottom: 8px; }
    .empty-state p { color: #64748b; }

    .table-card { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .table-responsive { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 16px 20px; text-align: left; border-bottom: 1px solid #f1f5f9; }
    .data-table th { background: #f8fafc; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .data-table tbody tr { transition: background 0.2s; }
    .data-table tbody tr:hover { background: #f8fafc; }

    .student-info { display: flex; align-items: center; gap: 12px; }
    .student-avatar {
      width: 44px; height: 44px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      background: #e2e8f0; color: #64748b; font-size: 18px;
    }
    .student-details { display: flex; align-items: center; }
    .student-name { font-weight: 600; color: #1e293b; font-size: 14px; }

    .mis-badge, .batch-badge {
      display: inline-block; padding: 6px 12px; border-radius: 8px;
      font-size: 12px; font-weight: 600;
    }
    .mis-badge { background: #e0e7ff; color: #6366f1; }
    .batch-badge { background: #dcfce7; color: #16a34a; }

    .action-buttons { display: flex; gap: 8px; }
    .action-btn {
      width: 36px; height: 36px; border: none; border-radius: 10px;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: all 0.3s;
    }
    .action-btn.edit { background: #f1f5f9; color: #64748b; }
    .action-btn.edit:hover { background: #fef3c7; color: #d97706; }
    .action-btn.delete { background: #f1f5f9; color: #64748b; }
    .action-btn.delete:hover { background: #fee2e2; color: #dc2626; }

    .modal-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
      z-index: 1000; animation: fadeIn 0.2s;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .modal-content {
      background: white; border-radius: 20px; width: 90%; max-width: 600px;
      max-height: 90vh; overflow-y: auto; animation: slideUp 0.3s;
    }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .modal-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 20px 24px; border-bottom: 1px solid #f1f5f9;
    }
    .modal-header h3 { font-size: 18px; font-weight: 600; color: #1e293b; margin: 0; }
    .modal-close { background: none; border: none; font-size: 20px; cursor: pointer; color: #94a3b8; }
    .modal-close:hover { color: #64748b; }
    .modal-body { padding: 24px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; font-size: 13px; font-weight: 500; color: #64748b; margin-bottom: 6px; }
    .form-group input, .form-group select {
      width: 100%; padding: 10px 14px; border: 2px solid #e2e8f0; border-radius: 10px;
      font-size: 14px; transition: all 0.3s;
    }
    .form-group input:focus, .form-group select:focus { outline: none; border-color: #6366f1; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }

    @media (max-width: 1024px) {
      .page-header { flex-direction: column; text-align: center; gap: 16px; }
      .header-actions { flex-direction: column; }
      .stat { text-align: center; }
      .filters-section { flex-direction: column; }
      .search-box { max-width: 100%; }
      .form-row { grid-template-columns: 1fr; }
    }

    .modal-lg { max-width: 800px; }
    
    .csv-upload-step { padding: 10px 0; }
    .file-upload-area {
      border: 2px dashed #e2e8f0; border-radius: 12px; padding: 40px;
      text-align: center; cursor: pointer; transition: all 0.3s;
    }
    .file-upload-area:hover { border-color: #6366f1; background: #f8fafc; }
    .file-upload-area i { font-size: 48px; color: #94a3b8; margin-bottom: 12px; }
    .file-upload-area p { color: #64748b; margin-bottom: 8px; }
    .file-hint { font-size: 12px; color: #94a3b8; }
    .file-selected {
      display: flex; align-items: center; justify-content: center; gap: 12px;
      color: #10b981; font-weight: 600;
    }
    .file-selected i { font-size: 24px; margin-bottom: 0; }
    .btn-remove { background: none; border: none; cursor: pointer; color: #94a3b8; padding: 4px; }
    .btn-remove:hover { color: #dc2626; }

    .csv-mapping-step { padding: 10px 0; }
    .mapping-info { color: #64748b; margin-bottom: 16px; }
    .mapping-table-container { overflow-x: auto; margin-bottom: 16px; }
    .mapping-table { width: 100%; border-collapse: collapse; }
    .mapping-table th, .mapping-table td { padding: 12px; text-align: left; border-bottom: 1px solid #f1f5f9; }
    .mapping-table th { background: #f8fafc; font-size: 12px; font-weight: 600; color: #64748b; }
    .mapping-table select { padding: 8px 12px; border: 2px solid #e2e8f0; border-radius: 8px; width: 100%; }
    .preview-cell { max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #64748b; font-size: 13px; }

    .import-progress { margin: 16px 0; }
    .progress-bar { height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
    .progress-fill { height: 100%; background: #6366f1; transition: width 0.3s; }
    .import-progress p { margin-top: 8px; color: #64748b; font-size: 14px; }

    .import-results { margin: 16px 0; }
    .result { display: flex; align-items: center; gap: 8px; padding: 12px; border-radius: 8px; margin-bottom: 8px; }
    .result.success { background: #dcfce7; color: #16a34a; }
    .result.error { background: #fee2e2; color: #dc2626; }
  `]
})
export class InstructorStudentsComponent implements OnInit {
  studentFields = STUDENT_FIELDS;
  
  students = signal<Student[]>([]);
  filteredStudents = signal<Student[]>([]);
  batches = signal<Batch[]>([]);
  isLoading = signal(true);
  searchTerm = '';
  selectedBatchId = 0;
  
  showModal = signal(false);
  isEditing = signal(false);
  editingStudentId: number | null = null;
  saving = signal(false);
  
  showCsvModal = signal(false);
  csvStep = signal(1);
  csvFile = signal<File | null>(null);
  csvFileName = signal('');
  csvBatchId = signal(0);
  csvHeaders = signal<string[]>([]);
  csvData = signal<CsvStudentRow[]>([]);
  csvMapping = signal<CsvMapping>({});
  
  importing = signal(false);
  importProgress = signal(0);
  importSuccess = signal(0);
  importFailed = signal(0);
  importComplete = signal(false);
  
  formData: CreateStudentDto = {
    misNo: '',
    nameWithInitials: '',
    fullName: '',
    nicNo: '',
    gender: '',
    address: '',
    telephone: '',
    email: '',
    batchId: 0,
    gsDivision: '',
    agDivision: ''
  };

  constructor(
    private studentService: StudentService, 
    private batchService: BatchService,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService
  ) {}

  ngOnInit(): void {
    this.loadBatches();
    this.loadStudents();
  }

  private loadBatches(): void {
    this.batchService.getBatches().subscribe({
      next: (data) => this.batches.set(data)
    });
  }

  loadStudents(): void {
    this.isLoading.set(true);
    const observable = this.selectedBatchId > 0 
      ? this.studentService.getStudentsByBatch(this.selectedBatchId)
      : this.studentService.getStudents();

    observable.subscribe({
      next: (data) => {
        this.students.set(data);
        this.filterStudents();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading students:', err);
        this.isLoading.set(false);
      }
    });
  }

  filterStudents(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredStudents.set([...this.students()]);
    } else {
      this.filteredStudents.set(
        this.students().filter(s => 
          s.nameWithInitials.toLowerCase().includes(term) ||
          s.misNo.toLowerCase().includes(term) ||
          s.nicNo.toLowerCase().includes(term) ||
          s.email.toLowerCase().includes(term)
        )
      );
    }
  }

  openCreateModal(): void {
    this.isEditing.set(false);
    this.editingStudentId = null;
    this.formData = {
      misNo: '',
      nameWithInitials: '',
      fullName: '',
      nicNo: '',
      gender: '',
      address: '',
      telephone: '',
      email: '',
      batchId: 0,
      gsDivision: '',
      agDivision: ''
    };
    this.showModal.set(true);
  }

  openEditModal(student: Student): void {
    this.isEditing.set(true);
    this.editingStudentId = student.id;
    this.formData = {
      misNo: student.misNo,
      nameWithInitials: student.nameWithInitials,
      fullName: student.fullName,
      nicNo: student.nicNo,
      gender: student.gender,
      address: student.address,
      telephone: student.telephone,
      email: student.email,
      batchId: student.batchId,
      gsDivision: student.gsDivision,
      agDivision: student.agDivision
    };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveStudent(): void {
    this.saving.set(true);
    if (this.isEditing() && this.editingStudentId) {
      const updateData: UpdateStudentDto = this.formData;
      this.studentService.updateStudent(this.editingStudentId, updateData).subscribe({
        next: () => {
          this.loadStudents();
          this.closeModal();
          this.saving.set(false);
          this.toast.success('Student updated successfully');
        },
        error: (err) => {
          console.error('Error updating student:', err);
          this.saving.set(false);
          this.toast.error('Failed to update student');
        }
      });
    } else {
      this.studentService.createStudent(this.formData).subscribe({
        next: () => {
          this.loadStudents();
          this.closeModal();
          this.saving.set(false);
          this.toast.success('Student created successfully');
        },
        error: (err) => {
          console.error('Error creating student:', err);
          this.saving.set(false);
          this.toast.error('Failed to create student');
        }
      });
    }
  }

  async deleteStudent(student: Student): Promise<void> {
    const confirmed = await this.confirmDialog.confirmDelete(student.nameWithInitials);
    if (confirmed) {
      this.studentService.deleteStudent(student.id).subscribe({
        next: () => {
          this.students.update(list => list.filter(s => s.id !== student.id));
          this.filterStudents();
          this.toast.success('Student deleted successfully');
        },
        error: (err) => {
          console.error('Error deleting student:', err);
          this.toast.error('Failed to delete student');
        }
      });
    }
  }

  openCsvUploadModal(): void {
    this.showCsvModal.set(true);
    this.csvStep.set(1);
    this.csvFile.set(null);
    this.csvFileName.set('');
    this.csvBatchId.set(0);
    this.csvHeaders.set([]);
    this.csvData.set([]);
    this.csvMapping.set({});
    this.importing.set(false);
    this.importComplete.set(false);
    this.importSuccess.set(0);
    this.importFailed.set(0);
  }

  closeCsvModal(): void {
    this.showCsvModal.set(false);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  handleFile(file: File): void {
    if (!file.name.endsWith('.csv')) {
      this.toast.error('Please upload a CSV file');
      return;
    }
    this.csvFile.set(file);
    this.csvFileName.set(file.name);
  }

  removeCsvFile(event: Event): void {
    event.stopPropagation();
    this.csvFile.set(null);
    this.csvFileName.set('');
  }

  processCsvFile(): void {
    const file = this.csvFile();
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      this.parseCsv(content);
    };
    reader.readAsText(file);
  }

  parseCsv(content: string): void {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      this.toast.error('CSV file must have headers and at least one data row');
      return;
    }

    const headers = this.parseCsvLine(lines[0]);
    const data: CsvStudentRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCsvLine(lines[i]);
      const row: CsvStudentRow = {};
      headers.forEach((header, index) => {
        if (header && values[index] !== undefined) {
          row[header] = values[index];
        }
      });
      if (Object.keys(row).length > 0) {
        data.push(row);
      }
    }

    this.csvHeaders.set(headers.filter(h => h));
    this.csvData.set(data);
    this.autoMapFields();
    this.csvStep.set(2);
  }

  parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  autoMapFields(): void {
    const mapping: CsvMapping = {};
    const headers = this.csvHeaders();
    
    headers.forEach(header => {
      const headerLower = header.toLowerCase().trim();
      for (const field of STUDENT_FIELDS) {
        const fieldNameLower = field.name.toLowerCase();
        const fieldLabelLower = field.label.toLowerCase();
        
        if (headerLower.includes(fieldNameLower) || headerLower.includes(fieldLabelLower) ||
            fieldNameLower.includes(headerLower) || fieldLabelLower.includes(headerLower)) {
          mapping[header] = field.name;
          break;
        }
      }
    });
    
    this.csvMapping.set(mapping);
  }

  updateMapping(header: string, fieldName: string): void {
    this.csvMapping.update(m => ({ ...m, [header]: fieldName }));
  }

  getCsvPreview(headerIndex: number): string {
    const data = this.csvData();
    if (data.length > 0) {
      const headers = this.csvHeaders();
      const header = headers[headerIndex];
      return data[0][header] || '';
    }
    return '';
  }

  goToCsvStep(step: number): void {
    this.csvStep.set(step);
    if (step === 1) {
      this.csvHeaders.set([]);
      this.csvData.set([]);
      this.csvMapping.set({});
    }
  }

  importStudents(): void {
    if (!this.csvBatchId()) {
      this.toast.warning('Please select a batch');
      return;
    }

    this.importing.set(true);
    this.importComplete.set(false);
    this.importSuccess.set(0);
    this.importFailed.set(0);
    this.toast.info('Starting import...');

    const data = this.csvData();
    const mapping = this.csvMapping();
    const batchId = this.csvBatchId();
    let success = 0;
    let failed = 0;
    let processed = 0;

    from(data)
      .pipe(
        concatMap(row => {
          const studentData = this.mapRowToStudent(row, mapping, batchId);
          return this.studentService.createStudent(studentData).pipe(
            finalize(() => {
              processed++;
              this.importProgress.set((processed / data.length) * 100);
            })
          );
        }),
        finalize(() => {
          this.importing.set(false);
          this.importComplete.set(true);
          this.importSuccess.set(success);
          this.importFailed.set(failed);
          this.loadStudents();
          if (failed === 0) {
            this.toast.success(`Successfully imported ${success} students`);
          } else {
            this.toast.warning(`Imported ${success} students, ${failed} failed`);
          }
        })
      )
      .subscribe({
        next: () => {
          success++;
          this.importSuccess.set(success);
        },
        error: () => {
          failed++;
          this.importFailed.set(failed);
        }
      });
  }

  mapRowToStudent(row: CsvStudentRow, mapping: CsvMapping, batchId: number): CreateStudentDto {
    const student: CreateStudentDto = {
      misNo: '',
      nameWithInitials: '',
      fullName: '',
      nicNo: '',
      gender: 'Male',
      address: '',
      telephone: '',
      email: '',
      batchId: batchId,
      gsDivision: 'Unknown',
      agDivision: 'Unknown'
    };

    Object.entries(mapping).forEach(([csvHeader, fieldName]) => {
      const value = row[csvHeader]?.trim() || '';
      if (!value) return;

      switch (fieldName) {
        case 'MISNo': student.misNo = value; break;
        case 'NameWithInitials': student.nameWithInitials = value; break;
        case 'FullName': student.fullName = value; break;
        case 'NICNo': student.nicNo = value; break;
        case 'Gender': student.gender = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase(); break;
        case 'Address': student.address = value; break;
        case 'Telephone': student.telephone = value; break;
        case 'Email': student.email = value; break;
        case 'GSDivision': student.gsDivision = value; break;
        case 'AGDivision': student.agDivision = value; break;
      }
    });

    if (!student.misNo) {
      student.misNo = 'ST-' + Math.random().toString(36).substr(2, 8).toUpperCase();
    }
    if (!student.nameWithInitials && student.fullName) {
      student.nameWithInitials = student.fullName.split(' ')[0];
    }
    if (!student.fullName && student.nameWithInitials) {
      student.fullName = student.nameWithInitials;
    }
    if (!student.email) {
      student.email = student.misNo + '@example.com';
    }

    return student;
  }
}

import { Component, computed, EventEmitter, inject, Input, OnChanges, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../services/toast.service';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

type QuestionType = 'multiple-choice' | 'checkbox' | 'dropdown' | 'short-answer' | 'paragraph' | 'linear-scale' | 'rating' | 'date' | 'time';
type DifficultyLevel = 'easy' | 'medium' | 'hard';
type ExamStatus = 'draft' | 'scheduled' | 'active' | 'completed';

interface Category {
  id: number;
  name: string;
  color: string;
}

interface QuestionOption {
  id: string;
  content: string;
  isCorrect?: boolean;
}

interface Question {
  id: number;
  content: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  categoryId: number;
  marks: number;
  options?: QuestionOption[];
  correctAnswer?: string[];
  explanation?: string;
  tags: string[];
  required: boolean;
}

interface ExamQuestion {
  id?: number;
  questionId: number;
  question?: Question;
  order: number;
}

interface Exam {
  id: number;
  title: string;
  description: string;
  categoryId: number;
  duration: number;
  status: ExamStatus;
  questions: ExamQuestion[];
}

interface ApiQuestionDto {
  Id?: number;
  id?: number;
  Content?: string | null;
  content?: string | null;
  Type?: string | null;
  type?: string | null;
  Difficulty?: string | null;
  difficulty?: string | null;
  CategoryId?: number;
  categoryId?: number;
  Marks?: number;
  marks?: number;
  Options?: string[] | null;
  options?: string[] | null;
  CorrectAnswer?: string | null;
  correctAnswer?: string | null;
  Explanation?: string | null;
  explanation?: string | null;
  Tags?: string[] | null;
  tags?: string[] | null;
  Required?: boolean;
  required?: boolean;
}

interface ApiExamQuestionDto {
  Id?: number;
  id?: number;
  ExamId?: number;
  examId?: number;
  QuestionId?: number;
  questionId?: number;
  Order?: number;
  order?: number;
  Question?: ApiQuestionDto | null;
  question?: ApiQuestionDto | null;
}

interface ApiExamDto {
  Id?: number;
  id?: number;
  Title?: string | null;
  title?: string | null;
  Description?: string | null;
  description?: string | null;
  CategoryId?: number;
  categoryId?: number;
  CategoryName?: string | null;
  categoryName?: string | null;
  QuestionCount?: number;
  questionCount?: number;
  Duration?: number;
  duration?: number;
  IsActive?: boolean;
  isActive?: boolean;
  CreatedAt?: string | null;
  createdAt?: string | null;
  TotalMarks?: number;
  totalMarks?: number;
  Status?: string | null;
  status?: string | null;
  Questions?: ApiExamQuestionDto[] | null;
  questions?: ApiExamQuestionDto[] | null;
}

interface ApiCategoryDto {
  Id?: number;
  id?: number;
  Name?: string | null;
  name?: string | null;
  Color?: string | null;
  color?: string | null;
  QuestionCount?: number;
  questionCount?: number;
}

@Component({
  selector: 'app-exam-editor-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './exam-editor-modal.component.html',
  styleUrl: './exam-editor-modal.component.scss'
})
export class ExamEditorModalComponent implements OnChanges {
  @Input() examId = 0;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<Exam>();

  private readonly API_URL = environment.apiUrl;
  private readonly toast = inject(ToastService);

  isLoading = signal(true);
  isSaving = signal(false);
  showQuestionSelectionModal = signal(false);
  activeExamId = signal(0);

  categories = signal<Category[]>([]);
  banks = signal<Question[]>([]);
  exam = signal<Exam>(this.emptyExam());
  persistedQuestionIds = signal<Set<number>>(new Set());
  persistingQuestionIds = signal<Set<number>>(new Set());

  selectedQuestionId = signal<number | null>(null);
  selectedQuestionIds = signal<Set<number>>(new Set());
  addSearchTerm = signal('');
  addCategoryFilter = signal<number | null>(null);

  questionTypes: { type: QuestionType; icon: string; label: string; description: string }[] = [
    { type: 'multiple-choice', icon: 'fa-circle-dot', label: 'Multiple Choice', description: 'One correct answer' },
    { type: 'checkbox', icon: 'fa-square-check', label: 'Checkbox', description: 'Multiple correct answers' },
    { type: 'dropdown', icon: 'fa-chevron-down', label: 'Dropdown', description: 'Select from list' },
    { type: 'short-answer', icon: 'fa-pen', label: 'Short Answer', description: 'Brief text response' },
    { type: 'paragraph', icon: 'fa-align-left', label: 'Paragraph', description: 'Long text response' },
    { type: 'linear-scale', icon: 'fa-sliders', label: 'Linear Scale', description: '1 to 5 scale' },
    { type: 'rating', icon: 'fa-star', label: 'Rating', description: 'Star rating' },
    { type: 'date', icon: 'fa-calendar', label: 'Date', description: 'Date answer' },
    { type: 'time', icon: 'fa-clock', label: 'Time answer', description: 'Time answer' }
  ];

  examTotalMarks = computed(() =>
    this.exam().questions.reduce((sum, item) => sum + (item.question?.marks || 0), 0)
  );

  isCreateMode = computed(() => this.activeExamId() === 0);

  selectedExamQuestion = computed(() => {
    const selectedId = this.selectedQuestionId();
    return this.exam().questions.find(item => item.questionId === selectedId)?.question || null;
  });

  filteredSelectableQuestions = computed(() => {
    const term = this.addSearchTerm().trim().toLowerCase();
    const selectedCategory = this.addCategoryFilter();

    return this.banks().filter(question => {
      const matchesCategory = !selectedCategory || question.categoryId === selectedCategory;
      const matchesSearch = !term ||
        question.content.toLowerCase().includes(term) ||
        question.tags.some(tag => tag.toLowerCase().includes(term));

      return matchesCategory && matchesSearch;
    });
  });

  filteredBankQuestionsForExam = computed(() =>
    this.filteredSelectableQuestions().filter(question => !this.isQuestionAlreadyInExam(question.id))
  );

  constructor(private http: HttpClient) {}

  ngOnChanges(): void {
    this.activeExamId.set(this.examId);
    this.loadCategories();
    this.loadQuestionBank();
    this.loadExam();
  }

  loadExam(): void {
    this.isLoading.set(true);

    if (!this.activeExamId()) {
      this.exam.set({
        ...this.emptyExam(),
        categoryId: this.categories()[0]?.id || 0
      });
      this.persistedQuestionIds.set(new Set());
      this.selectedQuestionId.set(null);
      this.isLoading.set(false);
      return;
    }

    this.http.get<ApiExamDto>(`${this.API_URL}/exams/${this.activeExamId()}/questions`).subscribe({
      next: data => {
        const questions = (data.Questions || data.questions || []).map(item => this.toExamQuestion(item));
        this.exam.set(this.toExam(data, questions));
        this.persistedQuestionIds.set(new Set(questions.map(item => item.questionId)));
        this.selectedQuestionId.set(null);
      },
      error: err => {
        console.error('Load exam error:', err);
        this.toast.error(`Failed to load exam: ${err.status || 'Unknown error'}`);
      },
      complete: () => this.isLoading.set(false)
    });
  }

  loadCategories(): void {
    this.http.get<ApiCategoryDto[]>(`${this.API_URL}/question-categories`).subscribe({
      next: data => this.categories.set(data.map(item => this.toCategory(item))),
      error: () => this.categories.set([])
    });
  }

  loadQuestionBank(): void {
    this.http.get<ApiQuestionDto[]>(`${this.API_URL}/questions`).subscribe({
      next: data => this.banks.set(data.map(item => this.toQuestion(item))),
      error: () => this.banks.set([])
    });
  }

  openQuestionSelectionModal(): void {
    if (!this.activeExamId()) {
      this.toast.error('Save the exam before adding questions');
      return;
    }

    this.selectedQuestionIds.set(new Set());
    this.addSearchTerm.set('');
    this.addCategoryFilter.set(null);
    this.showQuestionSelectionModal.set(true);
  }

  closeQuestionSelectionModal(): void {
    this.selectedQuestionIds.set(new Set());
    this.showQuestionSelectionModal.set(false);
  }

  toggleSelectableQuestion(questionId: number): void {
    this.selectedQuestionIds.update(ids => {
      const next = new Set(ids);
      next.has(questionId) ? next.delete(questionId) : next.add(questionId);
      return next;
    });
  }

  selectAllVisibleQuestions(): void {
    const selectedIds = new Set(this.selectedQuestionIds());
    this.filteredSelectableQuestions().forEach(question => selectedIds.add(question.id));
    this.selectedQuestionIds.set(selectedIds);
  }

  clearQuestionSelection(): void {
    this.selectedQuestionIds.set(new Set());
  }

  addSelectedQuestionsToExam(): void {
    if (!this.activeExamId()) {
      this.toast.error('Save the exam before adding questions');
      return;
    }

    const questionIds = Array.from(this.selectedQuestionIds()).filter(id => !this.isQuestionAlreadyInExam(id));

    if (questionIds.length === 0) {
      this.toast.error('Selected questions are already in this exam');
      return;
    }

    this.persistingQuestionIds.update(ids => new Set([...ids, ...questionIds]));

    let completedRequests = 0;
    const finishRequest = (questionId: number) => {
      this.persistingQuestionIds.update(ids => {
        const next = new Set(ids);
        next.delete(questionId);
        return next;
      });

      completedRequests++;
      if (completedRequests === questionIds.length) {
        this.selectedQuestionIds.set(new Set());
        this.closeQuestionSelectionModal();
      }
    };

    questionIds.forEach(questionId => {
      this.http.post<ApiExamQuestionDto>(`${this.API_URL}/exams/${this.activeExamId()}/questions`, {
        QuestionId: questionId
      }).subscribe({
        next: result => {
          const examQuestion = this.toExamQuestion(result);
          this.exam.update(exam => ({
            ...exam,
            questions: [...exam.questions, examQuestion]
          }));
          this.persistedQuestionIds.update(ids => new Set([...ids, questionId]));
        },
        error: err => {
          console.error('Add question to exam error:', err);
          this.toast.error(`Failed to add question: ${err.status || 'Unknown error'}`);
        },
        complete: () => finishRequest(questionId)
      });
    });
  }

  removeQuestion(questionId: number): void {
    if (!this.activeExamId()) {
      this.toast.error('Save the exam before removing questions');
      return;
    }

    this.http.delete(`${this.API_URL}/exams/${this.activeExamId()}/questions/${questionId}`, { responseType: 'text' as any }).subscribe({
      next: () => this.removeLocalQuestion(questionId),
      error: () => this.removeLocalQuestion(questionId)
    });
  }

  removeLocalQuestion(questionId: number): void {
    this.exam.update(exam => ({
      ...exam,
      questions: exam.questions.filter(item => item.questionId !== questionId)
    }));
    this.persistedQuestionIds.update(ids => {
      const next = new Set(ids);
      next.delete(questionId);
      return next;
    });
    if (this.selectedQuestionId() === questionId) {
      this.selectedQuestionId.set(null);
    }
    this.toast.success('Question removed from exam');
  }

  duplicateQuestion(question: Question): void {
    if (!this.activeExamId()) {
      this.toast.error('Save the exam before duplicating questions');
      return;
    }

    this.http.post<ApiQuestionDto>(`${this.API_URL}/questions`, {
      Content: `${question.content} (Copy)`,
      Type: this.mapQuestionTypeToApi(question.type),
      Difficulty: this.mapDifficultyToApi(question.difficulty),
      CategoryId: question.categoryId,
      Marks: question.marks,
      Tags: question.tags,
      Options: (question.options || []).map(option => option.content),
      CorrectAnswer: this.correctAnswerToText(question),
      Explanation: question.explanation,
      Required: question.required
    }).subscribe({
      next: result => {
        const newQuestion = this.toQuestion(result);
        this.banks.update(items => [...items, newQuestion]);
        this.addSingleQuestionToExam(newQuestion);
        this.toast.success('Question duplicated');
      },
      error: err => {
        console.error('Duplicate question error:', err);
        this.toast.error(`Failed to duplicate question: ${err.status || 'Unknown error'}`);
      }
    });
  }

  addSingleQuestionToExam(question: Question, index?: number): void {
    if (!this.activeExamId()) {
      this.toast.error('Save the exam before adding questions');
      return;
    }

    if (this.isQuestionAlreadyInExam(question.id)) {
      this.toast.error('Question is already in this exam');
      return;
    }

    this.persistingQuestionIds.update(ids => new Set([...ids, question.id]));
    this.http.post<ApiExamQuestionDto>(`${this.API_URL}/exams/${this.activeExamId()}/questions`, {
      QuestionId: question.id
    }).subscribe({
      next: result => {
        const examQuestion = this.toExamQuestion(result);
        this.exam.update(exam => {
          const questions = [...exam.questions];
          const insertIndex = index === undefined ? questions.length : Math.min(index, questions.length);
          questions.splice(insertIndex, 0, examQuestion);
          return { ...exam, questions };
        });
        this.persistedQuestionIds.update(ids => new Set([...ids, question.id]));
      },
      error: err => {
        console.error('Add question to exam error:', err);
        this.toast.error(`Failed to add question: ${err.status || 'Unknown error'}`);
      },
      complete: () => this.persistingQuestionIds.update(ids => {
        const next = new Set(ids);
        next.delete(question.id);
        return next;
      })
    });
  }

  saveExam(): void {
    if (this.isSaving()) {
      return;
    }

    const exam = this.exam();
    if (!exam.title.trim()) {
      this.toast.error('Exam title is required');
      return;
    }

    this.isSaving.set(true);

    if (this.activeExamId()) {
      this.saveExistingExam(exam);
      return;
    }

    this.http.post<ApiExamDto>(`${this.API_URL}/exams`, this.toExamPayload(exam)).subscribe({
      next: result => {
        const created = this.toExam(result);
        this.exam.set(created);
        this.activeExamId.set(created.id);
        this.persistedQuestionIds.set(new Set(created.questions.map(item => item.questionId)));
        this.persistQuestions(created.questions, created);
      },
      error: err => {
        this.isSaving.set(false);
        console.error('Create exam error:', err);
        this.toast.error(`Failed to create exam: ${err.status || 'Unknown error'}`);
      }
    });
  }

  saveExistingExam(exam: Exam): void {
    const questionsToPersist = exam.questions.filter(item =>
      !this.persistedQuestionIds().has(item.questionId) && !this.persistingQuestionIds().has(item.questionId)
    );

    this.http.put(`${this.API_URL}/exams/${this.activeExamId()}`, this.toExamPayload(exam), { responseType: 'text' as any }).subscribe({
      next: () => {
        if (questionsToPersist.length === 0) {
          this.saved.emit(this.exam());
          this.closeModal();
          return;
        }

        this.persistQuestions(questionsToPersist, exam);
      },
      error: err => {
        this.isSaving.set(false);
        console.error('Update exam error:', err);
        this.toast.error(`Failed to save exam: ${err.status || 'Unknown error'}`);
      }
    });
  }

  scheduleExam(): void {
    if (!this.activeExamId()) {
      this.toast.error('Save the exam before scheduling');
      return;
    }

    this.http.patch(`${this.API_URL}/exams/${this.activeExamId()}/schedule`, {}, { responseType: 'text' as any }).subscribe({
      next: () => {
        this.exam.update(item => ({ ...item, status: 'scheduled' }));
        this.toast.success('Exam scheduled');
      },
      error: () => this.toast.error('Failed to schedule exam')
    });
  }

  publishExam(): void {
    if (!this.activeExamId()) {
      this.toast.error('Save the exam before publishing');
      return;
    }

    this.http.patch(`${this.API_URL}/exams/${this.activeExamId()}/publish`, {}, { responseType: 'text' as any }).subscribe({
      next: () => {
        this.exam.update(item => ({ ...item, status: 'active' }));
        this.toast.success('Exam published');
      },
      error: () => this.toast.error('Failed to publish exam')
    });
  }

  closeModal(): void {
    this.close.emit();
  }

  updateExamField(field: keyof Exam, value: any): void {
    this.exam.update(exam => ({ ...exam, [field]: value }));
  }

  updateQuestion(question: Question): void {
    this.banks.update(items => items.map(item => item.id === question.id ? question : item));
    this.exam.update(exam => ({
      ...exam,
      questions: exam.questions.map(item => item.questionId === question.id ? { ...item, question } : item)
    }));
  }

  updateSelectedQuestionField(field: keyof Question, value: any): void {
    const question = this.selectedExamQuestion();
    if (question) {
      this.updateQuestion({ ...question, [field]: value });
    }
  }

  updateQuestionOption(questionId: number, optionId: string, content: string): void {
    const question = this.banks().find(item => item.id === questionId) || this.selectedExamQuestion();
    if (!question) {
      return;
    }

    this.updateQuestion({
      ...question,
      options: (question.options || []).map(option => option.id === optionId ? { ...option, content } : option)
    });
  }

  addExamOption(questionId: number): void {
    const question = this.banks().find(item => item.id === questionId) || this.selectedExamQuestion();
    if (!question) {
      return;
    }

    const options = [...(question.options || [])];
    options.push({ id: `opt${Date.now()}`, content: `Option ${options.length + 1}` });
    this.updateQuestion({ ...question, options });
  }

  removeOption(questionId: number, optionId: string): void {
    const question = this.banks().find(item => item.id === questionId) || this.selectedExamQuestion();
    if (!question) {
      return;
    }

    const options = (question.options || []).filter(option => option.id !== optionId);
    const correctAnswer = (question.correctAnswer || []).filter(id => id !== optionId);
    this.updateQuestion({ ...question, options, correctAnswer });
  }

  setCorrectAnswerExam(questionId: number, optionId: string): void {
    const question = this.banks().find(item => item.id === questionId) || this.selectedExamQuestion();
    if (!question) {
      return;
    }

    const currentCorrect = question.correctAnswer || [];
    const correctAnswer = question.type === 'checkbox'
      ? currentCorrect.includes(optionId)
        ? currentCorrect.filter(id => id !== optionId)
        : [...currentCorrect, optionId]
      : [optionId];

    this.updateQuestion({ ...question, correctAnswer });
  }

  updateQuestionTags(questionId: number, value: string): void {
    const question = this.banks().find(item => item.id === questionId) || this.selectedExamQuestion();
    if (!question) {
      return;
    }

    const tags = value.split(',').map(tag => tag.trim()).filter(Boolean);
    this.updateQuestion({ ...question, tags });
  }

  drop(event: CdkDragDrop<any>): void {
    if (event.previousContainer === event.container) {
      this.exam.update(exam => {
        const questions = [...exam.questions];
        moveItemInArray(questions, event.previousIndex, event.currentIndex);
        return { ...exam, questions };
      });
      return;
    }

    const question = event.item.data as Question;
    this.addSingleQuestionToExam(question, event.currentIndex);
  }

  getQuestionTypeIcon(type: QuestionType): string {
    return this.questionTypes.find(item => item.type === type)?.icon || 'fa-question';
  }

  getQuestionTypeLabel(type: QuestionType): string {
    return this.questionTypes.find(item => item.type === type)?.label || type;
  }

  getQuestionTypeBadgeClass(type: QuestionType): string {
    const map: Record<QuestionType, string> = {
      'multiple-choice': 'badge-type-primary',
      'checkbox': 'badge-type-info',
      'dropdown': 'badge-type-purple',
      'short-answer': 'badge-type-success',
      'paragraph': 'badge-type-warning',
      'linear-scale': 'badge-type-orange',
      'rating': 'badge-type-yellow',
      'date': 'badge-type-blue',
      'time': 'badge-type-gray'
    };

    return map[type] || 'badge-type-gray';
  }

  getStatusClass(status: ExamStatus): string {
    return `status-badge ${status}`;
  }

  getCategoryById(categoryId: number): Category | undefined {
    return this.categories().find(category => category.id === categoryId);
  }

  getCategoryName(categoryId: number): string {
    return this.getCategoryById(categoryId)?.name || 'Uncategorized';
  }

  getCorrectAnswerText(question: Question): string {
    if (!question.correctAnswer?.length || !question.options?.length) {
      return '-';
    }

    const answers = question.correctAnswer
      .map(id => question.options?.find(option => option.id === id)?.content)
      .filter(Boolean);

    return answers.join(', ') || '-';
  }

  isOptionsQuestion(type: QuestionType): boolean {
    return type === 'multiple-choice' || type === 'checkbox' || type === 'dropdown';
  }

  private persistQuestions(questions: ExamQuestion[], exam: Exam): void {
    let completedRequests = 0;
    let failedRequests = 0;

    const finish = () => {
      completedRequests++;

      if (completedRequests === questions.length) {
        this.isSaving.set(false);
        if (failedRequests === 0) {
          this.persistedQuestionIds.update(ids => new Set([...ids, ...questions.map(item => item.questionId)]));
          this.saved.emit(exam);
          this.closeModal();
        } else {
          this.toast.error(`${failedRequests} question(s) could not be saved`);
        }
      }
    };

    questions.forEach(question => {
      this.persistingQuestionIds.update(ids => new Set([...ids, question.questionId]));
      this.http.post<ApiExamQuestionDto>(`${this.API_URL}/exams/${this.activeExamId()}/questions`, {
        QuestionId: question.questionId
      }).subscribe({
        next: () => this.persistedQuestionIds.update(ids => new Set([...ids, question.questionId])),
        error: err => {
          failedRequests++;
          console.error('Persist exam question error:', err);
        },
        complete: () => {
          this.persistingQuestionIds.update(ids => {
            const next = new Set(ids);
            next.delete(question.questionId);
            return next;
          });
          finish();
        }
      });
    });
  }

  private isQuestionAlreadyInExam(questionId: number): boolean {
    return this.exam().questions.some(item => item.questionId === questionId) || this.persistingQuestionIds().has(questionId);
  }

  private emptyExam(): Exam {
    return {
      id: 0,
      title: '',
      description: '',
      categoryId: 0,
      duration: 60,
      status: 'draft',
      questions: []
    };
  }

  private toCategory(category: ApiCategoryDto): Category {
    return {
      id: category.Id ?? category.id ?? 0,
      name: category.Name ?? category.name ?? '',
      color: category.Color ?? category.color ?? '#6366f1'
    };
  }

  private toQuestion(question: ApiQuestionDto): Question {
    const options = (question.Options ?? question.options ?? [])
      .map((option, index) => ({
        id: `opt${index + 1}`,
        content: option
      }));

    const correctAnswer = (question.CorrectAnswer ?? question.correctAnswer ?? '')
      .split(',')
      .map(value => value.trim())
      .filter(Boolean)
      .map(value => options.find(option => option.content === value)?.id)
      .filter((value): value is string => Boolean(value));

    return {
      id: question.Id ?? question.id ?? 0,
      content: question.Content ?? question.content ?? '',
      type: this.mapQuestionTypeFromApi(question.Type ?? question.type ?? 'MultipleChoice'),
      difficulty: this.mapDifficultyFromApi(question.Difficulty ?? question.difficulty ?? 'Medium'),
      categoryId: question.CategoryId ?? question.categoryId ?? 0,
      marks: question.Marks ?? question.marks ?? 1,
      options,
      correctAnswer,
      explanation: question.Explanation ?? question.explanation ?? '',
      tags: question.Tags ?? question.tags ?? [],
      required: question.Required ?? question.required ?? true
    };
  }

  private toExam(exam: ApiExamDto, questions: ExamQuestion[] = []): Exam {
    return {
      id: exam.Id ?? exam.id ?? 0,
      title: exam.Title ?? exam.title ?? '',
      description: exam.Description ?? exam.description ?? '',
      categoryId: exam.CategoryId ?? exam.categoryId ?? 0,
      duration: exam.Duration ?? exam.duration ?? 60,
      status: this.mapStatusFromApi(exam.Status ?? exam.status ?? 'Draft'),
      questions
    };
  }

  private toExamQuestion(examQuestion: ApiExamQuestionDto): ExamQuestion {
    return {
      id: examQuestion.Id ?? examQuestion.id,
      questionId: examQuestion.QuestionId ?? examQuestion.questionId ?? 0,
      order: examQuestion.Order ?? examQuestion.order ?? 0,
      question: examQuestion.Question ? this.toQuestion(examQuestion.Question) : undefined
    };
  }

  private toExamPayload(exam: Exam): any {
    return {
      Title: exam.title,
      Description: exam.description,
      CategoryId: exam.categoryId,
      Duration: exam.duration
    };
  }

  private correctAnswerToText(question: Question): string {
    const options = question.options || [];
    return (question.correctAnswer || [])
      .map(id => options.find(option => option.id === id)?.content || '')
      .filter(Boolean)
      .join(',');
  }

  private mapQuestionTypeToApi(type: QuestionType): string {
    const map: Record<QuestionType, string> = {
      'multiple-choice': 'MultipleChoice',
      'checkbox': 'Checkbox',
      'dropdown': 'Dropdown',
      'short-answer': 'ShortAnswer',
      'paragraph': 'Essay',
      'linear-scale': 'LinearScale',
      'rating': 'Rating',
      'date': 'Date',
      'time': 'Time'
    };

    return map[type];
  }

  private mapQuestionTypeFromApi(type: string): QuestionType {
    const normalized = type.replace(/\s+/g, '').toLowerCase();

    switch (normalized) {
      case 'multiplechoice':
      case 'multiple-choice':
        return 'multiple-choice';
      case 'checkbox':
        return 'checkbox';
      case 'dropdown':
        return 'dropdown';
      case 'shortanswer':
        return 'short-answer';
      case 'essay':
      case 'paragraph':
        return 'paragraph';
      case 'linearscale':
        return 'linear-scale';
      case 'rating':
        return 'rating';
      case 'date':
        return 'date';
      case 'time':
        return 'time';
      default:
        return 'multiple-choice';
    }
  }

  private mapDifficultyToApi(difficulty: DifficultyLevel): string {
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  }

  private mapDifficultyFromApi(difficulty: string): DifficultyLevel {
    const normalized = difficulty.toLowerCase();

    if (normalized === 'easy') {
      return 'easy';
    }

    if (normalized === 'hard') {
      return 'hard';
    }

    return 'medium';
  }

  private mapStatusFromApi(status: string): ExamStatus {
    const normalized = status.toLowerCase();

    if (normalized === 'scheduled' || normalized === 'active' || normalized === 'completed') {
      return normalized;
    }

    return 'draft';
  }
}

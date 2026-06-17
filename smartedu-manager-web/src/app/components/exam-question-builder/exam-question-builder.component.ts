import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../services/toast.service';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ExamEditorModalComponent } from '../exam-editor-modal/exam-editor-modal.component';

type QuestionType = 'multiple-choice' | 'checkbox' | 'dropdown' | 'short-answer' | 'paragraph' | 'linear-scale' | 'rating' | 'date' | 'time';
type DifficultyLevel = 'easy' | 'medium' | 'hard';
type ExamStatus = 'draft' | 'scheduled' | 'active' | 'completed';
type BuilderPanel = 'question-bank' | 'exam-builder';

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
  categoryId: number | null;
  duration: number;
  status: ExamStatus;
  availableFrom: string | null;
  availableTo: string | null;
  timeZone: string | null;
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
  AvailableFrom?: string | null;
  availableFrom?: string | null;
  AvailableTo?: string | null;
  availableTo?: string | null;
  TimeZone?: string | null;
  timeZone?: string | null;
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
  selector: 'app-exam-question-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, ExamEditorModalComponent],
  templateUrl: './exam-question-builder.component.html',
  styleUrl: './exam-question-builder.component.scss'
})
export class ExamQuestionBuilderComponent implements OnInit {
  private readonly API_URL = environment.apiUrl;
  private readonly toast = inject(ToastService);

  activePanel = signal<BuilderPanel>('question-bank');
  isLoadingQuestionBank = signal(false);
  isLoadingExams = signal(false);
  isLoadingFullExam = signal(false);

  selectedQuestionId = signal<number | null>(null);
  selectedBankQuestionId = signal<number | null>(null);
  selectedExamId = signal<number | null>(null);
  showExamEditorModal = signal(false);

  showQuestionEditorModal = signal(false);
  editQuestion = signal<Question | null>(null);

  selectedCategoryFilter = signal<number | null>(null);
  searchTerm = signal('');
  examBuilderSearchTerm = signal('');
  examBuilderCategoryFilter = signal<number | null>(null);

  showCategoryModal = signal(false);
  selectedCategory = signal<Category>({ id: 0, name: '', color: '#6366f1' });

  categories = signal<Category[]>([]);
  banks = signal<Question[]>([]);
  exams = signal<Exam[]>([]);

  exam = signal<Exam>(this.emptyExam());

  questionTypes: { type: QuestionType; icon: string; label: string; description: string }[] = [
    { type: 'multiple-choice', icon: 'fa-circle-dot', label: 'Multiple Choice', description: 'One correct answer' },
    { type: 'checkbox', icon: 'fa-square-check', label: 'Checkbox', description: 'Multiple correct answers' },
    { type: 'dropdown', icon: 'fa-chevron-down', label: 'Dropdown', description: 'Select from list' },
    { type: 'short-answer', icon: 'fa-pen', label: 'Short Answer', description: 'Brief text response' },
    { type: 'paragraph', icon: 'fa-align-left', label: 'Paragraph', description: 'Long text response' },
    { type: 'linear-scale', icon: 'fa-sliders', label: 'Linear Scale', description: '1 to 5 scale' },
    { type: 'rating', icon: 'fa-star', label: 'Rating', description: 'Star rating' },
    { type: 'date', icon: 'fa-calendar', label: 'Date', description: 'Date answer' },
    { type: 'time', icon: 'fa-clock', label: 'Time', description: 'Time answer' }
  ];

  filteredBankQuestions = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const selectedCategory = this.selectedCategoryFilter();

    return this.banks().filter(question => {
      const matchesCategory = !selectedCategory || question.categoryId === selectedCategory;
      const matchesSearch = !term ||
        question.content.toLowerCase().includes(term) ||
        question.tags.some(tag => tag.toLowerCase().includes(term));

      return matchesCategory && matchesSearch;
    });
  });

  filteredExamBuilderQuestions = computed(() => {
    const term = this.examBuilderSearchTerm().trim().toLowerCase();
    const selectedCategory = this.examBuilderCategoryFilter();

    return this.banks().filter(question => {
      const matchesCategory = !selectedCategory || question.categoryId === selectedCategory;
      const matchesSearch = !term ||
        question.content.toLowerCase().includes(term) ||
        question.tags.some(tag => tag.toLowerCase().includes(term));

      return matchesCategory && matchesSearch;
    });
  });

  selectedQuestion = computed(() => {
    const selectedId = this.selectedQuestionId();
    const examQuestion = this.exam().questions.find(item => item.questionId === selectedId);
    return examQuestion?.question || null;
  });

  examTotalMarks = computed(() =>
    this.exam().questions.reduce((sum, item) => sum + (item.question?.marks || 0), 0)
  );

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadQuestionBank();
    this.loadExams();
  }

  loadCategories(): void {
    this.http.get<ApiCategoryDto[]>(`${this.API_URL}/question-categories`).subscribe({
      next: data => this.categories.set(data.map(item => this.toCategory(item))),
      error: () => this.categories.set([])
    });
  }

  loadQuestionBank(): void {
    this.isLoadingQuestionBank.set(true);
    this.http.get<ApiQuestionDto[]>(`${this.API_URL}/questions`).subscribe({
      next: data => this.banks.set(data.map(item => this.toQuestion(item))),
      error: () => this.banks.set([]),
      complete: () => this.isLoadingQuestionBank.set(false)
    });
  }

  loadExams(): void {
    this.isLoadingExams.set(true);
    this.http.get<ApiExamDto[]>(`${this.API_URL}/exams`).subscribe({
      next: data => this.exams.set(data.map(item => this.toExam(item))),
      error: () => this.exams.set([]),
      complete: () => this.isLoadingExams.set(false)
    });
  }

  showQuestionBank(): void {
    this.activePanel.set('question-bank');
  }

  showExamBuilder(): void {
    this.activePanel.set('exam-builder');
  }

  editExamDetails(exam: Exam): void {
    this.selectedExamId.set(exam.id);
    this.showExamEditorModal.set(true);
    this.showExamBuilder();
  }

  openNewExamModal(): void {
    this.selectedExamId.set(null);
    this.showExamEditorModal.set(true);
    this.showExamBuilder();
  }

  closeExamEditorModal(): void {
    this.showExamEditorModal.set(false);
    this.selectedExamId.set(null);
  }

  handleExamSaved(): void {
    this.closeExamEditorModal();
    this.loadExams();
  }

  saveExam(): void {
    const exam = this.exam();
    if (!exam.title.trim()) {
      this.toast.error('Exam title is required');
      return;
    }

    const payload = {
      Title: exam.title,
      Description: exam.description,
      CategoryId: exam.categoryId,
      Duration: exam.duration
    };

    const saveNext = () => {
      if (exam.id) {
        this.persistExamQuestions(exam.id);
      }
      this.toast.success('Exam saved');
      this.loadExams();
    };

    if (exam.id) {
      this.http.put(`${this.API_URL}/exams/${exam.id}`, payload, { responseType: 'text' as any }).subscribe({
        next: saveNext,
        error: () => this.toast.error('Failed to save exam')
      });
      return;
    }

    this.http.post<ApiExamDto>(`${this.API_URL}/exams`, payload).subscribe({
      next: result => {
        const created = this.toExam(result);
        this.exam.set(created);
        this.exams.update(items => [created, ...items]);
        this.persistExamQuestions(created.id);
        this.toast.success('Exam created');
        this.loadExams();
      },
      error: () => this.toast.error('Failed to create exam')
    });
  }

  addQuestionToBank(type: QuestionType): void {
    const payload = {
      Content: '',
      Type: this.mapQuestionTypeToApi(type),
      Difficulty: this.mapDifficultyToApi('medium'),
      CategoryId: this.categories()[0]?.id || 0,
      Marks: 1,
      Tags: [],
      Options: this.getDefaultOptions(type).map(option => option.content),
      CorrectAnswer: '',
      Explanation: '',
      Required: true
    };

    this.http.post<ApiQuestionDto>(`${this.API_URL}/questions`, payload).subscribe({
      next: result => {
        const question = this.toQuestion(result);
        this.banks.update(items => [...items, question]);
        this.openQuestionEditor(question.id);
        this.toast.success('Question added to bank');
      },
      error: err => {
        console.error('Add question error:', err);
        this.toast.error(`Failed to add question: ${err.status || 'Unknown error'}`);
      }
    });
  }

  openQuestionEditor(questionId: number): void {
    const question = this.banks().find(item => item.id === questionId);
    if (!question) {
      return;
    }

    this.editQuestion.set({
      ...question,
      options: [...(question.options || [])],
      correctAnswer: [...(question.correctAnswer || [])],
      tags: [...question.tags]
    });
    this.selectedBankQuestionId.set(questionId);
    this.showQuestionEditorModal.set(true);
  }

  closeQuestionEditor(): void {
    this.showQuestionEditorModal.set(false);
    this.editQuestion.set(null);
  }

  saveQuestion(): void {
    const question = this.editQuestion();
    if (!question) {
      return;
    }

    if (!question.content.trim()) {
      this.toast.error('Question text is required');
      return;
    }

    this.updateBankQuestion(question);
    this.toast.success('Question saved');
    this.closeQuestionEditor();
  }

  updateBankQuestion(question: Question): void {
    const options = question.options || [];
    const correctAnswerText = (question.correctAnswer || [])
      .map(id => options.find(option => option.id === id)?.content || '')
      .filter(Boolean)
      .join(',');

    this.http.put(`${this.API_URL}/questions/${question.id}`, {
      Content: question.content,
      Type: this.mapQuestionTypeToApi(question.type),
      Difficulty: this.mapDifficultyToApi(question.difficulty),
      CategoryId: question.categoryId,
      Marks: question.marks,
      Tags: question.tags,
      Options: options.map(option => option.content),
      CorrectAnswer: correctAnswerText,
      Explanation: question.explanation,
      Required: question.required
    }, { responseType: 'text' as any }).subscribe({
      next: () => {
        this.banks.update(items => items.map(item => item.id === question.id ? question : item));
        this.exam.update(exam => ({
          ...exam,
          questions: exam.questions.map(item => item.questionId === question.id ? { ...item, question } : item)
        }));
      },
      error: err => {
        console.error('Update question error:', err);
        this.toast.error(`Failed to update question: ${err.status || 'Unknown error'}`);
      }
    });
  }

  deleteQuestionFromBank(questionId: number): void {
    this.http.delete(`${this.API_URL}/questions/${questionId}`, { responseType: 'text' as any }).subscribe({
      next: () => {
        this.banks.update(items => items.filter(item => item.id !== questionId));
        this.exam.update(exam => ({
          ...exam,
          questions: exam.questions.filter(item => item.questionId !== questionId)
        }));
        if (this.selectedBankQuestionId() === questionId) {
          this.selectedBankQuestionId.set(null);
        }
        if (this.selectedQuestionId() === questionId) {
          this.selectedQuestionId.set(null);
        }
        this.toast.success('Question deleted');
      },
      error: err => {
        console.error('Delete question error:', err);
        this.toast.error(`Failed to delete question: ${err.status || 'Unknown error'}`);
      }
    });
  }

  addBankQuestionToExam(question: Question): void {
    if (this.exam().id) {
      this.addPersistedQuestionToExam(question);
      return;
    }

    this.addLocalQuestionToExam(question);
    this.showExamBuilder();
    this.toast.success('Question added to draft exam');
  }

  addLocalQuestionToExam(question: Question): void {
    this.exam.update(exam => ({
      ...exam,
      questions: [
        ...exam.questions,
        { questionId: question.id, question, order: exam.questions.length }
      ]
    }));
  }

  addPersistedQuestionToExam(question: Question): void {
    this.http.post<ApiExamQuestionDto>(`${this.API_URL}/exams/${this.exam().id}/questions`, {
      QuestionId: question.id
    }).subscribe({
      next: result => {
        this.exam.update(exam => ({
          ...exam,
          questions: [...exam.questions, this.toExamQuestion(result)]
        }));
        this.toast.success('Question added to exam');
      },
      error: err => {
        console.error('Add question to exam error:', err);
        this.toast.error(`Failed to add question to exam: ${err.status || 'Unknown error'}`);
      }
    });
  }

  removeQuestion(questionId: number): void {
    if (this.exam().id) {
      this.http.delete(`${this.API_URL}/exams/${this.exam().id}/questions/${questionId}`, { responseType: 'text' as any }).subscribe({
        next: () => this.removeLocalQuestion(questionId),
        error: () => this.removeLocalQuestion(questionId)
      });
      return;
    }

    this.removeLocalQuestion(questionId);
  }

  removeLocalQuestion(questionId: number): void {
    this.exam.update(exam => ({
      ...exam,
      questions: exam.questions.filter(item => item.questionId !== questionId)
    }));
    if (this.selectedQuestionId() === questionId) {
      this.selectedQuestionId.set(null);
    }
    this.toast.success('Question removed from exam');
  }

  duplicateQuestion(question: Question): void {
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
        if (this.exam().id) {
          this.addPersistedQuestionToExam(newQuestion);
        } else {
          this.addLocalQuestionToExam(newQuestion);
          this.showExamBuilder();
        }
        this.toast.success('Question duplicated');
      },
      error: err => {
        console.error('Duplicate question error:', err);
        this.toast.error(`Failed to duplicate question: ${err.status || 'Unknown error'}`);
      }
    });
  }

  updateQuestion(question: Question): void {
    this.banks.update(items => items.map(item => item.id === question.id ? question : item));
    this.exam.update(exam => ({
      ...exam,
      questions: exam.questions.map(item => item.questionId === question.id ? { ...item, question } : item)
    }));
  }

  updateQuestionOption(questionId: number, optionId: string, content: string): void {
    const updated = this.withUpdatedOption(questionId, optionId, content);
    this.updateQuestion(updated);
  }

  addExamOption(questionId: number): void {
    const question = this.banks().find(item => item.id === questionId) || this.selectedQuestion();
    if (!question) {
      return;
    }

    const options = [...(question.options || [])];
    options.push({ id: `opt${Date.now()}`, content: `Option ${options.length + 1}` });
    this.updateQuestion({ ...question, options });
  }

  removeOption(questionId: number, optionId: string): void {
    const question = this.banks().find(item => item.id === questionId) || this.selectedQuestion();
    if (!question) {
      return;
    }

    const options = (question.options || []).filter(option => option.id !== optionId);
    const correctAnswer = (question.correctAnswer || []).filter(id => id !== optionId);
    this.updateQuestion({ ...question, options, correctAnswer });
  }

  setCorrectAnswerExam(questionId: number, optionId: string): void {
    const question = this.banks().find(item => item.id === questionId) || this.selectedQuestion();
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
    const question = this.banks().find(item => item.id === questionId) || this.selectedQuestion();
    if (!question) {
      return;
    }

    const tags = value.split(',').map(tag => tag.trim()).filter(Boolean);
    this.updateQuestion({ ...question, tags });
  }

  drop(event: CdkDragDrop<ExamQuestion[]>): void {
    this.exam.update(exam => {
      const questions = [...exam.questions];
      moveItemInArray(questions, event.previousIndex, event.currentIndex);
      return { ...exam, questions };
    });
  }

  scheduleExam(): void {
    const exam = this.exam();
    if (!exam.id) {
      this.toast.error('Save the exam before scheduling');
      return;
    }

    this.http.patch(`${this.API_URL}/exams/${exam.id}/schedule`, {}, { responseType: 'text' as any }).subscribe({
      next: () => {
        this.exam.update(item => ({ ...item, status: 'scheduled' }));
        this.toast.success('Exam scheduled');
      },
      error: () => this.toast.error('Failed to schedule exam')
    });
  }

  publishExam(): void {
    const exam = this.exam();
    if (!exam.id) {
      this.toast.error('Save the exam before publishing');
      return;
    }

    this.http.patch(`${this.API_URL}/exams/${exam.id}/publish`, {}, { responseType: 'text' as any }).subscribe({
      next: () => {
        this.exam.update(item => ({ ...item, status: 'active' }));
        this.toast.success('Exam published');
      },
      error: () => this.toast.error('Failed to publish exam')
    });
  }

  editExistingCategory(category: Category): void {
    this.selectedCategory.set({ ...category });
  }

  cancelEdit(): void {
    this.selectedCategory.set({ id: 0, name: '', color: '#6366f1' });
  }

  openCategoryManager(): void {
    this.cancelEdit();
    this.showCategoryModal.set(true);
  }

  closeCategoryModal(): void {
    this.showCategoryModal.set(false);
    this.cancelEdit();
  }

  saveCategory(): void {
    const category = this.selectedCategory();
    if (!category.name.trim()) {
      this.toast.error('Category name is required');
      return;
    }

    const payload = {
      Name: category.name,
      Color: category.color
    };

    const success = () => {
      this.categories.update(items => {
        if (category.id) {
          return items.map(item => item.id === category.id ? { ...item, ...payload } : item);
        }
        return [...items, { ...category, ...payload, id: Date.now() }];
      });
      this.cancelEdit();
      this.toast.success('Category saved');
    };

    if (category.id) {
      this.http.put(`${this.API_URL}/question-categories/${category.id}`, payload, { responseType: 'text' as any }).subscribe({
        next: success,
        error: err => this.toast.error(`Failed to update category: ${err.status || 'Unknown error'}`)
      });
      return;
    }

    this.http.post<ApiCategoryDto>(`${this.API_URL}/question-categories`, payload).subscribe({
      next: result => {
        this.categories.update(items => [...items, this.toCategory(result)]);
        this.cancelEdit();
        this.toast.success('Category created');
      },
      error: err => this.toast.error(`Failed to create category: ${err.status || 'Unknown error'}`)
    });
  }

  deleteCategory(categoryId: number): void {
    if (!confirm('Are you sure you want to delete this category?')) {
      return;
    }

    this.http.delete(`${this.API_URL}/question-categories/${categoryId}`, { responseType: 'text' as any }).subscribe({
      next: () => {
        this.categories.update(items => items.filter(item => item.id !== categoryId));
        if (this.selectedCategoryFilter() === categoryId) {
          this.selectedCategoryFilter.set(null);
        }
        this.toast.success('Category deleted');
      },
      error: err => this.toast.error(`Failed to delete category: ${err.status || 'Unknown error'}`)
    });
  }

  deleteExam(examId: number): void {
    if (!confirm('Are you sure you want to delete this exam?')) {
      return;
    }

    this.http.delete(`${this.API_URL}/exams/${examId}`, { responseType: 'text' as any }).subscribe({
      next: () => {
        this.exams.update(items => items.filter(item => item.id !== examId));
        if (this.exam().id === examId) {
          this.exam.set(this.emptyExam());
          this.selectedQuestionId.set(null);
        }
        this.toast.success('Exam deleted');
      },
      error: err => this.toast.error(`Failed to delete exam: ${err.status || 'Unknown error'}`)
    });
  }

  duplicateExam(exam: Exam): void {
    this.http.post<ApiExamDto>(`${this.API_URL}/exams`, {
      Title: `${exam.title} (Copy)`,
      Description: exam.description,
      CategoryId: exam.categoryId,
      Duration: exam.duration,
      Questions: exam.questions.map((item, index) => ({ QuestionId: item.questionId, Order: index }))
    }).subscribe({
      next: result => {
        const created = this.toExam(result);
        this.exams.update(items => [created, ...items]);
        this.toast.success('Exam duplicated');
      },
      error: err => this.toast.error(`Failed to duplicate exam: ${err.status || 'Unknown error'}`)
    });
  }

  updateEditQuestionField(field: keyof Question, value: any): void {
    const question = this.editQuestion();
    if (question) {
      this.editQuestion.set({ ...question, [field]: value });
    }
  }

  addEditOption(): void {
    const question = this.editQuestion();
    if (!question) {
      return;
    }

    const options = [...(question.options || [])];
    options.push({ id: `opt${Date.now()}`, content: 'New Option' });
    this.editQuestion.set({ ...question, options });
  }

  updateEditOption(optionId: string, content: string): void {
    const question = this.editQuestion();
    if (!question || !question.options) {
      return;
    }

    this.editQuestion.set({
      ...question,
      options: question.options.map(option => option.id === optionId ? { ...option, content } : option)
    });
  }

  removeEditOption(optionId: string): void {
    const question = this.editQuestion();
    if (!question || !question.options) {
      return;
    }

    this.editQuestion.set({
      ...question,
      options: question.options.filter(option => option.id !== optionId),
      correctAnswer: (question.correctAnswer || []).filter(id => id !== optionId)
    });
  }

  setEditCorrectAnswer(optionId: string): void {
    const question = this.editQuestion();
    if (!question) {
      return;
    }

    const currentCorrect = question.correctAnswer || [];
    const correctAnswer = question.type === 'checkbox'
      ? currentCorrect.includes(optionId)
        ? currentCorrect.filter(id => id !== optionId)
        : [...currentCorrect, optionId]
      : [optionId];

    this.editQuestion.set({ ...question, correctAnswer });
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

  private emptyExam(): Exam {
    return {
      id: 0,
      title: '',
      description: '',
      categoryId: null,
      duration: 60,
      status: 'draft',
      availableFrom: null,
      availableTo: null,
      timeZone: null,
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
      categoryId: exam.CategoryId ?? exam.categoryId ?? null,
      duration: exam.Duration ?? exam.duration ?? 60,
      status: this.mapStatusFromApi(exam.Status ?? exam.status ?? 'Draft'),
      availableFrom: exam.AvailableFrom ?? exam.availableFrom ?? null,
      availableTo: exam.AvailableTo ?? exam.availableTo ?? null,
      timeZone: exam.TimeZone ?? exam.timeZone ?? null,
      questions
    };
  }

  private toExamQuestion(examQuestion: ApiExamQuestionDto): ExamQuestion {
    const questionData = examQuestion.Question || examQuestion.question;
    return {
      id: examQuestion.Id ?? examQuestion.id,
      questionId: examQuestion.QuestionId ?? examQuestion.questionId ?? 0,
      order: examQuestion.Order ?? examQuestion.order ?? 0,
      question: questionData ? this.toQuestion(questionData) : undefined
    };
  }

  private persistExamQuestions(examId: number): void {
    const questions = this.exam().questions;
    if (!examId || questions.length === 0) {
      return;
    }

    questions.forEach(question => {
      this.http.post<ApiExamQuestionDto>(`${this.API_URL}/exams/${examId}/questions`, {
        QuestionId: question.questionId
      }).subscribe({
        next: () => this.loadExams(),
        error: err => console.error('Persist exam question error:', err)
      });
    });
  }

  private withUpdatedOption(questionId: number, optionId: string, content: string): Question {
    const question = this.banks().find(item => item.id === questionId) || this.selectedQuestion();
    if (!question) {
      return this.emptyQuestion();
    }

    return {
      ...question,
      options: (question.options || []).map(option => option.id === optionId ? { ...option, content } : option)
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

  private getDefaultOptions(type: QuestionType): QuestionOption[] {
    if (type === 'multiple-choice' || type === 'checkbox' || type === 'dropdown') {
      return [
        { id: 'opt1', content: 'Option 1' },
        { id: 'opt2', content: 'Option 2' }
      ];
    }

    if (type === 'linear-scale') {
      return Array.from({ length: 5 }, (_, index) => ({
        id: `scale${index + 1}`,
        content: `${index + 1}`
      }));
    }

    return [];
  }

  private emptyQuestion(): Question {
    return {
      id: 0,
      content: '',
      type: 'multiple-choice',
      difficulty: 'medium',
      categoryId: 0,
      marks: 1,
      options: [],
      correctAnswer: [],
      tags: [],
      required: true
    };
  }
}

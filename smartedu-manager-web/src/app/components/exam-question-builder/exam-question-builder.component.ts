import { Component, signal, OnInit, inject } from '@angular/core';
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

interface QuestionOption {
  id: string;
  content: string;
  isCorrect?: boolean;
}

interface Exam {
  id: number;
  title: string;
  description: string;
  categoryId: number;
  duration: number;
  status: ExamStatus;
  scheduledAt?: Date | string;
  availableFrom?: Date | string;
  availableTo?: Date | string;
  timeZone?: string;
  questions: ExamQuestion[];
}

interface ExamQuestion {
  id?: number;
  questionId: number;
  question?: Question;
  order: number;
}

@Component({
  selector: 'app-exam-question-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './exam-question-builder.component.html',
  styleUrl: './exam-question-builder.component.scss'
})
export class ExamQuestionBuilderComponent implements OnInit {
  private readonly API_URL = environment.apiUrl;
  private readonly toast = inject(ToastService);

  // Active panel toggle
  activePanel = signal<'question-bank' | 'exam-builder'>('question-bank');
  
  // View modes
  selectedQuestionId = signal<number | null>(null);
  selectedBankQuestionId = signal<number | null>(null);
  
  // Modal states
  showQuestionEditorModal = signal(false);
  editQuestion = signal<Question | null>(null);
  
  // Filters
  selectedCategoryFilter = signal<number | null>(null);
  searchTerm = signal('');
  
  // Category modal
  showCategoryModal = signal(false);
  selectedCategory = signal<Category>({ id: 0, name: '', color: '#6366f1' });

  // Data
  categories = signal<Category[]>([]);
  banks = signal<Question[]>([]);
  exams = signal<Exam[]>([]);

  // Current exam being built
  exam = signal<Exam>({
    id: 0,
    title: '',
    description: '',
    categoryId: 0,
    duration: 60,
    status: 'draft',
    questions: []
  });

  // Question types available in palette
  questionTypes: { type: QuestionType; icon: string; label: string }[] = [
    { type: 'multiple-choice', icon: 'fa-circle-dot', label: 'Multiple choice' },
    { type: 'checkbox', icon: 'fa-square-check', label: 'Checkboxes' },
    { type: 'dropdown', icon: 'fa-chevron-down', label: 'Dropdown' },
    { type: 'short-answer', icon: 'fa-pen', label: 'Short answer' },
    { type: 'paragraph', icon: 'fa-align-left', label: 'Paragraph' },
    { type: 'linear-scale', icon: 'fa-sliders', label: 'Linear scale' },
    { type: 'rating', icon: 'fa-star', label: 'Rating' },
    { type: 'date', icon: 'fa-calendar', label: 'Date' },
    { type: 'time', icon: 'fa-clock', label: 'Time' }
  ];

  constructor(private http: HttpClient) {}

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

  private mapDifficultyToApi(diff: DifficultyLevel): string {
    const map: Record<DifficultyLevel, string> = {
      'easy': 'Easy',
      'medium': 'Medium',
      'hard': 'Hard'
    };
    return map[diff];
  }

  private mapQuestionTypeFromApi(type: string): QuestionType {
    const map: Record<string, QuestionType> = {
      'MultipleChoice': 'multiple-choice',
      'Checkbox': 'checkbox',
      'Dropdown': 'dropdown',
      'ShortAnswer': 'short-answer',
      'Essay': 'paragraph',
      'LinearScale': 'linear-scale',
      'Rating': 'rating',
      'Date': 'date',
      'Time': 'time'
    };
    return map[type] || 'multiple-choice';
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadQuestionBank();
    this.loadExams();
  }

  loadCategories(): void {
    this.http.get<Category[]>(`${this.API_URL}/question-categories`).subscribe({
      next: (data) => this.categories.set(data),
      error: () => this.categories.set([])
    });
  }

  loadQuestionBank(): void {
    this.http.get<any[]>(`${this.API_URL}/questions`).subscribe({
      next: (data) => {
        const questions = data.map((q: any) => {
          const opts = ((q.options as any) || []).map((opt: string, i: number) => ({ id: `opt${i + 1}`, content: opt }));
          const correctAns = (q.correctAnswer ? (q.correctAnswer as string).split(',').map((s: string) => s.trim()).filter(Boolean) : []);
          const correctIds = correctAns.map((c: string) => {
            const found = opts.find((o: any) => o.content === c);
            return found ? found.id : null;
          }).filter(Boolean);
          return {
            ...q,
            type: this.mapQuestionTypeFromApi(q.type),
            options: opts,
            correctAnswer: correctIds,
            required: q.required ?? true,
            tags: q.tags ?? []
          };
        });
        this.banks.set(questions);
      },
      error: () => this.banks.set([])
    });
  }

  loadExams(): void {
    this.http.get<Exam[]>(`${this.API_URL}/exams`).subscribe({
      next: (data) => this.exams.set(data),
      error: () => this.exams.set([])
    });
  }

  // Filter questions by category
  get filteredBankQuestions(): Question[] {
    const term = this.searchTerm().toLowerCase();
    return this.banks().filter(q => {
      const matchesCategory = !this.selectedCategoryFilter() || q.categoryId === this.selectedCategoryFilter();
      const matchesSearch = !term || q.content.toLowerCase().includes(term) || q.tags.some(t => t.toLowerCase().includes(term));
      return matchesCategory && matchesSearch;
    });
  }

  // Switch panels
  showQuestionBank(): void {
    this.activePanel.set('question-bank');
  }

  showExamBuilder(): void {
    this.activePanel.set('exam-builder');
  }

  // Question Bank CRUD
  addQuestionToBank(type: QuestionType): void {
    const payload = {
      content: '',
      type: this.mapQuestionTypeToApi(type),
      difficulty: this.mapDifficultyToApi('medium'),
      categoryId: this.categories()[0]?.id || 0,
      marks: 1,
      tags: [],
      options: (this.getDefaultOptions(type) || []).map((o: QuestionOption) => o.content)
    };

    this.http.post<Question>(`${this.API_URL}/questions`, payload).subscribe({
      next: (result) => {
        const opts = ((result.options as any) || []).map((opt: string, i: number) => ({ id: `opt${i + 1}`, content: opt }));
        const correctAns = result.correctAnswer ? (result.correctAnswer as any).split(',').map((s: string) => s.trim()).filter(Boolean) : [];
        const correctIds = correctAns.map((c: string) => opts.find((o: any) => o.content === c)?.id || null).filter(Boolean);
        const newQuestion = { ...result, type: this.mapQuestionTypeFromApi(result.type), tags: [], options: opts, correctAnswer: correctIds, required: result.required ?? true };
        this.banks.set([...this.banks(), newQuestion]);
        this.openQuestionEditor(result.id);
        this.toast.success('Question added to bank');
      },
      error: (err) => {
        console.error('Add question error:', err);
        this.toast.error(`Failed to add question: ${err.status} ${err.error || ''}`);
      }
    });
  }

  deleteQuestionFromBank(questionId: number): void {
    this.http.delete(`${this.API_URL}/questions/${questionId}`, { responseType: 'text' as any }).subscribe({
      next: () => {
        this.banks.set(this.banks().filter(q => q.id !== questionId));
        if (this.selectedBankQuestionId() === questionId) {
          this.selectedBankQuestionId.set(null);
        }
        this.toast.success('Question deleted');
      },
      error: (err) => {
        console.error('Delete question error:', err);
        this.toast.error(`Failed to delete question: ${err.status} ${err.error || ''}`);
      }
    });
  }

  updateBankQuestion(updated: Question): void {
    const opts = updated.options || [];
    const correctAns = (updated.correctAnswer || []).map(id => {
      const opt = opts.find(o => o.id === id);
      return opt ? opt.content : '';
    }).filter(Boolean);
    const payload = {
      content: updated.content,
      type: this.mapQuestionTypeToApi(updated.type),
      difficulty: this.mapDifficultyToApi(updated.difficulty),
      categoryId: updated.categoryId,
      marks: updated.marks,
      tags: updated.tags || [],
      options: opts.map(o => o.content),
      correctAnswer: correctAns.join(','),
      required: updated.required,
      explanation: updated.explanation
    };
this.http.put(`${this.API_URL}/questions/${updated.id}`, payload, { responseType: 'text' as any }).subscribe({
      next: () => {
        this.banks.update(questions => questions.map(q => q.id === updated.id ? updated : q));
      },
      error: (err) => {
        console.error('Update question error:', err);
        console.error('Error body:', err.error);
        this.toast.error(`Failed to update question: ${err.status} ${err.error || ''}`);
      }
    });
  }

  getDefaultOptions(type: QuestionType): QuestionOption[] {
    switch (type) {
      case 'multiple-choice':
      case 'checkbox':
      case 'dropdown':
        return [
          { id: 'opt1', content: 'Option 1' },
          { id: 'opt2', content: 'Option 2' }
        ];
      case 'linear-scale':
        return Array.from({ length: 5 }, (_, i) => ({ id: `scale${i+1}`, content: `${i+1}` }));
      default:
        return [];
    }
  }

  // Question editor modal
  openQuestionEditor(questionId: number): void {
    const question = this.banks().find(q => q.id === questionId);
    if (question) {
      let edited = { ...question };
      if (!edited.options && (edited.type === 'multiple-choice' || edited.type === 'checkbox' || edited.type === 'dropdown')) {
        edited.options = this.getDefaultOptions(edited.type);
      }
      this.editQuestion.set(edited);
      this.showQuestionEditorModal.set(true);
    }
  }

  closeQuestionEditor(): void {
    this.showQuestionEditorModal.set(false);
    this.editQuestion.set(null);
  }

  saveQuestion(): void {
    const q = this.editQuestion();
    if (q) {
      this.updateBankQuestion(q);
      this.toast.success('Question saved');
      this.closeQuestionEditor();
    }
  }

  updateEditQuestionField(field: keyof Question, value: any): void {
    const q = this.editQuestion();
    if (q) {
      this.editQuestion.set({ ...q, [field]: value });
    }
  }

  addEditOption(): void {
    const q = this.editQuestion();
    if (q) {
      const newId = `opt${Date.now()}`;
      const options = q.options || [];
      this.editQuestion.set({ ...q, options: [...options, { id: newId, content: 'New Option' }] });
    }
  }

  updateEditOption(optId: string, content: string): void {
    const q = this.editQuestion();
    if (q && q.options) {
      this.editQuestion.set({ ...q, options: q.options.map(o => o.id === optId ? { ...o, content } : o) });
    }
  }

  removeEditOption(optId: string): void {
    const q = this.editQuestion();
    if (q && q.options) {
      this.editQuestion.set({ ...q, options: q.options.filter(o => o.id !== optId) });
    }
  }

  updateTagsInput(value: string): void {
    const q = this.editQuestion();
    if (q) {
      this.editQuestion.set({ ...q, tags: value.split(',').map(t => t.trim()).filter(Boolean) });
    }
  }

  updateExamQuestionTags(questionId: number, value: string): void {
    const tags = value.split(',').map(t => t.trim()).filter(Boolean);
    this.updateQuestion({ ...this.selectedQuestion!, tags });
  }

  setEditCorrectAnswer(optId: string): void {
    const q = this.editQuestion();
    if (!q) return;
    const currentCorrect = q.correctAnswer || [];
    let updatedCorrect: string[];
    if (q.type === 'checkbox') {
      if (currentCorrect.includes(optId)) {
        updatedCorrect = currentCorrect.filter(id => id !== optId);
      } else {
        updatedCorrect = [...currentCorrect, optId];
      }
    } else {
      updatedCorrect = [optId];
    }
    this.editQuestion.set({ ...q, correctAnswer: updatedCorrect });
  }

  // Add question from bank to exam
  addBankQuestionToExam(question: Question): void {
    this.exam.update(e => ({
      ...e,
      questions: [...e.questions, { questionId: question.id, question, order: e.questions.length }]
    }));
  }

  // Create new exam
  createNewExam(): void {
    this.exam.set({
      id: 0,
      title: '',
      description: '',
      categoryId: this.categories()[0]?.id || 0,
      duration: 60,
      status: 'draft',
      questions: []
    });
    this.showExamBuilder();
  }

  // Exam CRUD
  saveExam(): void {
    const payload = {
      title: this.exam().title,
      description: this.exam().description,
      categoryId: this.exam().categoryId,
      duration: this.exam().duration,
      questions: this.exam().questions.map((q, i) => ({
        questionId: q.questionId,
        order: i
      }))
    };

    if (this.exam().id) {
      this.http.put(`${this.API_URL}/exams/${this.exam().id}`, payload, { responseType: 'text' as any }).subscribe({
        next: () => this.toast.success('Exam saved'),
        error: () => this.toast.error('Failed to save exam')
      });
    } else {
      this.http.post<Exam>(`${this.API_URL}/exams`, payload).subscribe({
        next: (result) => {
          this.exam.set({ ...this.exam(), id: result.id });
          this.exams.set([...this.exams(), result]);
          this.toast.success('Exam created');
        },
        error: () => this.toast.error('Failed to create exam')
      });
    }
  }

  // Remove question from exam
  removeQuestion(questionId: number): void {
    this.exam.update(e => ({
      ...e,
      questions: e.questions.filter(q => q.questionId !== questionId)
    }));
    if (this.selectedQuestionId() === questionId) {
      this.selectedQuestionId.set(null);
    }
  }

  duplicateQuestion(question: Question): void {
    const payload = {
      content: question.content,
      type: this.mapQuestionTypeToApi(question.type),
      difficulty: this.mapDifficultyToApi(question.difficulty),
      categoryId: question.categoryId,
      marks: question.marks,
      tags: question.tags || [],
      options: (question.options || []).map((o: QuestionOption) => o.content),
      correctAnswer: (question.correctAnswer || []).map(id => {
        const opt = question.options?.find(o => o.id === id);
        return opt ? opt.content : '';
      }).filter(Boolean).join(',')
    };
    this.http.post<Question>(`${this.API_URL}/questions`, payload).subscribe({
      next: (result) => {
        const opts = ((result.options as any) || []).map((opt: string, i: number) => ({ id: `opt${i + 1}`, content: opt }));
        const newQuestion = { ...result, type: this.mapQuestionTypeFromApi(result.type), options: opts, tags: result.tags || [] };
        this.exam.update(e => ({ ...e, questions: [...e.questions, { questionId: result.id, question: newQuestion, order: e.questions.length }] }));
        this.banks.set([...this.banks(), newQuestion]);
      }
    });
  }

  updateQuestion(updated: Question): void {
    this.exam.update(e => ({
      ...e,
      questions: e.questions.map(eq => 
        eq.questionId === updated.id ? { ...eq, question: updated } : eq
      )
    }));
  }

  drop(event: CdkDragDrop<ExamQuestion[]>): void {
    this.exam.update(e => {
      const questions = [...e.questions];
      moveItemInArray(questions, event.previousIndex, event.currentIndex);
      return { ...e, questions };
    });
  }

  // Schedule exam
  scheduleExam(): void {
    const payload = {
      availableFrom: this.exam().availableFrom,
      availableTo: this.exam().availableTo,
      timeZone: this.exam().timeZone
    };

    this.http.patch(`${this.API_URL}/exams/${this.exam().id}/schedule`, payload).subscribe({
      next: () => {
        this.exam.update(e => ({ ...e, status: 'scheduled' }));
        this.toast.success('Exam scheduled');
      },
      error: () => this.toast.error('Failed to schedule exam')
    });
  }

  publishExam(): void {
    this.http.patch(`${this.API_URL}/exams/${this.exam().id}/publish`, {}).subscribe({
      next: () => {
        this.exam.update(e => ({ ...e, status: 'active' }));
        this.toast.success('Exam published');
      },
      error: () => this.toast.error('Failed to publish exam')
    });
  }

  // Helper methods
  get selectedQuestion(): Question | null {
    const id = this.selectedQuestionId();
    const eq = this.exam().questions.find(q => q.questionId === id);
    return eq?.question || null;
  }

  get selectedBankQuestion(): Question | null {
    const id = this.selectedBankQuestionId();
    return this.banks().find(q => q.id === id) || null;
  }

  getQuestionTypeIcon(type: QuestionType): string {
    return this.questionTypes.find(qt => qt.type === type)?.icon || 'fa-question';
  }

  getQuestionTypeLabel(type: QuestionType): string {
    return this.questionTypes.find(qt => qt.type === type)?.label || type;
  }

  getCategoryById(id: number): Category | undefined {
    return this.categories().find(c => c.id === id);
  }

  addOption(questionId: number): void {
    this.exam.update(e => ({
      ...e,
      questions: e.questions.map(eq => {
        if (eq.questionId === questionId && eq.question) {
          const options = [...eq.question.options || []];
          options.push({ id: `opt${Date.now()}`, content: `Option ${options.length + 1}` });
          return { ...eq, question: { ...eq.question, options } };
        }
        return eq;
      })
    }));
  }

  removeOption(questionId: number, optionId: string): void {
    this.exam.update(e => ({
      ...e,
      questions: e.questions.map(eq => {
        if (eq.questionId === questionId && eq.question?.options) {
          return {
            ...eq,
            question: {
              ...eq.question,
              options: eq.question.options.filter(opt => opt.id !== optionId)
            }
          };
        }
        return eq;
      })
    }));
  }

// Category CRUD
  openCategoryManager(): void {
    this.selectedCategory.set({ id: 0, name: '', color: '#6366f1' });
    this.showCategoryModal.set(true);
  }

  editExistingCategory(cat: Category): void {
    this.selectedCategory.set({ ...cat });
  }

  cancelEdit(): void {
    this.selectedCategory.set({ id: 0, name: '', color: '#6366f1' });
  }

  closeCategoryModal(): void {
    this.showCategoryModal.set(false);
    this.selectedCategory.set({ id: 0, name: '', color: '' });
  }

  saveCategory(): void {
    const cat = this.selectedCategory();
    if (!cat.name.trim()) {
      this.toast.error('Category name is required');
      return;
    }

    const payload = { name: cat.name, color: cat.color };

    if (cat.id && cat.id > 0) {
      this.http.put(`${this.API_URL}/question-categories/${cat.id}`, payload, { responseType: 'text' as any }).subscribe({
        next: () => {
          this.categories.set(this.categories().map(c => c.id === cat.id ? { ...c, ...payload } : c));
          this.cancelEdit();
          this.toast.success('Category updated');
        },
        error: (err) => {
          console.error('Update error:', err);
          this.toast.error(`Failed to update category: ${err.status} ${err.error || ''}`);
        }
      });
    } else {
      this.http.post<Category>(`${this.API_URL}/question-categories`, payload).subscribe({
        next: (result) => {
          this.categories.set([...this.categories(), result]);
          this.cancelEdit();
          this.toast.success('Category created');
        },
        error: (err) => {
          console.error('Create error:', err);
          this.toast.error(`Failed to create category: ${err.status} ${err.error || ''}`);
        }
      });
    }
  }

  deleteCategory(catId: number): void {
    if (confirm('Are you sure you want to delete this category?')) {
      this.http.delete(`${this.API_URL}/question-categories/${catId}`).subscribe({
        next: () => {
          this.categories.set(this.categories().filter(c => c.id !== catId));
          this.toast.success('Category deleted');
        },
        error: (err) => {
          console.error('Delete error:', err);
          this.toast.error(`Failed to delete category: ${err.status} ${err.error || ''}`);
        }
      });
    }
  }

  updateBankQuestionOption(questionId: number, optId: string, content: string): void {
    this.banks.update(questions => questions.map(q => {
      if (q.id === questionId && q.options) {
        return { ...q, options: q.options.map(o => o.id === optId ? { ...o, content } : o) };
      }
      return q;
    }));
    const question = this.banks().find(q => q.id === questionId);
    if (question) {
      this.updateBankQuestion(question);
    }
  }

  // Open existing exam
  openExam(exam: Exam): void {
    this.http.get<Exam>(`${this.API_URL}/exams/${exam.id}/questions`).subscribe({
      next: (fullExam) => {
        this.exam.set(fullExam);
        this.showExamBuilder();
      }
    });
  }

  updateQuestionOption(questionId: number, optId: string, content: string): void {
    this.exam.update(e => ({
      ...e,
      questions: e.questions.map(eq => {
        if (eq.question?.id === questionId && eq.question.options) {
          return {
            ...eq,
            question: {
              ...eq.question,
              options: eq.question.options.map(o => o.id === optId ? { ...o, content } : o)
            }
          };
        }
        return eq;
      })
    }));
  }

  addExamOption(questionId: number): void {
    this.exam.update(e => ({
      ...e,
      questions: e.questions.map(eq => {
        if (eq.questionId === questionId && eq.question) {
          const options = [...eq.question.options || []];
          options.push({ id: `opt${Date.now()}`, content: `Option ${options.length + 1}` });
          return { ...eq, question: { ...eq.question, options } };
        }
        return eq;
      })
    }));
  }

  setCorrectAnswerExam(questionId: number, optId: string): void {
    this.exam.update(e => ({
      ...e,
      questions: e.questions.map(eq => {
        if (eq.question?.id === questionId && eq.question.options) {
          const currentCorrect = eq.question.correctAnswer || [];
          let updatedCorrect: string[];
          if (eq.question.type === 'checkbox') {
            if (currentCorrect.includes(optId)) {
              updatedCorrect = currentCorrect.filter(id => id !== optId);
            } else {
              updatedCorrect = [...currentCorrect, optId];
            }
          } else {
            updatedCorrect = [optId];
          }
          return { ...eq, question: { ...eq.question, correctAnswer: updatedCorrect } };
        }
        return eq;
      })
    }));
  }
}

import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export type ExamStatus = 'draft' | 'scheduled' | 'active' | 'completed';

export interface ExamQuestion {
  id?: number;
  examId: number;
  questionId: number;
  order: number;
  question?: {
    id: number;
    content: string;
    type: string;
    difficulty: string;
    marks: number;
    options?: string[];
    correctAnswer?: string;
    explanation?: string;
  } | null;
}

export interface ExamAttempt {
  id: number;
  examId: number;
  studentId: string;
  startedAt: string;
  submittedAt?: string;
  score: number;
  totalMarks: number;
  isCompleted: boolean;
  status: string;
  exam: {
    id: number;
    title: string;
    description: string;
    duration: number;
    questions: ExamQuestion[];
    availableFrom?: string | null;
    availableTo?: string | null;
  };
}

export interface Exam {
  id: number;
  title: string;
  description?: string;
  categoryId: number | null;
  duration: number;
  status: ExamStatus;
  availableFrom?: string | null;
  availableTo?: string | null;
  timeZone?: string | null;
  questions: ExamQuestion[];
  questionCount?: number;
}

interface ExamResult {
  id: number;
  examId: number;
  examTitle: string;
  score: number;
  totalMarks: number;
  percentage: number;
  status: string;
  startedAt: string;
  submittedAt?: string;
  answers: {
    questionId: number;
    questionContent: string;
    selectedAnswer?: string;
    correctAnswer: string;
    isCorrect: boolean;
    marksObtained: number;
    totalMarks: number;
  }[];
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
  Duration?: number;
  duration?: number;
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
  QuestionCount?: number;
  questionCount?: number;
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

interface ApiQuestionDto {
  Id?: number;
  id?: number;
  Content?: string | null;
  content?: string | null;
  Type?: string | null;
  type?: string | null;
  Difficulty?: string | null;
  difficulty?: string | null;
  Marks?: number;
  marks?: number;
  Options?: string[] | null;
  options?: string[] | null;
  CorrectAnswer?: string | null;
  correctAnswer?: string | null;
  Explanation?: string | null;
  explanation?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ExamService {
  private readonly API_URL = environment.apiUrl;

  exams = signal<Exam[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  getExams(): Observable<Exam[]> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.get<ApiExamDto[]>(`${this.API_URL}/exams/student`).pipe(
      map(data => data.map(item => this.toExam(item))),
      tap(mapped => {
        this.exams.set(mapped);
        this.isLoading.set(false);
      }),
      catchError(err => {
        this.isLoading.set(false);
        this.error.set('Failed to load exams');
        return throwError(() => err);
      })
    );
  }

  getExamWithQuestions(id: number): Observable<Exam> {
    return this.http.get<ApiExamDto>(`${this.API_URL}/exams/${id}/questions`).pipe(
      map(data => this.toExam(data))
    );
  }

  startExam(examId: number): Observable<ExamAttempt> {
    return this.http.post<ExamAttempt>(`${this.API_URL}/exam-attempts/start`, { examId });
  }

  submitExam(attemptId: number, answers: { questionId: number; selectedAnswer?: string }[]): Observable<ExamResult> {
    return this.http.post<ExamResult>(`${this.API_URL}/exam-attempts/submit`, {
      examAttemptId: attemptId,
      answers
    });
  }

  getMyResults(): Observable<ExamResult[]> {
    return this.http.get<ExamResult[]>(`${this.API_URL}/exam-attempts/my-results`);
  }

  getResult(resultId: number): Observable<ExamResult> {
    return this.http.get<ExamResult>(`${this.API_URL}/exam-attempts/results/${resultId}`);
  }

  private toExam(exam: ApiExamDto): Exam {
    const questions = (exam.Questions || exam.questions || [])
      .map(item => this.toExamQuestion(item))
      .sort((a, b) => a.order - b.order);

    return {
      id: exam.Id ?? exam.id ?? 0,
      title: exam.Title ?? exam.title ?? '',
      description: exam.Description ?? exam.description ?? '',
      categoryId: exam.CategoryId ?? exam.categoryId ?? null,
      duration: exam.Duration ?? exam.duration ?? 60,
      status: this.toStatus(exam.Status ?? exam.status ?? 'Draft'),
      availableFrom: exam.AvailableFrom ?? exam.availableFrom ?? null,
      availableTo: exam.AvailableTo ?? exam.availableTo ?? null,
      timeZone: exam.TimeZone ?? exam.timeZone ?? null,
      questions,
      questionCount: exam.QuestionCount ?? exam.questionCount ?? questions.length
    };
  }

  private toExamQuestion(examQuestion: ApiExamQuestionDto): ExamQuestion {
    const questionData = examQuestion.Question || examQuestion.question;
    return {
      id: examQuestion.Id ?? examQuestion.id,
      examId: examQuestion.ExamId ?? examQuestion.examId ?? 0,
      questionId: examQuestion.QuestionId ?? examQuestion.questionId ?? 0,
      order: examQuestion.Order ?? examQuestion.order ?? 0,
      question: questionData ? this.toQuestion(questionData) : undefined
    };
  }

  private toQuestion(question: ApiQuestionDto): {
    id: number;
    content: string;
    type: string;
    difficulty: string;
    marks: number;
    options?: string[];
    correctAnswer?: string;
    explanation?: string;
  } {
    return {
      id: question.Id ?? question.id ?? 0,
      content: question.Content ?? question.content ?? '',
      type: question.Type ?? question.type ?? 'multiple-choice',
      difficulty: question.Difficulty ?? question.difficulty ?? 'medium',
      marks: question.Marks ?? question.marks ?? 1,
      options: question.Options ?? question.options ?? [],
      correctAnswer: question.CorrectAnswer ?? question.correctAnswer ?? '',
      explanation: question.Explanation ?? question.explanation ?? ''
    };
  }

  private toStatus(status: string): ExamStatus {
    const normalized = status?.toLowerCase();
    if (normalized === 'scheduled' || normalized === 'active' || normalized === 'completed') {
      return normalized;
    }
    return 'draft';
  }
}
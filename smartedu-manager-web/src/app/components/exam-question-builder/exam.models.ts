export type QuestionType = 'multiple-choice' | 'checkbox' | 'dropdown' | 'short-answer' | 'paragraph' | 'linear-scale' | 'rating' | 'date' | 'time';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type ExamStatus = 'draft' | 'scheduled' | 'active' | 'completed';
export type BuilderPanel = 'question-bank' | 'exam-builder';

export interface Category {
  id: number;
  name: string;
  color: string;
}

export interface QuestionOption {
  id: string;
  content: string;
  isCorrect?: boolean;
}

export interface Question {
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

export interface ExamQuestion {
  id?: number;
  questionId: number;
  question?: Question;
  order: number;
}

export interface Exam {
  id: number;
  title: string;
  description: string;
  categoryId: number | null;
  duration: number;
  maxAttempts: number;
  status: ExamStatus;
  availableFrom: string | null;
  availableTo: string | null;
  timeZone: string | null;
  questions: ExamQuestion[];
}

export interface ApiQuestionDto {
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

export interface ApiExamQuestionDto {
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

export interface ApiExamDto {
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
  MaxAttempts?: number;
  maxAttempts?: number;
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

export interface ApiCategoryDto {
  Id?: number;
  id?: number;
  Name?: string | null;
  name?: string | null;
  Color?: string | null;
  color?: string | null;
  QuestionCount?: number;
  questionCount?: number;
}

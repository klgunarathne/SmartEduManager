export type QuestionType =
  | 'multiple-choice'
  | 'checkbox'
  | 'dropdown'
  | 'true-false'
  | 'short-answer'
  | 'essay'
  | 'text'
  | 'linear-scale'
  | 'rating'
  | 'date'
  | 'time';

export type ExamStatus = 'Draft' | 'Scheduled' | 'Active' | 'Completed';

export interface QuestionDto {
  questionId: string;
  content: string;
  type: QuestionType;
  difficulty: string;
  marks: number;
  options?: string;
  correctAnswer?: string;
  explanation?: string;
  tags?: string[];
  categoryId: string;
  categoryName?: string;
  order?: number;
}

export interface ExamDto {
  examId: string;
  title: string;
  description?: string;
  categoryId?: string;
  categoryName?: string;
  totalMarks: number;
  questionCount: number;
  duration: number;
  isActive: boolean;
  createdAt: string;
  status: ExamStatus;
  availableFrom?: string;
  availableTo?: string;
  timeZone?: string;
  questions?: QuestionDto[];
}

export interface StartExamDto {
  examId: string;
}

export interface ExamAttemptDto {
  examAttemptId: string;
  examId: string;
  studentId: string;
  startedAt: string;
  submittedAt?: string;
  score?: number;
  totalMarks: number;
  isCompleted: boolean;
  status: string;
  exam?: ExamDto;
  answers?: ExamAnswerDto[];
}

export interface ExamAnswerDto {
  examAnswerId: string;
  examAttemptId: string;
  questionId: string;
  selectedAnswer?: string;
  isCorrect?: boolean;
  marksObtained?: number;
  totalMarks?: number;
  questionContent?: string;
  correctAnswer?: string;
}

export interface ExamAnswerSubmission {
  questionId: string;
  selectedAnswer?: string;
}

export interface SubmitExamDto {
  examAttemptId: string;
  answers: ExamAnswerSubmission[];
}

export interface ExamResultDto {
  id: string;
  examId: string;
  examTitle: string;
  score: number;
  totalMarks: number;
  percentage: number;
  status: string;
  startedAt: string;
  submittedAt?: string;
  answers: ExamAnswerResultDto[];
}

export interface ExamAnswerResultDto {
  questionId: string;
  questionContent: string;
  selectedAnswer?: string;
  correctAnswer?: string;
  isCorrect: boolean;
  marksObtained: number;
  totalMarks: number;
}

export interface ExamAvailability {
  canStart: boolean;
  status: 'available' | 'scheduled' | 'draft' | 'expired' | 'not_available';
  message: string;
}

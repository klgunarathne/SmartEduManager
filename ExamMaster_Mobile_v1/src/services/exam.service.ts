import { apiClient } from './api-client';
import { ExamDto, StartExamDto, ExamAttemptDto, ExamResultDto, SubmitExamDto, ExamAnswerSubmission, ExamAvailability } from '@/models/exam.models';

export const examService = {
  async getAvailableExams(): Promise<ExamDto[]> {
    return apiClient.get<ExamDto[]>('/Exams/student');
  },

  async getExamById(examId: string): Promise<ExamDto> {
    return apiClient.get<ExamDto>(`/Exams/${examId}/questions`);
  },

  async startExam(dto: StartExamDto): Promise<ExamAttemptDto> {
    return apiClient.post<ExamAttemptDto>('/exam-attempts/start', dto);
  },

  async submitExam(dto: SubmitExamDto): Promise<ExamAttemptDto> {
    return apiClient.post<ExamAttemptDto>('/exam-attempts/submit', dto);
  },

  async getResult(resultId: string): Promise<ExamResultDto> {
    return apiClient.get<ExamResultDto>(`/exam-attempts/results/${resultId}`);
  },

  async getMyResults(): Promise<ExamResultDto[]> {
    return apiClient.get<ExamResultDto[]>('/exam-attempts/my-results');
  },

  checkAvailability(exam: ExamDto): ExamAvailability {
    const now = new Date();
    const availableFrom = exam.availableFrom ? new Date(exam.availableFrom) : null;
    const availableTo = exam.availableTo ? new Date(exam.availableTo) : null;

    if (exam.status === 'Draft') {
      return { canStart: false, status: 'draft', message: 'Exam is not yet published.' };
    }

    if (exam.status === 'Completed') {
      return { canStart: false, status: 'expired', message: 'Exam has ended.' };
    }

    if (availableFrom && now < availableFrom) {
      return {
        canStart: false,
        status: 'scheduled',
        message: `Available from ${availableFrom.toLocaleString()}`,
      };
    }

    if (availableTo && now > availableTo) {
      return { canStart: false, status: 'expired', message: 'Exam window has closed.' };
    }

    if (exam.status === 'Scheduled' && (!availableFrom || now < availableFrom)) {
      return { canStart: false, status: 'scheduled', message: 'Exam has not started yet.' };
    }

    if (exam.status === 'Active' || exam.status === 'Scheduled') {
      return { canStart: true, status: 'available', message: 'Available now' };
    }

    return { canStart: false, status: 'not_available', message: 'Exam is not available.' };
  },
};

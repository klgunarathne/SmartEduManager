export interface StudentDto {
  studentId: string;
  misNo: string;
  nameWithInitials: string;
  fullName: string;
  nicNo: string;
  gender: string;
  address?: string;
  telephone?: string;
  email?: string;
  batchId: string;
  batchCode?: string;
  gsDivision?: string;
  agDivision?: string;
  studentNumber?: string;
}

export interface CreateStudentDto {
  misNo: string;
  nameWithInitials: string;
  fullName: string;
  nicNo: string;
  gender: string;
  address?: string;
  telephone?: string;
  email?: string;
  batchId: string;
  gsDivision?: string;
  agDivision?: string;
  studentNumber?: string;
}

export interface UpdateStudentDto {
  misNo?: string;
  nameWithInitials?: string;
  fullName?: string;
  nicNo?: string;
  gender?: string;
  address?: string;
  telephone?: string;
  email?: string;
  batchId?: string;
  gsDivision?: string;
  agDivision?: string;
  studentNumber?: string;
}

export interface AttendanceDto {
  attendanceId: string;
  studentId: string;
  batchId: string;
  date: string;
  isPresent: boolean;
  remarks?: string;
  studentName?: string;
  misNo?: string;
}

export interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  percentage: number;
}

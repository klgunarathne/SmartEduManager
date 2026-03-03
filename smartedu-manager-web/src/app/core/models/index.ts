// Core Models for the Application

// Center
export interface Center {
  centerId: number;
  centerName: string;
  districtId: number;
  districtName: string;
  address: string;
  contactNumber: string;
}

export interface CreateCenterDto {
  centerName: string;
  districtId: number;
  address: string;
  contactNumber: string;
}

export interface UpdateCenterDto {
  centerName?: string;
  districtId?: number;
  address?: string;
  contactNumber?: string;
}

// Course
export interface Course {
  courseId: number;
  courseName: string;
  description: string;
  duration: number;
  courseFee: number;
  centerId: number;
  centerName: string;
  instructorIds: number[];
  instructorNames: string[];
  batchIds: number[];
  batchCodes: string[];
  hasInstructors: boolean;
  hasBatches: boolean;
}

export interface CreateCourseDto {
  courseName: string;
  description: string;
  duration: number;
  courseFee: number;
  centerId: number;
}

export interface UpdateCourseDto {
  courseName?: string;
  description?: string;
  duration?: number;
  courseFee?: number;
  centerId?: number;
}

// Instructor
export interface Instructor {
  instructorId: number;
  epfNo: string;
  fullName: string;
  nic: string;
  email: string;
  phone: string;
}

export interface CreateInstructorDto {
  epfNo: string;
  fullName: string;
  nic: string;
  email: string;
  phone: string;
}

export interface UpdateInstructorDto {
  epfNo?: string;
  fullName?: string;
  nic?: string;
  email?: string;
  phone?: string;
}

// Batch
export interface Batch {
  batchId: number;
  batchCode: string;
  batchName?: string;
  courseId: number;
  courseName: string;
  centerId?: number;
  centerName?: string;
  startDate: Date | string;
  endDate: Date | string;
  duration: number;
  maxCapacity?: number;
  currentStudentCount?: number;
}

export interface CreateBatchDto {
  batchCode: string;
  batchName?: string;
  courseId: number;
  centerId?: number;
  startDate: Date | string;
  endDate: Date | string;
  duration: number;
  maxCapacity?: number;
}

export interface UpdateBatchDto {
  batchCode?: string;
  batchName?: string;
  courseId?: number;
  centerId?: number;
  startDate?: Date | string;
  endDate?: Date | string;
  duration?: number;
  maxCapacity?: number;
}

// Student
export interface Student {
  studentId: number;
  misNo: string;
  nameWithInitials: string;
  fullName: string;
  nicNo: string;
  gender: string;
  address: string;
  telephone: string;
  email: string;
  batchId: number;
  batchCode: string;
  gsDivision: string;
  agDivision: string;
}

export interface CreateStudentDto {
  misNo: string;
  nameWithInitials: string;
  fullName: string;
  nicNo: string;
  gender: string;
  address: string;
  telephone: string;
  email?: string;
  batchId: number;
  gsDivision?: string;
  agDivision?: string;
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
  batchId?: number;
  gsDivision?: string;
  agDivision?: string;
}

// Assignment
export interface Assignment {
  id: number;
  title: string;
  description: string;
  courseId: number;
  courseName?: string;
  moduleId?: number;
  moduleName?: string;
  coveringModule?: string;
  maxMarks: number;
  dueDate: Date | string;
  createdDate: Date | string;
}

export interface CreateAssignmentDto {
  title: string;
  description: string;
  courseId: number;
  moduleId?: number;
  coveringModule?: string;
  maxMarks: number;
  dueDate: Date | string;
}

export interface UpdateAssignmentDto {
  title?: string;
  description?: string;
  courseId?: number;
  moduleId?: number;
  coveringModule?: string;
  maxMarks?: number;
  dueDate?: Date | string;
}

// Assignment Marks
export interface AssignmentMarks {
  id: number;
  assignmentId: number;
  studentId: number;
  marks: number;
  obtainedMarks?: number;
  remarks?: string;
  gradedDate?: Date | string;
}

// Continuous Assessment
export interface ContinuousAssessment {
  id: number;
  studentId: number;
  moduleTaskId: number;
  assessmentMark: string;
  assessmentDate?: Date | string;
  assessorNotes?: string;
  studentName?: string;
  moduleTaskName?: string;
  moduleName?: string;
}

export interface CreateContinuousAssessmentDto {
  studentId: number;
  moduleTaskId: number;
  assessmentMark: string;
  assessmentDate?: Date | string;
  assessorNotes?: string;
}

export interface UpdateContinuousAssessmentDto {
  assessmentMark: string;
  assessmentDate?: Date | string;
  assessorNotes?: string;
}

// District
export interface District {
  districtId: number;
  districtName: string;
}

// Course Instructor
export interface CourseInstructor {
  courseId: number;
  instructorId: number;
  courseName?: string;
  instructorName?: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  errors?: string[];
}

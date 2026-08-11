# API Documentation

## Base URL

| App | Base URL |
|------|----------|
| `smartedu-manager-web` | `https://localhost:7160/api` |

---

## Services

### 1. AuthService
**File:** `src/app/services/auth.service.ts`

| # | Method | Endpoint | Request Body | Response | Description |
|---|--------|----------|--------------|----------|-------------|
| 1 | POST | `/auth/login` | `{ email: string, password: string }` | `TokenResponse` | User login, returns access/refresh tokens |
| 2 | POST | `/auth/refresh-token` | `{ accessToken: string, refreshToken: string }` | `TokenResponse` | Refresh expired access token |

---

### 2. StudentAuthService
**File:** `src/app/services/student-auth.service.ts`

| # | Method | Endpoint | Request Body | Response | Description |
|---|--------|----------|--------------|----------|-------------|
| 1 | POST | `/students/generate-credentials` | `{ batchId?: number, studentIds?: number[] }` | `StudentCredentials[]` | Generate student credentials (usernames/passwords) |
| 2 | POST | `/students/delete-users-by-usernames` | `{ usernames: string[] }` | `DeleteUsersResponse` | Delete student user accounts by username list |
| 3 | POST | `/students/check-users-exist` | `{ usernames: string[] }` | `boolean[]` | Check if given usernames already exist |

---

### 3. AttendanceService
**File:** `src/app/services/attendance.service.ts`

| # | Method | Endpoint | Request Body | Response | Description |
|---|--------|----------|--------------|----------|-------------|
| 1 | GET | `/attendance/batch/{batchId}` | — | `Attendance[]` | Get all attendance records for a batch |
| 2 | GET | `/attendance/batch/{batchId}/summary?startDate={startDate}&endDate={endDate}` | — | `BatchAttendanceSummary[]` | Get attendance summary for a batch within a date range |
| 3 | GET | `/attendance/batch/{batchId}/monthly?year={year}&month={month}` | — | `Attendance[]` | Get monthly attendance data for a batch |
| 4 | POST | `/attendance` | `CreateAttendanceDto` | `Attendance` | Create a new attendance record |
| 5 | PUT | `/attendance/{id}` | `{ isPresent?: boolean, remarks?: string }` | `text` | Update attendance record by ID |
| 6 | DELETE | `/attendance/{id}` | — | `text` | Delete attendance record by ID |
| 7 | PUT | `/attendance/day/{date}/student/{studentId}/batch/{batchId}` | `{ isPresent: boolean }` | `text` | Update attendance for a specific student on a specific day |
| 8 | DELETE | `/attendance/day/{date}/student/{studentId}/batch/{batchId}` | — | `text` | Delete attendance for a specific student on a specific day |
| 9 | DELETE | `/attendance/day/{date}/batch/{batchId}` | — | `text` | Clear all attendance for a specific day in a batch |
| 10 | DELETE | `/attendance/batch/{batchId}` | — | `text` | Clear all attendance for an entire batch |
| 11 | GET | `/attendance/batch/summary` | — | `BatchAttendanceSummary[]` | Get overall batch attendance summary |
| 12 | GET | `/attendance/batch/{batchId}/completion-report` | — | `CourseCompletionReport` | Generate course completion report for a batch |
| 13 | GET | `/attendance/report/daily?batchId&date` | — | `Attendance[]` | Get daily attendance report |
| 14 | GET | `/attendance/report/monthly?batchId&month&year` | — | `BatchAttendanceSummary[]` | Get monthly attendance report |
| 15 | GET | `/attendance/report/student/{studentId}?startDate&endDate` | — | `StudentAttendanceSummary` | Get student-specific attendance report |
| 16 | GET | `/settings/attendance` | — | `Settings` | Get attendance settings |
| 17 | PUT | `/settings/attendance` | `Settings` | `Settings` | Update attendance settings |

---

### 4. BatchService
**File:** `src/app/services/batch.service.ts`

| # | Method | Endpoint | Request Body | Response | Description |
|---|--------|----------|--------------|----------|-------------|
| 1 | GET | `/batches` | — | `Batch[]` | Get all batches |
| 2 | GET | `/batches/instructor` | — | `Batch[]` | Get batches assigned to the current instructor |
| 3 | GET | `/batches/current` | — | `Batch` | Get the current active batch |
| 4 | GET | `/batches/{id}` | — | `Batch` | Get a single batch by ID |
| 5 | GET | `/batches/active` | — | `Batch[]` | Get all active batches |
| 6 | POST | `/batches` | `CreateBatchDto` | `Batch` | Create a new batch |
| 7 | PUT | `/batches/{id}` | `UpdateBatchDto` | `text` | Update batch details |
| 8 | DELETE | `/batches/{id}` | — | `text` | Delete a batch |

---

### 5. CenterService
**File:** `src/app/services/center.service.ts`

| # | Method | Endpoint | Request Body | Response | Description |
|---|--------|----------|--------------|----------|-------------|
| 1 | GET | `/centers` | — | `Center[]` | Get all centers |
| 2 | GET | `/centers/{id}` | — | `Center` | Get a single center by ID |
| 3 | POST | `/centers` | `CreateCenter` | `Center` | Create a new center |
| 4 | PUT | `/centers/{id}` | `Partial<CreateCenter>` | `text` | Update center details |
| 5 | DELETE | `/centers/{id}` | — | `text` | Delete a center |
| 6 | GET | `/districts` | — | `District[]` | Get all districts |
| 7 | POST | `/districts` | `{ districtName: string }` | `District` | Create a new district |
| 8 | PUT | `/districts/{id}` | `{ districtName: string }` | `text` | Update district name |
| 9 | DELETE | `/districts/{id}` | — | `text` | Delete a district |

---

### 6. CourseScheduleService
**File:** `src/app/services/course-schedule.service.ts`

| # | Method | Endpoint | Request Body | Response | Description |
|---|--------|----------|--------------|----------|-------------|
| 1 | GET | `/batches` | — | `any[]` | Load batches for schedule dropdown |
| 2 | GET | `/coursesessions?batchId&start&end` | — | `CourseSession[]` | Get course sessions with optional filters |
| 3 | GET | `/coursesessions/{id}` | — | `CourseSession` | Get a single course session |
| 4 | POST | `/coursesessions` | `CreateSessionDto` | `CourseSession` | Create a new course session |
| 5 | PUT | `/coursesessions/{id}` | `UpdateSessionDto` | `CourseSession` | Update an existing course session |
| 6 | DELETE | `/coursesessions/{id}` | — | `void` | Delete a course session |
| 7 | POST | `/coursesessions/check-conflicts` | `ConflictCheckRequest` | `ConflictCheckResult` | Check for scheduling conflicts |
| 8 | POST | `/coursesessions/generate-timetable` | `GenerateTimetableRequest` | `CourseSession[]` | Auto-generate timetable sessions |
| 9 | PUT | `/coursesessions/publish/{id}` | `{}` | `any` | Publish a course session |

---

### 7. CourseService
**File:** `src/app/services/course.service.ts`

| # | Method | Endpoint | Request Body | Response | Description |
|---|--------|----------|--------------|----------|-------------|
| 1 | GET | `/courses` | — | `Course[]` | Get all courses |
| 2 | GET | `/courses/{id}` | — | `Course` | Get a single course by ID |
| 3 | POST | `/courses` | `UpdateCourse` | `Course` | Create a new course |
| 4 | PUT | `/courses/{id}` | `{ courseName?, description?, duration?, courseFee?, centerId?, instructorIds?, ncsIds? }` | `any` | Update course details |
| 5 | DELETE | `/courses/{id}` | — | `void` | Delete a course |

---

### 8. InstructorService
**File:** `src/app/services/instructor.service.ts`

| # | Method | Endpoint | Request Body | Response | Description |
|---|--------|----------|--------------|----------|-------------|
| 1 | GET | `/instructors` | — | `Instructor[]` | Retrieve all instructors |
| 2 | GET | `/instructors/{id}` | — | `Instructor` | Retrieve a single instructor by ID |
| 3 | POST | `/instructors` | `CreateInstructor` | `Instructor` | Create a new instructor |
| 4 | PUT | `/instructors/{id}` | `Partial<CreateInstructor>` | `Instructor` | Update an existing instructor |
| 5 | DELETE | `/instructors/{id}` | — | `void` | Delete an instructor |

---

### 9. ModulesService
**File:** `src/app/services/modules.service.ts`

| # | Method | Endpoint | Request Body | Response | Description |
|---|--------|----------|--------------|----------|-------------|
| 1 | GET | `/modules` | — | `Module[]` | Get all modules |
| 2 | GET | `/modules/ncs/{ncsId}` | — | `Module[]` | Get modules filtered by NCS ID |
| 3 | GET | `/modules/{id}` | — | `Module` | Get a single module by ID |
| 4 | GET | `/modules/tasks` | — | `ModuleTask[]` | Get all module tasks |
| 5 | POST | `/modules` | `CreateModule` | `Module` | Create a new module |
| 6 | PUT | `/modules/{id}` | `Partial<CreateModule>` | `any` | Update module details |
| 7 | DELETE | `/modules/{id}` | — | `void` | Delete a module |

---

### 10. NcsService
**File:** `src/app/services/ncs.service.ts`

| # | Method | Endpoint | Request Body | Response | Description |
|---|--------|----------|--------------|----------|-------------|
| 1 | GET | `/ncs` | — | `NCS[]` | Get all NCS entries |
| 2 | GET | `/ncs/course/{courseId}` | — | `NCS[]` | Get NCS entries filtered by course ID |
| 3 | GET | `/ncs/{id}` | — | `NCS` | Get a single NCS by ID |
| 4 | POST | `/ncs` | `CreateNCS` | `NCS` | Create a new NCS entry |
| 5 | PUT | `/ncs/{id}` | `Partial<CreateNCS>` | `any` | Update NCS entry |
| 6 | DELETE | `/ncs/{id}` | — | `void` | Delete an NCS entry |

---

### 11. StudentService
**File:** `src/app/services/student.service.ts`

| # | Method | Endpoint | Request Body | Response | Description |
|---|--------|----------|--------------|----------|-------------|
| 1 | GET | `/students` | — | `ApiStudent[]` | Get all students |
| 2 | GET | `/students/batch/{batchId}` | — | `ApiStudent[]` | Get students by batch ID |
| 3 | GET | `/students/{id}` | — | `ApiStudent` | Get a single student by ID |
| 4 | POST | `/students` | Mapped `CreateStudentDto` (PascalCase keys) | `ApiStudent` | Create a new student |
| 5 | PUT | `/students/{id}` | Mapped `UpdateStudentDto` | `text` | Update student details |
| 6 | DELETE | `/students/{id}` | — | `text` | Delete a student |

---

### 12. UserService
**File:** `src/app/services/user.service.ts`

| # | Method | Endpoint | Request Body | Response | Description |
|---|--------|----------|--------------|----------|-------------|
| 1 | GET | `/users` | — | `User[]` | Get all users |
| 2 | GET | `/users/roles` | — | `Role[]` | Get all available roles |
| 3 | POST | `/users` | `Partial<User>` | `User` | Create a new user |
| 4 | PUT | `/users/{id}` | `Partial<User>` | `User` | Update user details |
| 5 | DELETE | `/users/{id}` | — | `void` | Delete a user |

---

## Components (Direct HTTP Calls)

### 13. InstructorAssignmentsComponent
**File:** `src/app/components/instructor-assignments/instructor-assignments.component.ts`

| # | Method | Endpoint | Request Body | Response | Description |
|---|--------|----------|--------------|----------|-------------|
| 1 | GET | `/batches` | — | `any[]` | Load batches for assignment management |
| 2 | GET | `/students/batch/{batchId}` | — | `any[]` | Load students for the selected batch |
| 3 | GET | `/assignments` | — | `Assignment[]` | Load all assignments |
| 4 | GET | `/assignmentmarks/assignment/{assignmentId}` | — | `AssignmentMark[]` | Load marks for a specific assignment |
| 5 | POST | `/assignments` | `{ assignmentName, coveringModule }` | `Assignment` | Create a new assignment |
| 6 | DELETE | `/assignments/{id}` | — | `text` | Delete an assignment |
| 7 | PUT | `/assignmentmarks/{id}` | `{ marks, assignmentDate }` | `text` | Update an assignment mark |
| 8 | POST | `/assignmentmarks` | `{ marks, assignmentDate, assignmentId, studentId }` | `AssignmentMark` | Create a new assignment mark |
| 9 | DELETE | `/assignmentmarks/{id}` | — | `text` | Delete an assignment mark |

---

### 14. InstructorContinuousAssessmentsComponent
**File:** `src/app/components/instructor-continuous-assessments/instructor-continuous-assessments.component.ts`

| # | Method | Endpoint | Request Body | Response | Description |
|---|--------|----------|--------------|----------|-------------|
| 1 | GET | `/batches` | — | `any[]` | Load batches for continuous assessments |
| 2 | GET | `/students/batch/{batchId}` | — | `any[]` | Load students for selected batch |
| 3 | GET | `/moduletasks` | — | `ModuleTask[]` | Load all module tasks |
| 4 | GET | `/modules` | — | `any[]` | Load all modules (for task enrichment) |
| 5 | GET | `/continuousassessments/batch/{batchId}` | — | `AssessmentRecord[]` | Load continuous assessments for a batch |
| 6 | POST | `/continuousassessments` | `{ studentId, moduleTaskId, assessmentMark, assessmentDate, competencyDate, assessorNotes }` | `AssessmentRecord` | Create a new continuous assessment record |
| 7 | PUT | `/continuousassessments/{id}` | `{ assessmentMark, assessmentDate, competencyDate, assessorNotes }` | `text` | Update an assessment mark/date |
| 8 | PUT | `/moduletasks/{taskId}/original-date` | `{ originalAssessmentDate: string \| null }` | `text` | Set/clear original assessment date for a task |

---

### 15. InstructorNcsComponent
**File:** `src/app/components/instructor-ncs/instructor-ncs.component.ts`

| # | Method | Endpoint | Request Body | Response | Description |
|---|--------|----------|--------------|----------|-------------|
| 1 | GET | `/moduletasks` | — | `any[]` | Load module tasks for the tasks tab |

---

### 16. InstructorsComponent (InstructorsPage)
**File:** `src/app/components/instructors/instructors.ts`

| # | Method | Endpoint | Request Body | Response | Description |
|---|--------|----------|--------------|----------|-------------|
| 1 | GET | `/moduletasks` | — | `any[]` | Load module tasks for the tasks tab |
| 2 | POST / PUT | `/moduletasks` or `/moduletasks/{id}` | `selectedTask` | `text` | Save a module task (create or update) |
| 3 | DELETE | `/moduletasks/{id}` | — | `text` | Delete a module task |

---

### 17. ContinuousAssessmentsReportsComponent
**File:** `src/app/components/continuous-assessments-reports/continuous-assessments-reports.component.ts`

| # | Method | Endpoint | Request Body | Response | Description |
|---|--------|----------|--------------|----------|-------------|
| 1 | GET | `/batches` | — | `any[]` | Load batches for report filtering |
| 2 | GET | `/modules` | — | `any[]` | Load all modules (part of `forkJoin`) |
| 3 | GET | `/moduletasks` | — | `any[]` | Load all module tasks (part of `forkJoin`) |
| 4 | GET | `/continuousassessments/batch/{batchId}` | — | `any[]` | Load continuous assessments for selected batch |
| 5 | GET | `/students/batch/{batchId}` | — | `any[]` | Load students for selected batch |

---

### 18. ExamEditorModalComponent
**File:** `src/app/components/exam-editor-modal/exam-editor-modal.component.ts`

| # | Method | Endpoint | Request Body | Response | Description |
|---|--------|----------|--------------|----------|-------------|
| 1 | GET | `/exams/{examId}/questions` | — | `ApiExamDto` | Load exam with its questions |
| 2 | GET | `/question-categories` | — | `ApiCategoryDto[]` | Load all question categories |
| 3 | GET | `/questions` | — | `ApiQuestionDto[]` | Load question bank |
| 4 | DELETE | `/exams/{examId}/questions/{questionId}` | — | `text` | Remove a question from an exam |
| 5 | POST | `/questions` | `{ Content, Type, Difficulty, CategoryId, Marks, Tags, Options, CorrectAnswer, Explanation, Required }` | `ApiQuestionDto` | Duplicate a question in the bank |
| 6 | POST | `/exams/{examId}/questions` | `{ QuestionId }` | `ApiExamQuestionDto` | Add a question to an exam |
| 7 | POST | `/exams` | `{ Title, Description, CategoryId, Duration }` | `ApiExamDto` | Create a new exam |
| 8 | PUT | `/exams/{examId}` | `{ Title, Description, CategoryId, Duration }` | `text` | Update exam details |
| 9 | PATCH | `/exams/{examId}/schedule` | `{ TimeZone, AvailableFrom?, AvailableTo? }` | `text` | Schedule an exam |
| 10 | PATCH | `/exams/{examId}/publish` | `{}` | `text` | Publish an exam |

---

### 19. ExamQuestionBuilderComponent
**File:** `src/app/components/exam-question-builder/exam-question-builder.component.ts`

| # | Method | Endpoint | Request Body | Response | Description |
|---|--------|----------|--------------|----------|-------------|
| 1 | GET | `/question-categories` | — | `ApiCategoryDto[]` | Load all question categories |
| 2 | GET | `/questions` | — | `ApiQuestionDto[]` | Load full question bank |
| 3 | GET | `/exams` | — | `ApiExamDto[]` | Load all exams |
| 4 | PUT | `/exams/{examId}` | `{ Title, Description, CategoryId, Duration }` | `text` | Update an exam |
| 5 | POST | `/exams` | `{ Title, Description, CategoryId, Duration }` | `ApiExamDto` | Create a new exam |
| 6 | POST | `/questions` | `{ Content, Type, Difficulty, CategoryId, Marks, Tags, Options, CorrectAnswer, Explanation, Required }` | `ApiQuestionDto` | Add a new question to the bank |
| 7 | PUT | `/questions/{questionId}` | `{ Content, Type, Difficulty, CategoryId, Marks, Tags, Options, CorrectAnswer, Explanation, Required }` | `text` | Update a question in the bank |
| 8 | DELETE | `/questions/{questionId}` | — | `text` | Delete a question from the bank |
| 9 | POST | `/exams/{examId}/questions` | `{ QuestionId }` | `ApiExamQuestionDto` | Add a persisted question to an exam |
| 10 | DELETE | `/exams/{examId}/questions/{questionId}` | — | `text` | Remove a question from an exam |
| 11 | PATCH | `/exams/{examId}/schedule` | `{}` | `text` | Schedule an exam |
| 12 | PATCH | `/exams/{examId}/publish` | `{}` | `text` | Publish an exam |
| 13 | PUT | `/question-categories/{id}` | `{ Name, Color }` | `text` | Update a question category |
| 14 | POST | `/question-categories` | `{ Name, Color }` | `ApiCategoryDto` | Create a question category |
| 15 | DELETE | `/question-categories/{id}` | — | `text` | Delete a question category |
| 16 | DELETE | `/exams/{examId}` | — | `text` | Delete an exam |

# SmartEduManager.Web - Project Structure & Features

## Overview
SmartEduManager is an Angular v21+ standalone application for managing educational training programs. It provides separate interfaces for Administrators and Instructors with role-based access control.

## Technology Stack
- **Framework**: Angular 21+ (standalone components)
- **State Management**: Angular Signals
- **Authentication**: JWT Token-based
- **UI**: Custom CSS with FontAwesome icons
- **Build**: Angular CLI with OnPush change detection
- **Notifications**: Toast notifications

---

## Project Structure

### Source Files (`src/`)

```
src/
├── app/
│   ├── components/           # UI Components
│   │   ├── admin-layout/     # Admin layout wrapper
│   │   │   └── admin-layout.component.ts - Sidebar navigation for Admin
│   │   ├── admin-dashboard/  # Admin dashboard
│   │   ├── login/           # Login page
│   │   ├── students/        # Student management (Admin)
│   │   ├── instructors/     # Instructor & NCS management (Admin only)
│   │   │   ├── instructors.ts - Instructor CRUD with checkbox multi-select for centers/courses
│   │   │   ├── instructors.html - Tab-based interface: Instructors, NCS, Modules, Tasks
│   │   │   └── instructors.scss - Styles with checkbox-grid styling
│   │   ├── courses/         # Course management (Admin)
│   │   ├── centers/         # Center management (Admin)
│   │   ├── districts/       # District management (Admin)
│   │   │   ├── districts.component.ts - Full CRUD for districts
│   │   │   ├── districts.component.html - Table with search/pagination
│   │   │   └── districts.component.scss - Styles
│   │   ├── user-manager/    # User account management (Admin)
│   │   ├── instructor-dashboard/ # Instructor dashboard
│   │   ├── instructor-batches/   # Batch management (Instructor)
│   │   ├── instructor-students/  # Student management (Instructor)
│   │   ├── instructor-ncs/       # NCS/Modules/Tasks (Instructor)
│   │   │   └── instructor-ncs.component.ts - View-only curriculum by assigned course(s)
│   │   ├── instructor-assignments/ # Assignment tracking
│   │   ├── instructor-continuous-assessments/ # CA management
│   │   ├── attendance/      # Attendance tracking system
│   │   ├── timetable/     # Course schedule/timetable
│   │   ├── exam-question-builder/ # Exam creation
│   │   ├── shared/          # Reusable components
│   │     └── toast.component.ts - Toast notification UI
│   ├── services/            # Core services
│   │   ├── auth.service.ts       # Authentication, JWT token management
│   │   ├── user.service.ts       # User CRUD operations
│   │   ├── instructor.service.ts # Instructor CRUD (multiple centers/courses)
│   │   ├── student.service.ts    # Student CRUD + CSV import
│   │   ├── course.service.ts     # Course CRUD operations
│   │   ├── batch.service.ts      # Batch CRUD operations
│   │   ├── ncs.service.ts        # NCS versions management
│   │   ├── modules.service.ts    # Modules & tasks management
│   │   ├── center.service.ts     # Centers & Districts CRUD
│   │   ├── course-schedule.service.ts # Timetable sessions
│   │   ├── toast.service.ts      # Toast notifications
│   │   └── confirm-dialog.service.ts # Confirm dialogs
│   ├── interceptors/        # HTTP interceptors
│   │   └── auth.interceptor.ts   # JWT token injection
│   ├── app.routes.ts        # Routing configuration
│   └── app.config.ts      # App configuration
├── assets/                # Static assets
└── environments/          # Environment configs
```

---

## Authentication & Authorization

### AuthService (`auth.service.ts`)
- **Signals**: `currentUser`, `isAuthenticated`
- **Methods**:
  - `login(credentials)` - Authenticate user, store JWT tokens
  - `logout()` - Clear auth state, redirect to login
  - `hasRole(role)` - Check user role
  - `isAdmin()` - Check Admin role
  - `isInstructor()` - Check Instructor role
  - `checkAuthStatus()` - Validate token expiration
  - `getToken()` - Get stored access token

### Routes Structure
- `/login` - Public access
- `/admin/*` - Admin only (dashboard, districts, centers, courses, instructors, students, users, exam-question-builder)
- `/instructor/*` - Instructor only (dashboard, ncs, batches, students, assignments, continuous-assessments, attendance, schedule)

---

## Administrator Functions

### 1. Master Data Management

#### Districts (`districts.component.ts`, `center.service.ts`)
- **Full CRUD**: Create, view, update, delete districts
- Fields: districtId, districtName
- UI: Table with search, pagination, modal forms for add/edit
- Toast notifications

#### Centers (`centers.ts`)
- Full CRUD operations on centers
- District association dropdown
- Fields: centerName, districtId, address, contactNumber
- Toast notifications for all CRUD operations

#### Courses (`courses.ts`)
- Full CRUD operations
- Fields: courseName, description, duration, courseFee, centerId
- **Instructor Assignment**: Checkbox multi-selection for assigning instructors to courses
- **NCS Assignment**: Checkbox multi-selection for assigning existing NCS versions to courses (NCS records are assigned via their courseId FK)
- Frontend validation with toast notifications

#### User Accounts (`user-manager.ts`)
- Full CRUD operations
- Role assignments (Admin, Instructor)
- User activation/deactivation
- Password validation with requirements

#### Instructors (`instructors.ts`)
- Full CRUD for instructor profiles (epfNo, fullName, email, phone, nic)
- **Multiple Center Assignment**: Checkbox multi-selection (scrollable list) - centers derived from assigned courses
- **Multiple Course Assignment**: Checkbox multi-selection (scrollable list)
- Required: Admin must create instructor records and assign courses for NCS access
- Edit dialog displays currently assigned centers and courses from API

### 3. NCS Management (`ncs.service.ts`, `modules.service.ts`)
- **NCS Versions**: Create, view, update, delete NCS
- **Modules**: Create, view, update, delete modules under NCS
- **Tasks**: Create, view, update, delete tasks under modules
- Module hours tracking (theory/practical)

---

## Instructor Functions

### 1. NCS Management (`instructor-ncs.component.ts`)
- Instructors see only NCS for their assigned Course(s)
- Course assignment set via Instructor Management (`/admin/instructors`) with multi-select checkboxes
- Tab-based interface: NCS, Modules, Tasks
- Read-only view of curriculum
- Shows "No Course Assigned" message if instructor not assigned to any course

### 2. Batch Management (`instructor-batches.component.ts`)

### 3. Student Management (`instructor-students.component.ts`)

### 4. Student Credentials (`student-credentials.component.ts`)

### 5. Attendance (`attendance/*.ts`)

### 6. Timetable (`timetable.component.ts`)
- Month View: Calendar grid with events
- Session Types: Theory, Practical, Exam, Assessment, Orientation
- CRUD Sessions: Create, view, edit, delete

### 6. Assignments (`instructor-assignments.component.ts`)
- Assignment creation and tracking
- Module/task association

### 7. Continuous Assessments (`instructor-continuous-assessments.component.ts`)
- CA tracking and scoring
- Report generation

---

## Models & Data Structures

### Core Entities

```typescript
// User (user.service.ts)
{
  id: string,
  firstName, lastName, email,
  password?, address?, dateOfBirth?, imageUrl?,
  roles: string[],
  status: string,
  createdAt?, updatedAt?,
  centerId?, courseId?
}

// Student (student.service.ts)
{
  id, misNo, nameWithInitials, fullName, nicNo,
  email, telephone, address,
  gender, batchId, studentNumber,
  gsDivision, agDivision
}

// Batch (batch.service.ts)
{
  batchId, batchCode, courseId, courseName,
  startDate, endDate, duration
}

// Course (course.service.ts)
{
  courseId, courseName, description, duration,
  courseFee, centerId, centerName,
  instructorIds, instructorNames,
  batchIds, batchCodes,
  hasInstructors, hasBatches,
  ncs: CourseNC[]
}

// CourseNC
{
  id, version, name, updatedDate
}

// Instructor (instructor.service.ts)
{
  instructorId, epfNo, fullName, email, phone, nic,
  centerIds: number[], centerNames: string[],
  courseIds: number[], courseNames: string[]
}

// District (center.service.ts)
{
  districtId, districtName
}

// Center (center.service.ts)
{
  centerId, centerName, districtId, districtName,
  address, contactNumber
}

// NCS (ncs.service.ts)
{
  id, version, name, updatedDate,
  courseId, courseName,
  modules: Module[]
}

// Module (modules.service.ts)
{
  id, moduleNo, moduleName,
  theoryHours, practicalHours, ncsId,
  tasks: Task[]
}

// Task
{
  id, taskNo, taskName, moduleId
}

// CourseSession (course-schedule.service.ts)
{
  appointmentId, text, description,
  startDateTime, endDateTime,
  allDay, sessionType, status,
  batchId, batchCode,
  instructorId, centerId
}
```

---

## Features Summary

| Feature | Admin | Instructor | Status |
|---------|-------|----------|--------|
| Dashboard | ✅ | ✅ | Separate dashboards |
| Districts | ✅ | ❌ | Full CRUD implemented |
| Centers | ✅ | ❌ | Full CRUD with toast notifications |
| Courses | ✅ | ❌ | Full CRUD |
| Instructors | ✅ | ❌ | Manage instructors with multi-center/course assignment via checkboxes |
| Students | ❌ | ✅ | Managed by Instructor through batches |
| Batches | ✅ | ✅ | Admin can view, Instructor creates/manages own batches |
| NCS | ✅ | ✅ | Admin full access, Instructor filtered by assigned course(s) |
| Modules | ✅ | ✅ | Under NCS with toast notifications |
| Tasks | ✅ | ✅ | Under Modules with toast notifications |
| Timetable | ✅ | ✅ | Session scheduling |
| Attendance | ✅ | ✅ | Daily/monthly tracking |
| Assignments | ✅ | ✅ | Task assignments |
| Continuous Assessments | ✅ | ✅ | Scoring system |
| Student Credentials | ❌ | ✅ | Generate student login credentials via CSV download |

---

## Remaining Features (Require Backend API)

1. **NCS Publish Notifications** - No notification system for new NCS versions
2. **NCS Version Switching** - Backend endpoint to switch active NCS version for instructor

---

## Environment Configuration

### Development (`environment.ts`)
```typescript
apiUrl: 'https://localhost:7160/api'
```

### Production (`environment.prod.ts`)
```typescript
apiUrl: 'https://smartedumanagerapi.somee.com/api'
```

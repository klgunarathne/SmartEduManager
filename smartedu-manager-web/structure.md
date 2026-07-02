# SmartEduManager.Web - Project Structure & Features

## Overview
SmartEduManager is an Angular v21+ standalone application for managing educational training programs. It provides separate interfaces for Administrators and Instructors with role-based access control.

## Technology Stack
- **Framework**: Angular 21+ (standalone components)
- **State Management**: Angular Signals
- **Authentication**: JWT Token-based
- **UI**: Custom CSS with FontAwesome icons
- **Build**: Angular CLI with OnPush change detection

---

## Project Structure

### Source Files (`src/`)

```
src/
├── app/
│   ├── components/           # UI Components
│   │   ├── admin-layout/     # Admin layout wrapper
│   │   ├── admin-dashboard/  # Admin dashboard
│   │   ├── login/           # Login page
│   │   ├── students/        # Student management (Admin)
│   │   ├── instructors/     # Instructor & NCS management
│   │   ├── courses/         # Course management (Admin)
│   │   ├── centers/         # Center & District management
│   │   ├── user-manager/    # User account management
│   │   ├── instructor-dashboard/ # Instructor dashboard
│   │   ├── instructor-batches/   # Batch management (Instructor)
│   │   ├── instructor-students/  # Student management (Instructor)
│   │   ├── instructor-assignments/ # Assignment tracking
│   │   ├── instructor-continuous-assessments/ # CA management
│   │   ├── attendance/      # Attendance tracking system
│   │   ├── timetable/       # Course schedule/timetable
│   │   ├── exam-question-builder/ # Exam creation
│   │   ├── shared/          # Reusable components
│   │   └── continuous-assessments-reports/ # CA reports
│   ├── services/            # Core services
│   │   ├── auth.service.ts       # Authentication
│   │   ├── user.service.ts       # User management
│   │   ├── instructor.service.ts # Instructor CRUD
│   │   ├── student.service.ts    # Student CRUD + CSV import
│   │   ├── course.service.ts     # Course CRUD
│   │   ├── batch.service.ts      # Batch CRUD
│   │   ├── ncs.service.ts        # NCS versions
│   │   ├── modules.service.ts    # Modules & tasks
│   │   ├── center.service.ts     # Centers & districts
│   │   ├── course-schedule.service.ts # Timetable sessions
│   │   └── toast.service.ts      # Notifications
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

### Routes Structure
- `/login` - Public access
- `/admin/*` - Admin only (instructors, courses, centers, users, timetable, exam-builder)
- `/instructor/*` - Instructor only (dashboard, batches, students, ncs, modules, schedule, attendance)

---

## Administrator Functions

### 1. Master Data Management

#### Districts (`center.service.ts`)
- `getDistricts()` - Retrieve all districts
- *Note: No dedicated UI component exists*

#### Centers (`centers.ts`)
- Full CRUD operations on centers
- District association
- Fields: centerName, districtId, address, contactNumber

#### Courses (`courses.ts`)
- Full CRUD operations
- Fields: courseName, courseCode, description, duration

#### User Accounts (`user-manager.ts`)
- Full CRUD operations
- Role assignments (Admin, Instructor)
- User activation/deactivation

### 2. Instructor Management (`instructors.ts`)
- Create/edit/delete instructors
- Assign to Center and Course
- Fields: epfNo, fullName, email, phone, nic, courseId, centerId

### 3. NCS Management (`ncs.service.ts`, `instructors.ts`)
- **NCS Versions**: Create, view, update, delete NCS
- **Modules**: Create, view, update, delete modules under NCS
- **Tasks**: Create, view, update, delete tasks under modules
- Module hours tracking (theory/practical)

---

## Instructor Functions

### 1. NCS Management
- Instructors see only NCS for their assigned Course/Trade
- Tab-based interface: NCS, Modules, Tasks
- View and use assigned curriculum

### 2. Batch Management (`instructor-batches.component.ts`)
- **Create Batch**: batchCode, courseId, startDate, endDate
- **View Batches**: Table view with batch details
- **Update Batch**: Edit batch information
- **Delete Batch**: Remove batch

### 3. Student Management (`instructor-students.component.ts`)
- **Register Students**:
  - Individual: misNo, nameWithInitials, fullName, nicNo, gender, address, telephone, email
  - Bulk CSV Import with column mapping
- **Assign to Batches**: Dropdown selection
- **View Students**: Search, filter by batch, reorder students
- **Update Student**: Edit all student fields
- **Delete Student**: Remove enrollment
- **Reordering**: Move students up/down in list

### 4. Attendance (`attendance/*.ts`)
- Daily attendance tracking
- Monthly calendar view
- Student summary reports
- Batch summary reports
- Course completion tracking

### 5. Timetable (`timetable.component.ts`, `custom-calendar.component.ts`)
- **Month View**: Calendar grid with events
- **Week View**: Time-based horizontal view (8AM-6PM)
- **Session Types**: Theory, Practical, Exam, Assessment, Orientation
- **CRUD Sessions**: Create, view, edit, delete
- **Double-click dates**: Quick session creation

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
// User
{
  id: string,
  firstName, lastName, email,
  roles: string[],
  phoneNumber?, address?, dateOfBirth?, imageUrl?
}

// Student
{
  id, misNo, nameWithInitials, fullName, nicNo,
  email, telephone, address,
  gender, batchId, studentNumber,
  gsDivision, agDivision
}

// Batch
{
  batchId, batchCode, courseId, courseName,
  startDate, endDate, duration
}

// Course
{
  courseId, courseName, courseCode,
  description, duration
}

// Instructor
{
  instructorId, epfNo, fullName, email, phone, nic,
  centerId, courseId
}

// NCS
{
  id, version, name, updatedDate,
  courseId, courseName,
  modules: Module[]
}

// Module
{
  id, moduleNo, moduleName,
  theoryHours, practicalHours, ncsId,
  tasks: Task[]
}

// Task
{
  id, taskNo, taskName, moduleId
}

// CourseSession
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

| Feature | Admin | Instructor | Notes |
|---------|-------|----------|-------|
| Dashboard | ✅ | ✅ | Separate dashboards |
| Districts | ✅ | ❌ | Service exists, no UI |
| Centers | ✅ | ❌ | Full CRUD |
| Courses | ✅ | ❌ | Full CRUD |
| Instructors | ✅ | ❌ | Manage instructors |
| Students | ✅ | ✅ | Admin global access, Instructor by batch |
| Batches | ✅ | ✅ | Instructor creates/manages own batches |
| NCS | ✅ | ✅ | Admin full access, Instructor filtered by course |
| Modules | ✅ | ✅ | Under NCS |
| Tasks | ✅ | ✅ | Under Modules |
| Timetable | ✅ | ✅ | Session scheduling |
| Attendance | ✅ | ✅ | Daily/monthly tracking |
| Assignments | ✅ | ✅ | Task assignments |
| Continuous Assessments | ✅ | ✅ | Scoring system |

---

## Missing Features (To Implement)

1. **Districts UI** - No component for managing districts
2. **NCS Publish Notifications** - No notification system for new NCS versions
3. **NCS Version Switching** - Instructors cannot switch between NCS versions
4. **Instructor-Course Filtering** - NCS not filtered by instructor's assigned course
5. **Role-based Menu** - Same layout used for both roles

---

## Environment Configuration

### Development (`environment.ts`)
```typescript
apiUrl: 'https://localhost:7160/api'
```

### Production (`environment.prod.ts`)
```typescript
apiUrl: 'production-api-url'
```
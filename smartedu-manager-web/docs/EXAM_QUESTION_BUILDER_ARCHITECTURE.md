# Exam Question Builder - Architectural Plan & UI Specification

## Overview

The Exam Question Builder is a modern, intuitive component for the SmartEdu Instructor App that enables instructors to create, categorize, and manage questions within a question bank, as well as seamlessly assemble these questions into complete exams.

---

## 1. Component Architecture

### 1.1 File Structure

```
src/app/components/exam-question-builder/
├── exam-question-builder.component.ts     # Main component with business logic
├── exam-question-builder.component.html   # Template with three-tab interface
└── exam-question-builder.component.scss   # Styles following SmartEdu theme
```

### 1.2 Core Modules

| Module | Responsibility |
|--------|---------------|
| **Question Bank Module** | CRUD operations for questions, categorization, filtering |
| **Category Management** | Course/subject organization, color coding |
| **Exam Builder Module** | Exam creation, question assembly, exam statistics |

---

## 2. Data Models

### 2.1 Category
- `id`: Unique identifier
- `name`: Category/subject name (e.g., Mathematics, Science)
- `color`: Visual color code for badge display
- `questionCount`: Number of questions in category

### 2.2 Question
- `id`: Unique identifier
- `content`: Question text
- `type`: `multiple-choice` | `true-false` | `short-answer` | `essay`
- `difficulty`: `easy` | `medium` | `hard`
- `categoryId`: Foreign key to Category
- `categoryName`: Resolved category name
- `marks`: Point value
- `options`: Array of MC options (optional)
- `correctAnswer`: Correct option index or answer
- `explanation`: Optional explanation text
- `tags`: Array of search tags
- `createdAt` / `updatedAt`: Timestamps

### 2.3 Exam
- `id`: Unique identifier
- `title`: Exam title
- `description`: Exam description
- `categoryId`: Foreign key to Category
- `categoryName`: Resolved category name
- `totalMarks`: Calculated total
- `questionCount`: Number of questions
- `duration`: Time limit in minutes
- `isActive`: Status flag
- `createdAt`: Creation timestamp

### 2.4 ExamQuestion (Junction)
- `id`: Unique identifier
- `examId`: Foreign key to Exam
- `questionId`: Foreign key to Question
- `question`: Full question object (optional)
- `order`: Position in exam

---

## 3. UI Specification

### 3.1 Three-Tab Interface

| Tab | Purpose | Key Features |
|-----|---------|-------------|
| **Question Bank** | View & manage all questions | Grid layout, filters, inline edit/delete |
| **Exam Builder** | Assemble selected exam | Drag-drop visualization, stats panel |
| **My Exams** | List all created exams | Card grid, quick access to builder |

### 3.2 Color Palette (SmartEdu Theme)

| Element | Background | Text | Usage |
|---------|-----------|------|-------|
| Primary | `linear-gradient(135deg, #6366f1, #8b5cf6)` | White | Primary buttons, active states |
| Success | `#10b981` → `#34d399` gradient | White | Active status badges |
| Warning | `#f59e0b` → `#fbbf24` gradient | White | Warning states |
| Danger | `#ef4444` | White | Delete actions |
| Info | `#3b82f6` | White | Info states |

### 3.3 Question Type Icons

| Type | Icon | Label |
|------|------|-------|
| multiple-choice | `fa-list-ul` | Multiple Choice |
| true-false | `fa-toggle-on` | True/False |
| short-answer | `fa-pen` | Short Answer |
| essay | `fa-align-left` | Essay |

### 3.4 Difficulty Badges

| Level | Background | Text |
|-------|-----------|------|
| Easy | `#dcfce7` | `#16a34a` |
| Medium | `#fef3c7` | `#d97706` |
| Hard | `#fee2e2` | `#dc2626` |

---

## 4. API Endpoints (Expected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/question-categories` | List all categories |
| POST | `/question-categories` | Create category |
| PUT | `/question-categories/{id}` | Update category |
| DELETE | `/question-categories/{id}` | Delete category |
| GET | `/questions` | List all questions |
| POST | `/questions` | Create question |
| PUT | `/questions/{id}` | Update question |
| DELETE | `/questions/{id}` | Delete question |
| GET | `/exams` | List all exams |
| POST | `/exams` | Create exam |
| GET | `/exams/{id}/questions` | Get exam questions |
| POST | `/exams/{id}/questions` | Add question to exam |
| DELETE | `/exams/{id}/questions/{qid}` | Remove from exam |

---

## 5. Component Features

### 5.1 Question Bank Module
- **Filtering**: By category, question type, search term
- **Question Cards**: Visual display with category badge, type icon, difficulty, marks
- **Inline Actions**: Edit, delete, add to exam (when exam selected)
- **Options Preview**: Shows available options for MC questions
- **Tags Display**: Visual tag badges for quick identification

### 5.2 Category Management
- **Create/Edit Modal**: Name and color customization
- **Visual Color Picker**: Native HTML5 color input
- **Delete Protection**: Confirmation with warning about reassignment

### 5.3 Exam Builder Module
- **Exam Stats Panel**: Questions count, total marks, duration
- **Question List**: Ordered list of assembled questions
- **One-Click Removal**: Remove individual questions from exam
- **Quick Navigation**: Switch back to bank to add more

### 5.4 My Exams Module
- **Exam Cards**: Visual overview with status (Active/Draft)
- **Category Badge**: Color-coded subject indicator
- **Quick Access**: Click card to open in builder

---

## 6. Responsive Design

- Desktop: 4-column question grid, sidebar expanded
- Tablet: 2-column grid, collapsed sidebar
- Mobile: Single column, hidden sidebar

---

## 7. Integration Points

1. **Routes**: Added to both `admin` and `instructor` sections
2. **Sidebar Navigation**: Added "Exam Builder" link for instructors
3. **Shared Services**: Uses existing `HttpClientModule` and `FormsModule`

---

## 8. Future Enhancements

- Import/Export functionality for bulk question upload
- Question preview/printing capability
- Exam publishing workflow
- Question randomization for exam variants
- Analytics on exam performance

---

## 9. Backend Implementation

### 9.1 Models Created
- `QuestionCategory.cs` - Subject/classification categories
- `Question.cs` - Questions with type, difficulty, marks, tags
- `Exam.cs` - Exam containers with duration and category
- `ExamQuestion.cs` - Junction entity for exam-question relationships

### 9.2 Database Tables
- `QuestionCategories` - Stores subject categories
- `Questions` - Stores all question bank entries
- `Exams` - Stores exam metadata
- `ExamQuestions` - Links questions to exams with ordering

### 9.3 API Controllers
- `QuestionCategoriesController` - CRUD for categories with toast notifications
- `QuestionsController` - CRUD for questions with toast notifications
- `ExamsController` - Exam CRUD + question assembly endpoints

### 9.4 Routes Added
- `/instructor/exam-question-builder`
- `/admin/exam-question-builder`

### 9.5 Notification System
- Integrated `ToastService` for success/error feedback on all operations
- Removed dummy data/fallback mock data - component now displays empty state when no data exists
# Exam Question Builder - Architectural Plan (Two-Panel Design)

## Overview

A two-panel interface for managing question banks and building exams:
- **Left panel**: Question bank with category filtering
- **Center panel**: Exam builder (when active) or question list
- **Right panel**: Question editing/settings

## Workflow

### 1. Question Bank Management
- Create questions via palette (9 types)
- Categorize questions with subject categories
- Set difficulty, marks, tags
- Search and filter by category

### 2. Exam Builder
- Select/create an exam
- Add questions from bank via click
- Reorder questions via drag-drop
- Edit question settings per-exam
- Save or publish exam

---

## UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Header: [Question Bank] [Exam Builder]                           │
├─────────────┬─────────────────────────────────┬───────────────┤
│ Question    │ Exam Canvas / Question List        │ Settings      │
│ List          (Questions in current exam)         │               │
│             │                                   │               │
│ Filter:     │ Exam Title                        │ Category       │
│ [Search]    │ Description                       │ Marks         │
│ [Category]  │ Questions appear below...         │ Difficulty    │
│             │                                   │ Tags          │
└─────────────┴─────────────────────────────────┴───────────────┘
```

---

## Features

### Category-Based Organization
- Color-coded category badges
- Filter dropdown for category selection
- Questions display category name

### Question Types
- Multiple choice, checkboxes, dropdown
- Short answer, paragraph
- Linear scale, rating
- Date, time

### Exam Management
- Create/edit exams
- Drag-drop reordering
- Question statistics
- Publish to make available to students
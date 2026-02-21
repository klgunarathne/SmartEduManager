# Student Progress Analyzer - Technical Report

## Table of Contents
1. [Overview](#overview)
2. [Technologies Used](#technologies-used)
3. [System Architecture](#system-architecture)
4. [Data Sources](#data-sources)
5. [Data Preprocessing & Cleaning](#data-preprocessing--cleaning)
6. [Feature Engineering](#feature-engineering)
7. [Machine Learning Algorithm](#machine-learning-algorithm)
8. [Model Training](#model-training)
9. [Prediction & Risk Assessment](#prediction--risk-assessment)
10. [Model Evaluation Metrics](#model-evaluation-metrics)
11. [API Integration](#api-integration)
12. [Output & Reports](#output--reports)

---

## 1. Overview

The **Student Progress Analyzer** is an AI-powered machine learning system designed to predict student exam pass rates and identify at-risk students based on their continuous assessment performance and assignment marks. The system uses historical student data to train a Random Forest classifier that predicts whether a student is likely to pass or fail their exams.

### Key Objectives:
- Predict exam pass/fail outcomes for students
- Identify students at high risk of failing
- Provide actionable insights for instructors to intervene early
- Calculate competency rates and performance metrics

---

## 2. Technologies Used

### Programming Languages
| Technology | Version | Purpose |
|-----------|---------|---------|
| Python | 3.x | Primary programming language |

### Web Framework
| Technology | Version | Purpose |
|-----------|---------|---------|
| Flask | 2.3.0 | Web application framework |
| Flask-WTF | 1.2.1 | Form handling and validation |

### Machine Learning & Data Processing
| Library | Version | Purpose |
|---------|---------|---------|
| pandas | ≥2.2.0 | Data manipulation and analysis |
| numpy | ≥1.26.0 | Numerical computations |
| scikit-learn | ≥1.3.0 | Machine learning algorithms |
| joblib | ≥1.3.0 | Model serialization/deserialization |

### Other Dependencies
| Library | Version | Purpose |
|---------|---------|---------|
| requests | 2.31.0 | HTTP API calls |
| python-dotenv | 1.0.0 | Environment variable management |
| wtforms | 3.0.1 | Form validation |
| email-validator | 2.1.0 | Email validation |

### Backend API (ASP.NET Core)
| Technology | Purpose |
|-----------|---------|
| Entity Framework Core | ORM for database operations |
| SQL Server | Relational database |
| JWT Authentication | Secure API access |
| AutoMapper | Object-object mapping |
| FluentValidation | Input validation |

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Flask Web Application                        │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │   Templates     │  │ StudentProgress  │  │    Routes     │ │
│  │  (HTML/Jinja2) │  │    Analyzer      │  │   (app.py)    │ │
│  └────────┬────────┘  └────────┬─────────┘  └───────┬───────┘ │
│           │                     │                    │          │
│           └─────────────────────┼────────────────────┘          │
│                                 │                               │
└─────────────────────────────────┼───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SmartEduManager API                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │  Students    │  │ Continuous   │  │    Assignment        │ │
│  │  Controller  │  │ Assessments  │  │    Marks Controller  │ │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬─────────┘ │
│         │                  │                      │            │
│         └──────────────────┼──────────────────────┘            │
│                            ▼                                     │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    SQL Server Database                      │ │
│  │  Students | ContinuousAssessments | AssignmentMarks        │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow:
1. **Data Collection**: Flask app fetches student data from API
2. **Preprocessing**: Raw data cleaned and transformed into features
3. **Training**: ML model trained on historical data (optional)
4. **Prediction**: Trained model predicts pass/fail outcomes
5. **Reporting**: Results displayed in web interface with risk levels

---

## 4. Data Sources

The Student Progress Analyzer uses three main data sources from the SmartEduManager API:

### 4.1 Student Data
```json
{
  "studentId": 1,
  "misNo": "STU001",
  "nameWithInitials": "A.B. Silva",
  "fullName": "Amara Buddika Silva",
  "gender": "Male",
  "batchId": 1,
  "gsDivision": "Kolonnawa",
  "agDivision": "Kolonnawa"
}
```

**Fields Used:**
- `StudentId` - Unique identifier
- `Gender` - For potential demographic analysis
- `BatchId` - For filtering by batch/course

### 4.2 Continuous Assessment Data
```json
{
  "id": 1,
  "studentId": 1,
  "moduleTaskId": 1,
  "assessmentMark": "C",  // "C" = Competent, "NYC" = Not Yet Competent
  "assessmentDate": "2025-01-15",
  "assessorNotes": "Good performance"
}
```

**Fields Used:**
- `StudentId` - Link to student
- `AssessmentMark` - C (Competent) or NYC (Not Yet Competent)
- `AssessmentDate` - For temporal analysis

### 4.3 Assignment Marks Data
```json
{
  "id": 1,
  "marks": 85,
  "assignmentDate": "2025-02-01",
  "assignmentId": 1,
  "studentId": 1
}
```

**Fields Used:**
- `StudentId` - Link to student
- `Marks` - Numeric score (0-100)
- `AssignmentDate` - For temporal analysis

---

## 5. Data Preprocessing & Cleaning

The preprocessing pipeline handles multiple data quality issues:

### 5.1 Column Name Standardization
```python
# Handle various column name formats (camelCase, PascalCase, snake_case)
rename_mapping = {}
for col in df.columns:
    if col.lower() == 'studentid' and 'StudentId' not in df.columns:
        rename_mapping[col] = 'StudentId'
    elif col.lower() == 'assessmentmark' and 'AssessmentMark' not in df.columns:
        rename_mapping[col] = 'AssessmentMark'
```

### 5.2 Continuous Assessment Preprocessing
1. **Conversion**: Transform categorical values to numeric
   - `C` (Competent) → `1`
   - `NYC` (Not Yet Competent) → `0`

2. **Aggregation**: Group by StudentId and calculate:
   - `TotalAssessments` - Count of all assessments
   - `CompetentAssessments` - Count of 'C' marks
   - `CompetencyRate` - Mean of assessment values (percentage)

3. **Temporal Data**: Extract first and last assessment dates

### 5.3 Assignment Marks Preprocessing
1. **Aggregation**: Group by StudentId and calculate:
   - `TotalAssignments` - Count of assignments
   - `TotalMarks` - Sum of all marks
   - `AvgMarks` - Average marks
   - `MarksStd` - Standard deviation of marks
   - `MinMarks` - Minimum marks
   - `MaxMarks` - Maximum marks

2. **Missing Values**: Replace NaN in standard deviation with 0 (for students with single assignment)

### 5.4 Data Merging
```python
# Merge all data sources on StudentId
features = pd.merge(students_df, assessment_stats, on='StudentId', how='left')
features = pd.merge(features, assignment_stats, on='StudentId', how='left')
```

### 5.5 Missing Value Handling
```python
# Fill all missing values with 0
required_columns = [
    'TotalAssessments', 'CompetentAssessments', 'CompetencyRate',
    'TotalAssignments', 'TotalMarks', 'AvgMarks', 'MarksStd',
    'MinMarks', 'MaxMarks', 'AssessmentToAssignmentRatio'
]

for col in required_columns:
    if col not in features.columns:
        features[col] = 0
    else:
        features[col] = features[col].fillna(0)
```

---

## 6. Feature Engineering

### 6.1 Engineered Features

| Feature | Formula/Source | Description |
|---------|---------------|-------------|
| `TotalAssessments` | COUNT(assessments) | Total number of continuous assessments |
| `CompetentAssessments` | SUM(assessmentMark=1) | Number of competent assessments |
| `CompetencyRate` | AVG(assessmentMark) | Percentage of competent assessments (0-1) |
| `TotalAssignments` | COUNT(assignments) | Total number of assignments |
| `TotalMarks` | SUM(marks) | Sum of all assignment marks |
| `AvgMarks` | AVG(marks) | Average assignment marks (0-100) |
| `MarksStd` | STD(marks) | Variation in assignment performance |
| `MinMarks` | MIN(marks) | Lowest assignment mark |
| `MaxMarks` | MAX(marks) | Highest assignment mark |
| `AssessmentToAssignmentRatio` | TotalAssessments/TotalAssignments | Ratio of assessments to assignments |

### 6.2 Target Variable (Ground Truth)
```python
# Pass criteria: Competency rate > 70% AND Average marks > 50
features['Pass'] = (
    (features['CompetencyRate'] > 0.7) & (features['AvgMarks'] > 50)
).astype(int)
```

### 6.3 Feature Selection
```python
# Remove non-numeric and identifier columns
X = features.drop(['StudentId', 'BatchId', 'Gender', 'Pass'], axis=1)
```

---

## 7. Machine Learning Algorithm

### Algorithm: Random Forest Classifier

**Why Random Forest?**
- Handles both numerical and categorical features
- Robust to outliers and missing values
- Provides feature importance rankings
- Good balance between bias and variance
- Works well with relatively small datasets

### Model Configuration
```python
RandomForestClassifier(
    n_estimators=100,      # Number of trees
    max_depth=10,          # Maximum tree depth
    min_samples_split=5,   # Min samples to split a node
    min_samples_leaf=2,    # Min samples in a leaf node
    random_state=42,      # Reproducibility
    n_jobs=-1              # Use all CPU cores
)
```

### Pipeline Architecture
```python
Pipeline([
    ('preprocessor', ColumnTransformer([
        ('num', Pipeline([
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler())
        ]), numeric_features)
    ])),
    ('classifier', RandomForestClassifier(...))
])
```

### Preprocessing Pipeline
1. **Imputation**: Replace missing values with median (robust to outliers)
2. **Scaling**: Standardize features (mean=0, std=1) for better convergence

---

## 8. Model Training

### 8.1 Train-Test Split
```python
X_train, X_test, y_train, y_test = train_test_split(
    X, y, 
    test_size=0.2,      # 80% train, 20% test
    random_state=42,    # Reproducibility
    stratify=y          # Maintain class distribution
)
```

### 8.2 Training Process
1. Load preprocessed features DataFrame
2. Split into training (80%) and testing (20%) sets
3. Apply preprocessing pipeline (impute + scale)
4. Train Random Forest classifier on training data
5. Evaluate on test set
6. Save model to disk using joblib

### 8.3 Model Persistence
```python
# Save trained model
joblib.dump(self.model, 'models/student_progress_predictor.pkl')

# Load trained model
self.model = joblib.load('models/student_progress_predictor.pkl')
```

---

## 9. Prediction & Risk Assessment

### 9.1 Batch Predictions
```python
# Generate predictions for all students
predictions = self.model.predict(X)        # Binary prediction (0/1)
probabilities = self.model.predict_proba(X)[:, 1]  # Probability of passing
```

### 9.2 Risk Level Classification
| Risk Level | Probability Range | Interpretation |
|------------|------------------|----------------|
| **Low** | ≥ 70% | Student likely to pass with high confidence |
| **Medium** | 40% - 69% | Student may pass, needs monitoring |
| **High** | < 40% | Student at risk of failing, needs intervention |

### 9.3 Prediction Output
```python
{
    'student_id': 1,
    'prediction': 1,           # 1 = Pass, 0 = Fail
    'probability': 0.85,         # 85% chance of passing
    'risk_level': 'Low',        # Risk category
    'performance': {
        'total_assessments': 10,
        'competent_assessments': 8,
        'competency_rate': 0.8,
        'total_assignments': 5,
        'total_marks': 420,
        'avg_marks': 84.0,
        'marks_std': 5.2,
        'min_marks': 75,
        'max_marks': 92
    }
}
```

---

## 10. Model Evaluation Metrics

The system calculates the following metrics after training:

| Metric | Description | Calculation |
|--------|-------------|-------------|
| **Accuracy** | Overall correctness | (TP + TN) / Total |
| **Precision** | Positive predictive value | TP / (TP + FP) |
| **Recall** | True positive rate | TP / (TP + FN) |
| **F1 Score** | Harmonic mean of precision and recall | 2 × (Precision × Recall) / (Precision + Recall) |
| **ROC AUC** | Area under ROC curve | Integral of ROC curve |
| **Confusion Matrix** | TP, TN, FP, FN counts | 2×2 matrix |

### Example Evaluation Output
```python
{
    'accuracy': 0.92,
    'precision': 0.89,
    'recall': 0.94,
    'f1': 0.91,
    'roc_auc': 0.95,
    'confusion_matrix': [[15, 2], [1, 18]],
    'classification_report': {
        '0': {'precision': 0.94, 'recall': 0.88, 'f1-score': 0.91},
        '1': {'precision': 0.90, 'recall': 0.95, 'f1-score': 0.92}
    }
}
```

---

## 11. API Integration

### 11.1 Flask Route for Analysis
```python
@app.route('/student-progress-analyzer')
def student_progress_analyzer():
    # Fetch data from API
    students_response = api_request('GET', 'students')
    assessments_response = api_request('GET', 'continuousassessments')
    marks_response = api_request('GET', 'assignmentmarks')
    
    # Get batch filter
    batch_id = request.args.get('batch_id', type=int)
    
    # Initialize analyzer
    analyzer = StudentProgressAnalyzer()
    
    # Create features
    features = analyzer.create_features(
        students=students,
        continuous_assessments=assessments,
        assignment_marks=marks,
        batch_id=batch_id
    )
    
    # Train or load model
    if needs_training:
        metrics = analyzer.train_model(features)
    else:
        analyzer.load_model()
    
    # Generate predictions
    predictions = analyzer.batch_predictions(features)
    
    # Generate report
    report = analyzer.generate_report(predictions)
    
    return render_template('student_progress.html', report=report)
```

### 11.2 API Endpoints Used
| Endpoint | Method | Data Retrieved |
|----------|--------|----------------|
| `/api/students` | GET | All students |
| `/api/students?batchId={id}` | GET | Students by batch |
| `/api/continuousassessments` | GET | All assessments |
| `/api/continuousassessments/student/{id}` | GET | Student assessments |
| `/api/assignmentmarks` | GET | All assignment marks |
| `/api/assignmentmarks/student/{id}` | GET | Student marks |

---

## 12. Output & Reports

### 12.1 Report Generation
```python
def generate_report(predictions):
    return {
        'generated_at': '2025-02-21T14:30:00',
        'total_students': 25,
        'predicted_pass': 18,
        'predicted_fail': 7,
        'pass_rate': 0.72,
        'risk_levels': {
            'Low': 15,
            'Medium': 6,
            'High': 4
        },
        'predictions': [/* individual predictions */]
    }
```

### 12.2 Web Interface Features

1. **Dashboard Overview**
   - Total students count
   - Predicted pass/fail counts
   - Pass rate percentage
   - Average marks

2. **Risk Analysis Panel**
   - Visual risk level distribution
   - Color-coded risk bars (Green/Yellow/Red)
   - Student counts per risk category

3. **Student Performance Table**
   - Individual student predictions
   - Pass probability with progress bars
   - Competency rate display
   - Quick action buttons for details

4. **Filtering**
   - Filter by batch/course
   - Clear filter option

5. **Model Management**
   - Retrain model button
   - Model persistence across sessions

---

## Conclusion

The Student Progress Analyzer demonstrates a complete machine learning pipeline:

1. **Data Collection** → Fetching from REST API
2. **Data Cleaning** → Handling missing values, standardizing column names
3. **Feature Engineering** → Creating meaningful metrics from raw data
4. **Model Training** → Random Forest classification with preprocessing pipeline
5. **Prediction** → Generating pass/fail predictions with probability scores
6. **Risk Assessment** → Categorizing students into risk levels
7. **Visualization** → Displaying results in an intuitive web interface

The system is designed to be:
- **Scalable**: Can handle additional students and data
- **Maintainable**: Clear separation of concerns
- **Extensible**: Easy to add new features or algorithms
- **User-Friendly**: Intuitive web interface for non-technical users

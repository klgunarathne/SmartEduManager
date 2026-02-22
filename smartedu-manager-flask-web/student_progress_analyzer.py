"""
Student Progress Analyzer
This module analyzes student performance data and predicts exam pass rates.
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder, OneHotEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report, roc_auc_score
)
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
import joblib
import os
from datetime import datetime
import json

class StudentProgressAnalyzer:
    """
    A class to analyze student progress and predict exam pass rates using
    machine learning techniques.
    """
    
    def __init__(self, model_path='models/student_progress_predictor.pkl'):
        """
        Initialize the student progress analyzer.
        
        Args:
            model_path (str): Path to save/load the trained model
        """
        self.model_path = model_path
        self.model = None
        self.scaler = None
        self.label_encoders = {}
        
        # Create models directory if it doesn't exist
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
    
    def preprocess_continuous_assessments(self, assessments):
        """
        Preprocess continuous assessment data.
        
        Args:
            assessments (list): List of continuous assessment records
            
        Returns:
            pd.DataFrame: Preprocessed continuous assessment data
        """
        if not assessments:
            return pd.DataFrame()
            
        df = pd.DataFrame(assessments)
        
        # Handle column name variations (camelCase, PascalCase, snake_case)
        rename_mapping = {}
        for col in df.columns:
            if col.lower() == 'studentid' and 'StudentId' not in df.columns:
                rename_mapping[col] = 'StudentId'
            elif col.lower() == 'assessmentmark' and 'AssessmentMark' not in df.columns:
                rename_mapping[col] = 'AssessmentMark'
            elif col.lower() == 'assessmentdate' and 'AssessmentDate' not in df.columns:
                rename_mapping[col] = 'AssessmentDate'
            
        df = df.rename(columns=rename_mapping)
        
        # Check for required columns
        required_columns = ['StudentId', 'AssessmentMark']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            print("Missing required columns in continuous assessments:", missing_columns)
            print("Available columns:", df.columns.tolist())
            return pd.DataFrame()
            
        # Handle AssessmentDate column - it's optional
        has_assessment_date = 'AssessmentDate' in df.columns
        
        # Convert assessment marks to numerical values: 'C' = 1, 'NYC' = 0
        df['AssessmentMark'] = df['AssessmentMark'].map({'C': 1, 'NYC': 0})
        
        # Calculate statistics per student
        if has_assessment_date:
            student_assessment_stats = df.groupby('StudentId').agg({
                'AssessmentMark': ['count', 'sum', 'mean'],
                'AssessmentDate': ['min', 'max']
            }).reset_index()
            
            # Flatten column names
            student_assessment_stats.columns = [
                'StudentId', 'TotalAssessments', 'CompetentAssessments', 
                'CompetencyRate', 'FirstAssessmentDate', 'LastAssessmentDate'
            ]
        else:
            student_assessment_stats = df.groupby('StudentId').agg({
                'AssessmentMark': ['count', 'sum', 'mean']
            }).reset_index()
            
            # Flatten column names
            student_assessment_stats.columns = [
                'StudentId', 'TotalAssessments', 'CompetentAssessments', 
                'CompetencyRate'
            ]
        
        return student_assessment_stats
    
    def preprocess_assignment_marks(self, assignment_marks):
        """
        Preprocess assignment marks data.
        
        Args:
            assignment_marks (list): List of assignment marks records
            
        Returns:
            pd.DataFrame: Preprocessed assignment marks data
        """
        if not assignment_marks:
            return pd.DataFrame()
            
        df = pd.DataFrame(assignment_marks)
        
        # Handle column name variations
        rename_mapping = {}
        for col in df.columns:
            if col.lower() == 'studentid' and 'StudentId' not in df.columns:
                rename_mapping[col] = 'StudentId'
            elif col.lower() == 'marks' and 'Marks' not in df.columns:
                rename_mapping[col] = 'Marks'
            
        df = df.rename(columns=rename_mapping)
        
        # Check for required columns
        required_columns = ['StudentId', 'Marks']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            print("Missing required columns in assignment marks:", missing_columns)
            print("Available columns:", df.columns.tolist())
            return pd.DataFrame()
            
        # Calculate statistics per student
        student_assignment_stats = df.groupby('StudentId').agg({
            'Marks': ['count', 'sum', 'mean', 'std', 'min', 'max']
        }).reset_index()
        
        # Flatten column names
        student_assignment_stats.columns = [
            'StudentId', 'TotalAssignments', 'TotalMarks', 'AvgMarks', 
            'MarksStd', 'MinMarks', 'MaxMarks'
        ]
        
        # Replace NaN values with 0 for standard deviation (case with single assignment)
        student_assignment_stats['MarksStd'] = student_assignment_stats['MarksStd'].fillna(0)
        
        return student_assignment_stats
    
    def create_features(self, students, continuous_assessments, assignment_marks, batch_id=None):
        """
        Create features from raw student, continuous assessment, and assignment data.
        
        Args:
            students (list): List of student records
            continuous_assessments (list): List of continuous assessment records
            assignment_marks (list): List of assignment marks records
            batch_id (int, optional): Batch ID to filter students (default: None)
            
        Returns:
            pd.DataFrame: Features DataFrame
            pd.Series: Target variable (pass/fail)
        """
        # Create student DataFrame
        students_df = pd.DataFrame(students)
        
        # Handle column name variations (camelCase, PascalCase, snake_case)
        rename_mapping = {}
        for col in students_df.columns:
            if col.lower() == 'studentid' and 'StudentId' not in students_df.columns:
                rename_mapping[col] = 'StudentId'
            elif col.lower() == 'batchid' and 'BatchId' not in students_df.columns:
                rename_mapping[col] = 'BatchId'
            elif col.lower() == 'gender' and 'Gender' not in students_df.columns:
                rename_mapping[col] = 'Gender'
            
        students_df = students_df.rename(columns=rename_mapping)
        
        # Filter by batch if specified
        if batch_id is not None and 'BatchId' in students_df.columns:
            students_df = students_df[students_df['BatchId'] == batch_id].copy()
        
        # Preprocess assessment and assignment data
        assessment_stats = self.preprocess_continuous_assessments(continuous_assessments)
        assignment_stats = self.preprocess_assignment_marks(assignment_marks)
        
        # Merge all data on StudentId
        selected_columns = ['StudentId']
        if 'BatchId' in students_df.columns:
            selected_columns.append('BatchId')
        if 'Gender' in students_df.columns:
            selected_columns.append('Gender')
        # Include student identification fields
        if 'misNo' in students_df.columns:
            selected_columns.append('misNo')
        elif 'MISNo' in students_df.columns:
            selected_columns.append('MISNo')
        if 'nameWithInitials' in students_df.columns:
            selected_columns.append('nameWithInitials')
        elif 'NameWithInitials' in students_df.columns:
            selected_columns.append('NameWithInitials')
            
        features = students_df[selected_columns]
        
        if not assessment_stats.empty:
            features = pd.merge(features, assessment_stats, on='StudentId', how='left')
        
        if not assignment_stats.empty:
            features = pd.merge(features, assignment_stats, on='StudentId', how='left')
        
        # Create additional features
        if 'TotalAssessments' in features.columns and 'TotalAssignments' in features.columns:
            features['AssessmentToAssignmentRatio'] = (
                features['TotalAssessments'] / features['TotalAssignments']
            ).fillna(0)
        
        # Handle missing values - ensure all required columns exist
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
        
        # Create target variable (pass/fail)
        # Students with >70% competency rate and average assignment marks >50 pass
        # For students with no data, we'll set pass to 0 (fail)
        features['Pass'] = (
            (features['CompetencyRate'] > 0.7) & (features['AvgMarks'] > 50)
        ).astype(int)
        
        # Ensure all required columns for analysis are present (handle missing columns gracefully)
        for col in ['BatchId', 'Gender']:
            if col not in features.columns:
                features[col] = ''
        
        return features
    
    def train_model(self, features, algorithm='random_forest', test_size=0.2, params=None):
        """
        Train a machine learning model on the features data.
        
        Args:
            features (pd.DataFrame): Features DataFrame with 'Pass' column as target
            algorithm (str): Algorithm to use ('random_forest', 'decision_tree', 'logistic_regression', 'svm', 'gradient_boosting', 'naive_bayes')
            test_size (float): Test set size ratio (default 0.2)
            params (dict): Algorithm-specific parameters
            
        Returns:
            dict: Training metrics
        """
        from sklearn.tree import DecisionTreeClassifier
        from sklearn.linear_model import LogisticRegression
        from sklearn.svm import SVC
        from sklearn.ensemble import GradientBoostingClassifier
        from sklearn.naive_bayes import GaussianNB
        
        if params is None:
            params = {}
        
        # Get algorithm display name
        algorithm_names = {
            'random_forest': 'Random Forest Classifier',
            'decision_tree': 'Decision Tree Classifier',
            'logistic_regression': 'Logistic Regression',
            'svm': 'Support Vector Machine',
            'gradient_boosting': 'Gradient Boosting Classifier',
            'naive_bayes': 'Naive Bayes Classifier'
        }
        # Separate features and target
        X = features.drop(['StudentId', 'BatchId', 'Gender', 'Pass'], axis=1, errors='ignore')
        y = features['Pass']
        
        # Check if we have enough data for training
        if len(features) < 2:
            raise ValueError("Not enough data to train the model")
        
        # Check if we have both classes
        unique_classes = y.unique()
        
        # Split into training and test sets
        # Don't use stratify if there's only one class in the target
        if len(unique_classes) == 1:
            # Only one class - train on all data
            X_train = X
            y_train = y
            X_test = X
            y_test = y
        else:
            # Multiple classes - check if we have enough samples for stratification
            class_counts = y.value_counts()
            if class_counts.min() >= 2:
                X_train, X_test, y_train, y_test = train_test_split(
                    X, y, test_size=test_size, random_state=42, stratify=y
                )
            else:
                # Not enough samples in one class - don't use stratification
                X_train, X_test, y_train, y_test = train_test_split(
                    X, y, test_size=test_size, random_state=42
                )
        
        # Create preprocessor
        numeric_features = X.select_dtypes(include=[np.number]).columns
        numeric_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler())
        ])
        
        # Preprocessing pipeline
        preprocessor = ColumnTransformer(
            transformers=[
                ('num', numeric_transformer, numeric_features)
            ],
            remainder='drop'
        )
        
        # Create model based on selected algorithm
        if algorithm == 'random_forest':
            clf = RandomForestClassifier(
                n_estimators=params.get('n_estimators', 100),
                max_depth=params.get('max_depth', 10),
                min_samples_split=params.get('min_samples_split', 5),
                min_samples_leaf=params.get('min_samples_leaf', 2),
                random_state=42,
                n_jobs=-1
            )
        elif algorithm == 'decision_tree':
            clf = DecisionTreeClassifier(
                max_depth=params.get('max_depth', 10),
                min_samples_split=params.get('min_samples_split', 5),
                random_state=42
            )
        elif algorithm == 'logistic_regression':
            clf = LogisticRegression(
                max_iter=params.get('max_iter', 100),
                C=params.get('C', 1.0),
                random_state=42
            )
        elif algorithm == 'svm':
            clf = SVC(
                C=params.get('C', 1.0),
                kernel=params.get('kernel', 'rbf'),
                probability=True,
                random_state=42
            )
        elif algorithm == 'gradient_boosting':
            clf = GradientBoostingClassifier(
                n_estimators=params.get('n_estimators', 100),
                max_depth=params.get('max_depth', 5),
                random_state=42
            )
        elif algorithm == 'naive_bayes':
            clf = GaussianNB()
        else:
            # Default to random forest
            clf = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                n_jobs=-1
            )
        
        # Create model pipeline
        self.model = Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('classifier', clf)
        ])
        
        # Train the model
        self.model.fit(X_train, y_train)
        
        # Evaluate the model
        y_pred = self.model.predict(X_test)
        
        # Handle single-class case for metrics
        unique_classes = y.unique()
        if len(unique_classes) == 1:
            # Only one class - set default metrics
            metrics = {
                'accuracy': 1.0,
                'precision': 1.0,
                'recall': 1.0,
                'f1': 1.0,
                'roc_auc': 1.0,
                'confusion_matrix': [[len(y_test), 0], [0, 0]],
                'classification_report': {'1': {'precision': 1.0, 'recall': 1.0, 'f1-score': 1.0}},
                'note': 'All students in single class - using feature-based predictions'
            }
        else:
            # Multiple classes - calculate metrics
            try:
                y_proba = self.model.predict_proba(X_test)[:, 1]
            except:
                y_proba = [0.5] * len(y_test)
            
            try:
                metrics = {
                    'accuracy': accuracy_score(y_test, y_pred),
                    'precision': precision_score(y_test, y_pred, zero_division=0),
                    'recall': recall_score(y_test, y_pred, zero_division=0),
                    'f1': f1_score(y_test, y_pred, zero_division=0),
                    'roc_auc': roc_auc_score(y_test, y_proba) if len(y_test) > 1 else 0.5,
                    'confusion_matrix': confusion_matrix(y_test, y_pred).tolist(),
                    'classification_report': classification_report(y_test, y_pred, output_dict=True, zero_division=0)
                }
            except Exception as e:
                metrics = {
                    'accuracy': 0.0,
                    'precision': 0.0,
                    'recall': 0.0,
                    'f1': 0.0,
                    'roc_auc': 0.5,
                    'confusion_matrix': [[0, 0], [0, 0]],
                    'classification_report': {},
                    'error': str(e)
                }
        
        # Save the trained model
        joblib.dump(self.model, self.model_path)
        
        # Add algorithm name to metrics
        metrics['algorithm'] = algorithm_names.get(algorithm, algorithm)
        
        return metrics
    
    def load_model(self):
        """Load a trained model from disk."""
        if os.path.exists(self.model_path):
            self.model = joblib.load(self.model_path)
        else:
            raise FileNotFoundError(f"Model file not found at {self.model_path}")
    
    def batch_predictions(self, features):
        """
        Generate predictions for a batch of students.
        
        Args:
            features (pd.DataFrame): Features DataFrame
            
        Returns:
            list: Predictions with probabilities and risk levels
        """
        if self.model is None:
            try:
                self.load_model()
            except FileNotFoundError:
                return []
                
        # Prepare features for prediction
        X = features.drop(['StudentId', 'BatchId', 'Gender', 'Pass'], axis=1, errors='ignore')
        
        # Make predictions
        predictions = self.model.predict(X)
        
        # Get probabilities - handle single-class case
        proba = self.model.predict_proba(X)
        if proba.shape[1] > 1:
            probabilities = proba[:, 1]
        else:
            # Only one class in model - use 1.0 if it's the Pass class, 0.0 otherwise
            # Check what class the model predicts
            single_class_pred = self.model.predict(X)
            if single_class_pred[0] == 1:
                probabilities = np.ones(len(X))  # All 1.0 for Pass class
            else:
                probabilities = np.zeros(len(X))  # All 0.0 for Fail class
        
        # Use feature-based criteria to override ML predictions when clear
        # If competency rate > 70% AND avg marks > 50, it's clearly a pass
        feature_based_pass = (
            (features['CompetencyRate'] > 0.7) & (features['AvgMarks'] > 50)
        ).astype(int)
        
        # Override ML predictions with feature-based logic where clear
        final_predictions = []
        final_probabilities = []
        for i in range(len(predictions)):
            comp_rate = float(features['CompetencyRate'].iloc[i]) if 'CompetencyRate' in features.columns else 0
            avg_marks = float(features['AvgMarks'].iloc[i]) if 'AvgMarks' in features.columns else 0
            
            # If clear pass criteria met (high competency OR good marks)
            # Enhanced: Give more weight to competency rate
            if comp_rate > 0.7 and avg_marks > 50:
                final_predictions.append(1)
                final_probabilities.append(max(comp_rate, 0.7))  # Weight by competency
            # If clear fail criteria (very low competency)
            elif comp_rate < 0.3 and avg_marks < 40:
                final_predictions.append(0)
                final_probabilities.append(0.0)  # 0% probability for clear fail
            # High competency but low marks - medium risk, not high
            elif comp_rate > 0.7 and avg_marks <= 50:
                final_predictions.append(1)
                final_probabilities.append(0.5)  # Medium - good competency but poor marks
            # Use ML model prediction for borderline cases
            else:
                final_predictions.append(predictions[i])
                final_probabilities.append(probabilities[i])
        
        predictions = final_predictions
        probabilities = final_probabilities
        
        # Determine risk levels
        risk_levels = []
        for prob in probabilities:
            if prob >= 0.7:
                risk_levels.append('Low')
            elif prob >= 0.4:
                risk_levels.append('Medium')
            else:
                risk_levels.append('High')
                
        # Create prediction objects
        results = []
        for i, (student_id, prediction, probability, risk) in enumerate(
            zip(features['StudentId'], predictions, probabilities, risk_levels)
        ):
            # Get student info with safe access
            mis_no = ''
            if 'misNo' in features.columns:
                mis_no = str(features['misNo'].iloc[i]) if pd.notna(features['misNo'].iloc[i]) else ''
            elif 'MISNo' in features.columns:
                mis_no = str(features['MISNo'].iloc[i]) if pd.notna(features['MISNo'].iloc[i]) else ''
                
            name_with_initials = ''
            if 'nameWithInitials' in features.columns:
                name_with_initials = str(features['nameWithInitials'].iloc[i]) if pd.notna(features['nameWithInitials'].iloc[i]) else ''
            elif 'NameWithInitials' in features.columns:
                name_with_initials = str(features['NameWithInitials'].iloc[i]) if pd.notna(features['NameWithInitials'].iloc[i]) else ''
            
            # Get student performance metrics
            # Use .get() with default values to handle missing columns gracefully
            performance = {
                'total_assessments': int(features['TotalAssessments'].iloc[i]) if 'TotalAssessments' in features.columns else 0,
                'competent_assessments': int(features['CompetentAssessments'].iloc[i]) if 'CompetentAssessments' in features.columns else 0,
                'competency_rate': float(features['CompetencyRate'].iloc[i]) if 'CompetencyRate' in features.columns else 0.0,
                'total_assignments': int(features['TotalAssignments'].iloc[i]) if 'TotalAssignments' in features.columns else 0,
                'total_marks': int(features['TotalMarks'].iloc[i]) if 'TotalMarks' in features.columns else 0,
                'avg_marks': float(features['AvgMarks'].iloc[i]) if 'AvgMarks' in features.columns else 0.0,
                'marks_std': float(features['MarksStd'].iloc[i]) if 'MarksStd' in features.columns else 0.0,
                'min_marks': int(features['MinMarks'].iloc[i]) if 'MinMarks' in features.columns else 0,
                'max_marks': int(features['MaxMarks'].iloc[i]) if 'MaxMarks' in features.columns else 0,
                'assessment_to_assignment_ratio': float(features['AssessmentToAssignmentRatio'].iloc[i]) if 'AssessmentToAssignmentRatio' in features.columns else 0.0
            }
            
            results.append({
                'student_id': int(student_id),
                'mis_no': mis_no,
                'name_with_initials': name_with_initials,
                'prediction': int(prediction),
                'probability': float(probability),
                'risk_level': risk,
                'performance': performance
            })
            
        return results
    
    def analyze_student_performance(self, student_id, features):
        """
        Analyze performance for a specific student.
        
        Args:
            student_id (int): Student ID to analyze
            features (pd.DataFrame): Features DataFrame
            
        Returns:
            dict: Student performance analysis
        """
        # Find the student in features
        student_features = features[features['StudentId'] == student_id]
        
        if student_features.empty:
            return {
                'prediction': 0,
                'probability': 0,
                'risk_level': 'High',
                'performance': {
                    'total_assessments': 0,
                    'competent_assessments': 0,
                    'competency_rate': 0,
                    'total_assignments': 0,
                    'total_marks': 0,
                    'avg_marks': 0,
                    'marks_std': 0,
                    'min_marks': 0,
                    'max_marks': 0
                }
            }
            
        # Make prediction
        if self.model is None:
            try:
                self.load_model()
            except FileNotFoundError:
                return {
                    'prediction': 0,
                    'probability': 0,
                    'risk_level': 'High',
                    'performance': {
                        'total_assessments': 0,
                        'competent_assessments': 0,
                        'competency_rate': 0,
                        'total_assignments': 0,
                        'total_marks': 0,
                        'avg_marks': 0,
                        'marks_std': 0,
                        'min_marks': 0,
                        'max_marks': 0
                    }
                }
                
        # Drop columns that might not exist (handle both camelCase and PascalCase)
        drop_columns = ['StudentId', 'BatchId', 'batchId', 'Gender', 'gender', 'Pass', 'FirstAssessmentDate', 'LastAssessmentDate']
        existing_columns = [col for col in drop_columns if col in student_features.columns]
        X = student_features.drop(existing_columns, axis=1)
        
        prediction = self.model.predict(X)[0]
        
        # Get probability - handle single-class case
        proba = self.model.predict_proba(X)
        if proba.shape[1] > 1:
            probability = proba[:, 1][0]
        else:
            # Only one class - use 0.5 as default
            probability = 0.5
        
        # Determine risk level
        if probability >= 0.7:
            risk_level = 'Low'
        elif probability >= 0.4:
            risk_level = 'Medium'
        else:
            risk_level = 'High'
            
        # Get performance metrics with safe access
        performance = {
            'total_assessments': int(student_features['TotalAssessments'].iloc[0]) if 'TotalAssessments' in student_features.columns else 0,
            'competent_assessments': int(student_features['CompetentAssessments'].iloc[0]) if 'CompetentAssessments' in student_features.columns else 0,
            'competency_rate': float(student_features['CompetencyRate'].iloc[0]) if 'CompetencyRate' in student_features.columns else 0.0,
            'total_assignments': int(student_features['TotalAssignments'].iloc[0]) if 'TotalAssignments' in student_features.columns else 0,
            'total_marks': int(student_features['TotalMarks'].iloc[0]) if 'TotalMarks' in student_features.columns else 0,
            'avg_marks': float(student_features['AvgMarks'].iloc[0]) if 'AvgMarks' in student_features.columns else 0.0,
            'marks_std': float(student_features['MarksStd'].iloc[0]) if 'MarksStd' in student_features.columns else 0.0,
            'min_marks': int(student_features['MinMarks'].iloc[0]) if 'MinMarks' in student_features.columns else 0,
            'max_marks': int(student_features['MaxMarks'].iloc[0]) if 'MaxMarks' in student_features.columns else 0,
            'assessment_to_assignment_ratio': float(student_features['AssessmentToAssignmentRatio'].iloc[0]) if 'AssessmentToAssignmentRatio' in student_features.columns else 0.0
        }
        
        return {
            'prediction': int(prediction),
            'probability': float(probability),
            'risk_level': risk_level,
            'performance': performance
        }
    
    def generate_report(self, predictions):
        """
        Generate a comprehensive report from predictions.
        
        Args:
            predictions (list): List of prediction objects
            
        Returns:
            dict: Report containing statistics and visualizations
        """
        if not predictions:
            return {
                'total_students': 0,
                'predicted_pass': 0,
                'predicted_fail': 0,
                'pass_rate': 0,
                'competency_based_pass': 0,
                'assignment_based_pass': 0,
                'risk_levels': {'Low': 0, 'Medium': 0, 'High': 0},
                'predictions': [],
                'methodology': {
                    'pass_criteria': 'Competency >70% AND Avg Marks >50',
                    'risk_thresholds': {'Low': '≥70%', 'Medium': '40-69%', 'High': '<40%'}
                }
            }
            
        # Calculate statistics
        total_students = len(predictions)
        predicted_pass = sum(1 for p in predictions if p['prediction'] == 1)
        predicted_fail = total_students - predicted_pass
        pass_rate = predicted_pass / total_students if total_students > 0 else 0
        
        # Calculate competency-based pass rate (only using competency >70%)
        competency_pass = sum(1 for p in predictions 
            if p['performance']['competency_rate'] > 0.7)
        competency_based_pass = competency_pass / total_students if total_students > 0 else 0
        
        # Calculate assignment-based pass rate (only using avg marks >50)
        assignment_pass = sum(1 for p in predictions 
            if p['performance']['avg_marks'] > 50)
        assignment_based_pass = assignment_pass / total_students if total_students > 0 else 0
        
        # Calculate risk level distribution
        risk_levels = {'Low': 0, 'Medium': 0, 'High': 0}
        for p in predictions:
            risk_levels[p['risk_level']] += 1
            
        # Create report with detailed breakdown
        report = {
            'generated_at': datetime.now().isoformat(),
            'total_students': total_students,
            'predicted_pass': predicted_pass,
            'predicted_fail': predicted_fail,
            'pass_rate': pass_rate,
            'competency_based_pass': competency_based_pass,
            'assignment_based_pass': assignment_based_pass,
            'risk_levels': risk_levels,
            'predictions': predictions,
            'methodology': {
                'pass_criteria': 'Competency >70% AND Avg Marks >50',
                'risk_thresholds': {'Low': '≥70%', 'Medium': '40-69%', 'High': '<40%'},
                'description': 'Pass rate combines both continuous assessments (C/NYC) and assignment marks'
            }
        }
        
        return report

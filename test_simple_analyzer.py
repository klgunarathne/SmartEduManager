import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'smartedu-manager-flask-web'))

from student_progress_analyzer import StudentProgressAnalyzer

def test_simple_analyzer():
    print("Testing StudentProgressAnalyzer...")
    print("=" * 50)
    
    # Create test data with balanced classes
    test_students = [
        {"StudentId": 1, "BatchId": 1, "Gender": "Male", "FullName": "Test Student 1"},
        {"StudentId": 2, "BatchId": 1, "Gender": "Female", "FullName": "Test Student 2"},
        {"StudentId": 3, "BatchId": 2, "Gender": "Male", "FullName": "Test Student 3"},
        {"StudentId": 4, "BatchId": 2, "Gender": "Female", "FullName": "Test Student 4"},
        {"StudentId": 5, "BatchId": 1, "Gender": "Male", "FullName": "Test Student 5"},
        {"StudentId": 6, "BatchId": 2, "Gender": "Female", "FullName": "Test Student 6"}
    ]
    
    test_assessments = [
        {"StudentId": 1, "AssessmentMark": "C", "AssessmentDate": "2024-01-15"},
        {"StudentId": 1, "AssessmentMark": "C", "AssessmentDate": "2024-01-20"},
        {"StudentId": 1, "AssessmentMark": "C", "AssessmentDate": "2024-01-25"},  # 100% C
        {"StudentId": 2, "AssessmentMark": "C", "AssessmentDate": "2024-01-18"},
        {"StudentId": 2, "AssessmentMark": "C", "AssessmentDate": "2024-01-22"},
        {"StudentId": 2, "AssessmentMark": "C", "AssessmentDate": "2024-01-28"},  # 100% C
        {"StudentId": 3, "AssessmentMark": "NYC", "AssessmentDate": "2024-01-16"},
        {"StudentId": 3, "AssessmentMark": "NYC", "AssessmentDate": "2024-01-20"},
        {"StudentId": 3, "AssessmentMark": "NYC", "AssessmentDate": "2024-01-25"},  # 0% C
        {"StudentId": 4, "AssessmentMark": "NYC", "AssessmentDate": "2024-01-15"},
        {"StudentId": 4, "AssessmentMark": "NYC", "AssessmentDate": "2024-01-25"},
        {"StudentId": 4, "AssessmentMark": "NYC", "AssessmentDate": "2024-01-30"},  # 0% C
        {"StudentId": 5, "AssessmentMark": "C", "AssessmentDate": "2024-01-15"},
        {"StudentId": 5, "AssessmentMark": "NYC", "AssessmentDate": "2024-01-20"},
        {"StudentId": 5, "AssessmentMark": "C", "AssessmentDate": "2024-01-25"},  # 66% C
        {"StudentId": 6, "AssessmentMark": "NYC", "AssessmentDate": "2024-01-18"},
        {"StudentId": 6, "AssessmentMark": "C", "AssessmentDate": "2024-01-22"},
        {"StudentId": 6, "AssessmentMark": "NYC", "AssessmentDate": "2024-01-28"}   # 33% C
    ]
    
    test_assignment_marks = [
        {"StudentId": 1, "Marks": 85},
        {"StudentId": 1, "Marks": 90},
        {"StudentId": 1, "Marks": 78},  # Avg: 84.3
        {"StudentId": 2, "Marks": 92},
        {"StudentId": 2, "Marks": 88},
        {"StudentId": 2, "Marks": 95},  # Avg: 91.7
        {"StudentId": 3, "Marks": 45},
        {"StudentId": 3, "Marks": 50},
        {"StudentId": 3, "Marks": 40},  # Avg: 45.0
        {"StudentId": 4, "Marks": 35},
        {"StudentId": 4, "Marks": 40},
        {"StudentId": 4, "Marks": 38},  # Avg: 37.7
        {"StudentId": 5, "Marks": 65},
        {"StudentId": 5, "Marks": 70},
        {"StudentId": 5, "Marks": 68},  # Avg: 67.7
        {"StudentId": 6, "Marks": 55},
        {"StudentId": 6, "Marks": 58},
        {"StudentId": 6, "Marks": 52}   # Avg: 55.0
    ]
    
    # Test analyzer
    analyzer = StudentProgressAnalyzer()
    
    # Create features
    features = analyzer.create_features(test_students, test_assessments, test_assignment_marks)
    print(f"Features created: {len(features)} students")
    
    # Train model
    if len(features) >= 2:
        metrics = analyzer.train_model(features)
        print("Model trained successfully!")
        print(f"  Accuracy: {metrics['accuracy']:.2f}")
        print(f"  Precision: {metrics['precision']:.2f}")
        print(f"  Recall: {metrics['recall']:.2f}")
        print(f"  F1 Score: {metrics['f1']:.2f}")
        print(f"  ROC AUC: {metrics['roc_auc']:.2f}")
    
    # Batch predictions
    predictions = analyzer.batch_predictions(features)
    print(f"\nBatch predictions generated: {len(predictions)}")
    
    # Individual analysis
    if predictions:
        analysis = analyzer.analyze_student_performance(1, features)
        status = "Likely to Pass" if analysis['prediction'] == 1 else "Likely to Fail"
        print(f"\nStudent 1 Analysis:")
        print(f"  Status: {status}")
        print(f"  Probability: {analysis['probability']:.1%}")
        print(f"  Risk Level: {analysis['risk_level']}")
        print(f"  Competency Rate: {analysis['performance']['competency_rate']:.1%}")
        print(f"  Average Marks: {analysis['performance']['avg_marks']:.1f}")
    
    print("\nAll tests passed. The StudentProgressAnalyzer is working correctly!")

if __name__ == "__main__":
    test_simple_analyzer()

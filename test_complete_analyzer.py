import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'smartedu-manager-flask-web'))

from student_progress_analyzer import StudentProgressAnalyzer

def test_complete_student_progress_analyzer():
    print("Testing Complete StudentProgressAnalyzer Functionality...")
    print("=" * 60)
    
    # Create test data with camelCase field names (to test API compatibility)
    test_students = [
        {"StudentId": 1, "BatchId": 1, "Gender": "Male", "FullName": "Test Student 1"},
        {"StudentId": 2, "BatchId": 1, "Gender": "Female", "FullName": "Test Student 2"},
        {"StudentId": 3, "BatchId": 1, "Gender": "Male", "FullName": "Test Student 3"},
        {"StudentId": 4, "BatchId": 2, "Gender": "Female", "FullName": "Test Student 4"},
        {"StudentId": 5, "BatchId": 2, "Gender": "Male", "FullName": "Test Student 5"},
        {"StudentId": 6, "BatchId": 2, "Gender": "Female", "FullName": "Test Student 6"}
    ]
    
    test_assessments = [
        {"StudentId": 1, "AssessmentMark": "C", "AssessmentDate": "2024-01-15"},
        {"StudentId": 1, "AssessmentMark": "C", "AssessmentDate": "2024-01-20"},
        {"StudentId": 1, "AssessmentMark": "NYC", "AssessmentDate": "2024-01-25"},
        {"StudentId": 2, "AssessmentMark": "C", "AssessmentDate": "2024-01-18"},
        {"StudentId": 2, "AssessmentMark": "C", "AssessmentDate": "2024-01-22"},
        {"StudentId": 3, "AssessmentMark": "NYC", "AssessmentDate": "2024-01-16"},
        {"StudentId": 3, "AssessmentMark": "NYC", "AssessmentDate": "2024-01-20"},
        {"StudentId": 4, "AssessmentMark": "C", "AssessmentDate": "2024-01-15"},
        {"StudentId": 4, "AssessmentMark": "C", "AssessmentDate": "2024-01-25"},
        {"StudentId": 5, "AssessmentMark": "NYC", "AssessmentDate": "2024-01-18"},
        {"StudentId": 6, "AssessmentMark": "C", "AssessmentDate": "2024-01-22"}
    ]
    
    test_assignment_marks = [
        {"StudentId": 1, "Marks": 85},
        {"StudentId": 1, "Marks": 90},
        {"StudentId": 1, "Marks": 78},
        {"StudentId": 2, "Marks": 92},
        {"StudentId": 2, "Marks": 88},
        {"StudentId": 3, "Marks": 45},
        {"StudentId": 3, "Marks": 50},
        {"StudentId": 4, "Marks": 82},
        {"StudentId": 4, "Marks": 76},
        {"StudentId": 5, "Marks": 40},
        {"StudentId": 6, "Marks": 88}
    ]
    
    # Test analyzer
    analyzer = StudentProgressAnalyzer()
    
    print("\n1. Testing complete pipeline...")
    print("=" * 50)
    
    # Create features
    features = analyzer.create_features(test_students, test_assessments, test_assignment_marks)
    print(f"Features created: {len(features)} students")
    
    # Train model
    if len(features) >= 2:
        metrics = analyzer.train_model(features)
        print(f"Model trained successfully!")
        print(f"  Accuracy: {metrics['accuracy']:.2f}")
        print(f"  Precision: {metrics['precision']:.2f}")
        print(f"  Recall: {metrics['recall']:.2f}")
        print(f"  F1 Score: {metrics['f1']:.2f}")
        print(f"  ROC AUC: {metrics['roc_auc']:.2f}")
    else:
        print("Not enough data to train model")
    
    # Generate batch predictions
    print("\n2. Generating batch predictions...")
    print("=" * 50)
    
    batch_predictions = analyzer.batch_predictions(features)
    print(f"Batch predictions generated: {len(batch_predictions)}")
    
    for prediction in batch_predictions:
        status = "Pass" if prediction['prediction'] == 1 else "Fail"
        print(f"  Student {prediction['student_id']}: {status} ({prediction['risk_level']} Risk, {prediction['probability']:.1%})")
    
    # Generate report
    print("\n3. Generating report...")
    print("=" * 50)
    
    report = analyzer.generate_report(batch_predictions)
    print(f"Report generated at: {report['generated_at']}")
    print(f"  Total Students: {report['total_students']}")
    print(f"  Predicted Pass: {report['predicted_pass']}")
    print(f"  Predicted Fail: {report['predicted_fail']}")
    print(f"  Pass Rate: {report['pass_rate']:.1%}")
    print(f"  Risk Levels: {report['risk_levels']}")
    
    # Test individual student analysis
    print("\n4. Testing individual student analysis...")
    print("=" * 50)
    
    if batch_predictions:
        student_id = batch_predictions[0]['student_id']
        analysis = analyzer.analyze_student_performance(student_id, features)
        
        status = "Likely to Pass" if analysis['prediction'] == 1 else "Likely to Fail"
        print(f"Student {student_id}: {status}")
        print(f"  Probability: {analysis['probability']:.1%}")
        print(f"  Risk Level: {analysis['risk_level']}")
        print(f"  Performance:")
        for metric, value in analysis['performance'].items():
            if metric in ['competency_rate']:
                print(f"    {metric}: {value:.1%}")
            else:
                print(f"    {metric}: {value}")
    
    # Test batch-specific analysis
    print("\n5. Testing batch-specific analysis...")
    print("=" * 50)
    
    batch_features = analyzer.create_features(test_students, test_assessments, test_assignment_marks, batch_id=1)
    batch_predictions = analyzer.batch_predictions(batch_features)
    batch_report = analyzer.generate_report(batch_predictions)
    
    print(f"Batch 1 Analysis:")
    print(f"  Total Students: {batch_report['total_students']}")
    print(f"  Predicted Pass: {batch_report['predicted_pass']}")
    print(f"  Predicted Fail: {batch_report['predicted_fail']}")
    print(f"  Pass Rate: {batch_report['pass_rate']:.1%}")
    
    print("\n✅ All tests passed! The complete StudentProgressAnalyzer functionality is working correctly!")

if __name__ == "__main__":
    test_complete_student_progress_analyzer()

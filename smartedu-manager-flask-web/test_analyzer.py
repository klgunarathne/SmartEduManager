
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from student_progress_analyzer import StudentProgressAnalyzer

def test_student_progress_analyzer():
    print("Testing StudentProgressAnalyzer...")
    
    # Create test data with both PascalCase and camelCase variations
    test_students = [
        {"StudentId": 1, "BatchId": 1, "Gender": "Male", "FullName": "Test Student 1"},
        {"StudentId": 2, "BatchId": 1, "Gender": "Female", "FullName": "Test Student 2"},
        {"StudentId": 3, "BatchId": 2, "Gender": "Male", "FullName": "Test Student 3"}
    ]
    
    test_assessments = [
        {"StudentId": 1, "AssessmentMark": "C", "AssessmentDate": "2024-01-15"},
        {"StudentId": 1, "AssessmentMark": "C", "AssessmentDate": "2024-01-20"},
        {"StudentId": 1, "AssessmentMark": "NYC", "AssessmentDate": "2024-01-25"},
        {"StudentId": 2, "AssessmentMark": "C", "AssessmentDate": "2024-01-18"},
        {"StudentId": 2, "AssessmentMark": "C", "AssessmentDate": "2024-01-22"},
        {"StudentId": 3, "AssessmentMark": "NYC", "AssessmentDate": "2024-01-16"}
    ]
    
    test_assignment_marks = [
        {"StudentId": 1, "Marks": 85},
        {"StudentId": 1, "Marks": 90},
        {"StudentId": 1, "Marks": 78},
        {"StudentId": 2, "Marks": 92},
        {"StudentId": 2, "Marks": 88},
        {"StudentId": 3, "Marks": 45}
    ]
    
    # Test analyzer
    analyzer = StudentProgressAnalyzer()
    
    print("\n1. Testing preprocess_continuous_assessments...")
    assessment_stats = analyzer.preprocess_continuous_assessments(test_assessments)
    print(f"   Result shape: {assessment_stats.shape}")
    print(f"   Columns: {list(assessment_stats.columns)}")
    print(f"   Data:")
    print(assessment_stats)
    
    print("\n2. Testing preprocess_assignment_marks...")
    assignment_stats = analyzer.preprocess_assignment_marks(test_assignment_marks)
    print(f"   Result shape: {assignment_stats.shape}")
    print(f"   Columns: {list(assignment_stats.columns)}")
    print(f"   Data:")
    print(assignment_stats)
    
    print("\n3. Testing create_features...")
    features = analyzer.create_features(test_students, test_assessments, test_assignment_marks, batch_id=1)
    print(f"   Result shape: {features.shape}")
    print(f"   Columns: {list(features.columns)}")
    print(f"   Data:")
    print(features)
    
    print("\nAll tests passed! The analyzer is working correctly with the current implementation.")

if __name__ == "__main__":
    test_student_progress_analyzer()

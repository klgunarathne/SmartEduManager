#!/usr/bin/env python3
# Test script to verify CSV processing functionality

import csv
import os
import sys

# Add the parent directory to the path so we can import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

sys.path.append('smartedu-manager-flask-web')
from app import parse_csv, process_csv_for_import

def test_csv_processing():
    print("Testing CSV processing...")
    
    # Test file path
    test_file = 'smartedu-manager-flask-web/temp_csv/2025_2_1.csv'
    
    if not os.path.exists(test_file):
        print(f"Error: Test file not found at {test_file}")
        return
    
    # Test parse_csv function
    try:
        headers, data = parse_csv(test_file)
        print("\nCSV Headers:", headers)
        print("\nFirst 5 rows of data:")
        for i, row in enumerate(data):
            print(f"  Row {i+1}: {row}")
    except Exception as e:
        print(f"Error parsing CSV: {e}")
        return
    
    # Test process_csv_for_import function with sample mapping
    print("\nTesting process_csv_for_import...")
    
    # Sample mapping based on your CSV
    sample_mapping = {
        'Name with Initials': 'NameWithInitials',
        'Full Name': 'FullName',
        'NIC No': 'NICNo',
        'Gender': 'Gender',
        'Address': 'Address',
        'Tel.No': 'Telephone',
        'MIS No': 'MISNo'
    }
    
    # Test with batch ID 1
    batch_id = 1
    
    try:
        students = process_csv_for_import(test_file, batch_id, sample_mapping)
        print(f"\nGenerated {len(students)} student records")
        
        # Show first 3 processed students
        print("\nFirst 3 processed students:")
        for i, student in enumerate(students[:3]):
            print(f"\nStudent {i+1}:")
            for key, value in student.items():
                print(f"  {key}: {value}")
    except Exception as e:
        print(f"Error processing CSV: {e}")
        return
    
    # Verify BatchId is set correctly
    print("\nChecking if BatchId is set correctly...")
    batch_ids = [student['BatchId'] for student in students]
    unique_batch_ids = list(set(batch_ids))
    
    if len(unique_batch_ids) == 1 and unique_batch_ids[0] == batch_id:
        print(f"All students have BatchId = {batch_id}")
    else:
        print(f"BatchIds are inconsistent: {unique_batch_ids}")
    
    # Check required fields
    print("\nChecking required fields...")
    required_fields = ['MISNo', 'NameWithInitials', 'FullName', 'NICNo', 
                     'Gender', 'Address', 'Telephone', 'BatchId']
    
    all_fields_valid = True
    for i, student in enumerate(students):
        missing_fields = [field for field in required_fields if field not in student or not student[field]]
        if missing_fields:
            print(f"Student {i+1} missing fields: {', '.join(missing_fields)}")
            all_fields_valid = False
    
    if all_fields_valid:
        print("All required fields are present")
    
    print("\nTesting completed!")

if __name__ == "__main__":
    test_csv_processing()
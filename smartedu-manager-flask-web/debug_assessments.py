
import requests
import pandas as pd
import sys

# Configuration - update these with your actual API endpoint
BASE_URL = 'http://localhost:5000'  # Flask app URL
API_ENDPOINT = 'http://localhost:7265/api/continuousassessments'  # .NET API endpoint

def debug_assessments():
    print("Debugging continuous assessments data structure...")
    print("=" * 50)
    
    try:
        # Make API call to get continuous assessments
        print(f"Calling API: {API_ENDPOINT}")
        response = requests.get(API_ENDPOINT)
        
        if response.status_code == 200:
            assessments = response.json()
            print(f"\nSuccessfully fetched {len(assessments)} continuous assessments")
            
            if assessments:
                # Convert to DataFrame for debugging
                df = pd.DataFrame(assessments)
                
                print("\nDataFrame shape:", df.shape)
                print("\nColumns available:", list(df.columns))
                print("\nFirst 5 rows:")
                print(df.head())
                
                # Check AssessmentMark column specifically
                if 'AssessmentMark' in df.columns:
                    print(f"\nAssessmentMark column found")
                    print(f"Unique values in AssessmentMark: {df['AssessmentMark'].unique()}")
                else:
                    print(f"\nERROR: 'AssessmentMark' column not found!")
                    print(f"Available columns: {list(df.columns)}")
                
            else:
                print("\nNo continuous assessments data returned")
                
        else:
            print(f"\nERROR: API request failed with status code {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"\nERROR: {str(e)}")

if __name__ == "__main__":
    debug_assessments()

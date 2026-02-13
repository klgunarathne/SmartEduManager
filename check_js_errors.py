import os
import re

template_dir = 'smartedu-manager-flask-web/templates'
problem_files = []

for filename in os.listdir(template_dir):
    if filename.endswith('.html'):
        file_path = os.path.join(template_dir, filename)
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Look for any remaining onclick attributes with window.location without semicolon
        matches = re.findall(r'onclick="window\.location[^;]*"', content)
        if matches:
            problem_files.append(filename)

print("Files with potential JavaScript syntax issues:")
for file in problem_files:
    print(f"- {file}")

if problem_files:
    print(f"\nTotal files with issues: {len(problem_files)}")
else:
    print("\nAll files are clean! No JavaScript syntax errors found.")


import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from jinja2 import Environment, FileSystemLoader

def validate_template():
    """Validate student_progress.html template syntax"""
    print("Validating student_progress.html template syntax...")
    
    try:
        # Create Jinja2 environment
        env = Environment(loader=FileSystemLoader('templates'))
        
        # Try to load and compile the template
        template = env.get_template('student_progress.html')
        
        print("Template syntax is valid!")
        
        # Print some debugging info about the template
        print(f"Template blocks: {list(template.blocks.keys())}")
        
    except Exception as e:
        print(f"Template validation failed: {type(e).__name__}: {e}")
        import traceback
        print("\nStack trace:")
        print(traceback.format_exc())
        return False
    
    return True

if __name__ == "__main__":
    validate_template()

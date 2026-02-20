from flask import Flask, render_template, redirect, url_for, flash, request, session, jsonify
from flask_wtf import FlaskForm
from flask_wtf.csrf import CSRFProtect
from flask_wtf.file import FileField, FileRequired, FileAllowed
from wtforms import StringField, PasswordField, SubmitField, IntegerField, SelectField, DecimalField, HiddenField
from wtforms.validators import InputRequired, Email, Length
import requests
import os
import csv
import io
from dotenv import load_dotenv

load_dotenv()

# Initialize Flask application
app = Flask(__name__)

# Configure Flask application
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')  # Secret key for session management and CSRF protection
app.config['API_BASE_URL'] = os.getenv('API_BASE_URL', 'https://localhost:7160/api')  # Base URL for the SmartEdu Manager API

# Initialize CSRF protection
csrf = CSRFProtect(app)

# Create a convenient reference to the API base URL
API_BASE_URL = app.config['API_BASE_URL']

# ==================== Forms ====================

class LoginForm(FlaskForm):
    email = StringField('Email', validators=[InputRequired(), Email(), Length(max=120)])
    password = PasswordField('Password', validators=[InputRequired(), Length(min=6)])
    submit = SubmitField('Sign In')

class CreateCourseForm(FlaskForm):
    courseName = StringField('Course Name', validators=[InputRequired(), Length(max=100)])
    description = StringField('Description', validators=[InputRequired()])
    duration = IntegerField('Duration (months)', validators=[InputRequired()])
    courseFee = DecimalField('Course Fee', validators=[InputRequired()])
    centerId = SelectField('Center', validators=[InputRequired()], coerce=int)
    submit = SubmitField('Create Course')

class CreateBatchForm(FlaskForm):
    batchCode = StringField('Batch Code', validators=[InputRequired(), Length(max=100)])
    courseId = SelectField('Course', validators=[InputRequired()], coerce=int)
    startDate = StringField('Start Date', validators=[InputRequired()])
    endDate = StringField('End Date', validators=[InputRequired()])
    duration = IntegerField('Duration (months)', validators=[InputRequired()])
    submit = SubmitField('Create Batch')

class CreateCenterForm(FlaskForm):
    centerName = StringField('Center Name', validators=[InputRequired(), Length(max=100)])
    address = StringField('Address', validators=[InputRequired()])
    contactNumber = StringField('Contact Number', validators=[InputRequired(), Length(max=20)])
    districtId = SelectField('District', validators=[InputRequired()], coerce=int)
    submit = SubmitField('Create Center')

class CreateInstructorForm(FlaskForm):
    EPFNo = StringField('EPF No', validators=[InputRequired(), Length(max=50)])
    FullName = StringField('Full Name', validators=[InputRequired(), Length(max=100)])
    NIC = StringField('NIC', validators=[InputRequired(), Length(max=20)])
    Email = StringField('Email', validators=[InputRequired(), Email(), Length(max=120)])
    Phone = StringField('Phone', validators=[InputRequired(), Length(max=20)])
    submit = SubmitField('Create Instructor')

class CreateStudentForm(FlaskForm):
    MISNo = StringField('MIS No', validators=[InputRequired(), Length(max=50)])
    NameWithInitials = StringField('Name with Initials', validators=[InputRequired(), Length(max=100)])
    FullName = StringField('Full Name', validators=[InputRequired(), Length(max=100)])
    NICNo = StringField('NIC No', validators=[InputRequired(), Length(max=20)])
    Gender = SelectField('Gender', validators=[InputRequired()], choices=[('Male', 'Male'), ('Female', 'Female')])
    Address = StringField('Address', validators=[InputRequired()])
    Telephone = StringField('Telephone', validators=[InputRequired(), Length(max=20)])
    Email = StringField('Email', validators=[InputRequired(), Email(), Length(max=120)])
    BatchId = SelectField('Batch', validators=[InputRequired()], coerce=int)
    GSDivision = StringField('GS Division', validators=[InputRequired(), Length(max=100)])
    AGDivision = StringField('AG Division', validators=[InputRequired(), Length(max=100)])
    submit = SubmitField('Create Student')

class UploadStudentsCsvForm(FlaskForm):
    batchId = SelectField('Batch', validators=[InputRequired()], coerce=int)
    file = FileField('CSV File', validators=[FileRequired(), FileAllowed(['csv'], 'CSV files only!')])
    submit = SubmitField('Upload and Preview')

class MapCsvFieldsForm(FlaskForm):
    file_name = HiddenField()
    batch_id = HiddenField()
    submit = SubmitField('Import Students')

class CreateCourseInstructorForm(FlaskForm):
    CourseId = SelectField('Course', validators=[InputRequired()], coerce=int)
    InstructorId = SelectField('Instructor', validators=[InputRequired()], coerce=int)
    submit = SubmitField('Assign Instructor')

class CreateNCSForm(FlaskForm):
    Version = StringField('Version', validators=[InputRequired(), Length(max=50)])
    Name = StringField('Name', validators=[InputRequired(), Length(max=200)])
    UpdatedDate = StringField('Updated Date', validators=[InputRequired()])
    CourseId = SelectField('Course', validators=[InputRequired()], coerce=int)
    submit = SubmitField('Create NCS')

class CreateAssignmentForm(FlaskForm):
    AssignmentName = StringField('Assignment Name', validators=[InputRequired(), Length(max=200)])
    submit = SubmitField('Create Assignment')

class UpdateAssignmentForm(FlaskForm):
    AssignmentName = StringField('Assignment Name', validators=[InputRequired(), Length(max=200)])
    submit = SubmitField('Update Assignment')

class CreateAssignmentMarksForm(FlaskForm):
    Marks = IntegerField('Marks', validators=[InputRequired()])
    AssignmentDate = StringField('Assignment Date', validators=[InputRequired()])
    AssignmentId = SelectField('Assignment', validators=[InputRequired()], coerce=int)
    submit = SubmitField('Create Assignment Marks')

class UpdateAssignmentMarksForm(FlaskForm):
    Marks = IntegerField('Marks', validators=[InputRequired()])
    AssignmentDate = StringField('Assignment Date', validators=[InputRequired()])
    submit = SubmitField('Update Assignment Marks')

class UpdateNCSForm(FlaskForm):
    Version = StringField('Version', validators=[Length(max=50)])
    Name = StringField('Name', validators=[Length(max=200)])
    UpdatedDate = StringField('Updated Date')
    CourseId = SelectField('Course', coerce=int)
    submit = SubmitField('Update NCS')

class CreateModuleForm(FlaskForm):
    ModuleNo = StringField('Module No', validators=[InputRequired(), Length(max=50)])
    ModuleName = StringField('Module Name', validators=[InputRequired(), Length(max=200)])
    TheoryHours = IntegerField('Theory Hours', validators=[InputRequired()])
    PracticalHours = IntegerField('Practical Hours', validators=[InputRequired()])
    NCSId = SelectField('NCS', validators=[InputRequired()], coerce=int)
    submit = SubmitField('Create Module')

class UpdateModuleForm(FlaskForm):
    ModuleNo = StringField('Module No', validators=[Length(max=50)])
    ModuleName = StringField('Module Name', validators=[Length(max=200)])
    TheoryHours = IntegerField('Theory Hours')
    PracticalHours = IntegerField('Practical Hours')
    NCSId = SelectField('NCS', coerce=int)
    submit = SubmitField('Update Module')

class CreateModuleTaskForm(FlaskForm):
    TaskNo = StringField('Task No', validators=[InputRequired(), Length(max=50)])
    TaskName = StringField('Task Name', validators=[InputRequired(), Length(max=200)])
    ModuleId = SelectField('Module', validators=[InputRequired()], coerce=int)
    submit = SubmitField('Create Module Task')

class UpdateModuleTaskForm(FlaskForm):
    TaskNo = StringField('Task No', validators=[Length(max=50)])
    TaskName = StringField('Task Name', validators=[Length(max=200)])
    ModuleId = SelectField('Module', coerce=int)
    submit = SubmitField('Update Module Task')

class ContinuousAssessmentForm(FlaskForm):
    AssessmentMark = SelectField('Assessment Mark', validators=[InputRequired()], 
                               choices=[('C', 'Competent (C)'), ('NYC', 'Not Yet Competent (NYC)')])
    AssessmentDate = StringField('Assessment Date')
    AssessorNotes = StringField('Assessor Notes')
    submit = SubmitField('Save Assessment')

# ==================== Helper Functions ====================

def get_auth_headers():
    if 'access_token' in session:
        return {'Authorization': f'Bearer {session["access_token"]}'}
    return {}

from werkzeug.utils import secure_filename

def parse_csv(file_or_content, preview_rows=5, is_file_path=True):
    """Parse CSV file or content and return headers and first N rows of data."""
    headers = []
    data = []
    
    # Try different encodings to handle various CSV file formats
    encodings = ['utf-8', 'iso-8859-1', 'cp1252']
    
    for encoding in encodings:
        try:
            if is_file_path:
                # Read from file path
                with open(file_or_content, 'r', newline='', encoding=encoding) as csvfile:
                    reader = csv.reader(csvfile)
                    headers = next(reader)
                    # Clean up BOM if present
                    if headers and headers[0].startswith('\ufeff'):
                        headers[0] = headers[0][1:]
                
                    for i, row in enumerate(reader):
                        if i >= preview_rows:
                            break
                        data.append(row)
            else:
                # Read from content string
                csv_content = file_or_content.decode(encoding)
                reader = csv.reader(io.StringIO(csv_content))
                headers = next(reader)
                # Clean up BOM if present
                if headers and headers[0].startswith('\ufeff'):
                    headers[0] = headers[0][1:]
                
                for i, row in enumerate(reader):
                    if i >= preview_rows:
                        break
                    data.append(row)
            
            return headers, data
        except Exception as e:
            continue
    
    raise Exception(f"Failed to parse CSV file with any supported encoding. Please check the file format.")

def process_csv_for_import(file_path, batch_id, mapping):
    """Process CSV file with field mapping and prepare student data for API."""
    students = []
    
    with open(file_path, 'r', newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        
        for row in reader:
            student_data = {'batchId': batch_id}
            
            for csv_header, field_name in mapping.items():
                if csv_header in row:
                    value = row[csv_header].strip() if row[csv_header] else ''
                    # Convert PascalCase field names to camelCase
                    camel_case_field = field_name[0].lower() + field_name[1:] if len(field_name) > 0 else field_name
                    # Ensure specific fields are properly mapped
                    if camel_case_field == 'nICNo':
                        camel_case_field = 'nicNo'
                    elif camel_case_field == 'mISNo':
                        camel_case_field = 'misNo'
                    student_data[camel_case_field] = value
            
            # Set default values for required fields that might not be mapped
            # This is important to ensure the API accepts the request
            if 'misNo' not in student_data or not student_data['misNo']:
                import uuid
                student_data['misNo'] = f"ST-{uuid.uuid4().hex[:8]}"
            
            if 'nameWithInitials' not in student_data or not student_data['nameWithInitials']:
                # Use full name as fallback if name with initials not provided
                if 'fullName' in student_data and student_data['fullName']:
                    # Take first part of full name as initials fallback
                    student_data['nameWithInitials'] = student_data['fullName'].split()[0] if ' ' in student_data['fullName'] else student_data['fullName']
                else:
                    student_data['nameWithInitials'] = ''
            
            if 'fullName' not in student_data or not student_data['fullName']:
                if 'nameWithInitials' in student_data and student_data['nameWithInitials']:
                    student_data['fullName'] = student_data['nameWithInitials']
                else:
                    student_data['fullName'] = ''
            
            if 'nicNo' not in student_data or not student_data['nicNo']:
                student_data['nicNo'] = ''
            
            if 'gender' not in student_data or not student_data['gender']:
                student_data['gender'] = 'Male'
            
            if 'address' not in student_data or not student_data['address']:
                student_data['address'] = ''
            
            if 'telephone' not in student_data or not student_data['telephone']:
                student_data['telephone'] = ''
            
            if 'email' not in student_data or not student_data['email']:
                if 'misNo' in student_data:
                    student_data['email'] = f"{student_data['misNo']}@example.com"
                else:
                    student_data['email'] = ''
            
            if 'gsDivision' not in student_data or not student_data['gsDivision']:
                student_data['gsDivision'] = 'Unknown'
            
            if 'agDivision' not in student_data or not student_data['agDivision']:
                student_data['agDivision'] = 'Unknown'
            
            # Cleanup and normalize data
            if 'gender' in student_data:
                student_data['gender'] = student_data['gender'].capitalize()
            if 'email' in student_data and student_data['email'] and '@' not in student_data['email']:
                student_data['email'] = f"{student_data['email']}@example.com"
            
            students.append(student_data)
    
    return students

def api_request(method, endpoint, data=None, params=None):
    url = f"{API_BASE_URL}/{endpoint}"
    headers = get_auth_headers()
    
    print(f"API Request: {method} {url}")
    print(f"Headers: {headers}")
    if data:
        print(f"Data: {data}")
    
    # Convert Decimal objects to float for JSON serialization
    if data is not None:
        import json
        from decimal import Decimal
        
        def convert_decimal(obj):
            if isinstance(obj, Decimal):
                return float(obj)
            raise TypeError(f"Object of type {obj.__class__.__name__} is not JSON serializable")
        
        data = json.loads(json.dumps(data, default=convert_decimal))
    
    try:
        if method == 'GET':
            response = requests.get(url, headers=headers, params=params, verify=False)
        elif method == 'POST':
            response = requests.post(url, headers=headers, json=data, verify=False)
        elif method == 'PUT':
            response = requests.put(url, headers=headers, json=data, verify=False)
        elif method == 'DELETE':
            response = requests.delete(url, headers=headers, verify=False)
        
        print(f"API Response Status: {response.status_code}")
        if response.content:
            print(f"API Response Content: {response.content.decode('utf-8')}")
        
        return response
    except Exception as e:
        print(f"API Request Error: {e}")
        return None

# ==================== Routes ====================

@app.route('/')
@app.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    
    if form.validate_on_submit():
        data = {
            'email': form.email.data,
            'password': form.password.data
        }
        
        response = api_request('POST', 'auth/login', data=data)
        
        if response and response.status_code == 200:
            result = response.json()
            session['access_token'] = result['accessToken']
            session['refresh_token'] = result['refreshToken']
            session['expires_at'] = result['expiresAt']
            session['email'] = form.email.data
            
            # Get user profile
            profile_response = api_request('GET', f'auth/profile?userEmail={session["email"]}')
            if profile_response and profile_response.status_code == 200:
                profile = profile_response.json()
                session['first_name'] = profile.get('firstName', 'User')
                session['full_name'] = profile.get('fullName', 'User')
                session['roles'] = profile.get('roles', ['User'])
            
            flash('Login successful!', 'success')
            return redirect(url_for('dashboard'))
        else:
            error_msg = 'Invalid email or password'
            if response:
                try:
                    error_msg = response.json().get('message', error_msg)
                except:
                    pass
            flash(error_msg, 'danger')
    
    return render_template('login.html', form=form)

@app.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out.', 'success')
    return redirect(url_for('login'))

@app.route('/dashboard')
@app.route('/dashboard/<int:course_id>')
def dashboard(course_id=None):
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    if course_id:
        # Single course view
        course_response = api_request('GET', f'courses/{course_id}')
        
        if not course_response or course_response.status_code != 200:
            flash('Course not found', 'danger')
            return redirect(url_for('courses'))
        
        course = course_response.json()
        
        # Get instructors for this course
        instructors_response = api_request('GET', 'instructors')
        instructors = instructors_response.json() if (instructors_response and instructors_response.status_code == 200) else []
        
        course_instructors_response = api_request('GET', 'courseinstructors')
        course_instructors = course_instructors_response.json() if (course_instructors_response and course_instructors_response.status_code == 200) else []
        assigned_instructor_ids = [ci['instructorId'] for ci in course_instructors if ci['courseId'] == course_id]
        course_instructors_list = [instructor for instructor in instructors if instructor['instructorId'] in assigned_instructor_ids]
        
        # Get batches for this course
        batches_response = api_request('GET', 'batches')
        batches = batches_response.json() if (batches_response and batches_response.status_code == 200) else []
        course_batches = [batch for batch in batches if batch['courseId'] == course_id]
        
        # Calculate enrollment statistics for each batch
        students_response = api_request('GET', 'students')
        students = students_response.json() if (students_response and students_response.status_code == 200) else []
        
        for batch in course_batches:
            batch['enrollment_count'] = len([student for student in students if student['batchId'] == batch['batchId']])
        
        total_students = sum(batch['enrollment_count'] for batch in course_batches)
        active_instructors = len(course_instructors_list)
        active_batches = len(course_batches)
        
        return render_template('dashboard.html', 
                             single_course=True,
                             course=course,
                             instructors=course_instructors_list,
                             batches=course_batches,
                             students=students,
                             total_students=total_students,
                             active_instructors=active_instructors,
                             active_batches=active_batches)
    else:
        # Overall dashboard view
        courses_response = api_request('GET', 'courses')
        batches_response = api_request('GET', 'batches')
        instructors_response = api_request('GET', 'instructors')
        students_response = api_request('GET', 'students')
        
        courses = courses_response.json() if (courses_response and courses_response.status_code == 200) else []
        batches = batches_response.json() if (batches_response and batches_response.status_code == 200) else []
        instructors = instructors_response.json() if (instructors_response and instructors_response.status_code == 200) else []
        students = students_response.json() if (students_response and students_response.status_code == 200) else []
        
        # Calculate stats
        total_students = len(students)
        active_instructors = len(instructors)
        courses_offered = len(courses)
        active_batches = len(batches)
        
        # Calculate incomplete courses
        incomplete_courses = []
        for course in courses:
            if 'hasInstructors' in course and 'hasBatches' in course:
                if not course['hasInstructors'] or not course['hasBatches']:
                    incomplete_courses.append(course)
            else:
                # Fallback for courses without complete data
                if 'instructorIds' in course and len(course['instructorIds']) == 0:
                    incomplete_courses.append(course)
                elif 'batchIds' in course and len(course['batchIds']) == 0:
                    incomplete_courses.append(course)
        
        return render_template('dashboard.html', 
                             single_course=False,
                             total_students=total_students,
                             active_instructors=active_instructors,
                             courses_offered=courses_offered,
                             active_batches=active_batches,
                             incomplete_courses=len(incomplete_courses),
                             courses=courses,
                             batches=batches,
                             instructors=instructors,
                             students=students)

# ==================== Courses Routes ====================

@app.route('/courses')
def courses():
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    response = api_request('GET', 'courses')
    
    if response and response.status_code == 200:
        courses = response.json()
        print("=== Courses Data ===")
        print(f"Response JSON: {courses}")
        for course in courses:
            print(f"Course ID: {course['courseId']}")
            print(f"Course Name: {course['courseName']}")
            print(f"Has Instructors: {course.get('hasInstructors', 'N/A')}")
            print(f"Instructor Names: {course.get('instructorNames', 'N/A')}")
            print(f"Instructor IDs: {course.get('instructorIds', 'N/A')}")
            print("-" * 50)
    else:
        courses = []
        flash('Failed to load courses', 'danger')
    
    return render_template('courses.html', courses=courses)


@app.route('/courses/<int:id>/assign-instructors', methods=['GET', 'POST'])
def assign_instructors_to_course(id):
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    # Get course details
    course_response = api_request('GET', f'courses/{id}')
    if not course_response or course_response.status_code != 200:
        flash('Course not found', 'danger')
        return redirect(url_for('courses'))
    course = course_response.json()
    
    # Get all instructors
    instructors_response = api_request('GET', 'instructors')
    instructors = instructors_response.json() if (instructors_response and instructors_response.status_code == 200) else []
    
    # Get currently assigned instructors
    course_instructors_response = api_request('GET', 'courseinstructors')
    course_instructors = course_instructors_response.json() if (course_instructors_response and course_instructors_response.status_code == 200) else []
    assigned_instructors = [ci['instructorId'] for ci in course_instructors if ci['courseId'] == id]
    
    # Handle form submission
    if request.method == 'POST':
        print(f"=== Form Data ===")
        print(f"Request Form: {request.form}")
        selected_instructors = request.form.getlist('instructor_ids')
        print(f"Selected Instructors: {selected_instructors}")
        print(f"Assigned Instructors: {assigned_instructors}")
        print(f"Course Instructors: {course_instructors}")
        
        # Remove unselected instructors
        for ci in course_instructors:
            if ci['courseId'] == id and str(ci['instructorId']) not in selected_instructors:
                print(f"Removing instructor {ci['instructorId']} from course {id}")
                api_request('DELETE', f'courseinstructors/{id}/{ci["instructorId"]}')
        
        # Add selected instructors
        for instructor_id in selected_instructors:
            instructor_id = int(instructor_id)
            if instructor_id not in assigned_instructors:
                print(f"Adding instructor {instructor_id} to course {id}")
                api_request('POST', 'courseinstructors', data={
                    'courseId': id,
                    'instructorId': instructor_id
                })
        
        flash('Instructors assigned successfully!', 'success')
        return redirect(url_for('courses'))
    
    from flask_wtf.csrf import generate_csrf
    token = generate_csrf()
    print(f"Generated CSRF Token: {token}")
    
    return render_template('assign_instructors_to_course.html', 
                         course=course, 
                         instructors=instructors, 
                         assigned_instructors=assigned_instructors,
                         csrf_token=token)


# ==================== NCS Routes ====================

@app.route('/ncs')
def ncs():
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    # Get NCS records
    ncs_response = api_request('GET', 'ncs')
    if ncs_response and ncs_response.status_code == 200:
        ncs_list = ncs_response.json()
        print("NCS List:", ncs_list)  # Debug print
    else:
        ncs_list = []
        flash('Failed to load NCS records', 'danger')
    
    # Get modules count
    modules_response = api_request('GET', 'modules')
    if modules_response and modules_response.status_code == 200:
        modules_count = len(modules_response.json())
    else:
        modules_count = 0
    
    # Get module tasks count
    tasks_response = api_request('GET', 'moduletasks')
    if tasks_response and tasks_response.status_code == 200:
        tasks_count = len(tasks_response.json())
    else:
        tasks_count = 0
    
    return render_template('ncs.html', 
                         ncs_list=ncs_list, 
                         ncs_count=len(ncs_list), 
                         modules_count=modules_count, 
                         tasks_count=tasks_count)

@app.route('/ncs/create', methods=['GET', 'POST'])
@app.route('/courses/<int:course_id>/ncs/create', methods=['GET', 'POST'])
def create_ncs(course_id=None):
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    form = CreateNCSForm()
    
    # Get courses for dropdown
    courses_response = api_request('GET', 'courses')
    if courses_response and courses_response.status_code == 200:
        courses = courses_response.json()
        form.CourseId.choices = [(course['courseId'], course['courseName']) for course in courses]
    
    # If course_id is provided, pre-select that course
    if course_id:
        form.CourseId.data = course_id
    
    if form.validate_on_submit():
        data = {
            'Version': form.Version.data,
            'Name': form.Name.data,
            'UpdatedDate': form.UpdatedDate.data,
            'CourseId': form.CourseId.data
        }
        
        response = api_request('POST', 'ncs', data=data)
        
        if response and response.status_code == 201:
            flash('NCS record created successfully!', 'success')
            if course_id:
                return redirect(url_for('manage_course_ncs', course_id=course_id))
            else:
                return redirect(url_for('ncs'))
        else:
            error_msg = 'Failed to create NCS record'
            if response:
                try:
                    error_msg = response.json().get('message', error_msg)
                except:
                    pass
            flash(error_msg, 'danger')
    
    # Get course details if creating from course page
    course = None
    if course_id:
        course_response = api_request('GET', f'courses/{course_id}')
        if course_response and course_response.status_code == 200:
            course = course_response.json()
    
    return render_template('create_ncs.html', form=form, course=course)

@app.route('/ncs/<int:id>/edit', methods=['GET', 'POST'])
def edit_ncs(id):
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    # Get NCS record
    ncs_response = api_request('GET', f'ncs/{id}')
    if not ncs_response or ncs_response.status_code != 200:
        flash('NCS record not found', 'danger')
        return redirect(url_for('ncs'))
    ncs_record = ncs_response.json()
    
    form = UpdateNCSForm()
    
    # Get courses for dropdown
    courses_response = api_request('GET', 'courses')
    if courses_response and courses_response.status_code == 200:
        courses = courses_response.json()
        form.CourseId.choices = [(course['courseId'], course['courseName']) for course in courses]
    
    if request.method == 'GET':
        form.Version.data = ncs_record['Version']
        form.Name.data = ncs_record['Name']
        form.UpdatedDate.data = ncs_record['UpdatedDate'].split('T')[0]
        form.CourseId.data = ncs_record['CourseId']
    
    if form.validate_on_submit():
        data = {}
        if form.Version.data:
            data['Version'] = form.Version.data
        if form.Name.data:
            data['Name'] = form.Name.data
        if form.UpdatedDate.data:
            data['UpdatedDate'] = form.UpdatedDate.data
        if form.CourseId.data:
            data['CourseId'] = form.CourseId.data
        
        response = api_request('PUT', f'ncs/{id}', data=data)
        
        if response and response.status_code == 200:
            flash('NCS record updated successfully!', 'success')
            return redirect(url_for('ncs'))
        else:
            error_msg = 'Failed to update NCS record'
            if response:
                try:
                    error_msg = response.json().get('message', error_msg)
                except:
                    pass
            flash(error_msg, 'danger')
    
    return render_template('edit_ncs.html', form=form, ncs_record=ncs_record)

@app.route('/ncs/<int:id>/delete', methods=['POST'])
def delete_ncs(id):
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    # Validate CSRF token
    from flask_wtf.csrf import validate_csrf
    from wtforms.validators import ValidationError
    try:
        validate_csrf(request.form.get('csrf_token'))
    except ValidationError:
        flash('CSRF token is invalid. Please try again.', 'danger')
        return redirect(url_for('ncs'))
    
    response = api_request('DELETE', f'ncs/{id}')
    
    if response and response.status_code == 200:
        flash('NCS deleted successfully!', 'success')
    else:
        flash('Failed to delete NCS', 'danger')
    
    return redirect(url_for('ncs'))

@app.route('/courses/<int:course_id>/ncs')
def manage_course_ncs(course_id):
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    # Get course details
    course_response = api_request('GET', f'courses/{course_id}')
    if not course_response or course_response.status_code != 200:
        flash('Course not found', 'danger')
        return redirect(url_for('courses'))
    course = course_response.json()
    
    # Get NCS records for this course
    ncs_response = api_request('GET', f'ncs/course/{course_id}')
    if ncs_response and ncs_response.status_code == 200:
        ncs_list = ncs_response.json()
    else:
        ncs_list = []
        flash('Failed to load NCS records', 'danger')
    
    # Get modules count for each NCS
    modules_count = 0
    tasks_count = 0
    for ncs in ncs_list:
        modules_count += len(ncs.get('Modules', []))
        for module in ncs.get('Modules', []):
            tasks_count += len(module.get('Tasks', []))
    
    return render_template('ncs_management.html',
                         ncs_list=ncs_list,
                         ncs_count=len(ncs_list),
                         modules_count=modules_count,
                         tasks_count=tasks_count,
                         course=course)

    response = api_request('DELETE', f'ncs/{id}')
    
    if response and response.status_code == 200:
        flash('NCS record deleted successfully!', 'success')
    else:
        error_msg = 'Failed to delete NCS record'
        if response:
            try:
                error_msg = response.json().get('message', error_msg)
            except:
                pass
        flash(error_msg, 'danger')
    
    return redirect(url_for('ncs'))

# ==================== Modules Routes ====================

@app.route('/modules')
@app.route('/modules/<int:ncs_id>')
def modules(ncs_id=None):
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    if ncs_id:
        response = api_request('GET', f'modules/ncs/{ncs_id}')
    else:
        response = api_request('GET', 'modules')
    
    if response and response.status_code == 200:
        modules_list = response.json()
    else:
        modules_list = []
        flash('Failed to load modules', 'danger')
    
    return render_template('modules.html', modules_list=modules_list, ncs_id=ncs_id)

@app.route('/modules/create', methods=['GET', 'POST'])
@app.route('/ncs/<int:ncs_id>/modules/create', methods=['GET', 'POST'])
def create_module(ncs_id=None):
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    form = CreateModuleForm()
    
    # Get NCS records for dropdown
    ncs_response = api_request('GET', 'ncs')
    if ncs_response and ncs_response.status_code == 200:
        ncs_list = ncs_response.json()
        form.NCSId.choices = [(ncs['id'], ncs['name']) for ncs in ncs_list]
    
    # Preselect NCS if provided
    if ncs_id:
        form.NCSId.data = ncs_id
    
    if form.validate_on_submit():
        data = {
            'ModuleNo': form.ModuleNo.data,
            'ModuleName': form.ModuleName.data,
            'TheoryHours': form.TheoryHours.data,
            'PracticalHours': form.PracticalHours.data,
            'NCSId': form.NCSId.data
        }
        
        response = api_request('POST', 'modules', data=data)
        
        if response and response.status_code == 201:
            flash('Module created successfully!', 'success')
            return redirect(url_for('modules'))
        else:
            error_msg = 'Failed to create module'
            if response:
                try:
                    error_msg = response.json().get('message', error_msg)
                except:
                    pass
            flash(error_msg, 'danger')
    
    return render_template('create_module.html', form=form)

@app.route('/modules/<int:id>/edit', methods=['GET', 'POST'])
def edit_module(id):
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    # Get module
    module_response = api_request('GET', f'modules/{id}')
    if not module_response or module_response.status_code != 200:
        flash('Module not found', 'danger')
        return redirect(url_for('modules'))
    module = module_response.json()
    
    form = UpdateModuleForm()
    
    # Get NCS records for dropdown
    ncs_response = api_request('GET', 'ncs')
    if ncs_response and ncs_response.status_code == 200:
        ncs_list = ncs_response.json()
        form.NCSId.choices = [(ncs['id'], ncs['name']) for ncs in ncs_list]
    
    if request.method == 'GET':
        form.ModuleNo.data = module['moduleNo']
        form.ModuleName.data = module['moduleName']
        form.TheoryHours.data = module['theoryHours']
        form.PracticalHours.data = module['practicalHours']
        form.NCSId.data = module['ncsId']
    
    if form.validate_on_submit():
        data = {}
        if form.ModuleNo.data:
            data['moduleNo'] = form.ModuleNo.data
        if form.ModuleName.data:
            data['moduleName'] = form.ModuleName.data
        if form.TheoryHours.data:
            data['theoryHours'] = form.TheoryHours.data
        if form.PracticalHours.data:
            data['practicalHours'] = form.PracticalHours.data
        if form.NCSId.data:
            data['ncsId'] = form.NCSId.data
        
        response = api_request('PUT', f'modules/{id}', data=data)
        
        if response and response.status_code == 200:
            flash('Module updated successfully!', 'success')
            return redirect(url_for('modules'))
        else:
            error_msg = 'Failed to update module'
            if response:
                try:
                    error_msg = response.json().get('message', error_msg)
                except:
                    pass
            flash(error_msg, 'danger')
    
    return render_template('edit_module.html', form=form, module=module)

@app.route('/modules/<int:id>/delete', methods=['POST'])
def delete_module(id):
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    # Validate CSRF token
    from flask_wtf.csrf import validate_csrf
    from wtforms.validators import ValidationError
    try:
        validate_csrf(request.form.get('csrf_token'))
    except ValidationError:
        flash('CSRF token is invalid. Please try again.', 'danger')
        return redirect(url_for('modules'))
    
    response = api_request('DELETE', f'modules/{id}')
    
    if response and response.status_code == 200:
        flash('Module deleted successfully!', 'success')
    else:
        error_msg = 'Failed to delete module'
        if response:
            try:
                error_msg = response.json().get('message', error_msg)
            except:
                pass
        flash(error_msg, 'danger')
    
    return redirect(url_for('modules'))

# ==================== Module Tasks Routes ====================

@app.route('/module-tasks')
@app.route('/module-tasks/<int:module_id>')
def module_tasks(module_id=None):
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    if module_id:
        response = api_request('GET', f'moduletasks/module/{module_id}')
    else:
        response = api_request('GET', 'moduletasks')
    
    if response and response.status_code == 200:
        tasks_list = response.json()
    else:
        tasks_list = []
        flash('Failed to load module tasks', 'danger')
    
    return render_template('module_tasks.html', tasks_list=tasks_list, module_id=module_id)

@app.route('/module-tasks/create', methods=['GET', 'POST'])
@app.route('/modules/<int:module_id>/tasks/create', methods=['GET', 'POST'])
def create_module_task(module_id=None):
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    form = CreateModuleTaskForm()
    
    # Get modules for dropdown
    modules_response = api_request('GET', 'modules')
    if modules_response and modules_response.status_code == 200:
        modules_list = modules_response.json()
        form.ModuleId.choices = [(module['id'], module['moduleName']) for module in modules_list]
    
    # Preselect module if provided
    if module_id:
        form.ModuleId.data = module_id
    
    if form.validate_on_submit():
        data = {
            'taskNo': form.TaskNo.data,
            'taskName': form.TaskName.data,
            'moduleId': form.ModuleId.data
        }
        
        response = api_request('POST', 'moduletasks', data=data)
        
        if response and response.status_code == 201:
            flash('Module task created successfully!', 'success')
            return redirect(url_for('module_tasks'))
        else:
            error_msg = 'Failed to create module task'
            if response:
                try:
                    error_msg = response.json().get('message', error_msg)
                except:
                    pass
            flash(error_msg, 'danger')
    
    return render_template('create_module_task.html', form=form)

@app.route('/module-tasks/<int:id>/edit', methods=['GET', 'POST'])
def edit_module_task(id):
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    # Get module task
    task_response = api_request('GET', f'moduletasks/{id}')
    if not task_response or task_response.status_code != 200:
        flash('Module task not found', 'danger')
        return redirect(url_for('module_tasks'))
    task = task_response.json()
    
    form = UpdateModuleTaskForm()
    
    # Get modules for dropdown
    modules_response = api_request('GET', 'modules')
    if modules_response and modules_response.status_code == 200:
        modules_list = modules_response.json()
        form.ModuleId.choices = [(module['id'], module['moduleName']) for module in modules_list]
    
    if request.method == 'GET':
        form.TaskNo.data = task['taskNo']
        form.TaskName.data = task['taskName']
        form.ModuleId.data = task['moduleId']
    
    if form.validate_on_submit():
        data = {}
        if form.TaskNo.data:
            data['taskNo'] = form.TaskNo.data
        if form.TaskName.data:
            data['taskName'] = form.TaskName.data
        if form.ModuleId.data:
            data['moduleId'] = form.ModuleId.data
        
        response = api_request('PUT', f'moduletasks/{id}', data=data)
        
        if response and response.status_code == 200:
            flash('Module task updated successfully!', 'success')
            return redirect(url_for('module_tasks'))
        else:
            error_msg = 'Failed to update module task'
            if response:
                try:
                    error_msg = response.json().get('message', error_msg)
                except:
                    pass
            flash(error_msg, 'danger')
    
    return render_template('edit_module_task.html', form=form, task=task)

@app.route('/module-tasks/<int:id>/delete', methods=['POST'])
def delete_module_task(id):
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    # Validate CSRF token
    from flask_wtf.csrf import validate_csrf
    from wtforms.validators import ValidationError
    try:
        validate_csrf(request.form.get('csrf_token'))
    except ValidationError:
        flash('CSRF token is invalid. Please try again.', 'danger')
        return redirect(url_for('module_tasks'))
    
    response = api_request('DELETE', f'moduletasks/{id}')
    
    if response and response.status_code == 200:
        flash('Module task deleted successfully!', 'success')
    else:
        error_msg = 'Failed to delete module task'
        if response:
            try:
                error_msg = response.json().get('message', error_msg)
            except:
                pass
        flash(error_msg, 'danger')
    
    return redirect(url_for('module_tasks'))

# ==================== Assignments Routes ====================

@app.route('/assignments')
def assignments():
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    response = api_request('GET', 'assignments')
    if response and response.status_code == 200:
        assignments_list = response.json()
    else:
        assignments_list = []
        flash('Failed to load assignments', 'danger')
    
    return render_template('assignments.html', assignments_list=assignments_list)

@app.route('/assignments/create', methods=['GET', 'POST'])
def create_assignment():
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    form = CreateAssignmentForm()
    
    if form.validate_on_submit():
        data = {
            'AssignmentName': form.AssignmentName.data
        }
        
        response = api_request('POST', 'assignments', data=data)
        
        if response and response.status_code == 201:
            flash('Assignment created successfully!', 'success')
            return redirect(url_for('assignments'))
        else:
            error_msg = 'Failed to create assignment'
            if response:
                try:
                    error_msg = response.json().get('message', error_msg)
                except:
                    pass
            flash(error_msg, 'danger')
    
    return render_template('create_assignment.html', form=form)

@app.route('/assignments/<int:id>/edit', methods=['GET', 'POST'])
def edit_assignment(id):
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    # Get assignment
    assignment_response = api_request('GET', f'assignments/{id}')
    if not assignment_response or assignment_response.status_code != 200:
        flash('Assignment not found', 'danger')
        return redirect(url_for('assignments'))
    assignment = assignment_response.json()
    
    form = UpdateAssignmentForm()
    
    if request.method == 'GET':
        form.AssignmentName.data = assignment['assignmentName']
    
    if form.validate_on_submit():
        data = {}
        if form.AssignmentName.data:
            data['assignmentName'] = form.AssignmentName.data
        
        response = api_request('PUT', f'assignments/{id}', data=data)
        
        if response and response.status_code == 200:
            flash('Assignment updated successfully!', 'success')
            return redirect(url_for('assignments'))
        else:
            error_msg = 'Failed to update assignment'
            if response:
                try:
                    error_msg = response.json().get('message', error_msg)
                except:
                    pass
            flash(error_msg, 'danger')
    
    return render_template('edit_assignment.html', form=form, assignment=assignment)

@app.route('/assignments/<int:id>/delete', methods=['POST'])
def delete_assignment(id):
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    # Validate CSRF token
    from flask_wtf.csrf import validate_csrf
    from wtforms.validators import ValidationError
    try:
        validate_csrf(request.form.get('csrf_token'))
    except ValidationError:
        flash('CSRF token is invalid. Please try again.', 'danger')
        return redirect(url_for('assignments'))
    
    response = api_request('DELETE', f'assignments/{id}')
    
    if response and response.status_code == 200:
        flash('Assignment deleted successfully!', 'success')
    else:
        error_msg = 'Failed to delete assignment'
        if response:
            try:
                error_msg = response.json().get('message', error_msg)
            except:
                pass
        flash(error_msg, 'danger')
    
    return redirect(url_for('assignments'))

# ==================== Assignment Marks Routes ====================

@app.route('/assignment-marks')
def assignment_marks():
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    response = api_request('GET', 'assignmentmarks')
    if response and response.status_code == 200:
        assignment_marks_list = response.json()
    else:
        assignment_marks_list = []
        flash('Failed to load assignment marks', 'danger')
    
    return render_template('assignment_marks.html', assignment_marks_list=assignment_marks_list)

@app.route('/assignment-marks/create', methods=['GET', 'POST'])
def create_assignment_marks():
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    form = CreateAssignmentMarksForm()
    
    # Get assignments for dropdown
    assignments_response = api_request('GET', 'assignments')
    if assignments_response and assignments_response.status_code == 200:
        assignments_list = assignments_response.json()
        form.AssignmentId.choices = [(assignment['id'], assignment['assignmentName']) for assignment in assignments_list]
    
    # Get students for dropdown
    students_response = api_request('GET', 'students')
    if students_response and students_response.status_code == 200:
        students_list = students_response.json()
        form.StudentId.choices = [(student['studentId'], student['nameWithInitials']) for student in students_list]
    
    if form.validate_on_submit():
        data = {
            'Marks': form.Marks.data,
            'AssignmentDate': form.AssignmentDate.data,
            'AssignmentId': form.AssignmentId.data,
            'StudentId': form.StudentId.data
        }
        
        response = api_request('POST', 'assignmentmarks', data=data)
        
        if response and response.status_code == 201:
            flash('Assignment marks created successfully!', 'success')
            return redirect(url_for('assignment_marks'))
        else:
            error_msg = 'Failed to create assignment marks'
            if response:
                try:
                    error_msg = response.json().get('message', error_msg)
                except:
                    pass
            flash(error_msg, 'danger')
    
    return render_template('create_assignment_marks.html', form=form)

@app.route('/assignment-marks/<int:id>/edit', methods=['GET', 'POST'])
def edit_assignment_marks(id):
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    # Get assignment marks
    assignment_marks_response = api_request('GET', f'assignmentmarks/{id}')
    if not assignment_marks_response or assignment_marks_response.status_code != 200:
        flash('Assignment marks not found', 'danger')
        return redirect(url_for('assignment_marks'))
    assignment_marks = assignment_marks_response.json()
    
    form = UpdateAssignmentMarksForm()
    
    if request.method == 'GET':
        form.Marks.data = assignment_marks['marks']
        form.AssignmentDate.data = assignment_marks['assignmentDate']
    
    if form.validate_on_submit():
        data = {}
        if form.Marks.data is not None:
            data['marks'] = form.Marks.data
        if form.AssignmentDate.data:
            data['assignmentDate'] = form.AssignmentDate.data
        
        response = api_request('PUT', f'assignmentmarks/{id}', data=data)
        
        if response and response.status_code == 200:
            flash('Assignment marks updated successfully!', 'success')
            return redirect(url_for('assignment_marks'))
        else:
            error_msg = 'Failed to update assignment marks'
            if response:
                try:
                    error_msg = response.json().get('message', error_msg)
                except:
                    pass
            flash(error_msg, 'danger')
    
    return render_template('edit_assignment_marks.html', form=form, assignment_marks=assignment_marks)

@app.route('/assignment-marks/<int:id>/delete', methods=['POST'])
def delete_assignment_marks(id):
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    # Validate CSRF token
    from flask_wtf.csrf import validate_csrf
    from wtforms.validators import ValidationError
    try:
        validate_csrf(request.form.get('csrf_token'))
    except ValidationError:
        flash('CSRF token is invalid. Please try again.', 'danger')
        return redirect(url_for('assignment_marks'))
    
    response = api_request('DELETE', f'assignmentmarks/{id}')
    
    if response and response.status_code == 200:
        flash('Assignment marks deleted successfully!', 'success')
    else:
        error_msg = 'Failed to delete assignment marks'
        if response:
            try:
                error_msg = response.json().get('message', error_msg)
            except:
                pass
        flash(error_msg, 'danger')
    
    return redirect(url_for('assignment_marks'))

# ==================== Student Assignment Marks Routes ====================

@app.route('/students/<int:student_id>/assignment-marks', methods=['GET', 'POST'])
def student_assignment_marks(student_id):
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    # Get student details
    student_response = api_request('GET', f'students/{student_id}')
    if not student_response or student_response.status_code != 200:
        flash('Student not found', 'danger')
        return redirect(url_for('students'))
    student = student_response.json()
    
    # Get assignment marks for the student
    assignment_marks_response = api_request('GET', f'assignmentmarks/student/{student_id}')
    if assignment_marks_response and assignment_marks_response.status_code == 200:
        assignment_marks_list = assignment_marks_response.json()
    else:
        assignment_marks_list = []
        flash('Failed to load assignment marks', 'danger')
    
    # Get all assignments
    assignments_response = api_request('GET', 'assignments')
    if assignments_response and assignments_response.status_code == 200:
        assignments_list = assignments_response.json()
    else:
        assignments_list = []
    
    # Create form for adding/editing assignment marks
    form = CreateAssignmentMarksForm()
    
    # Populate assignment dropdown with available assignments
    # Only include assignments that haven't been marked for this student yet
    available_assignments = [assignment for assignment in assignments_list if assignment['id'] not in [am['assignmentId'] for am in assignment_marks_list]]
    form.AssignmentId.choices = [(assignment['id'], assignment['assignmentName']) for assignment in available_assignments]
    
    # Process form submission
    if request.method == 'POST':
        if form.validate_on_submit():
            # Create assignment marks
            data = {
                'AssignmentId': form.AssignmentId.data,
                'StudentId': student_id,
                'Marks': form.Marks.data,
                'AssignmentDate': form.AssignmentDate.data
            }
            
            response = api_request('POST', 'assignmentmarks', data=data)
            
            if response and response.status_code == 201:
                flash('Assignment marks created successfully!', 'success')
                return redirect(url_for('student_assignment_marks', student_id=student_id))
            else:
                error_msg = 'Failed to create assignment marks'
                if response:
                    try:
                        error_msg = response.json().get('message', error_msg)
                    except:
                        pass
                flash(error_msg, 'danger')
        else:
            # Form validation failed
            flash('Please correct the errors in the form.', 'danger')
    
    return render_template('student_assignment_marks.html', 
                         student=student, 
                         assignment_marks_list=assignment_marks_list,
                         assignments_list=assignments_list,
                         form=form)

@app.route('/courses/<int:id>/assign-batches', methods=['GET', 'POST'])
def assign_batches_to_course(id):
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    # Get course details
    course_response = api_request('GET', f'courses/{id}')
    if not course_response or course_response.status_code != 200:
        flash('Course not found', 'danger')
        return redirect(url_for('courses'))
    course = course_response.json()
    
    # Get all batches
    batches_response = api_request('GET', 'batches')
    batches = batches_response.json() if (batches_response and batches_response.status_code == 200) else []
    
    # Get currently assigned batches
    assigned_batches = [batch['batchId'] for batch in batches if batch['courseId'] == id]
    
    # Handle form submission
    if request.method == 'POST':
        selected_batches = request.form.getlist('batch_ids')
        
        # Update batches
        for batch in batches:
            if str(batch['batchId']) in selected_batches:
                if batch['courseId'] != id:
                    # Assign to this course
                    api_request('PUT', f'batch/{batch["batchId"]}', data={
                        'courseId': id,
                        'batchCode': batch['batchCode'],
                        'startDate': batch['startDate'],
                        'endDate': batch['endDate'],
                        'duration': batch['duration']
                    })
            else:
                if batch['courseId'] == id:
                    # Unassign from this course (assign to no course or another course)
                    # For now, we'll just set to 0 or leave as is - depends on business logic
                    # Here, we'll just leave it as is since we don't have a "no course" option
                    pass
        
        flash('Batches assigned successfully!', 'success')
        return redirect(url_for('courses'))
    
    from flask_wtf.csrf import generate_csrf
    token = generate_csrf()
    print(f"Generated CSRF Token: {token}")
    
    return render_template('assign_batches_to_course.html', 
                         course=course, 
                         batches=batches, 
                         assigned_batches=assigned_batches,
                         csrf_token=token)

@app.route('/courses/create', methods=['GET', 'POST'])
def create_course():
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    # Fetch centers from API
    centers_response = api_request('GET', 'centers')
    centers = centers_response.json() if (centers_response and centers_response.status_code == 200) else []
    
    form = CreateCourseForm()
    form.centerId.choices = [(center['centerId'], center['centerName']) for center in centers]
    
    if form.validate_on_submit():
        data = {
            'courseName': form.courseName.data,
            'description': form.description.data,
            'duration': form.duration.data,
            'courseFee': form.courseFee.data,
            'centerId': form.centerId.data
        }
        
        response = api_request('POST', 'courses', data=data)
        
        if response and response.status_code == 201:
            flash('Course created successfully!', 'success')
            return redirect(url_for('courses'))
        else:
            error_msg = 'Failed to create course'
            if response:
                try:
                    error_msg = response.json().get('message', error_msg)
                except:
                    pass
            flash(error_msg, 'danger')
    
    return render_template('create_course.html', form=form, centers=centers)

@app.route('/students/upload-csv', methods=['GET', 'POST'])
def upload_students_csv():
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    # Student fields for mapping with friendly names (must match API's PascalCase field names)
    student_fields = [
        {'name': 'MISNo', 'label': 'MIS Number'},
        {'name': 'NameWithInitials', 'label': 'Name with Initials'},
        {'name': 'FullName', 'label': 'Full Name'},
        {'name': 'NICNo', 'label': 'NIC Number'},
        {'name': 'Gender', 'label': 'Gender'},
        {'name': 'Address', 'label': 'Address'},
        {'name': 'Telephone', 'label': 'Telephone'},
        {'name': 'Email', 'label': 'Email'},
        {'name': 'GSDivision', 'label': 'GS Division'},
        {'name': 'AGDivision', 'label': 'AG Division'}
    ]
    
    # Get batches for dropdown
    batches_response = api_request('GET', 'batches')
    batches = batches_response.json() if (batches_response and batches_response.status_code == 200) else []
    batch_choices = [(batch['batchId'], batch['batchCode']) for batch in batches]
    
    # Step 1: Upload CSV and select batch
    if request.method == 'GET' or (request.method == 'POST' and not request.form.get('step') == '2'):
        form = UploadStudentsCsvForm()
        form.batchId.choices = batch_choices
        
        if request.method == 'POST':
            if form.validate_on_submit():
                try:
                    # Parse CSV file directly without saving to disk
                    file = form.file.data
                    filename = secure_filename(file.filename)
                    
                    # Try to parse CSV with different encodings
                    csv_headers = None
                    complete_csv_data = None
                    csv_data = []
                    
                    # Try different encodings to handle various CSV file formats
                    encodings = ['utf-8', 'iso-8859-1', 'cp1252']
                    for encoding in encodings:
                        try:
                            # Read and decode file content
                            file_content = file.read()
                            decoded_content = file_content.decode(encoding)
                            
                            # Parse CSV data
                            csv_reader = csv.DictReader(io.StringIO(decoded_content))
                            csv_headers = csv_reader.fieldnames
                            complete_csv_data = list(csv_reader)
                            
                            # Preview data (first 5 rows)
                            for i, row in enumerate(complete_csv_data):
                                if i >= 5:
                                    break
                                csv_data.append(list(row.values()))
                            
                            break  # Success, move to next step
                        except Exception as e:
                            print(f"Failed to parse CSV with encoding {encoding}: {e}")
                            continue
                    
                    if not csv_headers or not complete_csv_data:
                        flash('Failed to parse CSV file with any supported encoding. Please check the file format.', 'danger')
                        return redirect(url_for('upload_students_csv'))
                    
                    # Store parsed data in session for second step
                    session['complete_csv_data'] = complete_csv_data
                    session['csv_headers'] = csv_headers
                    session['batch_id'] = form.batchId.data
                    
                    # Render mapping interface
                    mapping_form = MapCsvFieldsForm()
                    
                    # Auto-detect possible mappings based on header similarity
                    auto_mapping = {}
                    for csv_header in csv_headers:
                        csv_header_lower = csv_header.lower().strip()
                        for field in student_fields:
                            field_name_lower = field['name'].lower()
                            field_label_lower = field['label'].lower()
                            
                            if csv_header_lower in field_name_lower or csv_header_lower in field_label_lower or \
                               field_name_lower in csv_header_lower or field_label_lower in csv_header_lower:
                                auto_mapping[csv_header] = field['name']
                                break
                    
                    session['auto_mapping'] = auto_mapping
                    
                    return render_template('upload_students_csv.html', 
                                         form=mapping_form, 
                                         csv_data=csv_data, 
                                         csv_headers=csv_headers, 
                                         student_fields=student_fields,
                                         file_name=filename,
                                         batch_id=form.batchId.data,
                                         auto_mapping=auto_mapping,
                                         step=2)
                except Exception as e:
                    flash(f'Error parsing CSV file: {str(e)}', 'danger')
                    print(f"Error details: {str(e)}")
                    return redirect(url_for('upload_students_csv'))
            else:
                print(f"Form errors: {form.errors}")
                print(f"Form data: {form.data}")
                for field, errors in form.errors.items():
                    for error in errors:
                        flash(f'{field}: {error}', 'danger')
        
        return render_template('upload_students_csv.html', 
                           form=form, 
                           csv_data=None, 
                           csv_headers=None, 
                           student_fields=student_fields,
                           step=1)
    
    # Step 2: Map fields with CSV headers and student model
    elif request.method == 'POST' and request.form.get('step') == '2':
        # Initialize the correct form class for step 2
        form = MapCsvFieldsForm()
        
        try:
            # Get parsed data from session
            complete_csv_data = session.get('complete_csv_data')
            batch_id = int(session.get('batch_id'))
            csv_headers = session.get('csv_headers')
            
            if not complete_csv_data:
                flash('CSV data not found. Please reupload.', 'danger')
                return redirect(url_for('upload_students_csv'))
            
            # Parse mapping from form
            mapping = {}
            for i, csv_header in enumerate(csv_headers):
                field_name = request.form.get(f'mapping_{i}')
                if field_name:
                    mapping[csv_header] = field_name
            
            if not mapping:
                flash('Please map at least one CSV column to a student field.', 'danger')
                return redirect(url_for('upload_students_csv'))
            
            # Process CSV data and create students directly from session data
            students = []
            for row in complete_csv_data:
                student_data = {'batchId': batch_id}
                
                for csv_header, field_name in mapping.items():
                    if csv_header in row:
                        value = row[csv_header].strip() if row[csv_header] else ''
                        # Convert PascalCase field names to camelCase
                        camel_case_field = field_name[0].lower() + field_name[1:] if len(field_name) > 0 else field_name
                        # Ensure specific fields are properly mapped
                        if camel_case_field == 'nICNo':
                            camel_case_field = 'nicNo'
                        elif camel_case_field == 'mISNo':
                            camel_case_field = 'misNo'
                        student_data[camel_case_field] = value
            
                # Set default values for required fields that might not be mapped
                if 'misNo' not in student_data or not student_data['misNo']:
                    import uuid
                    student_data['misNo'] = f"ST-{uuid.uuid4().hex[:8]}"
            
                if 'nameWithInitials' not in student_data or not student_data['nameWithInitials']:
                    if 'fullName' in student_data and student_data['fullName']:
                        student_data['nameWithInitials'] = student_data['fullName'].split()[0] if ' ' in student_data['fullName'] else student_data['fullName']
                    else:
                        student_data['nameWithInitials'] = ''
            
                if 'fullName' not in student_data or not student_data['fullName']:
                    if 'nameWithInitials' in student_data and student_data['nameWithInitials']:
                        student_data['fullName'] = student_data['nameWithInitials']
                    else:
                        student_data['fullName'] = ''
            
                if 'nicNo' not in student_data or not student_data['nicNo']:
                    student_data['nicNo'] = ''
            
                if 'gender' not in student_data or not student_data['gender']:
                    student_data['gender'] = 'Male'
            
                if 'address' not in student_data or not student_data['address']:
                    student_data['address'] = ''
            
                if 'telephone' not in student_data or not student_data['telephone']:
                    student_data['telephone'] = ''
            
                if 'email' not in student_data or not student_data['email']:
                    if 'misNo' in student_data:
                        student_data['email'] = f"{student_data['misNo']}@example.com"
                    else:
                        student_data['email'] = ''
            
                if 'gsDivision' not in student_data or not student_data['gsDivision']:
                    student_data['gsDivision'] = 'Unknown'
            
                if 'agDivision' not in student_data or not student_data['agDivision']:
                    student_data['agDivision'] = 'Unknown'
            
                # Cleanup and normalize data
                if 'gender' in student_data:
                    student_data['gender'] = student_data['gender'].capitalize()
                if 'email' in student_data and student_data['email'] and '@' not in student_data['email']:
                    student_data['email'] = f"{student_data['email']}@example.com"
            
                students.append(student_data)
            
            if students:
                # Send to API using CreateStudent endpoint (loop through each student)
                success_count = 0
                failed_count = 0
                errors = []
            
                for student in students:
                    response = api_request('POST', 'students', data=student)
                    if response and response.status_code == 201:
                        success_count += 1
                    else:
                        failed_count += 1
                        error_msg = 'Unknown error'
                        if response:
                            try:
                                error_msg = response.json().get('message', error_msg)
                            except:
                                error_msg = f"HTTP {response.status_code}"
                        errors.append(f"{student.get('misNo', 'Unknown')}: {error_msg}")
            
                # Show detailed results
                flash(f'Successfully imported {success_count} out of {len(students)} students', 'success')
                if failed_count > 0:
                    flash(f'Failed to import {failed_count} students. Check logs for details.', 'danger')
                    # Log errors
                    for error in errors:
                        print(f"Import Error: {error}")
                else:
                    flash('No valid student data found in CSV', 'warning')
            
                # Cleanup session
                session.pop('complete_csv_data', None)
                session.pop('csv_headers', None)
                session.pop('batch_id', None)
                session.pop('auto_mapping', None)
            
                # Redirect to students list
                return redirect(url_for('students'))
        except Exception as e:
            flash(f'Error importing students: {str(e)}', 'danger')
            print(f"Import Error Details: {str(e)}")
            # Cleanup session
            session.pop('complete_csv_data', None)
            session.pop('csv_headers', None)
            session.pop('batch_id', None)
            session.pop('auto_mapping', None)
            return redirect(url_for('upload_students_csv'))


@app.route('/courses/<int:id>/edit', methods=['GET', 'POST'])
def edit_course(id):
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    # Get course details
    course_response = api_request('GET', f'courses/{id}')
    
    if not course_response or course_response.status_code != 200:
        flash('Course not found', 'danger')
        return redirect(url_for('courses'))
    
    course = course_response.json()
    
    # Fetch centers from API
    centers_response = api_request('GET', 'centers')
    centers = centers_response.json() if (centers_response and centers_response.status_code == 200) else []
    
    form = CreateCourseForm(data={
        'courseName': course['courseName'],
        'description': course['description'],
        'duration': course['duration'],
        'courseFee': course['courseFee'],
        'centerId': course['centerId']
    })
    form.centerId.choices = [(center['centerId'], center['centerName']) for center in centers]
    
    if form.validate_on_submit():
        data = {
            'courseName': form.courseName.data,
            'description': form.description.data,
            'duration': form.duration.data,
            'courseFee': form.courseFee.data,
            'centerId': form.centerId.data
        }
        
        response = api_request('PUT', f'courses/{id}', data=data)
        
        if response and response.status_code == 200:
            flash('Course updated successfully!', 'success')
            return redirect(url_for('courses'))
        else:
            error_msg = 'Failed to update course'
            if response:
                try:
                    error_msg = response.json().get('message', error_msg)
                except:
                    pass
            flash(error_msg, 'danger')
    
    return render_template('edit_course.html', form=form, course=course, centers=centers)

@app.route('/courses/<int:id>/details')
def course_details(id):
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    # Get course details
    course_response = api_request('GET', f'courses/{id}')
    if not course_response or course_response.status_code != 200:
        flash('Course not found', 'danger')
        return redirect(url_for('courses'))
    course = course_response.json()
    
    # Get all instructors
    instructors_response = api_request('GET', 'instructors')
    instructors = instructors_response.json() if (instructors_response and instructors_response.status_code == 200) else []
    
    # Get all batches
    batches_response = api_request('GET', 'batches')
    batches = batches_response.json() if (batches_response and batches_response.status_code == 200) else []
    
    # Filter instructors and batches associated with this course
    course_instructors = []
    if course.get('instructorIds'):
        course_instructors = [instructor for instructor in instructors if instructor['instructorId'] in course['instructorIds']]
    
    course_batches = []
    if course.get('batchIds'):
        course_batches = [batch for batch in batches if batch['batchId'] in course['batchIds']]
    
    # Calculate enrollment statistics for each batch
    students_response = api_request('GET', 'students')
    students = students_response.json() if (students_response and students_response.status_code == 200) else []
    
    for batch in course_batches:
        batch['enrollment_count'] = len([student for student in students if student['batchId'] == batch['batchId']])
    
    return render_template('course_details.html', 
                         course=course, 
                         instructors=course_instructors,
                         batches=course_batches)


@app.route('/courses/<int:id>/delete', methods=['POST'])
def delete_course(id):
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    # Validate CSRF token
    from flask_wtf.csrf import validate_csrf
    from wtforms.validators import ValidationError
    try:
        validate_csrf(request.form.get('csrf_token'))
    except ValidationError:
        flash('CSRF token is invalid. Please try again.', 'danger')
        return redirect(url_for('courses'))
    
    response = api_request('DELETE', f'courses/{id}')
    
    if response and response.status_code == 200:
        flash('Course deleted successfully!', 'success')
    else:
        error_msg = 'Failed to delete course'
        if response:
            try:
                error_msg = response.json().get('message', error_msg)
            except:
                pass
        flash(error_msg, 'danger')
    
    return redirect(url_for('courses'))

# ==================== Batches Routes ====================

@app.route('/batches')
def batches():
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    response = api_request('GET', 'batches')
    
    if response and response.status_code == 200:
        batches = response.json()
    else:
        batches = []
        flash('Failed to load batches', 'danger')
    
    return render_template('batches.html', batches=batches)

@app.route('/batches/create', methods=['GET', 'POST'])
def create_batch():
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    # Fetch courses from API
    courses_response = api_request('GET', 'courses')
    courses = courses_response.json() if (courses_response and courses_response.status_code == 200) else []
    
    form = CreateBatchForm()
    form.courseId.choices = [(course['courseId'], course['courseName']) for course in courses]
    
    if form.validate_on_submit():
        data = {
            'batchCode': form.batchCode.data,
            'courseId': form.courseId.data,
            'startDate': form.startDate.data,
            'endDate': form.endDate.data,
            'duration': form.duration.data
        }
        
        response = api_request('POST', 'batches', data=data)
        
        if response and response.status_code == 201:
            flash('Batch created successfully!', 'success')
            return redirect(url_for('batches'))
        else:
            error_msg = 'Failed to create batch'
            if response:
                try:
                    error_msg = response.json().get('message', error_msg)
                except:
                    pass
            flash(error_msg, 'danger')
    
    import datetime
    today_str = datetime.date.today().strftime('%Y-%m-%d')
    return render_template('create_batch.html', form=form, courses=courses, today_str=today_str)

@app.route('/batches/<int:id>/edit', methods=['GET', 'POST'])
def edit_batch(id):
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    # Get batch details
    batch_response = api_request('GET', f'batches/{id}')
    
    if not batch_response or batch_response.status_code != 200:
        flash('Batch not found', 'danger')
        return redirect(url_for('batches'))
    
    batch = batch_response.json()
    
    # Fetch courses from API
    courses_response = api_request('GET', 'courses')
    courses = courses_response.json() if (courses_response and courses_response.status_code == 200) else []
    
    # Format dates to YYYY-MM-DD for HTML date input
    start_date_str = batch['startDate'].split('T')[0] if 'T' in batch['startDate'] else batch['startDate']
    end_date_str = batch['endDate'].split('T')[0] if 'T' in batch['endDate'] else batch['endDate']
    
    form = CreateBatchForm(data={
        'batchCode': batch['batchCode'],
        'courseId': batch['courseId'],
        'startDate': start_date_str,
        'endDate': end_date_str,
        'duration': batch['duration']
    })
    form.courseId.choices = [(course['courseId'], course['courseName']) for course in courses]
    
    if form.validate_on_submit():
        data = {
            'batchCode': form.batchCode.data,
            'courseId': form.courseId.data,
            'startDate': form.startDate.data,
            'endDate': form.endDate.data,
            'duration': form.duration.data
        }
        
        response = api_request('PUT', f'batches/{id}', data=data)
        
        if response and response.status_code == 200:
            flash('Batch updated successfully!', 'success')
            return redirect(url_for('batches'))
        else:
            error_msg = 'Failed to update batch'
            if response:
                try:
                    error_msg = response.json().get('message', error_msg)
                except:
                    pass
            flash(error_msg, 'danger')
    
    import datetime
    today_str = datetime.date.today().strftime('%Y-%m-%d')
    return render_template('edit_batch.html', form=form, batch=batch, courses=courses, today_str=today_str)

@app.route('/batches/<int:id>/delete', methods=['POST'])
def delete_batch(id):
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    # Validate CSRF token
    from flask_wtf.csrf import validate_csrf
    from wtforms.validators import ValidationError
    try:
        validate_csrf(request.form.get('csrf_token'))
    except ValidationError:
        flash('CSRF token is invalid. Please try again.', 'danger')
        return redirect(url_for('batches'))
    
    response = api_request('DELETE', f'batches/{id}')
    
    if response and response.status_code == 200:
        flash('Batch deleted successfully!', 'success')
    else:
        error_msg = 'Failed to delete batch'
        if response:
            try:
                error_msg = response.json().get('message', error_msg)
            except:
                pass
        flash(error_msg, 'danger')
    
    return redirect(url_for('batches'))

# ==================== Centers Routes ====================

@app.route('/centers')
def centers():
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    response = api_request('GET', 'centers')
    
    if response and response.status_code == 200:
        centers = response.json()
    else:
        centers = []
        flash('Failed to load centers', 'danger')
    
    return render_template('centers.html', centers=centers)

@app.route('/centers/create', methods=['GET', 'POST'])
def create_center():
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    # Fetch districts from API
    districts_response = api_request('GET', 'districts')
    districts = districts_response.json() if (districts_response and districts_response.status_code == 200) else []
    
    form = CreateCenterForm()
    form.districtId.choices = [(district['districtId'], district['districtName']) for district in districts]
    
    if form.validate_on_submit():
        data = {
            'centerName': form.centerName.data,
            'address': form.address.data,
            'contactNumber': form.contactNumber.data,
            'districtId': form.districtId.data
        }
        
        response = api_request('POST', 'centers', data=data)
        
        if response and response.status_code == 201:
            flash('Center created successfully!', 'success')
            return redirect(url_for('centers'))
        else:
            error_msg = 'Failed to create center'
            if response:
                try:
                    error_msg = response.json().get('message', error_msg)
                except:
                    pass
            flash(error_msg, 'danger')
    
    return render_template('create_center.html', form=form, districts=districts)

@app.route('/centers/<int:id>/edit', methods=['GET', 'POST'])
def edit_center(id):
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    # Get center details
    center_response = api_request('GET', f'centers/{id}')
    
    if not center_response or center_response.status_code != 200:
        flash('Center not found', 'danger')
        return redirect(url_for('centers'))
    
    center = center_response.json()
    
    # Fetch districts from API
    districts_response = api_request('GET', 'districts')
    districts = districts_response.json() if (districts_response and districts_response.status_code == 200) else []
    
    form = CreateCenterForm(data={
        'centerName': center['centerName'],
        'address': center['address'],
        'contactNumber': center['contactNumber'],
        'districtId': center['districtId']
    })
    form.districtId.choices = [(district['districtId'], district['districtName']) for district in districts]
    
    if form.validate_on_submit():
        data = {
            'centerName': form.centerName.data,
            'address': form.address.data,
            'contactNumber': form.contactNumber.data,
            'districtId': form.districtId.data
        }
        
        response = api_request('PUT', f'centers/{id}', data=data)
        
        if response and response.status_code == 200:
            flash('Center updated successfully!', 'success')
            return redirect(url_for('centers'))
        else:
            error_msg = 'Failed to update center'
            if response:
                try:
                    error_msg = response.json().get('message', error_msg)
                except:
                    pass
            flash(error_msg, 'danger')
    
    return render_template('edit_center.html', form=form, center=center, districts=districts)

@app.route('/centers/<int:id>/delete', methods=['POST'])
def delete_center(id):
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    # Validate CSRF token
    from flask_wtf.csrf import validate_csrf
    from wtforms.validators import ValidationError
    try:
        validate_csrf(request.form.get('csrf_token'))
    except ValidationError:
        flash('CSRF token is invalid. Please try again.', 'danger')
        return redirect(url_for('centers'))
    
    response = api_request('DELETE', f'centers/{id}')
    
    if response and response.status_code == 200:
        flash('Center deleted successfully!', 'success')
    else:
        error_msg = 'Failed to delete center'
        if response:
            try:
                error_msg = response.json().get('message', error_msg)
            except:
                pass
        flash(error_msg, 'danger')
    
    return redirect(url_for('centers'))

# ==================== Instructors Routes ====================

@app.route('/instructors')
def instructors():
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    response = api_request('GET', 'instructors')
    
    if response and response.status_code == 200:
        instructors = response.json()
    else:
        instructors = []
        flash('Failed to load instructors', 'danger')
    
    return render_template('instructors.html', instructors=instructors)

@app.route('/instructors/create', methods=['GET', 'POST'])
def create_instructor():
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    form = CreateInstructorForm()
    
    if form.validate_on_submit():
        data = {
            'epfNo': form.EPFNo.data,
            'fullName': form.FullName.data,
            'nic': form.NIC.data,
            'email': form.Email.data,
            'phone': form.Phone.data
        }
        
        response = api_request('POST', 'instructors', data=data)
        
        if response and response.status_code == 201:
            flash('Instructor created successfully!', 'success')
            return redirect(url_for('instructors'))
        else:
            error_msg = 'Failed to create instructor'
            if response:
                try:
                    error_msg = response.json().get('message', error_msg)
                except:
                    pass
            flash(error_msg, 'danger')
    
    return render_template('create_instructor.html', form=form)

@app.route('/instructors/<int:id>/edit', methods=['GET', 'POST'])
def edit_instructor(id):
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    # Get instructor details
    instructor_response = api_request('GET', f'instructors/{id}')
    
    if not instructor_response or instructor_response.status_code != 200:
        flash('Instructor not found', 'danger')
        return redirect(url_for('instructors'))
    
    instructor = instructor_response.json()
    
    form = CreateInstructorForm(data={
        'EPFNo': instructor['epfNo'],
        'FullName': instructor['fullName'],
        'NIC': instructor['nic'],
        'Email': instructor['email'],
        'Phone': instructor['phone']
    })
    
    if form.validate_on_submit():
        data = {
            'epfNo': form.EPFNo.data,
            'fullName': form.FullName.data,
            'nic': form.NIC.data,
            'email': form.Email.data,
            'phone': form.Phone.data
        }
        
        response = api_request('PUT', f'instructors/{id}', data=data)
        
        if response and response.status_code == 200:
            flash('Instructor updated successfully!', 'success')
            return redirect(url_for('instructors'))
        else:
            error_msg = 'Failed to update instructor'
            if response:
                try:
                    error_msg = response.json().get('message', error_msg)
                except:
                    pass
            flash(error_msg, 'danger')
    
    return render_template('edit_instructor.html', form=form, instructor=instructor)

@app.route('/instructors/<int:id>/delete', methods=['POST'])
def delete_instructor(id):
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    # Validate CSRF token
    from flask_wtf.csrf import validate_csrf
    from wtforms.validators import ValidationError
    try:
        validate_csrf(request.form.get('csrf_token'))
    except ValidationError:
        flash('CSRF token is invalid. Please try again.', 'danger')
        return redirect(url_for('instructors'))
    
    response = api_request('DELETE', f'instructors/{id}')
    
    if response and response.status_code == 200:
        flash('Instructor deleted successfully!', 'success')
    else:
        error_msg = 'Failed to delete instructor'
        if response:
            try:
                error_msg = response.json().get('message', error_msg)
            except:
                pass
        flash(error_msg, 'danger')
    
    return redirect(url_for('instructors'))

# ==================== Course-Instructor Routes ====================

@app.route('/course-instructors')
def course_instructors():
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    response = api_request('GET', 'courseinstructors')
    
    if response and response.status_code == 200:
        course_instructors = response.json()
    else:
        course_instructors = []
        flash('Failed to load course-instructor relationships', 'danger')
    
    return render_template('course_instructors.html', course_instructors=course_instructors)

@app.route('/course-instructors/create', methods=['GET', 'POST'])
def create_course_instructor():
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    # Get all courses and instructors
    courses_response = api_request('GET', 'courses')
    instructors_response = api_request('GET', 'instructors')
    
    courses = courses_response.json() if (courses_response and courses_response.status_code == 200) else []
    instructors = instructors_response.json() if (instructors_response and instructors_response.status_code == 200) else []
    
    form = CreateCourseInstructorForm()
    form.CourseId.choices = [(course['courseId'], course['courseName']) for course in courses]
    form.InstructorId.choices = [(instructor['instructorId'], instructor['fullName']) for instructor in instructors]
    
    if form.validate_on_submit():
        data = {
            'courseId': form.CourseId.data,
            'instructorId': form.InstructorId.data
        }
        
        response = api_request('POST', 'courseinstructors', data=data)
        
        if response and response.status_code == 201:
            flash('Instructor assigned to course successfully!', 'success')
            return redirect(url_for('course_instructors'))
        else:
            error_msg = 'Failed to assign instructor to course'
            if response:
                try:
                    error_msg = response.json().get('message', error_msg)
                except:
                    pass
            flash(error_msg, 'danger')
    
    return render_template('create_course_instructor.html', form=form, courses=courses, instructors=instructors)

@app.route('/course-instructors/<int:course_id>/<int:instructor_id>/delete', methods=['POST'])
def delete_course_instructor(course_id, instructor_id):
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    # Validate CSRF token
    from flask_wtf.csrf import validate_csrf
    from wtforms.validators import ValidationError
    try:
        validate_csrf(request.form.get('csrf_token'))
    except ValidationError:
        flash('CSRF token is invalid. Please try again.', 'danger')
        return redirect(url_for('course_instructors'))
    
    response = api_request('DELETE', f'courseinstructors/{course_id}/{instructor_id}')
    
    if response and response.status_code == 200:
        flash('Course-instructor relationship deleted successfully!', 'success')
    else:
        error_msg = 'Failed to delete course-instructor relationship'
        if response:
            try:
                error_msg = response.json().get('message', error_msg)
            except:
                pass
        flash(error_msg, 'danger')
    
    return redirect(url_for('course_instructors'))

# ==================== Students Routes ====================

@app.route('/students')
@app.route('/students/<int:batch_id>')
def students(batch_id=None):
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    # Get all students
    students_response = api_request('GET', 'students')
    students = students_response.json() if (students_response and students_response.status_code == 200) else []
    
    # Get all batches
    batches_response = api_request('GET', 'batches')
    batches = batches_response.json() if (batches_response and batches_response.status_code == 200) else []
    
    # Filter students by batch if batch_id is provided
    filtered_students = []
    selected_batch = None
    
    if batch_id:
        filtered_students = [student for student in students if student['batchId'] == batch_id]
        selected_batch = next((batch for batch in batches if batch['batchId'] == batch_id), None)
    else:
        # If no batch selected, show students from first batch (if available)
        if batches:
            batch_id = batches[0]['batchId']
            filtered_students = [student for student in students if student['batchId'] == batch_id]
            selected_batch = batches[0]
    
    return render_template('students.html', 
                         students=filtered_students,
                         batches=batches,
                         selected_batch=selected_batch)

@app.route('/students/create', methods=['GET', 'POST'])
def create_student():
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    # Fetch batches from API to populate dropdown
    batches_response = api_request('GET', 'batches')
    batches = batches_response.json() if (batches_response and batches_response.status_code == 200) else []
    
    form = CreateStudentForm()
    form.BatchId.choices = [(batch['batchId'], batch['batchCode']) for batch in batches]
    
    if form.validate_on_submit():
        data = {
            'misNo': form.MISNo.data,
            'nameWithInitials': form.NameWithInitials.data,
            'fullName': form.FullName.data,
            'nicNo': form.NICNo.data,
            'gender': form.Gender.data,
            'address': form.Address.data,
            'telephone': form.Telephone.data,
            'email': form.Email.data,
            'batchId': form.BatchId.data,
            'gsDivision': form.GSDivision.data,
            'agDivision': form.AGDivision.data
        }
        
        response = api_request('POST', 'students', data=data)
        
        if response and response.status_code == 201:
            flash('Student created successfully!', 'success')
            return redirect(url_for('students'))
        else:
            error_msg = 'Failed to create student'
            if response:
                try:
                    error_msg = response.json().get('message', error_msg)
                except:
                    pass
            flash(error_msg, 'danger')
    
    return render_template('create_student.html', form=form, batches=batches)

@app.route('/students/<int:id>/edit', methods=['GET', 'POST'])
def edit_student(id):
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    # Get student details
    student_response = api_request('GET', f'students/{id}')
    
    if not student_response or student_response.status_code != 200:
        flash('Student not found', 'danger')
        return redirect(url_for('students'))
    
    student = student_response.json()
    
    # Fetch batches from API to populate dropdown
    batches_response = api_request('GET', 'batches')
    batches = batches_response.json() if (batches_response and batches_response.status_code == 200) else []
    
    form = CreateStudentForm(data={
        'MISNo': student.get('misNo', ''),
        'NameWithInitials': student.get('nameWithInitials', ''),
        'FullName': student.get('fullName', ''),
        'NICNo': student.get('nicNo', ''),
        'Gender': student.get('gender', ''),
        'Address': student.get('address', ''),
        'Telephone': student.get('telephone', ''),
        'Email': student.get('email', ''),
        'BatchId': student.get('batchId', 0),
        'GSDivision': student.get('gsDivision', ''),
        'AGDivision': student.get('agDivision', '')
    })
    form.BatchId.choices = [(batch['batchId'], batch['batchCode']) for batch in batches]
    
    if form.validate_on_submit():
        data = {
            'misNo': form.MISNo.data,
            'nameWithInitials': form.NameWithInitials.data,
            'fullName': form.FullName.data,
            'nicNo': form.NICNo.data,
            'gender': form.Gender.data,
            'address': form.Address.data,
            'telephone': form.Telephone.data,
            'email': form.Email.data,
            'batchId': form.BatchId.data,
            'gsDivision': form.GSDivision.data,
            'agDivision': form.AGDivision.data
        }
        
        response = api_request('PUT', f'students/{id}', data=data)
        
        if response and response.status_code == 200:
            flash('Student updated successfully!', 'success')
            return redirect(url_for('students'))
        else:
            error_msg = 'Failed to update student'
            if response:
                try:
                    error_msg = response.json().get('message', error_msg)
                except:
                    pass
            flash(error_msg, 'danger')
    
    return render_template('edit_student.html', form=form, student=student)

@app.route('/students/<int:id>/continuous-assessment', methods=['GET', 'POST'])
def student_continuous_assessment(id):
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    # Get student details
    student_response = api_request('GET', f'students/{id}')
    if not student_response or student_response.status_code != 200:
        flash('Student not found', 'danger')
        return redirect(url_for('students'))
    student = student_response.json()
    
    # Get all module tasks (assuming tasks are associated with course via batch)
    tasks_response = api_request('GET', 'moduletasks')
    tasks = []
    if tasks_response and tasks_response.status_code == 200:
        tasks = tasks_response.json()
    else:
        flash('Failed to load module tasks', 'warning')
    
    # Get existing assessments for this student
    assessments_response = api_request('GET', f'continuousassessments/student/{id}')
    assessments = []
    if assessments_response and assessments_response.status_code == 200:
        assessments = assessments_response.json()
    else:
        flash('Failed to load existing assessments', 'warning')
    
    # Create a dictionary for quick lookup of existing assessments
    assessment_dict = {assess['moduleTaskId']: assess for assess in assessments}
    
    from flask_wtf import FlaskForm
    class AssessmentForm(FlaskForm):
        pass
    
    form = AssessmentForm()
    
    if request.method == 'POST':
        # Validate CSRF token
        from flask_wtf.csrf import validate_csrf
        from wtforms.validators import ValidationError
        try:
            validate_csrf(request.form.get('csrf_token'))
        except ValidationError:
            flash('CSRF token is invalid. Please try again.', 'danger')
            return redirect(url_for('student_continuous_assessment', id=id))
        # Process form submission
        for task in tasks:
            task_id = task['id']
            assessment_mark = request.form.get(f'assessment_mark_{task_id}')
            assessment_date = request.form.get(f'assessment_date_{task_id}')
            assessor_notes = request.form.get(f'assessor_notes_{task_id}')
            
            if assessment_mark:
                # Check if assessment exists
                existing_assessment = assessment_dict.get(task_id)
                
                data = {
                    'assessmentMark': assessment_mark,
                    'assessmentDate': assessment_date if assessment_date else None,
                    'assessorNotes': assessor_notes if assessor_notes else None
                }
                
                if existing_assessment:
                    # Update existing assessment
                    response = api_request('PUT', f'continuousassessments/{existing_assessment["id"]}', data=data)
                else:
                    # Create new assessment
                    create_data = {
                        'studentId': id,
                        'moduleTaskId': task_id,
                        'assessmentMark': assessment_mark,
                        'assessmentDate': assessment_date if assessment_date else None,
                        'assessorNotes': assessor_notes if assessor_notes else None
                    }
                    response = api_request('POST', 'continuousassessments', data=create_data)
                
                if response and response.status_code not in [200, 201]:
                    flash(f'Failed to save assessment for task {task["taskNo"]}', 'danger')
        
        flash('Continuous assessment marks saved successfully!', 'success')
        return redirect(url_for('student_continuous_assessment', id=id))
    
    return render_template('student_continuous_assessment.html', 
                         student=student, 
                         tasks=tasks, 
                         assessment_dict=assessment_dict,
                         assessments=assessments,
                         form=form)

# AJAX endpoint for loading module tasks
@app.route('/students/<int:student_id>/continuous-assessment/tasks', methods=['GET'])
@csrf.exempt
def get_student_assessment_tasks(student_id):
    if 'access_token' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    # Get all module tasks
    tasks_response = api_request('GET', 'moduletasks')
    if not tasks_response or tasks_response.status_code != 200:
        return jsonify({'error': 'Failed to load module tasks'}), 500
    tasks = tasks_response.json()
    
    # Create task lookup for save endpoint
    task_lookup = {task['id']: task for task in tasks}
    
    # Get existing assessments for this student
    assessments_response = api_request('GET', f'continuousassessments/student/{student_id}')
    assessments = []
    if assessments_response and assessments_response.status_code == 200:
        assessments = assessments_response.json()
    
    # Create a task lookup dict for merging with assessments
    task_lookup = {task['id']: task for task in tasks}
    
    # Merge task details into assessments
    enriched_assessments = []
    for assess in assessments:
        task_info = task_lookup.get(assess['moduleTaskId'], {})
        assess['taskNo'] = task_info.get('taskNo', 'N/A')
        assess['taskName'] = task_info.get('taskName', 'N/A')
        assess['moduleNo'] = task_info.get('moduleNo', 'N/A')
        assess['moduleName'] = task_info.get('moduleName', 'N/A')
        enriched_assessments.append(assess)
    
    # Create assessment lookup dict with enriched data
    assessment_dict = {assess['moduleTaskId']: assess for assess in enriched_assessments}
    
    # Group tasks by module
    modules = {}
    for task in tasks:
        module_no = task.get('moduleNo', 'Unknown')
        if module_no not in modules:
            modules[module_no] = {
                'moduleNo': module_no,
                'moduleName': task.get('moduleName', 'Unknown Module'),
                'tasks': []
            }
        modules[module_no]['tasks'].append({
            'id': task['id'],
            'taskNo': task['taskNo'],
            'taskName': task['taskName'],
            'assessment': assessment_dict.get(task['id'])
        })
    
    return jsonify({
        'tasks': list(modules.values()),
        'assessment_dict': assessment_dict
    })

# AJAX endpoint for saving a single assessment
@app.route('/students/<int:student_id>/continuous-assessment/save', methods=['POST'])
@csrf.exempt
def save_student_assessment(student_id):
    if 'access_token' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        task_id = data.get('taskId')
        assessment_mark = data.get('assessmentMark')
        assessment_date = data.get('assessmentDate')
        assessor_notes = data.get('assessorNotes')
        
        if not task_id or not assessment_mark:
            return jsonify({'error': 'Task ID and assessment mark are required'}), 400
        
        # Get task details for later use
        tasks_response = api_request('GET', 'moduletasks')
        task_lookup = {}
        if tasks_response and tasks_response.status_code == 200:
            tasks = tasks_response.json()
            task_lookup = {task['id']: task for task in tasks}
        
        # Check if assessment already exists
        assessments_response = api_request('GET', f'continuousassessments/student/{student_id}')
        existing_assessment = None
        if assessments_response and assessments_response.status_code == 200:
            assessments = assessments_response.json()
            # Convert task_id to int for comparison
            task_id_int = int(task_id) if isinstance(task_id, str) else task_id
            for assess in assessments:
                if assess['moduleTaskId'] == task_id_int:
                    existing_assessment = assess
                    break
        
        if existing_assessment:
            # Update existing assessment
            update_data = {
                'assessmentMark': assessment_mark,
                'assessmentDate': assessment_date if assessment_date else None,
                'assessorNotes': assessor_notes if assessor_notes else None
            }
            response = api_request('PUT', f'continuousassessments/{existing_assessment["id"]}', data=update_data)
            if response and response.status_code == 200:
                # Add task details to response
                task_info = task_lookup.get(int(task_id), {})
                existing_assessment['taskNo'] = task_info.get('taskNo', 'N/A')
                existing_assessment['taskName'] = task_info.get('taskName', 'N/A')
                existing_assessment['moduleNo'] = task_info.get('moduleNo', 'N/A')
                return jsonify({'message': 'Assessment updated successfully', 'assessment': existing_assessment})
            else:
                return jsonify({'error': 'Failed to update assessment'}), 500
        else:
            # Create new assessment
            create_data = {
                'studentId': student_id,
                'moduleTaskId': int(task_id) if isinstance(task_id, str) else task_id,
                'assessmentMark': assessment_mark,
                'assessmentDate': assessment_date if assessment_date else None,
                'assessorNotes': assessor_notes if assessor_notes else None
            }
            response = api_request('POST', 'continuousassessments', data=create_data)
            if response and response.status_code in [200, 201]:
                new_assessment = response.json()
                # Add task details to response
                task_info = task_lookup.get(int(task_id), {})
                new_assessment['taskNo'] = task_info.get('taskNo', 'N/A')
                new_assessment['taskName'] = task_info.get('taskName', 'N/A')
                new_assessment['moduleNo'] = task_info.get('moduleNo', 'N/A')
                return jsonify({'message': 'Assessment saved successfully', 'assessment': new_assessment})
            else:
                return jsonify({'error': 'Failed to save assessment'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/students/<int:id>/delete', methods=['POST'])
def delete_student(id):
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    # Validate CSRF token
    from flask_wtf.csrf import validate_csrf
    from wtforms.validators import ValidationError
    try:
        validate_csrf(request.form.get('csrf_token'))
    except ValidationError:
        flash('CSRF token is invalid. Please try again.', 'danger')
        return redirect(url_for('students'))
    
    response = api_request('DELETE', f'students/{id}')
    
    if response and response.status_code == 200:
        flash('Student deleted successfully!', 'success')
    else:
        error_msg = 'Failed to delete student'
        if response:
            try:
                error_msg = response.json().get('message', error_msg)
            except:
                pass
        flash(error_msg, 'danger')
    
    return redirect(url_for('students'))

if __name__ == '__main__':
    app.run(debug=True, port=5000)
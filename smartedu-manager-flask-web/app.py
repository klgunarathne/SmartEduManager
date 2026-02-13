from flask import Flask, render_template, redirect, url_for, flash, request, session, jsonify
from flask_wtf import FlaskForm
from flask_wtf.csrf import CSRFProtect
from wtforms import StringField, PasswordField, SubmitField, IntegerField, SelectField, DecimalField
from wtforms.validators import InputRequired, Email, Length
import requests
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
app.config['API_BASE_URL'] = os.getenv('API_BASE_URL', 'https://localhost:7160/api')
CSRFProtect(app)

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
    fullName = StringField('Full Name', validators=[InputRequired(), Length(max=100)])
    email = StringField('Email', validators=[InputRequired(), Email(), Length(max=120)])
    contactNumber = StringField('Contact Number', validators=[InputRequired(), Length(max=20)])
    batchId = IntegerField('Batch ID', validators=[InputRequired()])
    submit = SubmitField('Create Student')

class CreateCourseInstructorForm(FlaskForm):
    CourseId = SelectField('Course', validators=[InputRequired()], coerce=int)
    InstructorId = SelectField('Instructor', validators=[InputRequired()], coerce=int)
    submit = SubmitField('Assign Instructor')

# ==================== Helper Functions ====================

def get_auth_headers():
    if 'access_token' in session:
        return {'Authorization': f'Bearer {session["access_token"]}'}
    return {}

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
def students():
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    response = api_request('GET', 'students')
    
    if response and response.status_code == 200:
        students = response.json()
    else:
        students = []
        flash('Failed to load students', 'danger')
    
    return render_template('students.html', students=students)

@app.route('/students/create', methods=['GET', 'POST'])
def create_student():
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    form = CreateStudentForm()
    
    if form.validate_on_submit():
        data = {
            'fullName': form.fullName.data,
            'email': form.email.data,
            'contactNumber': form.contactNumber.data,
            'batchId': form.batchId.data
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
    
    return render_template('create_student.html', form=form)

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
    
    form = CreateStudentForm(data={
        'fullName': student['fullName'],
        'email': student['email'],
        'contactNumber': student['contactNumber'],
        'batchId': student['batchId']
    })
    
    if form.validate_on_submit():
        data = {
            'fullName': form.fullName.data,
            'email': form.email.data,
            'contactNumber': form.contactNumber.data,
            'batchId': form.batchId.data
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

@app.route('/students/<int:id>/delete', methods=['POST'])
def delete_student(id):
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
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
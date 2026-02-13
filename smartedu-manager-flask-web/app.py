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
    batchName = StringField('Batch Name', validators=[InputRequired(), Length(max=100)])
    courseId = SelectField('Course', validators=[InputRequired()], coerce=int)
    startDate = StringField('Start Date', validators=[InputRequired()])
    endDate = StringField('End Date', validators=[InputRequired()])
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
def dashboard():
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    # Get data for dashboard
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
    
    return render_template('dashboard.html', 
                         total_students=total_students,
                         active_instructors=active_instructors,
                         courses_offered=courses_offered,
                         active_batches=active_batches,
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
    else:
        courses = []
        flash('Failed to load courses', 'danger')
    
    return render_template('courses.html', courses=courses)

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
            'batchName': form.batchName.data,
            'courseId': form.courseId.data,
            'startDate': form.startDate.data,
            'endDate': form.endDate.data
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
    
    return render_template('create_batch.html', form=form, courses=courses)

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
    
    form = CreateBatchForm(data={
        'batchName': batch['batchName'],
        'courseId': batch['courseId'],
        'startDate': batch['startDate'],
        'endDate': batch['endDate']
    })
    form.courseId.choices = [(course['courseId'], course['courseName']) for course in courses]
    
    if form.validate_on_submit():
        data = {
            'batchName': form.batchName.data,
            'courseId': form.courseId.data,
            'startDate': form.startDate.data,
            'endDate': form.endDate.data
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
    
    return render_template('edit_batch.html', form=form, batch=batch, courses=courses)

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
            'EPFNo': form.EPFNo.data,
            'FullName': form.FullName.data,
            'NIC': form.NIC.data,
            'Email': form.Email.data,
            'Phone': form.Phone.data
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
            'EPFNo': form.EPFNo.data,
            'FullName': form.FullName.data,
            'NIC': form.NIC.data,
            'Email': form.Email.data,
            'Phone': form.Phone.data
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
    form.CourseId.choices = [(course['CourseId'], course['CourseName']) for course in courses]
    form.InstructorId.choices = [(instructor['InstructorId'], instructor['FullName']) for instructor in instructors]
    
    if form.validate_on_submit():
        data = {
            'CourseId': form.CourseId.data,
            'InstructorId': form.InstructorId.data
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
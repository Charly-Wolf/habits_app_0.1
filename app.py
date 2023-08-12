from flask import Flask, request, jsonify, render_template, make_response
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from flask import make_response
from flask import redirect, url_for

app = Flask(__name__)
app.config['SECRET_KEY'] = "P@ssW0rd#"

#LOCAL DB (FOR TESTING):
#app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'

#RENDER ONLINE DB (FOR TESTING):
#app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://test_db_7vup_user:vN2FuqTTQv3Eng3LmcnYBW4ii6PkuxYE@dpg-cjb50c3bq8nc73bmg13g-a.oregon-postgres.render.com/test_db_7vup'

#RENDER ONLINE DB PRODUCTION!!:
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://test_db_7vup_user:vN2FuqTTQv3Eng3LmcnYBW4ii6PkuxYE@dpg-cjb50c3bq8nc73bmg13g-a/test_db_7vup'


db = SQLAlchemy(app)
CORS(app)  # Enable CORS for all routes

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)  
    username = db.Column(db.String(20), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)
#    habits = db.relationship('Habit', backref='user', lazy=True)

class Habit(db.Model):
    habit_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    status = db.Column(db.Boolean, default=False)
    #created_at = db.Column(db.DateTime, default=datetime.utcnow) 
    logs = db.relationship('HabitLog', backref='habit', lazy=True)


class HabitLog(db.Model):
    log_id = db.Column(db.Integer, primary_key=True)
    habit_id = db.Column(db.Integer, db.ForeignKey('habit.habit_id'), nullable=False)
    #user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False) #user is implied in the habit object with its user_id attribute
    log_date = db.Column(db.DateTime, nullable=False)
    # status = db.Column(db.Boolean, default=False)



@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        user = User.query.filter_by(username=username).first()

        if user and user.password == password:

            #token_payload = {'username': username, 'user_id': user.id, 'exp': datetime.utcnow() + timedelta(hours=1)}
            #token = jwt.encode({'username': username, 'exp': datetime.utcnow() + timedelta(hours=1)}, app.config['SECRET_KEY'], algorithm='HS256')
            #session['user_id'] = user.id
            #return jsonify({'token': token})  # Return the token as JSON response
            # return jsonify({'message': 'Login successful'}), 200
            response = make_response(jsonify({'message': 'Login successful'}), 200)
            response.set_cookie('user_id', str(user.id))  # Set the user_id cookie

            return response
        else:
            return jsonify({'message': 'Invalid username or password'}), 401 
    return render_template('login.html')

@app.route('/logout', methods=['POST'])
def logout():
    response = make_response(jsonify({'message': 'Logged out'}), 200)
    response.delete_cookie('user_id')  # Clear the user_id cookie
    return response


@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return jsonify({'message': 'Username and password are required'}), 400

        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            return jsonify({'message': 'Username already exists'}), 409

        new_user = User(username=username, password=password)
        db.session.add(new_user)
        db.session.commit()

        return jsonify({'message': 'User registered successfully'}), 201
    return render_template('register.html')

engine = create_engine('sqlite:///site.db')  # Replace with your database URL

scheduler = BackgroundScheduler()

def reset_habit_statuses():
    # Create a session outside the try block
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # Reset the status of all habits to not done
        habits = session.query(Habit).all()
        for habit in habits:
            habit.status = False

        # Commit the changes
        session.commit()
    except Exception as e:
        # Rollback in case of error
        session.rollback()
    finally:
        # Close the session
        session.close()

# Schedule the reset at 0:00 every day
scheduler.add_job(reset_habit_statuses, 'cron', hour=13, minute=24) # OREGON TIME TEST

# Start the scheduler
scheduler.start()

@app.route('/habits', methods=['GET'])
def get_habits():

    user_id = request.cookies.get('user_id')  # Get user ID from the cookie
    if user_id is None:
        return jsonify({'message': 'User not logged in'}), 401


    habits = Habit.query.filter_by(user_id=user_id).order_by(Habit.name).all()  # Fetch user's habits ordered by name
    habit_list = []

    for habit in habits:
        habit_data = {
            "habit_id": habit.habit_id,
            "name": habit.name,
            "status": habit.status
        }

        habit_list.append(habit_data)

    return jsonify(habit_list)

@app.route('/log_entries', methods=['GET'])
def get_log_entries():
    log_entries = HabitLog.query.all() # Fetch all log entries from the database
    log_entry_list = []

    for log_entry in log_entries:
        log_entry_data = {
            "log_id": log_entry.log_id,
            "habit_id": log_entry.habit_id,
            "log_date": log_entry.log_date,
            "status": log_entry.status
        }
    
        log_entry_list.append(log_entry_data)
    
    return jsonify(log_entry_list)

@app.route('/habit/<int:habit_id>', methods=['DELETE'])
def delete_habit(habit_id):
    habit = Habit.query.get_or_404(habit_id)
    
    try:
        db.session.delete(habit)
        db.session.commit()
        return jsonify({'message': 'Habit deleted successfully'}), 200
    except Exception as e:
        return jsonify({'message': 'An error occurred while deleting the habit.'}), 500


@app.route('/add_log_entry', methods=['POST'])
def add_log_entry():
    try:
        data = request.get_json()
        habit_id = data.get('habit_id')

        if not habit_id or not habit_id.strip(): # Check for empty or whitespace-only habit id
            return jsonify({'message': 'Habit id cannot be empty!'}), 400

        new_entry_log = HabitLog(h_id = habit_id, log_date = datetime.now(), status = 1)
        db.session.add(new_entry_log)
        db.session.commit()

        return jsonify({'message': 'Entry log added successfully'}), 201
    except Exception as e:
        return jsonify({'message': 'An error occured while adding the entry log.'}), 500
            

@app.route('/add_habit', methods=['POST'])
def add_habit():
    try:
        data = request.get_json()
        habit_name = data.get('name')
        user_id = request.cookies.get('user_id') 

        if not habit_name or not habit_name.strip():
            return jsonify({'message': 'Habit name cannot be empty!'}), 400

        new_habit = Habit(user_id=user_id, name=habit_name)  # Associate habit with the user

        db.session.add(new_habit)
        db.session.commit()

        return jsonify({'message': 'Habit added successfully'}), 201
    except Exception as e:
        return jsonify({'message': 'An error occurred while adding the habit.'}), 500


@app.route('/habit/<int:habit_id>', methods=['GET'])
def get_habit(habit_id):
    habit = Habit.query.get(habit_id)
    if habit:
        habit_data = {
            "habit_id": habit.habit_id,
            "name": habit.name,
            "status": habit.status
        }
        return jsonify(habit_data)
    else:
        return jsonify({'message': 'Habit not found'}), 404
    
@app.route('/log_entry/<int:log_id>', methods=['GET'])
def get_log_entry(log_id):
    log_entry = HabitLog.query.get(log_id)
    if log_entry:
        log_entry_data = {
            "log_id": log_entry.log_id,
            "habit_id": log_entry.habit_id,
            "log_date": log_entry.log_date,
            "status": log_entry.status
        }    
        return jsonify(log_entry_data)
    else:
        return jsonify({'message': 'Log entry not found'}), 404


@app.route('/track_habit/<int:habit_id>', methods=['PUT'])
def track_habit(habit_id):
    habit = Habit.query.get_or_404(habit_id)

    # Check if the habit status is changing
    if habit.status:
        new_log = HabitLog(habit_id=habit.habit_id, log_date=datetime.now(), status=True)
        db.session.add(new_log)
    # else:
    #     # Delete the corresponding log entry if habit is marked as not done
    #     log_entry = HabitLog.query.filter_by(habit_id=habit.habit_id, log_date=datetime.utcnow()).first()
    #     if log_entry:
    #         db.session.delete(log_entry)

    db.session.commit()

    return jsonify({'message': 'Habit tracked successfully'}), 200



@app.route('/habit/mark_done/<int:habit_id>', methods=['POST'])
def toggle_habit_done(habit_id):
    habit = Habit.query.get(habit_id)

    if habit:
        try:
            new_log = HabitLog(habit_id=habit.habit_id, log_date=datetime.now())
            db.session.add(new_log)

            habit.status = not habit.status
            db.session.commit()

            return jsonify({'message': 'Habit status toggled successfully'}), 200
        except Exception as e:
            return jsonify({'message': 'An error occurred while toggling habit status.'}), 500
    else:
        return jsonify({'message': 'Habit not found'}), 404



@app.route('/habit/update_name/<int:habit_id>', methods=['PUT'])
def update_habit_name(habit_id):
    habit = Habit.query.get_or_404(habit_id)
    
    try:
        data = request.get_json()
        new_name = data.get('name')
        
        if not new_name or not new_name.strip():
            return jsonify({'message': 'New habit name cannot be empty!'}), 400
        
        habit.name = new_name
        db.session.commit()
        
        return jsonify({'message': 'Habit name updated successfully'}), 200
    except Exception as e:
        return jsonify({'message': 'An error occurred while updating the habit name.'}), 500


@app.route('/')
def index():
    user_id = request.cookies.get('user_id')
    if user_id is None:
        return redirect(url_for('login'))  # Redirect to the login page if user is not logged in
    return render_template('index.html')


db.create_all() 


if __name__ == '__main__':
    app.run
from flask import Flask, request, jsonify, render_template, make_response
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = 'P@ssW0rd#'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
db = SQLAlchemy(app)
CORS(app)  # Enable CORS for all routes

# class User(db.Model):
#     #user_id = db.Column(db.Integer, primary_key=True)
#     id = db.Column(db.Integer, primary_key=True)  # Changed user_id to id
#     username = db.Column(db.String(20), unique=True, nullable=False)
#     password_hash = db.Column(db.String(128), nullable=False)
#     habits = db.relationship('Habit', backref='user', lazy=True)

class Habit(db.Model):
    habit_id = db.Column(db.Integer, primary_key=True)
    #user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    status = db.Column(db.Boolean, default=False)
    #created_at = db.Column(db.DateTime, default=datetime.utcnow) 
    logs = db.relationship('HabitLog', backref='habit', lazy=True)


class HabitLog(db.Model):
    log_id = db.Column(db.Integer, primary_key=True)
    habit_id = db.Column(db.Integer, db.ForeignKey('habit.habit_id'), nullable=False)
    log_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.Boolean, default=False)

@app.route('/habits', methods=['GET'])
def get_habits():
    habits = Habit.query.all()  # Fetch all habits from the database
    habit_list = []

    for habit in habits:
        habit_data = {
            "habit_id": habit.habit_id,
            "name": habit.name,
            "status": habit.status
        }

        habit_list.append(habit_data)

    return jsonify(habit_list)

@app.route('/habit/<int:habit_id>', methods=['DELETE'])
def delete_habit(habit_id):
    habit = Habit.query.get_or_404(habit_id)
    
    try:
        db.session.delete(habit)
        db.session.commit()
        return jsonify({'message': 'Habit deleted successfully'}), 200
    except Exception as e:
        return jsonify({'message': 'An error occurred while deleting the habit.'}), 500


@app.route('/add_habit', methods=['POST'])
def add_habit():
    try:
        data = request.get_json()
        habit_name = data.get('name')

        if not habit_name or not habit_name.strip():  # Check for empty or whitespace-only habit name
            return jsonify({'message': 'Habit name cannot be empty!'}), 400

        new_habit = Habit(name=habit_name)
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


@app.route('/track_habit/<int:habit_id>', methods=['PUT'])
def track_habit(habit_id):
    habit = Habit.query.get_or_404(habit_id)
    
    # Check if the last habit log entry is from a previous day
    last_log = habit.logs.order_by(HabitLog.log_date.desc()).first()
    today = datetime.utcnow().date()
    if not last_log or last_log.log_date < today:
        # Reset habit status for the new day
        habit.status = False
    
    habit.status = not habit.status
    
    new_log = HabitLog(habit_id=habit.habit_id, log_date=today, status=habit.status)
    db.session.add(new_log)
    db.session.commit()
    
    return jsonify({'message': 'Habit tracked successfully'}), 200


@app.route('/habit/mark_done/<int:habit_id>', methods=['POST'])
def toggle_habit_done(habit_id):
    habit = Habit.query.get(habit_id)
    # if habit and habit.user_id == current_user.id:
    habit.status = not habit.status
    db.session.commit()
    return jsonify({'message': 'Habit status toggled'}), 200
    # return jsonify({'message': 'Habit not found or unauthorized'}), 404

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
    return render_template('index.html')


db.create_all()

if __name__ == '__main__':
    app.run(debug=True)
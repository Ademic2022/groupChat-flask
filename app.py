from flask import Flask, render_template, request, redirect, url_for
from flask_socketio import SocketIO
import random
from flask_socketio import rooms
from flask_login import LoginManager, logout_user, login_user, login_required, current_user
from string import ascii_uppercase
from socketIo.socketIoEngine import ChatSocketIO
from models.storage.storage import MongoDBConnection

app = Flask(__name__)
rooms = {}
app.config['SECRET_KEY'] = 'dvhdnmfgavregancb'
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
db = MongoDBConnection()


@login_manager.user_loader
def load_user(username):
    return db.get_user(username)
socketio = SocketIO(app)
sio = ChatSocketIO(app, socketio)

def generate_unique_code(length):
    while True:
        code = ''
        for _ in range(length):
            code+=random.choice(ascii_uppercase)
        if code not in rooms:
            break
    return code


@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    # session.clear()
    if request.method == 'POST':
        username = request.form.get('username').strip()
        password = request.form.get('password').strip()

        user = db.get_user(username)
        if user and user.check_password(password):
            login_user(user)
            return redirect(url_for('index'))
        
        return redirect(url_for('login'))

    return render_template('login.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if current_user.is_authenticated:
        return redirect(url_for('index'))

    if request.method == 'POST':
        username = request.form.get('username').strip()
        email = request.form.get('email').strip()
        password = request.form.get('password').strip()

        user = db.get_user(username)
        if not user:
            """save new user"""
            db.save_user(username,email,password)
            return redirect(url_for('login'))
        
        return render_template('signup.html')
      
    return render_template('signup.html')

@app.route('/', methods=['GET', 'POST'])
@login_required
def index():
    if request.method == 'POST':
        profileName = request.form.get('profileName').strip()
        createRoom = request.form.get('createRoom', False)

        if not profileName:
            return render_template('index.html', error='enter a profile name')

        for key in request.form.keys():
            if key.startswith('joinRoom_'):
                room_id = key.split('_')[1]
                print(f"Joining room with ID {room_id}")
                return redirect(url_for('groupchat', room_id = room_id))
            

        if createRoom != False:
            # usernames = [username.strip() for username in request.form.get('members').split(',')]
            usernames = [username.strip() for username in []]
            room = generate_unique_code(4)

            """Save Room and Insert bulk members to the Room"""
            if len(usernames):
                room_id = db.save_room(room, current_user.username)
                if current_user.username in usernames:
                    usernames.remove(current_user.username)
                db.add_room_members(room_id, room, usernames, current_user.username)

                return redirect(url_for('groupchat', room_id=room_id))

            """Save Room and Insert Self as Room Member"""
            room_id = db.save_room(room, current_user.username)
            return redirect(url_for('groupchat', room_id=room_id))

        return redirect(url_for('groupchat'))
    
    rooms = []
    if current_user.is_authenticated:
        rooms = db.get_rooms_for_user(current_user.username)
    return render_template('index.html', rooms=rooms)

@app.route('/groupchat/<room_id>', methods=['POST', 'GET'])
@app.route('/groupchat', defaults={'room_id': None}, methods=['POST', 'GET'])
@login_required
def groupchat(room_id):
    if room_id is None:
        # flash('Please select a valid room.')
        return redirect(url_for('index'))  # Replace with your default route

    room = db.get_room(room_id)
    room_member = db.is_room_member(room_id, current_user.username)

    if room and room_member:
        room_members = db.get_room_members(room_id)
        return render_template('groupchat.html', room=room, room_members=room_members)

    # flash('Invalid room or you are not a member.')
    return redirect(url_for('index'))


@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))


@socketio.on('send_message')
def handle_send_message_event(data):
    sio.handle_send_message_event(data)


@socketio.on('join_room')
def handle_join_room_event(data):
    sio.handle_join_room_event(data)


@socketio.on('leave_room')
def handle_leave_room_event(data):
    sio.handle_leave_room_event(data)

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5008)
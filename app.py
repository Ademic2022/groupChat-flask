from flask import Flask, render_template, request, session, redirect, url_for
from flask_socketio import SocketIO
import random
from flask_login import LoginManager, logout_user, login_user, login_required, current_user
from string import ascii_uppercase
from socketIo.socketIoEngine import ChatSocketIO
from models.storage.storage import get_user

app = Flask(__name__)
rooms = {}
app.config['SECRET_KEY'] = 'dvhdnmfgavregancb'
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
@login_manager.user_loader
def load_user(username):
    return get_user(username)
socketio = SocketIO(app)
sio = ChatSocketIO(socketio, rooms)

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
    # session.clear()
    if request.method == 'POST':
        username = request.form.get('username').strip()
        password = request.form.get('password').strip()

        user = get_user(username)
        if user and user.check_password(password):
            login_user(user)
            return redirect(url_for('index'))
        
        return redirect(url_for('login'))

    return render_template('login.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        pass

    return render_template('signup.html')

@app.route('/', methods=['GET', 'POST'])
@login_required
def index():
    session.pop(current_user.username, None)
    if request.method == 'POST':
        profileName = current_user.username
        code = request.form.get('code').strip()
        joinRoom = request.form.get('joinRoom', False)
        createRoom = request.form.get('createRoom', False)
        if not profileName:
            return render_template('index.html', error='enter a profile name')

        if joinRoom != False and not code:
            return render_template('index.html', error='enter roomCode', profileName=profileName, code=code)
        room = code

        if createRoom != False:
            room = generate_unique_code(4)
            rooms[room] = {'members':0, 'messages':[]}
        elif code not in rooms:
            return render_template('index.html', error='room does not exist', profileName=profileName, code=code)

        session['room'] = room 
        session['profileName'] = profileName
        return redirect(url_for('groupchat'))
    
    return render_template('index.html')

@app.route('/groupchat/<room_id>', methods=['POST', 'GET'])
@app.route('/groupchat', defaults={'room_id': None}, methods=['POST', 'GET'])
# @app.route('/groupchat', methods=['POST', 'GET'])
@login_required
def groupchat(room_id):
    if room_id is not None:
        room_id = room_id.upper()
        print(room_id)
    room = session.get('room')
    if room not in rooms or room is None:
        print("Redirecting to index - Room not in rooms or is None")
        return redirect(url_for('index'))
    if room_id is not None and room_id != room:
        print(f"Redirecting to index - room_id mismatch: {room_id} != {room}")
        return redirect(url_for('index'))
    print(room)

    return render_template('groupchat.html', room=room, messages=rooms[room]['messages'])

@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))


@socketio.on('message')
def message(data):
    sio.create_message(data)

@socketio.on('connect')
def connects(auth):
    sio.handle_connect(auth)

@socketio.on('disconnect')
def disconnect():
    sio.handle_disconnect()

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5008)
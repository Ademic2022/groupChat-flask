from flask import Flask, render_template, request, session, redirect, url_for
from flask_socketio import SocketIO, send, join_room, leave_room
import random
from string import ascii_uppercase
from socketIo.socketIoEngine import ChatSocketIO

app = Flask(__name__)
rooms = {}
app.config['SECRET_KEY'] = 'dvhdnmfgavregancb'
socketio = SocketIO(app)
sio = ChatSocketIO(socketio, rooms)

def generate_unique_code(length):
    while True:
        code = ''
        for _ in range(length):
            code+=random.choice(ascii_uppercase)
        if code not in rooms:
            break
    print(code)
    return code

@app.route('/', methods=['GET', 'POST'])
def index():
    session.clear()
    if request.method == 'POST':
        profileName = request.form.get('profileName')
        code = request.form.get('code')
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

@app.route('/groupchat', methods=['POST', 'GET'])
def groupchat():
    room = session.get('room')
    profileName = session.get('profileName')
    if room not in rooms or room is None or profileName is None:
        return redirect(url_for('index'))
    print(room)

    return render_template('groupchat.html', room=room, messages=rooms[room]['messages'])

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
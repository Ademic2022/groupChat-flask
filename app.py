from flask import Flask, render_template, request, session, redirect, url_for
from flask_socketio import SocketIO, send, join_room, leave_room
import random
from string import ascii_uppercase

app = Flask(__name__)
app.config['SECRET_KEY'] = 'dvhdnmfgavregancb'
socketio = SocketIO(app)

rooms = {}
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

    return render_template('groupchat.html', room=room)

@socketio.on('message')
def message(data):
    room = session.get('room')
    profileName = session.get('profileName')
    if room not in rooms:
        return
    content = {
        "profileName": profileName,
        "message": data["data"],
    }
    send(content, to=room)
    rooms[room]['messages'].append(content)
    print(f"{profileName} said: {data['data']}")

@socketio.on('connect')
def connect(auth):
    room = session.get('room')
    profileName = session.get('profileName')
    if not room or not profileName:
        return
    if room not in rooms:
        leave_room(room)
        return
    
    join_room(room)
    send({"profileName": profileName, "message": "has joined the group chat"}, to=room)
    rooms[room]['members'] += 1
    print(f"{profileName} has joined the group")

@socketio.on('disconnect')
def disconnect():
    room = session.get('room')
    profileName = session.get('profileName')
    leave_room(room)
    if room in rooms:
        rooms[room]['members'] -= 1
        if rooms[room]['members'] <= 0:
            del rooms[room]
            return

    send({"profileName": profileName, "message": "has left the group chat"}, to=room)
    print(f"{profileName} has left the group")

if __name__ == '__main__':
    socketio.run(app, debug=True, host='localhost', port=5000)
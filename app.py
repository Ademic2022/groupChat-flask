from enum import member
from pyexpat.errors import messages
from flask import Flask, render_template, request, redirect, url_for, jsonify
from flask_socketio import SocketIO
from bson.json_util import dumps
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


""" LOGIN ROUTE """
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

""" SIGN UP ROUTE """
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


""" HOME PAGE ROUTE """
@app.route('/', methods=['GET', 'POST'])
@login_required
def index():
    if request.method == 'POST':
        room_name = request.form.get('groupName')
        usernames = [username.strip() for username in request.form.get('groupMembers').split(',')]

        """Save Room and Insert bulk members to the Room"""
        if len(room_name) and len(usernames):
            room_id = db.save_room(room_name, current_user.username)
            if current_user.username in usernames:
                usernames.remove(current_user.username)
            db.add_room_members(room_id, room_name, usernames, current_user.username)

            return redirect(url_for('groupchat', room_id=room_id))
        else:
            """Save Room and Insert Self as Room Member"""
            room_id = db.save_room(room_name, current_user.username)
            return redirect(url_for('groupchat', room_id=room_id))
    
    rooms = []
    if current_user.is_authenticated:
        rooms = db.get_rooms_for_user(current_user.username)
    return render_template('chatRoom.html', rooms=rooms)

""" EDIT ROUTE """
@app.route('/rooms/edit/<room_id>', methods=['GET', 'POST'])
@login_required
def edit_room(room_id):
    room = db.get_room(room_id)
    if room and db.is_room_admin(room_id, current_user.username):
        old_members = [member['_id']['username'] for member in db.get_room_members(room_id)]
        room_members_str_format = ",".join(old_members)
        if request.method == 'POST':
            # Access the JSON data from the request
            data = request.json

            room_name = data.get('newGroupNameValue')
            membersdata = data.get('newGroupMembersValue')
            
            room['name'] = room_name
            db.update_room(room_id ,room_name)

            new_members = [members.strip() for members in membersdata.split(',')]
            members_to_be_added = list(set(new_members) - set(old_members))
            members_to_be_removed = list(set(old_members) - set(new_members))
            if len(members_to_be_added):
                db.add_room_members(room_id, room_name, members_to_be_added, current_user.username)
            if len(members_to_be_removed):
                db.remove_room_members(room_id, members_to_be_removed)

            room_members_str_format = ",".join(new_members)
            return jsonify({"message": f"Successfully edited Room: {room_name}"}), 200
            # return redirect(url_for('groupchat', room_id=room_id))
        return render_template('edit_room.html', room=room, room_members_str_format=room_members_str_format)
    else:
        return "Only Admin can edit this Room", 404


@app.route('/groupchat/<room_id>', methods=['POST', 'GET'])
@app.route('/groupchat', defaults={'room_id': None}, methods=['POST', 'GET'])
@login_required
def groupchat(room_id):
    try:
        if room_id is None:
            return redirect(url_for('index'))

        room = db.get_room(room_id)
        room_member = db.is_room_member(room_id, current_user.username)

        if room and room_member:
            room_members = db.get_room_members(room_id)
            messages = db.get_messages(room_id)

            # Convert ObjectId to string for jsonify
            room['_id'] = str(room['_id'])
            for member in room_members:
                member['_id'] = str(member['_id'])
            for message in messages:
                message['_id'] = str(message['_id'])
            # Return all data in JSON format
            return jsonify(room=room, room_members=room_members, messages=messages)
        
        # You might want to handle the case where the room or user is invalid
        return jsonify(error="Invalid room or you are not a member.")
    
    except Exception as e:
        print(f"Error in groupchat route: {str(e)}")
        return jsonify(error="Internal Server Error")

""" MESSAGE API """
@app.route('/rooms/<room_id>/messages', methods=['GET', 'POST'])
@login_required
def fetch_message(room_id):
    room = db.get_room(room_id)
    room_member = db.is_room_member(room_id, current_user.username)

    if room and room_member:
        page = int(request.args.get('page', 0))
        messages = db.get_messages(room_id, page)
        return dumps(messages)


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
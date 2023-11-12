from flask_socketio import send, join_room, leave_room, close_room, rooms
from flask import session

class ChatSocketIO:
    def __init__(self, socketio, rooms):
        self.socketio = socketio
        self.rooms = rooms

    def create_message(self, data):
        room = session.get('room')
        profileName = session.get('profileName')
        if room not in self.rooms:
            return
        content = {
            "profileName": profileName,
            "message": data["data"],
        }
        send(content, to=room)
        self.rooms[room]['messages'].append(content)
        print(f"{profileName} said: {data['data']}")

    def handle_connect(self, auth):
        room = session.get('room')
        profile_name = session.get('profileName')

        if not room or not profile_name:
            return

        if room not in self.rooms:
            leave_room(room)
            return
        

        join_room(room)
        self.rooms[room]['members'] += 1
        send({"profileName": profile_name, "message": "has joined the group chat", "count":self.rooms[room]['members']}, to=room)
        print(f"{profile_name} has joined the group")

    def handle_disconnect(self):
        room = session.get('room')
        profile_name = session.get('profileName')

        leave_room(room)

        if room in self.rooms:
            self.rooms[room]['members'] -= 1

            if self.rooms[room]['members'] <= 0:
                del self.rooms[room]
                return
        send({"profileName": profile_name, "message": "has left the group chat", "count":self.rooms[room]['members']}, to=room)

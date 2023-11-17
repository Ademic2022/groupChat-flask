from flask_socketio import join_room, leave_room
from models.storage.storage import MongoDBConnection
from datetime import datetime
db = MongoDBConnection()

class ChatSocketIO:

    def __init__(self, app, socketio):
        self.socketio = socketio
        self.app = app

    def handle_send_message_event(self, data):
        self.app.logger.info(f"{data['username']} has sent a message to the room {data['room']}: {data['message']}")
        data['created_at'] = datetime.now().strftime(("%d %b, %H:%M:%S"))
        db.save_messages(data['room'], data['message'], data['username'])
        self.socketio.emit('receive_message', data, room=data['room'])

    def handle_join_room_event(self, data):
        self.app.logger.info(f"{data['username']} has joined the room {data['room']}")
        join_room(data['room'])
        data['created_at'] = datetime.now().strftime(("%d %b, %H:%M:%S"))
        self.socketio.emit('join_room_announcement', data, room=data['room'])

    def handle_leave_room_event(self, data):
        self.app.logger.info(f"{data['username']} has left the room {data['room']}")
        leave_room(data['room'])
        data['created_at'] = datetime.now().strftime(("%d %b, %H:%M:%S"))
        self.socketio.emit('leave_room_announcement', data, room=data['room'])
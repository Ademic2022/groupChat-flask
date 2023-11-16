import datetime 
from datetime import datetime
import pymongo
from bson import ObjectId
from hashlib import md5
from models.users import User

class MongoDBConnection:
    def __init__(self):
        self._url = "mongodb+srv://nodetest:nodetest@ademicnode.enl9bef.mongodb.net/?retryWrites=true&w=majority"
        self.client = pymongo.MongoClient(self._url)
        self.db = self.client['ChatDB']
        """Collections(users, rooms, room_members)"""
        self.users_collection = self.db.get_collection('users')
        self.rooms_collection = self.db.get_collection('rooms')
        self.room_members_collection = self.db.get_collection('room_members')


        try:
            if self.client.server_info():
                print("Connected to MongoDB")
            else:
                print("Failed to connect to MongoDB")
        except pymongo.errors.ConnectionFailure as e:
            print(f"Connection to MongoDB failed: {e}")

    def save_user(self, username, email, password):
        hashed_password = md5(password.encode()).hexdigest()
        try:
            self.users_collection.insert_one({'_id': username, 'email': email, 'password': hashed_password})
        except Exception as e:
            print(e)

    def get_user(self, username):
        user_data = self.users_collection.find_one({'_id': username})
        if not user_data:
            return None
        return User(user_data['_id'], user_data['email'], user_data['password'])
    
    """Rooms Operations"""

    def save_room(self, room_name, created_by):
        room_id = self.rooms_collection.insert_one(
            {'name':room_name, 'created_by':created_by, 'created_at':datetime.now()}).inserted_id
        
        self.add_room_member(room_id, room_name, created_by, created_by, is_room_admin=True)
        return room_id

    def update_room(self, room_id, room_name):
        self.rooms_collection.update_one({'_id':ObjectId(room_id)}, {'$set': {'name': room_name}})

    def get_room(self, room_id):
        return self.rooms_collection.find_one({'_id':ObjectId(room_id)})

    def add_room_member(self, room_id, room_name, username, added_by, is_room_admin=False):
        self.room_members_collection.insert_one(
            {'_id':{'room_id':ObjectId(room_id), 'username': username},
             'room_name':room_name, 'added_by':added_by,
             'added_at':datetime.now(), 'is_room_admin': is_room_admin})

    def add_room_members(self, room_id, room_name, usernames, added_by):
        self.room_members_collection.insert_many(
            [{'_id':{'room_id':ObjectId(room_id), 'username': username},
             'room_name':room_name, 'added_by':added_by,
             'added_at':datetime.now(), 'is_room_admin': False} for username in usernames ])

    def remove_room_members(self, room_id, usernames):
        self.room_members_collection.delete_many({'_id': {'$in': [{'room_id': room_id, 'username': username} for username in usernames]}})

    def get_room_members(self, room_id):
        return list(self.room_members_collection.find({'_id.room_id': ObjectId(room_id)}))

    def get_rooms_for_user(self, username):
        return list(self.room_members_collection.find({'_id.username': username}))

    def is_room_member(self, room_id, username):
        return self.room_members_collection.count_documents({'_id':{'room_id': ObjectId(room_id), 'username': username}})

    def is_room_admin(self, room_id, username):
        return self.room_members_collection.count_documents({'_id':{'room_id': ObjectId(room_id), 'username': username}, 'is_room_admin':True})

# db = MongoDBConnection()
# rooms = db.add_room_member('6553e2d375a87d37510f9934', 'ZZBN', 'tosin', 'ademic', is_room_admin=True)
# print(rooms)
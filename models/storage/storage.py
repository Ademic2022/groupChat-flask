import pymongo
from hashlib import md5
from models.users import User

"""Define the MongoDB connection URL"""
# url = 'mongodb://localhost:27017'
url = "mongodb+srv://nodetest:nodetest@ademicnode.enl9bef.mongodb.net/?retryWrites=true&w=majority"

try:
    """Attempt to create a MongoDB client"""
    client = pymongo.MongoClient(url)

    """Access the 'projects' database or create it if it doesn't exist"""
    db = client['ChatDB']
    users_collection = db.get_collection('users')
    """Optionally, check if the connection was successful"""
    if client.server_info():
        print("Connected to MongoDB")
    else:
        print("Failed to connect to MongoDB")

except pymongo.errors.ConnectionFailure as e:
    """Handle any connection errors"""
    print(f"Connection to MongoDB failed: {e}")

def save_user(username, email, password):
    hashed_password = md5(password.encode()).hexdigest()
    try:
        users_collection.insert_one({'_id': username, 
                                 'email': email, 
                                 'password': hashed_password})
    except Exception as e:
        print(e)

def get_user(username):
    user_data = users_collection.find_one({'_id': username})
    if not user_data:
        return None
    return User(user_data['_id'], user_data['email'], user_data['password'])

# save_user('dami', 'dami@gmail.com', 'dami')
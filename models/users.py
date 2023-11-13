import pymongo
from hashlib import md5
from flask_login import UserMixin


class User(UserMixin):
    def __init__(self, username, email, password):
        self.username = username
        self.email = email
        self.password = password
    
    def check_password(self, password):
        encoded_password = md5(password.encode()).hexdigest()
        if self.password == encoded_password:
            return True
        return False
    @staticmethod
    def is_active(self):
        return True
    
    def get_id(self):
        return self.username
    @staticmethod
    def is_authenticated(self):
        return True
    @staticmethod
    def is_anonymous(self):
        return False
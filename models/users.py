import pymongo
from hashlib import md5


class User:
    def __init__(self, username, email, password):
        self.username = username
        self.email = email
        self.password = password
    
    def check_password(self, password):
        pass
    @staticmethod
    def isActive(self):
        return True
    
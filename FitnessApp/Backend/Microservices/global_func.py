import psycopg2
import random
import string


DATABASE_URL = "postgresql://postgres:password@postgres:5432/gitfitbro"

def getConnection():
    conn = psycopg2.connect(DATABASE_URL)
    return conn

def generate_key():
    return ''.join(random.choices(string.printable, k=64))
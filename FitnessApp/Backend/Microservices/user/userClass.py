import psycopg2
import global_func

class User ():
    
    def __init__(self, id = None, email = None, fname = None, lname = None, pass_hash = None, dob = None, sex = None, BFL = None, key = None):
        self.key = key
        if not key:
            self.email = email
            self.fname = fname
            self.lname = lname
            self.pass_hash = pass_hash
            self.dob = dob
            self.sex = sex
            self.BFL = BFL
            self.id = -1
        else:
            self.getUser()
        
    def getUser(self):
        psycopg2.connect(global_func.DATABASE_URL)
        conn = global_func.getConnection()
        cur = conn.cursor()
        cur.execute("SELECT id, email, fname, lname, password_hash, dob, sex, BFL FROM users WHERE key = %s", (self.key,))
        result = cur.fetchone()
        if result:
            self.id = result[0]
            self.email = result[1]
            self.fname = result[2]
            self.lname = result[3]
            self.pass_hash = result[4]
            self.dob = result[5]
            self.sex = result[6]
            self.BFL = result[7]
        else:
            self.id = -1
        cur.close()
        conn.close()
        
    def insertUser(self):
        
        createUserQuery = """INSERT INTO users (email, fname, lname, password_hash, dob, sex, key) 
        VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id"""
        
        conn = global_func.getConnection()
        cur = conn.cursor()
        key = global_func.generate_key()
        cur.execute(createUserQuery, (self.email, self.fname, self.lname, self.pass_hash, self.dob, self.sex, key))
        self.id = cur.fetchone()[0]
        conn.commit()
        
        cur.close()
        conn.close()
        
    

        



class UserStats(User):
    def __init__(self, fname=None, lname=None, pass_hash=None, dob=None, sex=None, BFL=None, key=None, height = None, weight = None):
        super().__init__(fname, lname, pass_hash, dob, sex, BFL, key)
        self.weight = weight
        self.height = height


class UserExeceptions(Exception): #Create Exceptions for user classes
    pass
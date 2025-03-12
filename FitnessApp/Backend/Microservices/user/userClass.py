import psycopg2
from psycopg2 import sql
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
        getUserQuery = sql.SQL(""""SELECT id, email, fname, lname, password_hash, dob, sex, BFL FROM users WHERE key = %s""")
        try:
            conn = global_func.getConnection()
            cur = conn.cursor()
            cur.execute(getUserQuery, (self.key,))
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
        except Exception as e:
            pass
        finally:
            cur.close()
            conn.close()
        
    def insertUser(self):
        
        createUserQuery = sql.SQL("""INSERT INTO users (email, fname, lname, password_hash, dob, sex, key)
        VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id""")
        
        try:
            conn = global_func.getConnection()
            cur = conn.cursor()
            key = global_func.generate_key()
            cur.execute(createUserQuery, (self.email, self.fname, self.lname, self.pass_hash, self.dob, self.sex, key))
            self.id = cur.fetchone()[0]
            conn.commit()
        except Exception as e:
            pass
        
        finally:
            cur.close()
            conn.close()
    
    def updateUser(self):
        updateUserQuery = sql.SQL("""UPDATE users SET email = %s, password_hash = %s WHERE id = %s""")
        try:
            conn = global_func.getConnection()
            cur = conn.cursor()
            cur.execute(updateUserQuery, (self.email, self.pass_hash, self.id))
            conn.commit()
            
        except Exception as e:
            pass #Create exception
        
        finally:
            cur.close()
            conn.close()
    
    def deleteUser(self):
        deleteUserQuery = sql.SQL("""DELETE FROM users WHERE id = %s""")
        try:
            conn = global_func.getConnection()
            cur = conn.cursor()
            cur.execute(deleteUserQuery, (self.id,))
            conn.commit()
        except Exception as e:
            pass
        finally:    
            cur.close()
            conn.close()
        
    

        



class UserStats(User):
    def __init__(self, fname=None, lname=None, pass_hash=None, dob=None, sex=None, BFL=None, key=None, height = None, weight = None):
        super().__init__(fname, lname, pass_hash, dob, sex, BFL, key)
        self.weight = weight
        self.height = height
    
    def insertStats(self):
        insertStatsQuery = sql.SQL("""INSERT INTO user_stats (user_id, height, weight) VALUES (%s, %s, %s)""")
        try:
            conn = global_func.getConnection()
            cur = conn.cursor()
            cur.execute(insertStatsQuery, (self.id, self.height, self.weight))
            conn.commit()
        except Exception as e:
            pass
        finally:
            cur.close()
            conn.close()
    
    def getUserStats(self, days = 0):
        getUserStatsQuery = sql.SQL("""SELECT height, weight FROM user_stats WHERE user_id = %s and created_at >= CURRENT_DATE - interval '%d day'""")
        try:
            conn = global_func.getConnection()
            cur = conn.cursor()
            cur.execute(getUserStatsQuery, (self.id,))
            result = cur.fetchone()
            if result:
                self.height = result[0]
                self.weight = result[1]
        except Exception as e:
            pass
        finally:
            cur.close()
            conn.close()
    
    def getUserLogin(self):
        loginUserQuery = sql.SQL("""SELECT key FROM users WHERE username = %s AND password_hash = %s""")
        try:
            conn = global_func.getConnection()
            cur = conn.cursor()
            cur.execute(loginUserQuery, (self.username, self.pass_hash))
            result = cur.fetchone()
            if result:
                return result[0]
            else:
                raise UserExeceptions("Invalid Username or Password")
        except Exception as e:
            pass
        finally:
            cur.close()
            conn.close()


class UserExeceptions(Exception): #Create Exceptions for user classes
    pass
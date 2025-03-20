import psycopg2
from psycopg2 import sql
import datetime
from global_func import verify_key, getConnection
class Leaderboard():
    def __init__(self, catagory = None, days = 30, scope = None, key = None, workout = None, number = 50):
        self.catagories = ["steps", "workouts", "exercise", "1rm", "pace"]
        if catagory:
            if catagory not in self.catagories:
                self.catagory = "steps"
            else:
                self.catagory = catagory
        else:
            self.catagory = "steps"
        self.days = days
        self.scope = scope
        self.workout = workout
        self.number = number
        self.keys = ["username", "value"]
                
        if key is None:
            raise Exception("Key is required") #Change to fit custom error handling later
        else:
            self.key = verify_key(key) #Add error checking to global functions
            
    
    def get_leaderboard(self):
        
        match self.catagory:
            case "steps":
                return self.get_steps_leaderboard()
            case "workouts":
                return self.get_workout_number_leaderboard()
            case "weight":
                return self.get_exercise_leaderboard()
            case "1rm":
                return self.get_1rm_leaderboard()
            case _:
                raise Exception("Invalid catagory")
        
    def get_steps_leaderboard(self):
        conn = getConnection()
        cur = conn.cursor()
        
        get_steps_query = sql.SQL("SELECT use.username, us.AVG(steps) FROM user_steps us JOIN users use ON us.user_id = use.id WHERE us.date >= %s AND us.date <= %s GROUP BY us.user_id ORDER BY AVG(us.steps) DESC LIMIT %s")
        cur.execute(get_steps_query, (datetime.datetime.now() - datetime.timedelta(days=self.days), datetime.datetime.now(), self.number))
        result = cur.fetchall()
        
        if result:
            return self.__jsonify_tuple_list__(result, self.keys)
        else:
            return None
        
    
    def get_workout_number_leaderboard(self):
        conn = getConnection()
        cur = conn.cursor()
        
        get_workout_number_query = sql.SQL("SELECT use.username, COUNT(w.id) FROM workouts w JOIN users use ON w.user_id = use.id WHERE w.date >= %s AND w.date <= %s GROUP BY use.username ORDER BY COUNT(w.id) DESC LIMIT %s")
        cur.execute(get_workout_number_query, (datetime.datetime.now() - datetime.timedelta(days=self.days), datetime.datetime.now(), self.number))
        result = cur.fetchall()
        
        if result:
            return self.__jsonify_tuple_list__(result, self.keys)
        else:
            return None
    
    def get_exercise_leaderboard(self):
        conn = getConnection()
        cur = conn.cursor()
        
        #Have to assure exercise is a real thing
        
        get_exercise_query = sql.SQL("""WITH expanded_sets AS (
                                        SELECT 
                                            w.user_id,  -- Keep user_id for later join
                                            unnest((we.sets).weight) AS weight
                                        FROM workouts w
                                        JOIN workout_exercises we ON we.workout_id = w.id
                                        WHERE w.date BETWEEN %s AND %s AND we.exercise_id = %s
                                        )
                                        SELECT 
                                            u.username, 
                                            MAX(es.weight) AS max_weight  -- Max weight in a single set
                                        FROM expanded_sets es
                                        JOIN users u ON es.user_id = u.id
                                        GROUP BY es.user_id
                                        ORDER BY max_weight DESC 
                                        LIMIT %s;
                                        """)
        cur.execute(get_exercise_query, (datetime.datetime.now() - datetime.timedelta(days=self.days), datetime.datetime.now(), self.workout, self.number))
        result = cur.fetchall()
        
        if result:
            return self.__jsonify_tuple_list__(result, self.keys)
        else:
            return None
    
    def get_heuristic_leaderboard(self):
        pass
    
    def get_1rm_leaderboard(self):
        conn = getConnection()
        cur = conn.cursor()
        
        get_1rm_query = sql.SQL("""
                                SELECT u.username, MAX(uem.calculated_1rm)
                                FROM user_exercise_max uem
                                JOIN users u ON uem.user_id = u.id
                                WHERE uem.exercise_id = %s
                                GROUP BY uem.user_id
                                ORDER BY MAX(uem.calculated_1rm) DESC
                                LIMIT %s
                                    """)
        cur.execute(get_1rm_query, (datetime.datetime.now() - datetime.timedelta(days=self.days), datetime.datetime.now(), self.workout, self.number))
        result = cur.fetchall()
        
        if result:
            return self.__jsonify_tuple_list__(result, self.keys)
        else:
            return None
        
    def get_fastest_avg_pace(self):
        conn = getConnection()
        cur = conn.cursor()
        
        get_fastest_mile_query = sql.SQL("""
                                        SELECT u.username, MIN(wc.duration/wc.distance)
                                        FROM workouts w
                                        JOIN users u ON w.user_id = u.id
                                        JOIN workout_cardio wc ON w.id = wc.workout_id
                                        WHERE w.date BETWEEN %s AND %s AND wc.distance >= 1
                                        GROUP BY w.user_id
                                        ORDER BY MIN(w.time) ASC
                                        LIMIT %s
                                        """)
        cur.execute(get_fastest_mile_query, (datetime.datetime.now() - datetime.timedelta(days=self.days), datetime.datetime.now(), self.number))
    
    def __jsonify_tuple_list__(self, tuple, keys):
        
        json_list = []
        for tup in tuple:
            json_dict = {}
            for i in range(len(keys)):
                json_dict[keys[i]] = tup[i]
            json_list.append(json_dict)
        return json_list
        
        
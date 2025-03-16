import psycopg2
from psycopg2 import sql
import global_func

class Workout():
    def __init__(self, id = -1, user_id = -1, name = None, workout_type = None, notes = None, average_heart_rate = None, total_weight_lifted = None, order = None, exercises = None):
        self.id = id
        self.user_id = user_id
        self.name = name
        self.workout_type = workout_type
        self.notes = notes
        self.average_heart_rate = average_heart_rate
        self.order = order
        self.exercises = exercises


    def insertWorkout(self):
        try:
            conn = global_func.getConnection()
            cur = conn.cursor()
            
            insert_query = """INSERT INTO workouts (user_id, name, workout_type, notes, average_heart_rate) 
                            VALUES (%s, %s, %s, %s, %s, %s) returning id"""
            cur.execute(insert_query, (self.user_id, self.name, self.workout_type, self.notes, self.average_heart_rate))
            wid = cur.fetchone()[0]
            conn.commit()
            self.insertExercises(wid, conn)
        except Exception as error:
            print(f"Error inserting into database: {error}")
            
        finally:
            cur.close()
            conn.close()
            
    def __prepareSets__(self, exercise):
        
        sets = f"ROW({exercise['reps']}, {exercise['weight']}, {exercise['percievedDifficulty']}, {exercise['superset']}, {exercise['setType']}::type_set_type[])"
        return sets
        
    
    def insertExercises(self, wid, conn = None):
        try:
            if conn == None:
                conn = global_func.getConnection()
            cur = conn.cursor()
            
            insert_query = sql.SQL("""INSERT INTO workout_exercises (workout_id, exercise_id, sets, order, notes) VALUES (%s, %s, %s, %s, %s)""")
            
            for exercise in self.exercises:
                sets = self.__prepareSets__(exercise)
                cur.execute(insert_query, (wid, exercise['exercise_id'], sets, exercise['order'], exercise['notes']))
            
        except Exception as error:
            print(f"Error inserting into database: {error}")
            
    def __getWorkoutId__(self, workoutName):
        try:
            conn = global_func.getConnection()
            cur = conn.cursor()
            
            get_query = """SELECT id FROM workouts WHERE name = %s"""
            cur.execute(get_query, (workoutName,))
            workout = cur.fetchone()
            return workout[0]
        except Exception as error:
            print(f"Error getting workout id: {error}")
            return None
        finally:
            cur.close()
            conn.close()
        
    
    def getWorkouts(self, offset):
        try:
            conn = global_func.getConnection()
            cur = conn.cursor()
            
            get_query = """SELECT * FROM workouts WHERE user_id = %d LIMIT 10 OFFSET %d"""
            cur.execute(get_query, (self.user_id, offset))
            workouts = cur.fetchall()
            workout_list = []
            for workout in workouts:
                get_exercises_query = """SELECT * FROM workout_exercises WHERE workout_id = %s"""
                cur.execute(get_exercises_query, (workout[0],))
                exercises = cur.fetchall()
                exercise_list = []
                for exercise in exercises:
                    exercise_list.append({
                        "exercise_id": exercise[1],
                        "sets": exercise[2],
                        "notes": exercise[3]
                    })
                workout_list.append({
                    "id": workout[0],
                    "workout_type": workout[2],
                    "notes": workout[3],
                    "average_heart_rate": workout[4],
                    "workout_date": workout[5],
                    "exercises": exercise_list
                })
            return workout_list
        except Exception as error:
            print(f"Error getting workouts: {error}")
            return None
        finally:
            cur.close()
            conn.close()
    
    def getExercises(self, offset = 0, amount = 50):
        try:
            conn = global_func.getConnection()
            cur = conn.cursor()
            
            get_query = """SELECT name, equipment, description, single_sided, primary_muscle, secondary_muscles, createdBy FROM exercises 
                        WHERE (createdBy = %d OR createdBy = NULL) LIMIT %d OFFSET %d"""
            cur.execute(get_query, (self.user_id, amount, offset * 50))
            exercises = cur.fetchall()
            exercise_list = []
            for exercise in exercises:
                if exercise[6] == None:
                    createdBy = "GitFitBro"
                else:
                    createdBy = self.__getUsername__()
                    
                exercise_list.append({
                    "name": exercise[0],
                    "equipment": exercise[1],
                    "description": exercise[2],
                    "single_sided": exercise[3],
                    "primary_muscle": exercise[4],
                    "secondary_muscles": exercise[5],
                    "createdBy": createdBy
                })
                
            if len(exercises) < amount:
                return exercise_list, -1
            else:
                return exercise_list, offset+1
            
        except Exception as error:
            print(f"Error getting exercises: {error}")
            return None, None
        finally:
            cur.close()
            conn.close()
    
    def __getUsername__(self):
        try:
            conn = global_func.getConnection()
            cur = conn.cursor()
            
            get_query = """SELECT username FROM users WHERE id = %d"""
            cur.execute(get_query, (self.user_id,))
            user = cur.fetchone()
            return user[0]
        except Exception as error:
            print(f"Error getting username: {error}")
            return None
        finally:
            cur.close()
            conn.close()

    def getWorkoutStats(self, workout_id, timeframe):
        try:
            conn = global_func.getConnection()
            cur = conn.cursor()
            
            get_query = sql.SQL("SELECT exercise_id, (sets).reps, (sets).weight, (sets).percieved_difficulty FROM workout_exercises WHERE workout_id = (SELECT id FROM workouts WHERE user_id = %s and workout_date > CURRENT_DATE - INTERVAL '%d days') AND exercise_id = %d ORDER BY date_performed")
            cur.execute(get_query, (workout_id, timeframe))
            stats = cur.fetchall()
            return stats
        except Exception as error:
            print(f"Error getting workout stats: {error}")
            return None
        finally:
            cur.close()
            conn.close()
            


class WorkoutExceptions(Exception):
    pass
import psycopg2
from psycopg2 import sql
import global_func

class Workout():
    def __init__(self, id = -1, user_id = -1, workout_type = None, notes = None, average_heart_rate = None, total_weight_lifted = None, exercises = None):
        self.id = id
        self.user_id = user_id
        self.workout_type = workout_type
        self.notes = notes
        self.average_heart_rate = average_heart_rate
        self.total_weight_lifted = total_weight_lifted
        self.exercises = exercises


    def insertWorkout(self):
        try:
            conn = global_func.getConnection()
            cur = conn.cursor()
            
            insert_query = """INSERT INTO workouts (user_id, name, workout_type, notes, average_heart_rate) 
                            VALUES (%d, %s, %s, %s, %d) returning id"""
            cur.execute(insert_query, (self.user_id, self.workout_type, self.notes, self.average_heart_rate))
            wid = cur.fetchone()[0]
            conn.commit()
            for exercise in self.exercises:
                insert_query = """INSERT INTO workout_exercises (workout_id, exercise_id, sets, notes) VALUES (%s, %s, %s, %s)"""
                cur.execute(insert_query, (wid, exercise['exercise_id'], exercise['sets'], exercise['notes']))
                conn.commit()
                
        except Exception as error:
            print(f"Error inserting into database: {error}")
            
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
    
    def getExercises(self, offset = 0):
        try:
            conn = global_func.getConnection()
            cur = conn.cursor()
            
            get_query = """SELECT name, equipment, description, single_sided, primary_muscle, secondary_muscles, createdBy FROM exercises 
                        WHERE (createdBy = %d OR createdBy = NULL) LIMIT 50 OFFSET %d"""
            cur.execute(get_query, (self.id, offset * 50))
            exercises = cur.fetchall()
            exercise_list = []
            for exercise in exercises:
                if exercise[6] == None:
                    createdBy = "GitFitBro"
                else:
                    createdBy = self.getUsername()
                exercise_list.append({
                    "name": exercise[0],
                    "equipment": exercise[1],
                    "description": exercise[2],
                    "single_sided": exercise[3],
                    "primary_muscle": exercise[4],
                    "secondary_muscles": exercise[5],
                    
                })
                
            if len(exercises) < 50:
                return exercise_list, -1
            else:
                return exercise_list, offset+1
            
        except Exception as error:
            print(f"Error getting exercises: {error}")
            return None
        finally:
            cur.close()
            conn.close()
    
    def getUsername(self):
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
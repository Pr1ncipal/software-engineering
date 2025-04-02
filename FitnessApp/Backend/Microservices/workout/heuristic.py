import flask
import psycopg2
import psycopg2.sql
import datetime
from global_func import verify_key, getConnection



main = flask.Blueprint('workout', __name__)

def calculateBFL(user_id):
    conn = getConnection()
    cursor = conn.cursor()
    
    #Calculate BMI
    account_age_query = psycopg2.sql.SQL("SELECT created_at FROM users WHERE id = %d;", (user_id,))
    cursor.execute(account_age_query)
    accountAge = cursor.fetchone()[0]
    
    if accountAge < datetime.datetime.now() - datetime.timedelta(days=7): 
        return None
    
        
    weightHeightQuery = psycopg2.sql.SQL("SELECT weight, height FROM user_stats WHERE user_id = %d ORDER BY created_at DESC LIMIT 1;", (user_id,))
    cursor.execute(weightHeightQuery)
    weight, height = cursor.fetchone()
        
    bmi = (weight / height**2) * 703
        
    ## Gaining workouts / week
    wkout_avg_query = psycopg2.sql.SQL("""
    WITH weekly_counts AS (
    SELECT 
        DATE_TRUNC('week', t.created_at) AS week_start,
        COUNT(*) AS workouts_per_week
    FROM workouts t
    WHERE t.created_at >= (
        SELECT created_at FROM users WHERE id = %d
    ) AND t.user_id = %d
    GROUP BY week_start
    )
    SELECT AVG(workouts_per_week) AS avg_entries_per_week
    FROM weekly_counts;
    """)
    
    cursor.execute(wkout_avg_query)
    avg_workouts = cursor.fetchone()[0]
    
    ## Getting workout type
    workout_type_query = psycopg2.sql.SQL("""SELECT 
    workout_type,
    (COUNT(*) * 100.0 / SUM(COUNT(*)) OVER ()) AS percentage
    FROM workouts
    WHERE user_id = %d
    GROUP BY workout_type;
    """)
    
    cursor.execute(workout_type_query, (user_id,))
    wk_percent = cursor.fetchall()
    
    for wkout in wk_percent:
        if wkout[0] == 'Strength':
            strength_percent = wkout[1]
        elif wkout[0] == 'Cardio':
            cardio_percent = wkout[1]
    
    ## Figure out about resting HR and steps/day
    
    
    return 0

def calculateStrength():
    pass

def calculateCardio():
    pass
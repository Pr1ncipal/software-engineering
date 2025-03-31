import psycopg2
from psycopg2 import sql
import json

def get_data():
    conn = psycopg2.connect("dbname=gitfitbro user=postgres password=password host=pgtest port=5432") #Change DB name to what you want to use
    cur = conn.cursor()
    user_info_query = sql.SQL("SELECT id, fname, lname, sex, (SELECT current_date - dob) as age FROM users WHERE key = %s")
    cur.execute(user_info_query, ("key",))#Change key to the one you want to use
    user = cur.fetchall()
    user_stats_query = sql.SQL("SELECT weight, height, goal FROM user_stats WHERE user_id = %s ORDER BY created_at DESC LIMIT 1")
    cur.execute(user_stats_query, (user[0],))#Change key to the one you want to use
    stats = cur.fetchall()
    goal_query = sql.SQL("SELECT weight_goal FROM user_stats WHERE user_id = %s ORDER BY created_at DESC LIMIT 1")
    cur.execute(goal_query, (user[0],))#Change key to the one you want to use
    goal = cur.fetchall()
    data = {}
    data['user'] = {"first_name": user[1], "last_name": user[2], "sex": "Male" if user[3] == 'M' else 'Female', "age": user[4]}
    data['stats'] = {"weight": stats[0], "height": stats[1], "goal": goal[0] if goal else "None"}
    cur.close()
    conn.close()
    return data


if __name__ == '__main__':
    data = get_data()
    with open('data.json', 'w') as f:
        json.dump(data, f)
    print("Data written to data.json")
    

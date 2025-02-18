import psycopg2
import os

def insert_data(data):
    conn = psycopg2.connect("dbname=gitfitbro user=postgres password=password host=pgtest")
    cur = conn.cursor()
    
    with open(data, 'r') as f:
        for line in f:
            try:
                cur.execute(line)
            except Exception as e:
                print(e)
            
    
if "__name__" == "__main__":
    current_folder = os.getcwd()
    for file in os.listdir(current_folder):
        if file.endswith('.sql'):
            print(file)
    
    query_file = "exercise_data.sql"
    insert_data(query_file)
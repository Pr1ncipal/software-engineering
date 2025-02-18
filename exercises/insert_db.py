import psycopg2
import os

def insert_data(data):
    conn = psycopg2.connect("dbname=gitfitbro user=postgres password=password host=pgtest port=5432")
    cur = conn.cursor()
    
    with open(data, 'r') as f:
        for line in f:
            try:
                cur.execute(line)
            except Exception as e:
                print(e)
    
    conn.commit()
    cur.close()
    conn.close()
    
            
        
query_file = "exercise_data.sql"
insert_data(query_file)
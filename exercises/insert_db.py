import psycopg2
import os

def insert_data(data):
    conn = psycopg2.connect("dbname=gitfitbro user=postgres password=password")
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
    
    query_file = input("Enter the name of the file you want to insert: ")
    insert_data(query_file)
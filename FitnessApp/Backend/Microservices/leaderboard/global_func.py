import psycopg2
from psycopg2 import sql


DATABASE_URL = "postgresql://postgres:password@postgres:5432/gitfitbro"

def getConnection():
    conn = psycopg2.connect(DATABASE_URL)
    return conn

def closeConnection(conn, cur):
    cur.close()
    conn.close()
    
def verify_key(key, conn=None):
    if not conn:
        conn = getConnection()
    cur = conn.cursor()
    
    get_id_query = sql.SQL("SELECT id FROM users WHERE key = %s")
    cur.execute(get_id_query, (key,))
    result = cur.fetchone()
    
    if result:
        return result[0]
    else:
        return None
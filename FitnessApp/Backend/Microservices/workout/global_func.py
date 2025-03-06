import psycopg2


DATABASE_URL = "postgresql://postgres:password@postgres:5432/gitfitbro"

def getConnection():
    conn = psycopg2.connect(DATABASE_URL)
    return conn

def verify_key(key, conn=None):
    if not conn:
        conn = getConnection()
    cur = conn.cursor()
    cur.execute("SELECT id FROM user WHERE key = %s", (key,))
    result = cur.fetchone()
    
    if result:
        return result[0]
    else:
        return None
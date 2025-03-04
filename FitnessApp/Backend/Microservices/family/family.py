#Need to fix for JWT and add data validation
from flask import Flask, request, jsonify
import psycopg2
from psycopg2 import sql
from psycopg2.extras import RealDictCursor

app = Flask(__name__)

# Database connection
def getConnection():
    conn = psycopg2.connect(
        dbname="your_db_name",
        user="your_db_user",
        password="your_db_password",
        host="your_db_host",
        port="your_db_port"
    )
    return conn

def verify_key(key, conn = None):
    if not conn:
        conn = getConnection()
    cur = conn.cursor()
    cur.execute("SELECT id FROM user WHERE key = %s", (key,))
    result = cur.fetchone()
    
    if result:
        return result[0]
    else:
        return None

def findUserId(key = None, username = None):
    conn = getConnection()
    cur = conn.cursor()
    if key:
        cur.execute("SELECT id FROM user WHERE key = %s", (key,))
    elif username:
        cur.execute("SELECT id FROM user WHERE username = %s", (username,))
    result = cur.fetchone()
    
    if result:
        return result[0]
    else:
        return None

def findFamilyId(family_name):
    conn = getConnection()
    cur = conn.cursor()
    if family_name:
        cur.execute("SELECT id FROM family WHERE family_name = %s", (family_name,))
    else:
        return None
    
    result = cur.fetchone()
    
    if result:
        return result[0]
    else:
        return None

def verify_family_admin(user, family_id, conn = None):
    if not conn:
        conn = getConnection()
    cur = conn.cursor()
    cur.execute("SELECT family_admin FROM family WHERE id = %s", (family_id,))
    result = cur.fetchone()
    
    cur.close()
    conn.close()
    
    if result:
        return result[0] == user
    else:
        return False
    
def add_user_to_family(family_id, user_id, conn = None): #Fix
    if not conn:
        conn = getConnection()
    cursor = conn.cursor()
    
    try:
        addMember_query = sql.SQL("""INSERT INTO family_members (family_id, user_id) VALUES (%d, %d)""")
        cursor.execute(addMember_query, (family_id, user_id))
        conn.commit()
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@app.route('/create_family', methods=['POST'])
def create_family(): #Check if family exists
    data = request.get_json()
    
    key = verify_key(data["key"])
    if not key:
        return jsonify({"message": "Invalid User"}), 400
    
    family_name = data.get('family_name')
    

    if not family_name:
        return jsonify({"error": "Family name is required"}), 400

    conn = getConnection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cursor.execute("INSERT INTO family (family_name, family_admin) VALUES (%s, %d) RETURNING id", (family_name,))
        family_id = cursor.fetchone()['id']
        conn.commit()
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

    return jsonify({"family_id": family_id, "family_name": family_name}), 201

@app.route('/create_family_request', methods=['POST'])
def create_family_request():
    data = request.get_json()
    admin_user_id = verify_key(data["key"]) #Should be family admin user ID
    if not admin_user_id:
        return jsonify({"message": "Invalid User"}), 400
    
    
    family_name = data.get('family_name')
    existing_query = sql.SQL("""SELECT COUNT(*) FROM family_requests WHERE family_id IN (SELECT id FROM family WHERE family_name = %s) AND receiver_id=%s AND status=NULL""")
    conn = getConnection()
    
    if not verify_family_admin(admin_user_id, findFamilyId(family_name), conn):
        return jsonify({"error": "You are not the admin of this family"}), 401
    
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cursor.execute(existing_query, (family_name, admin_user_id,))
        count = cursor.fetchone()[0]
        if count > 0:
            return jsonify({"error": "Request already exists"}), 400
        else:
            request_query = sql.SQL("""INSERT INTO family_requests (family_id, receiver_id, sender_id) VALUES ((SELECT id FROM family WHERE family_name = %s), %d, %d)""")
            cursor.execute(request_query, (family_name, admin_user_id,))
            conn.commit()
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()
        
    return jsonify({"message": "Request sent successfully"}), 201

@app.route('/accept_family_request', methods=['PUT'])
def accept_family_request():
    data = request.get_json()
    user_id = verify_key(data["key"])
    if not user_id:
        return jsonify({"message": "Invalid User"}), 400
    
    request_id = data.get('request_id')
    if not request_id:
        return jsonify({"error": "Request ID is required"}), 400
    
    conn = getConnection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cursor.execute("SELECT * FROM family_requests WHERE id = %d", (request_id,))
        family_id = cursor.fetchone()['family_id']
        
        if not family_id:
            return jsonify({"error": "Request does not exist"}), 400
        
        add_user_to_family(family_id, user_id, conn)
        
        if data["accept"]:
            change_request_accept = sql.SQL("""UPDATE family_requests SET status=True WHERE id = %d""")
            cursor.execute(change_request_accept, (request_id,))
            conn.commit()
        else:
            change_request_deny = sql.SQL("""UPDATE family_requests SET status=False WHERE id = %d""")
            cursor.execute(change_request_deny, (request_id,))
            conn.commit()
            
        cursor.execute()
    except Exception as e:
        cursor.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()
        
        

@app.route('/delete_family', methods=['DELETE'])
def delete_family():
    data = request.get_json()
        
    key = verify_key(data["key"])
    if not key:
        return jsonify({"message": "Invalid User"}), 400
        
    family_id = data.get('family_id')
        
    if not family_id:
        return jsonify({"error": "Family ID is required"}), 400

    conn = getConnection()
    cursor = conn.cursor()

    try:
        cursor.execute("DELETE FROM family WHERE id = %d", (family_id,))
        cursor.execute("DELETE FROM family_members WHERE family_id = %d", (family_id,))
        conn.commit()
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

    return jsonify({"message": "Family deleted successfully"}), 200

@app.route('/get_family_members', methods=['GET'])
def get_family_members():
    family_id = request.args.get('family_id')
    
    conn = getConnection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
        
    if not family_id:
        family_name = request.args.get('family_name')
        if not family_name:
            return jsonify({"error": "Family ID or Family Name is required"}), 400
        else:
        #may want to add privacy control here

            try:
                cursor.execute("SELECT id FROM family WHERE family_name = %s", (family_name,))
                family_id = cursor.fetchone()['id']
            except Exception as e:
                return jsonify({"error": str(e)}), 500

    try:
        cursor.execute("SELECT user_id FROM family_members WHERE family_id = %s", (family_id,))
        members = cursor.fetchall()
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

    return jsonify({"family_id": family_id, "members": members}), 200

@app.route('/remove_family_member', methods=['DELETE']) #Fix HTTP method. Similar to Get
def remove_family_member():
    data = request.get_json()
        
    key = verify_key(data["key"])
    if not key:
        return jsonify({"message": "Invalid User"}), 400
        
    family_id = data.get('family_id')
    if not family_id:
        family_name = data.get('family_name')
        if not family_name:
            return jsonify({"error": "Family ID or Family Name is required"}), 400
        else:
            conn = getConnection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)

            try:
                cursor.execute("SELECT id, family_admin FROM family WHERE family_name = %s", (family_name,))
                family_id = cursor.fetchone()['id']
                admin = cursor.fetchone()['family_admin']
            except Exception as e:
                return jsonify({"error": str(e)}), 500
            finally:
                cursor.close()
                conn.close()
                
    if admin != key:
        return jsonify({"error": "You are not the admin of this family"}), 401
                
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400
    
    if user_id == admin:
        return jsonify({"error": "You cannot remove the admin from the family"}), 400
    

    if not family_id or not user_id:
        return jsonify({"error": "Family ID and User ID are required"}), 400

    conn = getConnection()
    cursor = conn.cursor()

    try:
        cursor.execute("DELETE FROM family_members WHERE family_id = %s AND user_id = %s", (family_id, user_id))
        conn.commit()
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

    return jsonify({"message": "User removed from family successfully"}), 200

@app.route('/edit_family_admin', methods=['PUT'])
def edit_family_admin():
    data = request.get_json()
        
    key = verify_key(data["key"])
    if not key:
        return jsonify({"message": "Invalid User"}), 400
        
    family_id = findFamilyId(data.get('family_name'))
    new_admin_id = findUserId(username = data.get('new_admin_username'))

    if not family_id or not new_admin_id:
        return jsonify({"error": "Family Name and New Admin username are required"}), 400

    conn = getConnection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT family_admin FROM family WHERE id = %d", (family_id,))
        current_admin_id = cursor.fetchone()['family_admin']
            
        if current_admin_id != key:
            return jsonify({"error": "You are not the admin of this family"}), 401
            
        cursor.execute("UPDATE family SET family_admin = %s WHERE id = %s", (new_admin_id, family_id))
        conn.commit()
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

    return jsonify({"message": "Family admin updated successfully"}), 200



if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
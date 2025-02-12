import os
import json

postgres_db_query_file = "postgres_db_query.sql"
muscles = {}

def filter_json(data, filename):
    name = ''
    equipment = ''
    description = ''
    single_sided = False
    primary_muscle = []
    secondary_muscles = []
    
    keys = data.keys()
    
    if 'catagory' in keys and data['catagory'] != '' and data['catagory'].upper() == 'STRETCHING':
        return None
    
    if 'name' in keys and data['name'] != '':
        name = data['name']
        
    if 'equipment' in keys and data['equipment'] != '':
        equipment = data['equipment']
        
    if "instructions" in keys and data['instructions'] != '':
        for instruction in data['instructions']:
            description = description + instruction + ' '
            
    if 'mechanic' in keys and data['mechanic'] != '' and data['mechanic'] != None:
        if data['mechanic'].upper() == 'ISOLATION':
            single_sided = True
            
    if 'primaryMuscles' in keys and data['primaryMuscles'] != '':
        primary_muscle = data['primaryMuscles'].copy()
        for muscle in primary_muscle:
            if muscle not in muscles:
                muscles[muscle] = 1
            else:
                muscles[muscle] = muscles[muscle] + 1
        
    if 'secondaryMuscles' in keys and len(data['secondaryMuscles']) != 0:
        secondary_muscles = data['secondaryMuscles'].copy()
        
    pms = primary_muscle[0]
    for pm in primary_muscle[1:]:
        pms = pms + ', ' + "'" + pm + "'"
        
    if(single_sided):
        single_sided = "\"TRUE\""
    else:
        single_sided = "\"FALSE\""
    
    if len(secondary_muscles) == 0:
        query = f'INSERT INTO exercises (name, equipment, description, single_sided, primary_muscle) VALUES ("{name}", "{equipment}", "{description}", {single_sided}, "{{{pms}}}");\n'
        return query
    else:
        sms = secondary_muscles[0]
        for sm in secondary_muscles[1:]:
            sms = sms + ', ' + "'" + sm + "'"
        
        query = f'INSERT INTO exercises (name, equipment, description, single_sided, primary_muscle, secondary_muscles) VALUES ("{name}", "{equipment}", "{description}", {single_sided}, "{{{pms}}}", "{{{sms}}}");\n'
    
    return query

def process_files():
    current_folder = os.getcwd()
    json_files = [f for f in os.listdir(current_folder) if f.endswith('.json')]
    
    
    for json_file in json_files:
        json_path = os.path.join(current_folder, json_file)
        with open(json_path, 'r') as f:
            data = json.load(f)
        
        query = filter_json(data, json_file)
        if query is None:
            continue
        
        with open(postgres_db_query_file, 'a') as f:    
            f.write(query)
        
        

if __name__ == "__main__":
    process_files()
    for key in muscles.keys():
        print(f'{key}: {muscles[key]}\n')
        
    print("Done\n")
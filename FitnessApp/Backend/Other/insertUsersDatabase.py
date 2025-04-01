import csv
import json
import requests

CSV_FILE_PATH = '/path/to/your/csvfile.csv'
API_URL = 'https://your-api-gateway-url/endpoint'

def read_csv(file_path):
    with open(file_path, mode='r') as file:
        csv_reader = csv.DictReader(file)
        for row in csv_reader:
            yield row

def send_user_data(user_data):
    response = requests.post(API_URL, json=user_data)
    return response.status_code

def main():
    for user_data in read_csv(CSV_FILE_PATH):
        status_code = send_user_data(user_data)
        if status_code != 201:
            print(f"Failed to insert user: {user_data}. Status code: {status_code}")
            break
        else:
            print(f"Successfully inserted user: {user_data}")

if __name__ == "__main__":
    main()
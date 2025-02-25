from flask import Flask, send_from_directory

app = Flask(__name__)

@app.route('/docs')
def redoc():
    return send_from_directory('.', 'redoc.html')

if __name__ == '__main__':
    app.run(debug=True)

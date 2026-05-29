# Simple Python Flask app for CI/CD practice
from flask import Flask, jsonify
import os

app = Flask(__name__)

@app.route('/health')
def health():
    return jsonify({
        'status': 'ok',
        'version': os.getenv('APP_VERSION', '1.0.0'),
    })

@app.route('/')
def index():
    return jsonify({'message': 'Hello from Python + GitLab CI!'})

@app.route('/users')
def users():
    return jsonify([
        {'id': 1, 'name': 'Alice'},
        {'id': 2, 'name': 'Bob'},
    ])

@app.route('/users/<int:user_id>')
def get_user(user_id):
    users_db = {1: 'Alice', 2: 'Bob'}
    if user_id not in users_db:
        return jsonify({'error': 'Not found'}), 404
    return jsonify({'id': user_id, 'name': users_db[user_id]})

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port)

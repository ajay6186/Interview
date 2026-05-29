import pytest
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_health(client):
    res = client.get('/health')
    assert res.status_code == 200
    data = res.get_json()
    assert data['status'] == 'ok'

def test_index(client):
    res = client.get('/')
    assert res.status_code == 200
    assert 'Hello' in res.get_json()['message']

def test_users_list(client):
    res = client.get('/users')
    assert res.status_code == 200
    data = res.get_json()
    assert isinstance(data, list)
    assert len(data) == 2

def test_user_found(client):
    res = client.get('/users/1')
    assert res.status_code == 200
    assert res.get_json()['name'] == 'Alice'

def test_user_not_found(client):
    res = client.get('/users/999')
    assert res.status_code == 404

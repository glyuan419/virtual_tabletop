#!/usr/bin/python3

from flask import Flask, redirect, render_template, abort, request
from os.path import exists
from os import listdir
from json import loads
from hashlib import md5
from time import time

app = Flask(__name__)

@app.route('/')
def home():
    res = []
    for file_name in listdir('savefiles/'):
        if file_name.split('.')[-1] != 'json': abort(500)
        with open(f'savefiles/{file_name}', 'r') as f:
            data = loads(f.read())['main']
            res.append([file_name.split('.')[0], data['race']+data['class'], data['character_name']])
    print(str(res).encode())
    return render_template('select_pc.html', data=str(res))

@app.route('/template/main')
def create_new_pc():
    with open(f'savefiles/template.json', 'r') as f:
        res = f.read()
    pc_id = md5(str(time()).encode()).hexdigest()[:16]
    with open(f'savefiles/{pc_id}.json', 'w') as f:
        f.write(res)
    return redirect(f'/{pc_id}/main')

@app.route('/<pc_id>/<scroll>')
def pl_view(pc_id, scroll):
    return render_template('pl_view.html', pc_id=pc_id, actived_scroll=scroll)



@app.route('/api/query/<pc_id>')
def api_query(pc_id):
    if not exists(f'savefiles/{pc_id}.json'): return ['?']
    with open(f'savefiles/{pc_id}.json', 'r') as f:
        res = f.read()
    return res

@app.route('/api/query/pc_list')
def api_query_pc_list():
    res = []
    for file_name in listdir('savefiles/'):
        if file_name.split('.')[-1] != 'json': abort(500)
        with open(f'savefiles/{file_name}', 'r') as f:
            data = loads(f.read())['main']
            res.append([file_name.split('.')[0], data['race']+data['class'], data['character_name']])
    return res

@app.route('/api/update/<pc_id>', methods=["POST"])
def api_update(pc_id):
    with open(f'savefiles/{pc_id}.json', 'w') as f:
        f.write(request.data.decode())
    return "ok"









@app.route('/dm')
def dm_view():
    return 'DM is resting!'

if __name__ == '__main__':
    app.run(debug=True)
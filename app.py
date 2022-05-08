# from dataclasses import replace
# from email.mime import image
from http import server
import re
from turtle import delay
from flask import Flask,render_template,request  # 서버 구현을 위한 Flask 객체 import
# from numpy import broadcast  
from pyngrok import ngrok ,conf # 외부 접속 링크 생성
from flask_socketio import SocketIO, join_room, emit
import base64
from datetime import datetime

# from requests import request
# import os

# users = []

serverActive = False

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins='*')

@app.route("/")
def hello_world():
    # Lockup for Network
    # global serverActive
    # if not serverActive:
    #     conf.get_default().auth_token = "22bp1baMLz3H6QgE3t23iVzAIOj_rHpMqB78wrxnasPzERdn"
    #     http_tunnel = ngrok.connect(5000)
    #     tunnels = ngrok.get_tunnels()

    #     for kk in tunnels:
    #         print(kk)

    #     serverActive = True

    return render_template('index.html')

@socketio.on('join_room')
def joinRoom(data):
    join_room(data['roomName'])
    emit('welcome',data['userID'], broadcast=True, to=data['roomName'], include_self=False)
    return

# Work after somone in
@socketio.on('offer')
def sendOffer(data,roomName):
    emit('offer', data, broadcast=True, to=roomName, include_self=False)
    return

@socketio.on('answer')
def asnwer(data,roomName):
    emit('answer', data, broadcast=True, to=roomName, include_self=False)
    return

@socketio.on('ice')
def ice(data,roomName):
    emit('ice', data, broadcast=True, to=roomName, include_self=False)
    return

# TTS Data receive
@socketio.on('sendTTS')
def getTTS(ttsData,roomName):
    emit('streamTTS', ttsData, broadcast=True, to=roomName, include_self=False)
    return

@socketio.on('disconnect')
def disconnecting():
    # delay(500);
    emit('userLeft',request.sid, broadcast=True, include_self=False)
    return

@socketio.on('connect')
def someoneJoin():
    emit('returnMyId', request.sid, broadcast=True, include_self=True, to=request.sid)
    return


@socketio.on('signImage')
def signImage(userImage):
    now = datetime.now()
    path = "./images/"

    userImage = userImage + '=' * (4 - len(userImage) % 4)
    userImage = userImage.replace('\n','')
    userImage = userImage.replace("data:image/png;base64,",'')

    image = base64.b64decode(userImage)
    file_name = str(now.timestamp()) + ".png"

    with open(path + file_name, 'wb') as f:
        f.write(image)
    return

@socketio.on_error()
def chat_error_handler(e):
        print('An error has occurred: ' + str(e))

if __name__ == "__main__":
    socketio.run(app, debug=True)
from http import server
import re
from socket import socket
from textwrap import wrap
from turtle import delay
from flask import Flask,render_template,request  # 서버 구현을 위한 Flask 객체 import
from pyngrok import ngrok ,conf # 외부 접속 링크 생성
from flask_socketio import SocketIO, join_room, emit
import base64
from datetime import datetime
import ssl
import csv

# users = []

serverActive = False

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins='*')

@app.route("/")
def hello_world():
    # global serverActive
    # if not serverActive:
    #     conf.get_default().auth_token = "29FM13u5ZEJ3W3XG7V2I1qFeuef_sQ7UKU6wUQDSKaNY9P8A"
    #     http_tunnel = ngrok.connect(5000)
    #     tunnels = ngrok.get_tunnels()

    #     for kk in tunnels:
    #         print(kk)

    #     serverActive = True

    return render_template('index.html')

@app.route("/signUp")
def signUp():
    return render_template('signUp.html')

@app.route("/room")
def room():
    return render_template('room.html')

# SOCKET.IO
@socketio.on('join_room')
def joinRoom(data):
    join_room(data['roomName'])
    emit('welcome',data, broadcast=True, to=data['roomName'], include_self=False)
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
    # print(data) # for Debug
    emit('ice', data, broadcast=True, to=roomName, include_self=False)
    return

# TTS Data receive
@socketio.on('sendTTS')
def getTTS(ttsData,roomName):
    emit('streamTTS', ttsData, broadcast=True, to=roomName, include_self=True)
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

@socketio.on('user_message')
def userMessage(data,roomName):
    emit('user_message_from', data, broadcast=True, to=roomName, include_self=False)
    return

@socketio.on('SignUp')
def signUp(data):
    # Check ID Exist
    status = 'NotExist'
    with open('./database/user.csv','r',encoding='utf-8') as f:
        rdr = csv.reader(f)
        for line in rdr:
            if(line[0] == data['signId']):
                emit('SignUpRes', 'IDExist', to=request.sid, include_self=True)
                return

    with open('./database/user.csv','a', encoding='utf-8', newline='') as f:
        wr = csv.writer(f)
        wr.writerow([data['signId'], data['signPw'], data['signName'], data['signBirth']])
    
    emit('SignUpRes', 'DONE', to=request.sid, include_self=True)
    return

@socketio.on('SignIn')
def signIn(data):
    # print(data)
    with open('./database/user.csv','r',encoding='utf-8') as f:
        rdr = csv.reader(f)
        for line in rdr:
            if(line[0] == data['signId'] and line[1] == data['signPw']):
                emit('SignInRes', {'states':'Success', 'userId': data['signId'], 'userName':line[2]}, to=request.sid, include_self=True)
                return
    emit('SignInRes', {'states':'Fail'}, to=request.sid, include_self=True)
    return

@socketio.on('IDExist')
def IDExist(id):
    status = 'NotExist'
    with open('./database/user.csv','r',encoding='utf-8') as f:
        rdr = csv.reader(f)

        for line in rdr:
            if(line[0] == id):
                status = 'Exist'
    
    emit('resIDExist', status, to=request.sid, include_self=True)
    return


@socketio.on('onMuteChange')
def onMuteChange(data, roomName):
    emit('res_onMuteChange', data, broadcast=True, to=roomName, include_self=False)
    return

@socketio.on('fileUpload')
def fileUpload(data):
    path = "./static/files/"
    
    with open(path + data['fileNameHash'] + '_' + data['fileName'], 'wb') as f:
        f.write(data['file'])
    emit('userSendFile', data, broadcast=True, to=data['roomName'], include_self=False)
    return

@socketio.on('signImage')
def signImage(data):
    # now = datetime.now()
    # path = "./images/"

    # userImage = data['userImage']
    # userImage = userImage + '=' * (4 - len(userImage) % 4)
    # userImage = userImage.replace('\n','')
    # userImage = userImage.replace("data:image/png;base64,",'')

    # image = base64.b64decode(userImage)
    # file_name = str(now.timestamp()) + ".png"

    # with open(path + file_name, 'wb') as f:
    #     f.write(image)
    # print(data['roomName'])
    emit('streamSIGN', {'userId': data['userId'], "userText" : "hello"}, broadcast=True, to=data['roomName'], include_self=True)
    return

@socketio.on_error()
def chat_error_handler(e):
        print('An error has occurred: ' + str(e))

if __name__ == "__main__":
    socketio.run(app, debug=True)
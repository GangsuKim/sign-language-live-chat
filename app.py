# from dataclasses import replace
# from email.mime import image
from http import server
import re
from site import USER_SITE
from socket import socket
from turtle import delay
from flask import Flask,render_template,request  # 서버 구현을 위한 Flask 객체 import
# from numpy import broadcast  
from pyngrok import ngrok ,conf # 외부 접속 링크 생성
from flask_socketio import SocketIO, join_room, emit
import base64
from datetime import datetime
import ssl

# from requests import request
# import os

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

@socketio.on('signImage')
def signImage(data):
    # now = datetime.now()
    # path = "./images/"
    userImage = data['userImage'] # 추가 => 사용자 이름 전달을 위해 추가
    userImage = userImage + '=' * (4 - len(userImage) % 4)
    userImage = userImage.replace('\n','')
    userImage = userImage.replace("data:image/png;base64,",'')

    img = base64.b64decode(userImage)
    imgByte = io.BytesIO(img)
    img = Image.open(imgByte)
    img = cv2.cvtColor(np.array(img), cv2.COLOR_BGR2RGB)

    # YOLO 가중치 파일과 CFG 파일 로드
    YOLO_net = cv2.dnn.readNet("H:/HEESUN/Hallym/4-1/capstone/sign-language-live-chat-main/yolov4-obj_best.weights", "H:/HEESUN/Hallym/4-1/capstone/sign-language-live-chat-main/yolov4-obj.cfg")

    # YOLO NETWORK 재구성
    classes = []
    with open("H:/HEESUN/Hallym/4-1/capstone/sign-language-live-chat-main/h_obj.names", "r") as f:
        classes = [line.strip() for line in f.readlines()]
    layer_names = YOLO_net.getLayerNames()
    output_layers = [layer_names[i - 1] for i in YOLO_net.getUnconnectedOutLayers()]

    h, w, c = img.shape

    # YOLO 입력
    blob = cv2.dnn.blobFromImage(img, 0.00392, (416, 416), (0, 0, 0), True, crop=False)
    YOLO_net.setInput(blob)
    outs = YOLO_net.forward(output_layers)

    class_ids = []
    confidences = []
    boxes = []

    # outs가 감지한 개수.
    for out in outs:
        for detection in out:

            # print(detection)
            scores = detection[5:]
            class_id = np.argmax(scores)
            confidence = scores[class_id]

            if confidence > 0.5:
                # Object detected
                center_x = int(detection[0] * w)
                center_y = int(detection[1] * h)
                dw = int(detection[2] * w)
                dh = int(detection[3] * h)
                # Rectangle coordinate
                x = int(center_x - dw / 2)
                y = int(center_y - dh / 2)
                boxes.append([x, y, dw, dh])
                confidences.append(float(confidence))
                class_ids.append(class_id)

    indexes = cv2.dnn.NMSBoxes(boxes, confidences, 0.45, 0.4)
    final_output = None
    for i in range(len(boxes)):
        if i in indexes:
            x, y, w, h = boxes[i]
            final_output = str(classes[class_ids[i]])
            # print(final_output)

            # 경계상자와 클래스 정보 이미지에 입력
            cv2.rectangle(img, (x, y), (x + w, y + h), (0, 0, 255), 5)
            cv2.putText(img, final_output, (x, y - 20), cv2.FONT_ITALIC, 0.5, (255, 255, 255), 1)
    
    # print(final_output)
    
    emit('SignToText', {'userText':final_output, 'userName' : data['userName']}, broadcast=True, to=data['roomName'], include_self=True)

    cv2.imshow("YOLOv4", img)
    cv2.waitKey(0)
    return


@socketio.on_error()
def chat_error_handler(e):
        print('An error has occurred: ' + str(e))

if __name__ == "__main__":
    socketio.run(app, debug=True)
# sign-language-live-chat
한림대학교 2022년도 1학기 캡스톤 디자인 Web part

## 개발 현황 (완료)
 - 1:1 실시간 화상 채팅
 - 실시간 화상 저장
 - 닉네임 구현

## 개발 목표
 - 1:N 화상 회의 구현 (Function)
 - Text 채팅창 구현 (UI + Function)
 - TTS 데이터 표시 화면 구현 (UI)

## 문제사항
 - Ngrok를 통한 외부망 배포시 RTCPeer를 이용한 화상통화가 안됨
 - TCP (내부망) 통신일때는 정상적으로 작동하나, UDP 통신 시에 작동이 안됨
 - STUN 서버가 아닌 TURN 서버를 이용해야 하는 것 같다
 - TURN 서버는 무료가 거의 없다 = 만들어야 한다 <- JOTDAM

## install libs
 - pyngrok [conda install -c conda-forge pyngrok]
 - flask_socketio [conda install -c conda-forge flask-socketio]
 - flask [conda install -c anaconda flask]
 - ngrok [conda install -c conda-forge pyngrok]
 
## 개인 메모
 - RTC는 1 대 1 로 새롭게 만들어야 한다.

## 개발 언어
<img src="https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=HTML5&logoColor=white"/> <img src="https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=CSS3&logoColor=white"/> <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=JavaScript&logoColor=white"/> <img src="https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=Python&logoColor=white"/> 

## 라이브러리
<img src="https://img.shields.io/badge/Flask-000000?style=flat-square&logo=Flask&logoColor=white"/> <img src="https://img.shields.io/badge/socket.io-010101?style=flat-square&logo=socket.io&logoColor=white"/> <img src="https://img.shields.io/badge/jQuery-0769AD?style=flat-square&logo=jQuery&logoColor=white"/> <img src="https://img.shields.io/badge/Bootstrap-7952B3?style=flat-square&logo=Bootstrap&logoColor=white"/> <img src="https://img.shields.io/badge/WebRTC-333333?style=flat-square&logo=WebRTC&logoColor=white"/> <img src="https://img.shields.io/badge/ngrok-1F1E37?style=flat-square&logo=ngrok&logoColor=white"/>

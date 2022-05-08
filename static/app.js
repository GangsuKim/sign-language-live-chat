const socket = io(); // io 와 Browser의 연결 (Scoket.io 실행)
// var socket = io.connect('http://' + document.domain + ':' + location.port);

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");

const welcome = document.getElementById("welcome");
const call = document.getElementById("call");
const footBar = document.getElementById('footBar');
const myName = document.getElementById('myName');

call.hidden = true;
footBar.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let userName;
let myPeerConnection = new Object();
let userId;

// Get SID from backend
socket.on('returnMyId', sid => {
    userId = CryptoJS.SHA256(sid).toString();
});

async function getCameras() { // 카메라의 목록 불러오기
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind == "videoinput");
        // const mics = devices.filter(device => device.kind == "videoinput");
        console.log(devices);
        const currentCamera = myStream.getVideoTracks()[0];
        cameras.forEach(camera => {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if (currentCamera.label === camera.label) {
                option.selected = true;
            }
            camerasSelect.appendChild(option);
        });
    } catch (e) {
        console.log(e);
    }
}

async function getMeida(deviceId) {
    const initialConstreins = {
        audio: true,
        video: {
            facingMode: "user"
        },
    };

    const cameraConstreins = {
        audio: true,
        video: {
            deviceId: {
                exact: deviceId
            }
        },
    }

    try {
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId ? cameraConstreins : initialConstreins
        )

        myFace.srcObject = myStream;
        if (!deviceId) {
            await getCameras();
        }
    } catch (e) {
        console.log(e);
    }

    console.log(myStream);
}

function handleMuteClick() {
    myStream.getAudioTracks().forEach((track) => (track.enabled = (track.enabled) ? false : true));
    const micIcon = muteBtn.getElementsByTagName('i')[0];

    if (!muted) {
        micIcon.setAttribute('class', 'bi bi-mic-mute-fill');
        muted = true;
        stopReco();
    } else {
        micIcon.setAttribute('class', 'bi bi-mic-fill');
        muted = false;
        startReco();
    }
}

function handleCameraClick() {
    myStream.getVideoTracks().forEach((track) => (track.enabled = (track.enabled) ? false : true));
    const cameraIcon = cameraBtn.getElementsByTagName('i')[0];

    if (cameraOff) {
        myStream.getVideoTracks().forEach((track) => (track.enabled = true));
        cameraIcon.setAttribute('class', 'bi bi-camera-video-fill');
        cameraOff = false;
    } else {
        myStream.getVideoTracks().forEach((track) => (track.enabled = false));
        cameraIcon.setAttribute('class', 'bi bi-camera-video-off-fill');
        cameraOff = true;
    }
}

// Solving mic errors when camera change
function changeOnHandle() {
    const micIcon = muteBtn.getElementsByTagName('i')[0];
    const cameraIcon = cameraBtn.getElementsByTagName('i')[0];

    if (muted) {
        myStream.getAudioTracks().forEach((track) => (track.enabled = false));
        micIcon.setAttribute('class', 'bi bi-mic-mute-fill');
    } else {
        myStream.getAudioTracks().forEach((track) => (track.enabled = true));
        micIcon.setAttribute('class', 'bi bi-mic-fill');
    }

    if (cameraOff) {
        myStream.getVideoTracks().forEach((track) => (track.enabled = false));
        cameraIcon.setAttribute('class', 'bi bi-camera-video-off-fill');
    } else {
        myStream.getVideoTracks().forEach((track) => (track.enabled = true));
        cameraIcon.setAttribute('class', 'bi bi-camera-video-fill');
    }
}

async function handleCameraChange() {
    await getMeida(camerasSelect.value); // For my self
    const videoTrack = myStream.getVideoTracks()[0];
    Object.keys(myPeerConnection).forEach(sid => {
        const videoSender = myPeerConnection[sid].getSenders().find(sender => sender.track.kind == "video");
        videoSender.replaceTrack(videoTrack);
    });
    changeOnHandle();
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);

// Form
const welcomeForm = welcome.querySelector('form');

async function intiCall() {
    welcome.hidden = true;
    call.hidden = false;
    footBar.hidden = false;
    await getMeida();
    makeConnection(userId,userName);
    startReco();
}

async function handleWelcomeSubmit(event) { // Join Btn click
    event.preventDefault();
    const inputRoomName = welcome.querySelector('#inputRoomName');
    const inputUserName = welcome.querySelector('#inputUserName');
    userName = inputUserName.value; // Save user name to let
    inputUserName.value = "";
    myName.innerText = userName;
    await intiCall();
    socket.emit("join_room", {roomName: inputRoomName.value, userID: userId, userName: userName}); // [S-1]
    roomName = inputRoomName.value; // 방의 이름을 변수에 저장
    inputRoomName.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit); // start of new connection

socket.on("welcome", async (data) => { // new person joined // [R-1] from 'join_room'
    makeConnection(data['userID'],data['userName']);
    console.log('New user join : ' + data['userID']);
    const offer = await myPeerConnection[data['userID']].createOffer();
    myPeerConnection[data['userID']].setLocalDescription(offer);
    console.log("Sent offer");
    socket.emit("offer", {offer:offer, userID: userId, userName: userName}, roomName);
});

socket.on("offer", async (data) => { // offer from exist users
    console.log("Recevied offer");
    if(myPeerConnection[data['userID']] === undefined) {
        makeConnection(data['userID'],data['userName']);
    }
    myPeerConnection[data['userID']].setRemoteDescription(data['offer']);
    const answer = await myPeerConnection[data['userID']].createAnswer();
    myPeerConnection[data['userID']].setLocalDescription(answer);
    socket.emit("answer", {answer:answer, userID:userId}, roomName);
    console.log("Sent the answer");
})

socket.on("answer", async (data) => { // answer from new user
    console.log("Recevied the answer");
    await myPeerConnection[data['userID']].setRemoteDescription(data['answer']);
});

socket.on("ice", async (data) => {
    console.log("Recevied Candidate");
    await myPeerConnection[data['userID']].addIceCandidate(data['ice']);
});

// User Left from room
socket.on("userLeft", function(sid) {
    const videoFaces = call.querySelectorAll('div[class=videoBgc]');
    const cryptoSID = CryptoJS.SHA256(sid).toString();
    videoFaces.forEach(videos => {
        if (videos['id'] == cryptoSID) {
            call.removeChild(videos);
        }
    });
    delete myPeerConnection[cryptoSID];
});

// RTC
function makeConnection(senderID,userName) { 
    myPeerConnection[senderID] = new RTCPeerConnection({
        iceServers: [{
            urls: [
                "stun:stun.l.google.com:19302",
                "stun:stun1.l.google.com:19302",
                "stun:stun2.l.google.com:19302",
                "stun:stun3.l.google.com:19302",
                "stun:stun4.l.google.com:19302",
            ],
        },],
    }); 
    myPeerConnection[senderID]['userID'] = senderID;
    myPeerConnection[senderID]['userName'] = userName;
    myPeerConnection[senderID].addEventListener("icecandidate", handleIce);
    myPeerConnection[senderID].addEventListener("addstream", handleAddStrean);
    // myPeerConnection[senderID].addEventListener("track", handleTrack);
    myStream.getTracks().forEach(track => myPeerConnection[senderID].addTrack(track, myStream));
}

function handleIce(data) {
    console.log("Sent Candidate");
    socket.emit("ice", { ice:data.candidate, userID:userId }, roomName);
}

function handleAddStrean(data) { // 20220509 Working
    const videoBgc = document.createElement('div');
    videoBgc.setAttribute('class','videoBgc');
    videoBgc.setAttribute('id', this['userID']);
    videoBgc.innerHTML = '<div class="userName">' + this['userName'] + '</div>';

    const video = document.createElement('video');
    video.setAttribute('class', 'peerFace');
    video.setAttribute('id', this['userID']);
    video.setAttribute('autoplay', '');
    video.setAttribute('playsinline', '');
    video.srcObject = data.stream;

    videoBgc.appendChild(video)

    socket.emit("idConnection", data.stream.id);

    call.appendChild(videoBgc);
}

function handleTrack(data) {
    // console.log(data)
    // console.log("handle track")
    // const peerFace = document.querySelector("#" + data.streams.id);
    console.log(this);
    // const peerFace = document.querySelector("#peerFace");
    // peerFace.srcObject = data.streams[0]
}

// TTS 
var printedData = '';
var regex = / /gi;
const ttsDiv = document.getElementById('ttsDiv');

var pastData = '';

socket.on("streamTTS", data => {
    if (pastData !== data) {
        var pEle = document.createElement('p');
        pEle.innerHTML = data;
        ttsDiv.append(pEle);

        console.log(data);
        pastData = data;
    }
});

// Video to Photo
const canvas = document.getElementById('canvas');
const photo = document.getElementById('photo');
const photoBtn = document.getElementById('capImage');
// const myFace = document.getElementById('myFace'); //myFace

// photoBtn.addEventListener("click", capturePhoto);

function capturePhoto() {
    var context = canvas.getContext('2d');

    canvas.width = 400;
    canvas.height = 300;
    context.drawImage(myFace, 0, 0, 400, 300);

    var data = canvas.toDataURL('image/png');
    // photo.setAttribute('src', data);
    console.log(data);
    socket.emit("signImage", data); // Emit base64 Image
}

// setInterval(capturePhoto, 20); // 무한촬영
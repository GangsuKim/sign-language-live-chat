const socket = io(); // io 와 Browser의 연결 (Scoket.io 실행)
// var socket = io.connect('http://' + document.domain + ':' + location.port);

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");

const welcome = document.getElementById("welcome");
const call = document.getElementById("call");
const myNameH1 = document.getElementById('myName');
const footBar = document.getElementById('footBar');

const userId = generateUserID();

call.hidden = true;
myNameH1.hidden = true;
footBar.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;

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
        );

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
    // myStream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
    myStream.getAudioTracks().forEach((track) => (track.enabled = (track.enabled) ? false : true));
    const micIcon = muteBtn.getElementsByTagName('i')[0];

    if (!muted) {
        // muteBtn.innerHTML = "Unmute";
        micIcon.setAttribute('class','bi bi-mic-mute-fill');
        muted = true;
        stopReco();
    } else {
        // muteBtn.innerHTML = "Mute"
        micIcon.setAttribute('class','bi bi-mic-fill');
        muted = false;
        startReco();
    }
}

function handleCameraClick() {
    myStream.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));
    const cameraIcon = cameraBtn.getElementsByTagName('i')[0];

    if (cameraOff) {
        // cameraBtn.innerText = "Turn Camera Off";
        cameraIcon.setAttribute('class','bi bi-camera-video-fill');
        cameraOff = false;
        // myNameH1.hidden = true;
    } else {
        // cameraBtn.innerText = "Turn Camera On";
        // bi bi-camera-video-off-fill
        cameraIcon.setAttribute('class','bi bi-camera-video-off-fill');
        cameraOff = true;
        // myNameH1.hidden = false;
    }
}

async function handleCameraChange() {
    await getMeida(camerasSelect.value); // For my self
    if (myPeerConnection) { // For other browser
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection.getSenders().find(sender => sender.track.kind == "video");
        videoSender.replaceTrack(videoTrack);
    }
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);

// Welcome Form
const welcomeForm = welcome.querySelector('form');

async function intiCall() {
    welcome.hidden = true;
    call.hidden = false;
    footBar.hidden = false;
    await getMeida();
    makeConnection();
    startReco();
}

async function handleWelcomeSubmit(event) {
    event.preventDefault();
    const input = welcome.querySelector('input');
    await intiCall();
    socket.emit("join_room", input.value);
    roomName = input.value; // 방의 이름을 변수에 저장
    input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

socket.on("welcome", async () => { // 다른 사람의 참가 A
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    console.log("Sent offer");
    socket.emit("offer", offer, roomName);
});

socket.on("offer", async (offer) => { // B
    console.log("Recevied offer");
    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer();
    myPeerConnection.setLocalDescription(answer);
    socket.emit("answer", answer, roomName);
    console.log("Sent the answer");
})

socket.on("answer", (answer) => { // A
    console.log("Recevied the answer");
    myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", ice => {
    console.log("Recevied Candidate");
    myPeerConnection.addIceCandidate(ice);
})

// RTC

function makeConnection() {
    myPeerConnection = new RTCPeerConnection({
        iceServers: [{
            urls: [
                "stun:stun.l.google.com:19302",
                "stun:stun1.l.google.com:19302",
                "stun:stun2.l.google.com:19302",
                "stun:stun3.l.google.com:19302",
                "stun:stun4.l.google.com:19302",
            ],
        }, ],
    }); // Create p2p 
    myPeerConnection.addEventListener("icecandidate", handleIce);
    myPeerConnection.addEventListener("addstream", handleAddStrean);
    myStream.getTracks().forEach(track => myPeerConnection.addTrack(track, myStream));
}

function handleIce(data) {
    console.log("Sent Candidate");
    socket.emit("ice", data.candidate, roomName);
}


function handleAddStrean(data) {
    // const peerFace = document.getElementById("peerFace");
    // peerFace.srcObject = data.stream;

    console.log(data.stream);

    const video = document.createElement('video');
    video.setAttribute('class', 'peerFace');
    video.setAttribute('id', data.stream.id);
    socket.emit("idConnection", data.stream.id);
    video.setAttribute('autoplay', '');
    video.setAttribute('playsinline', '');
    video.srcObject = data.stream;
    call.appendChild(video);
}

// myPeerConnection.addEventListener("track", handleTrack);

// function handleTrack(data) {
//     console.log(data)
//     console.log("handle track")
//     // const peerFace = document.querySelector("#" + data.streams.id);
//     const peerFace = document.querySelector("#peerFace");
//     peerFace.srcObject = data.streams[0]
// }

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

function generateUserID() {
    let date = new Date();
    const userString = "" + date.getHours() + date.getMinutes() + date.getSeconds() + date.getMilliseconds() + navigator.userAgent;
    var hash = CryptoJS.SHA256(userString);
    return hash.toString();
}

// Video to Photo
const canvas = document.getElementById('canvas');
const photo = document.getElementById('photo');
const photoBtn = document.getElementById('capImage');
// const myFace = document.getElementById('myFace'); //myFace

photoBtn.addEventListener("click", capturePhoto);

function capturePhoto() {
    var context = canvas.getContext('2d');

    canvas.width = 400;
    canvas.height = 300;
    context.drawImage(myFace, 0, 0, 400, 300);

    var data = canvas.toDataURL('image/png');
    photo.setAttribute('src', data);
    console.log(data);
}

// setInterval(capturePhoto, 20); // 무한촬영
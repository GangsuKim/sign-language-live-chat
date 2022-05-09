const chatForm = document.getElementById('chatForm');
const userChat = document.getElementById('userChat');

chatForm.addEventListener('submit', (event) => {
    event.preventDefault();
    appendMyChat(userChat.value);
    userChat.value = '';
});

userChat.addEventListener('keydown', (event) => {
    if(event.keyCode == 13) {
        event.preventDefault();
        document.getElementById('sendChat').click();
    }
});

function appendMyChat(text) {   
    socket.emit("user_message", {userText: text, userName: userName}, roomName);

    const myChatBoxDiv = document.createElement('div');
    myChatBoxDiv.setAttribute('class','myChatBox')
    myChatBoxDiv.innerHTML = '<span id="myNameOnChat">' + userName + '</span><br>';
    myChatBoxDiv.innerHTML += '<span id="textArea">' + text + '</span>';

    document.getElementById('chatBox').appendChild(myChatBoxDiv);
}

function appendReceiveUserChat(data) {
    const receiveChatBoxDiv = document.createElement('div');
    receiveChatBoxDiv.setAttribute('class','receiveChatBox')
    receiveChatBoxDiv.innerHTML = '<span id="myNameOnChat">' + data['userName'] + '</span><br>';
    receiveChatBoxDiv.innerHTML += '<span id="textArea">' + data['userText'] + '</span>';

    document.getElementById('chatBox').appendChild(receiveChatBoxDiv);
}

socket.on("user_message_from", async (data) => {
    appendReceiveUserChat(data);
});
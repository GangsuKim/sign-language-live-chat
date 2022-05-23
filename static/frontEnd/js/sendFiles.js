const sendFile = document.getElementById('sendFile');
const inputUploadFile = document.getElementById('uploadFile');

sendFile.addEventListener('click', () => {
    inputUploadFile.click();
});

inputUploadFile.addEventListener('change', (e) => {
    const file = inputUploadFile.files[0];
    if (file) {
        const fileNameStr = CryptoJS.SHA256(roomName + '_' + userName + '_' + timeString.getTime() + '_' + fileName)
        showFileOnChat(file, 'ME', fileNameStr.toString());
        const timeString = new Date()


        socket.emit("fileUpload", {
            file: file,
            fileName: file.name,
            userName: userName,
            roomName: roomName,
            timeStr: timeString.getTime(),
            fileNameHash: fileNameStr.toString()
        })
    }
})

function showFileOnChat(file, sender, fileNameStr) {
    const fileMessage = document.createElement('div');
    if (sender === 'ME') {
        fileMessage.setAttribute('class', 'fileMessage');
    }
    fileMessage.innerHTML = '<a id="fileName">' + file.name + '</a><br>';
    fileMessage.innerHTML += '<a id="size"> Size ' + file.size + ' KB </a><br>';
    fileMessage.innerHTML += '<div class="downloadBtn"><a href="./static/files/' + fileNameStr  + '" download><i class="bi bi-download"></i></a></div>';
    
    if(sender === 'ME' && lastSender != 'ME') {
        document.getElementById('chatBox').innerHTML += '<span id="myFileSenderName">' + userName + '</span><br>';
        lastSender = 'ME';
    }

    document.getElementById('chatBox').appendChild(fileMessage);
    fileMessage.scrollIntoView();
}

// Receive File
socket.on('userSendFile', data => {
    console.log(data);
})
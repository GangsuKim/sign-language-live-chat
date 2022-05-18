const joinRoomBtn = document.getElementById('joinRoomBtn');
const joinRoomName = document.getElementById('joinRoomName');
const joinUserName = document.getElementById('joinUserName');
const privateKey = 'capston2022-SIGN';

joinRoomBtn.addEventListener('click', function () {
    if (joinRoomName.value == '') {
        alert('방 이름을 입력해 주세요');
        joinRoomName.focus();
    } else {
        var data;
        if(sessionStorage.getItem('userLogined')) {
            data = {
                'name' : sessionStorage.getItem('LoginedName'),
                'room' : joinRoomName.value
            }
        } else {
            const promptUserName = prompt('사용자 이름을 입력해 주세요');
            data = {
                'name' : promptUserName,
                'room' : joinRoomName.value
            }
        }

        const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), privateKey).toString();
        location.href = '/room?data=' + encrypted;
    }
});
const socket = io(); // io 와 Browser의 연결 (Scoket.io 실행)
const login_btn = document.getElementById('login_btn');
const sigin_in_div = document.getElementsByClassName('signInDiv')[0];
const signin_btn = document.getElementById('signIn');
const signOut_btn = document.getElementById('signOut');


signin_btn.addEventListener('click', function() {
    if(!sessionStorage.getItem('userLogined')) {
        sigin_in_div.hidden = false;
    }
})

signOut_btn.addEventListener('click', function() {
    sessionStorage.clear();
    location.reload();
})

login_btn.addEventListener('click', () => {
    const userInId = document.getElementById('signID');
    const userInPw = document.getElementById('signPW');

    socket.emit("SignIn", {
        signId: userInId.value,
        signPw: userInPw.value
    });
})

socket.on('SignInRes', (res) => {
    if(res['states'] === 'Success') {
        sessionStorage.setItem('userLogined', true);
        sessionStorage.setItem('LoginedID', res['userId']);
        sessionStorage.setItem('LoginedName', res['userName']);
        sigin_in_div.hidden = true;
        location.reload();
    } else {
        alert('아아디/비밀번호가 일치하지 않습니다.');
    }
});


window.onload = function() {
    const sigininup_div = document.getElementById('signInUpDiv');
    const logined_div = document.getElementById('logined');
    

    if(sessionStorage.getItem('userLogined')) {
        sigininup_div.hidden = true;
        logined_div.hidden = false;
    }
}
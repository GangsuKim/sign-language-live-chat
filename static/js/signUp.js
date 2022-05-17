function signUp(id, pw, name, birth) {
    socket.emit("SignUp", {
        signId: id,
        signPw: pw,
        signName: name,
        signBirth:birth
    });
}

function IDExist(id) {
    socket.emit("IDExist", id);
}



socket.on('resIDExist', (res) => {
    console.log(res)
});
const sendFile = document.getElementById('sendFile');
const inputUploadFile = document.getElementById('uploadFile');

sendFile.addEventListener('click', () => {
    inputUploadFile.click();
});

inputUploadFile.addEventListener('change', (e) => {
    if(inputUploadFile.files[0]) {
        console.log(inputUploadFile.files[0]);
    }
})
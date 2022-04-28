console.log(generateUserID());

function generateUserID() {
    let date = new Date();
    const userString = "" + date.getHours() + date.getMinutes() + date.getSeconds() + date.getMilliseconds() + navigator.userAgent;
    var hash = CryptoJS.SHA256(userString);
    return hash.toString();
}
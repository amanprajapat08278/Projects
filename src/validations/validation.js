function validateEmail(email) {
    let regex = /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/
    return ( typeof(email) !="string" || regex.test(email)) ? true :false
}

function validPassword(password) {
    let regex = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,15}$/;
    return regex.test(password);
}

function isValidMobile(phone){
    let regex = /^[6-9][0-9]{9}$/
    return regex.test(phone)
}

function isValidname(firstname){
    let result = (typeof(firstname) == "string" && /^[a-zA-Z]+$/.test(firstname.trim()))?true:false
    // if(result){
    //     firstname = firstname.trim()
    //     return firstname.replace(firstname[0], firstname[0].toUpperCase())
    // }else{
    //     return false
    // }
    return result
}

module.exports = {validateEmail, validPassword,isValidMobile, isValidname }
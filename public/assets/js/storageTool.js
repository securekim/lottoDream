
const MAX_POOL = 5;

//1부터 시작함. 0인 경우 없는것임.
let lastNumber = Number(localStorage.getItem('lastNumber')); 

let tempDream = localStorage.getItem('tempDream');
if(tempDream){
    $('#TEXTAREA_DREAM').val(tempDream);
}


const STORAGE_addDream = (title, dream, score) => {
//0
    let today = new Date();
    let jsonContext = JSON.stringify({title:title, dream:dream, score:score, date:
        today.toLocaleDateString()});
    let jsonTemp = {};
    if(lastNumber == MAX_POOL ){ //꽉 찬 경우 하나씩 내려서 비워줌
        for(var i=1; i<lastNumber; i++){
            jsonTemp = localStorage.getItem(i+1);
            localStorage.setItem(i, jsonTemp);
        }
    } else {
        lastNumber++; //꽉 안 찬 경우 인덱스를 하나 증가시키자
        localStorage.setItem('lastNumber',lastNumber);
    }
    localStorage.setItem(lastNumber,jsonContext);
    refreshTableWithStorage_LOCKER();
    refreshTableWithStorage_LOTTO();
}

const STORAGE_getDreams = () =>{
    let dreams = [];
    if(lastNumber != 0) 
        for(var i=1; i<=MAX_POOL; i++){
            let temp = localStorage.getItem(i);
            if(temp) {
                dreams.push(JSON.parse(temp))
            }
            
        }
    return dreams;
}

const STORAGE_delDreams = () =>{
    for(var i=1; i<=MAX_POOL; i++){
        localStorage.removeItem(i);
    }
    localStorage.setItem('lastNumber',0);
    refreshTableWithStorage_LOCKER();
    refreshTableWithStorage_LOTTO();
}

const STORAGE_saveTemp = (dream) =>{
    localStorage.setItem("tempDream",dream);
}


const STORAGE_saveContact = (message, name, email) =>{
    localStorage.setItem("tempMessage",message);
    localStorage.setItem("tempName",name);
    localStorage.setItem("tempEmail",email);
}

const STORAGE_loadContact = ()=>{
    let tempMessage = localStorage.getItem('tempMessage');
    let tempName = localStorage.getItem('tempName');
    let tempEmail = localStorage.getItem('tempEmail');
    if(tempMessage){
        $('#message').val(tempMessage);
    }
    if(tempName){
        $('#name').val(tempName);
    }
    if(tempEmail){
        $('#email').val(tempEmail);
    }
}

const STORAGE_delContact = ()=>{
    localStorage.removeItem('tempMessage');
    localStorage.removeItem('tempName');
    localStorage.removeItem('tempEmail');
    $('#message').val("");
    $('#name').val("");
    $('#email').val("");
}

STORAGE_loadContact();
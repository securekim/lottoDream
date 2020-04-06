
let SERVER = window.location.href;
 

//[HEADER]
const H_SUCCESS_REQ         = 200;
const H_SUCCESS_MODIFY      = 201;
const H_FAIL_BAD_REQUEST    = 400;
const H_FAIL_UNAUTHORIZED   = 401;
const H_FAIL_FORBIDDEN      = 403;
const H_FAIL_NOT_FOUND      = 404;
const H_FAIL_NOT_ACCEPTABLE = 406;
const H_FAIL_SERVER_ERR     = 500;
const H_FAIL_SERVER_HACKED  = 501;

/*
   [Register User]
   ID : 아이디 
   PW : 패스워드
   EMail : 비워도 됨
   NM : 닉네임
   type : kakao / facebook / google / NA
   platform : iOS / Android / Web / NA

   Callback(JSON) : {status, result}
    
   //USAGE EXAMPLE
        register("myID", "myPW", "myEmail@email.com", "myNickName", "NA", "Web", (result)=>{
            console.table(result);
        })
*/
function register(ID, PW, Email, NM, type, platform, callback){
    GENERAL_REQ("POST", SERVER+"users", {ID:ID, PW:SHA256(PW), Email:Email, NM:NM, type:type, platform:platform}, (result)=>{
        callback(result);
    });
}

/*
   [Login]
   ID : 아이디 
   PW : 패스워드

   Callback(JSON) : {status, result}
    
   //USAGE EXAMPLE
        login("myID", "myPW", (result)=>{
            console.table(result);
        })
*/
function login(ID, PW, callback){
    GENERAL_REQ("POST", SERVER+"login", {ID:ID, PW:SHA256(PW)}, (result)=>{
        callback(result);
    })
    socket.emit("login", {ID:ID, PW:SHA256(PW)});
}

/*
   [로그인 된 상태인지 확인]
   Callback(JSON) : {status, result}
    
   //USAGE EXAMPLE
        isLoggedIn((result)=>{
            console.table(result);
        })
*/
function isLoggedIn(callback){
    GENERAL_REQ("GET", SERVER+"login", null, (result)=>{
        callback(result);
    });
    socket.emit("isLoggedIn");
}

/*
   [Logout]
   Callback(JSON) : {status, result}
    
   //USAGE EXAMPLE
        logout((result)=>{
            console.table(result);
        })
*/
function logout(callback){
    GENERAL_REQ("DELETE", SERVER+"login", null, (result)=>{
        callback(result);
    });
    socket.emit("logout");
}

/*
   [게임 종료 후 결과 로깅하는 부분]
   [이상한 데이터가 넘어올 시 서버에서는 해킹이라고 판단, 일단 -1점]
   History : [{Coin: 'CoinType', Sec : 'Press Time(ms)'}, ...] 
   target  : target

   Callback(JSON) : {status, result}
    
   //USAGE EXAMPLE
        writeHistory([{Coin: 500, Sec : 100}, {Coin: 100, Sec : 250}, {Coin: 100, Sec : 500}] , 700, (result)=>{
            console.table(result);
        };
*/
function writeHistory(History, target, callback){
    GENERAL_REQ("POST", SERVER+"history", {History:History, target:target}, (result)=>{
        callback(result);
    });
}

/*
   [나의 포인트 가져오는 부분]

   Callback(JSON) : {status, result}
    
   //USAGE EXAMPLE
        readHistory((result)=>{
            console.table(result);
        })
*/
function readHistory(callback){
    GENERAL_REQ("GET", SERVER+"history", null, (result)=>{
        let point = null;
        if(result.status == H_SUCCESS_REQ){
            try{
                point = result.result.split(":")[1].split("}")[0]
            }catch(e){}
        }
        result.result = point;
        callback(result);
    });
}


///////////////////////////WEB SOCKET ////////////////////////////

var socket = io.connect(SERVER);

//최초 시작시 exit 
multi_exitRoom();

socket.on('login', function (data) {
    //Body
    console.log("[WS] :" +JSON.stringify(data));
});

socket.on('isLoggedIn', function (data) {
    //True / False
    console.log("[WS] Logged In :" +JSON.stringify(data));
});


//방 참여의 기준은 내가 직접 방을 만들었냐 아니냐임.

//이미 방에 참여 되어있던 경우 fail이 true로 옴
function multi_getRoom(){
    socket.emit("getRoom");
}

//이미 내가 만든 경우에는 안됨. (내가 만든 경우만)
function multi_makeRoom(){
    socket.emit("makeRoom");
}

//게임 룸에 혹시 들어가 있을까봐.
function multi_exitRoom(status){
    socket.emit("exitRoom", {status:status});
}

//내가 만든 방 기준
socket.on('getRoom', function (data) {
    //{"fail":false,"result":{"hostID":"myID","total":2,"IDS":["myID"],"target":null,"histories":{}}}
    console.log("[WS] getRoom :" + JSON.stringify(data));
});

//UI 없이 그냥 방이 꽉차면 스타트게임!
socket.on('fullRoom', function(){
    console.log("[WS] Room is full.")
    multi_startGame();
})

socket.on('exitRoom', function(data){
    console.log("[WS] Escape room.", JSON.stringify(data));
})

//hostID: "myID"
//hostNM: "myNickName"
//level: 0
//point: 0
//total: 2
//IDS: ["myID"]
//target: 900

// 내가 참여를 해놓고 새로 방을 팔 수도 있다. 
socket.on('makeRoom', function (data) {
    // [WS] makeRoom :{"fail":true,"result":"Your room is already exist."}
    console.log("[WS] makeRoom :"+JSON.stringify(data));
});

//게임 시작!
function multi_startGame(){
    socket.emit("startGame");
}

//게임이 시작되었습니다 알림.
socket.on('startGame', function (data) {
    //{"fail":false,"result":{"hostID":"myID","hostNM":"myNickName","level":0,"point":0,"total":2,"IDS":["myID","myID2"],"target":600,"histories":{}}}
    console.log("[WS] startGame :"+JSON.stringify(data));
});

//누군가 들어왔거나 나갔다.
socket.on('playerChanged', function (data) {
    console.log("[WS] Room info is changed  :"+JSON.stringify(data));
    if(data.roomInfo.total <= data.roomInfo.IDS.length){
        //방에 사람이 꽉차부렀네
        multi_startGame();
    }
});

//Confirm 후 History 를 서버에 보낸다. 
//  multi_writeHistory([{Coin: 500, Sec : 100}, {Coin: 100, Sec : 250}, {Coin: 100, Sec : 500}])
function multi_writeHistory(History){
    socket.emit("writeHistory", History);
}

socket.on('writeHistory', function (data) {
    console.log("[WS] writeHistory :" +JSON.stringify(data));
});

//다른사람들이 한것도 올라옴.
socket.on('roomHistory', function(data){
    console.log("[WS] roomHistory :" +JSON.stringify(data));
})

//게임이 종료되었다는 알림.
socket.on('endGame', function (data) {
    console.log("[WS] endGame :" +JSON.stringify(data));
    multi_exitGame("endGame");
});

//방에서 나가는 용도.
//게임 참여 후 정상 종료시 status 가 endGame
//게임 참여 후 도중에 종료시 status 가 exitGame
function multi_exitGame(status){
    socket.emit("exitGame", {status:status});
    socket.emit("exitRoom", {status:status});
}

function multi_endGame(){

}

function multi_coinPush(coin){
    socket.emit("coinPush", coin);
}

socket.on('coinPush', function (data) {
    console.log("[WS] coinPush :" +JSON.stringify(data));
});

function multi_exitRoom(){
    socket.emit("exitRoom");
}

function GENERAL_REQ(method, url, jsonData, callback){
    console.log("General REQ : "+method);
    let xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onreadystatechange = () => {
        if(xhr.readyState == 4 && typeof callback != "undefined") //여러번 호출되므로 종료시에만
            callback({status:xhr.status, result:xhr.responseText});
    };
    if(typeof jsonData == "undefined" || !jsonData) {
        xhr.send();
    } else {
        console.log(jsonData);
        xhr.send(JSON.stringify(jsonData));
    }
    
}

function SHA256(r){
    var n=8,t=0;function e(r,n){var t=(65535&r)+(65535&n);return(r>>16)+(n>>16)+(t>>16)<<16|65535&t}function o(r,n){return r>>>n|r<<32-n}function u(r,n){return r>>>n}function a(r,n,t){return r&n^~r&t}function f(r,n,t){return r&n^r&t^n&t}function c(r){return o(r,2)^o(r,13)^o(r,22)}function i(r){return o(r,6)^o(r,11)^o(r,25)}function h(r){return o(r,7)^o(r,18)^u(r,3)}return function(r){for(var n=t?"0123456789ABCDEF":"0123456789abcdef",e="",o=0;o<4*r.length;o++)e+=n.charAt(r[o>>2]>>8*(3-o%4)+4&15)+n.charAt(r[o>>2]>>8*(3-o%4)&15);return e}(function(r,n){var t,C,g,A,d,v,S,l,m,y,w,b=new Array(1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298),p=new Array(1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225),B=new Array(64);r[n>>5]|=128<<24-n%32,r[15+(n+64>>9<<4)]=n;for(var D=0;D<r.length;D+=16){t=p[0],C=p[1],g=p[2],A=p[3],d=p[4],v=p[5],S=p[6],l=p[7];for(var E=0;E<64;E++)B[E]=E<16?r[E+D]:e(e(e(o(w=B[E-2],17)^o(w,19)^u(w,10),B[E-7]),h(B[E-15])),B[E-16]),m=e(e(e(e(l,i(d)),a(d,v,S)),b[E]),B[E]),y=e(c(t),f(t,C,g)),l=S,S=v,v=d,d=e(A,m),A=g,g=C,C=t,t=e(m,y);p[0]=e(t,p[0]),p[1]=e(C,p[1]),p[2]=e(g,p[2]),p[3]=e(A,p[3]),p[4]=e(d,p[4]),p[5]=e(v,p[5]),p[6]=e(S,p[6]),p[7]=e(l,p[7])}return p}(function(r){for(var t=Array(),e=(1<<n)-1,o=0;o<r.length*n;o+=n)t[o>>5]|=(r.charCodeAt(o/n)&e)<<24-o%32;return t}(r=function(r){r=r.replace(/\r\n/g,"\n");for(var n="",t=0;t<r.length;t++){var e=r.charCodeAt(t);e<128?n+=String.fromCharCode(e):e>127&&e<2048?(n+=String.fromCharCode(e>>6|192),n+=String.fromCharCode(63&e|128)):(n+=String.fromCharCode(e>>12|224),n+=String.fromCharCode(e>>6&63|128),n+=String.fromCharCode(63&e|128))}return n}(r)),r.length*n))
}


////////////////////////////////////


function a_test(){
    register("myID", "myPW", "myEmail@email.com", "myNickName", "NA", "Web", (result)=>{
        console.table(result);
    })

    login("myID", "myPW", (result)=>{
        console.table(result);
    })

}




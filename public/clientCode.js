
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

//

/*
    post_dream_number 함수
   
   //설명
     /dream/number 에 POST 로 요청해서 꿈 정보를 DB에 저장

   //매개변수
    token : 아이디(토큰) 
    dream : 꿈 제목
    round : 회차
    data : {numArr:[숫자들], wordArr:[단어들]}
    callback : 콜백 - {status, result}
    
   //사용 예제
    post_dream_number(
        "tokenExample", 
         "꿈제목", 
         155, 
         {numArr:[2,3,42,45,6,5,7], wordArr:["가위","가방","하이","바이","응","아니"]}, 
         (result) => 
         { 
            console.table(result); 
             
            if(result.status == H_SUCCESS_REQ || result.status == H_SUCCESS_MODIFY) console.log("성공 ! ");
            else console.log("실패 ! ");
         }) 

   //결과 예제
    {status: 200, result: "{"fieldCount":0,"affectedRows":1,"insertId":1,"ser…0,"message":"","protocol41":true,"changedRows":0}"}
*/

function post_dream_number(token, dream, round, data, callback){
    console.log(data);
    console.log(data.number);
    console.log(data.word);
    round = Number(round);
    
    GENERAL_REQ("POST", SERVER+"dream/number", {token:token, dream:dream, round:round, numArr:data.numArr, wordArr:data.wordArr}, (result)=>{
        callback(result);
    });
}



/*
    get_dream_number 함수
   
   //설명
     /dream/number 에 GET 로 요청해서 꿈 정보를 DB에서 불러옴

   //매개변수
    token : 아이디(토큰) 
    dream : 꿈 제목
    
   //사용 예제
    get_dream_number("tokenExample", "꿈제목", (result) => { 
            console.log(result); 
             
            if(result.status == H_SUCCESS_REQ || result.status == H_SUCCESS_MODIFY) console.log("성공 ! ");
            else console.log("실패 ! ");
         }) 

   //결과 예제
    {status: 200, result: "[{"iddreams":2,"token":"tokenExample","id":"NULL",…s":"2,3,42,45,6,5,7","words":"가위,가방,하이,바이,응,아니"}]"}
*/

function get_dream_number(token, dream, callback){
    GENERAL_REQ("GET", SERVER+"dream/number/"+token+"/"+dream, null, (result)=>{
        callback(result);
    });
}



//register("myID", "myPW", "myEmail@email.com", "myNickName", "NA", "Web", (result)=>{ console.table(result); })

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


function GENERAL_REQ(method, url, jsonData, callback){
    let xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onreadystatechange = () => {
        if(xhr.readyState == 4 && typeof callback != "undefined"){ //여러번 호출되므로 종료시에만
            callback({status:xhr.status, result:xhr.responseText});
        }
    };
    if(typeof jsonData == "undefined" || !jsonData) {
        xhr.send();
    } else {
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




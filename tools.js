
let rooms = []; // [{hostNM, IDS[], level, point}, ...]


let roomsJSON = {}; // {roomID:{IDS[], level, point, total}}
//history 를 보고 이게 정상인지 확인
//[{Coin, Sec}, ...,], target
const isChallengeOK=(history, target)=>{

}

const isNone = (value) =>{
    if(typeof value == "undefined" || value == null || value == "") return true;
    return false;
}

const isLogout = (req) =>{
    return isNone(req.session.uid);
}

const isLogoutWS = (socket) => {
    return isNone(socket.handshake.session.uid);
}

//todo : req 를 받아서 로그 출력
const LOGD = (req) =>{
    
}

//todo : req 를 받아서 아이피, 계정 정보와 관련 데이터 로그를 저장
const saveLog = (req) =>{

}

//level 1 : 100 ~ 1000
//level 2 : 100 ~ 2000
//평균레벨 1.2 뭐 이런거는 올림.
const getRandomTarget = (level) =>{
    return (Math.ceil(Math.random() * 10 * (level+1))) * 100;
}

function toJSON(stringOrJSON) {
    if(typeof stringOrJSON != 'object'){
        try {
            stringOrJSON = JSON.parse(stringOrJSON);
        } catch (e) {
            //It's not a JSON.
            try{
                stringOrJSON = JSON.parse(stringOrJSON.replace(/\'/g, '"'))
            } catch(e) {
                stringOrJSON = null;
            }
        }
    }
    return stringOrJSON;
}


function randomRange(n1, n2) {
    return Math.floor( (Math.random() * (n2 - n1 + 1)) + n1 );
}

const getUserInfo = (socket) =>{
    const ID = socket.handshake.session.uid;
    const NM = socket.handshake.session.NM;
    const level = socket.handshake.session.level;
    const point = socket.handshake.session.point;
    return {ID: ID, NM: NM, level: level, point: point};
}

const makeRoom = (socket, total) =>{ // total : 방의 전체 인원
    let ID = socket.handshake.session.uid;
    if(typeof roomsJSON["ROOM_"+ID] != "undefined"){
        return null;
    } else {
        //배열을 사용해서 관리하면 RaceCondition 의 우려가 있을듯.
        let roomInfo = {
            hostID : ID,
            hostNM : socket.handshake.session.NM,
            level : socket.handshake.session.level,
            point : socket.handshake.session.point,
            total : total,
            IDS : [ID],
            status : "ready",
            target : getRandomTarget(socket.handshake.session.level),
            gameTime : "",
            histories : {}
        }
        roomsJSON["ROOM_"+ID] = roomInfo;
        rooms.push(roomInfo);
        return roomInfo;
    }
    //rooms.push(roomInfo);
    //return rooms.length;
}

//현재는 먼저 생성된 방 순서로 들어감
//사람이 한명 들어가면 큐 맨 뒤로 가게 할 것. (멀티 고려)
const getIntoRoom = (socket) =>{
    let ID = socket.handshake.session.uid;
    //이미 내가 만든 방이 있는 경우
    if(typeof roomsJSON["ROOM_"+ID] != "undefined")
        return {fail: false, result: roomsJSON["ROOM_"+ID]};

    for(var i in rooms){
        var room = rooms[i];
        //인원이 꽉 차있거나, 게임이 시작했거나, 게임이 끝난 경우엔 다른 룸을 찾는다. 
        if(room.IDS.length >= room.total || room.status == "start" || room.status == "end") 
            continue;
        addMemberToRoom(socket, room);
        rooms[i] = room;   
        roomsJSON["ROOM_"+room.hostID] = room;
        return {fail: false, result: room};
    }
    return {fail: true, result: "No room."};
    
    //delete roomsJSON["ROOM_"+room.hostID];
    //룸이 없거나 꽉 차 있으면 ...
//    rooms.shift();
//    rooms.push(addMemberToRoom(socket, room));
}

const updateRoom = (socket, roomInfo) =>{
    let joined = amIjoined(socket);
    if(joined.fail) return {fail:true, result:"You are not in the room"};
    roomsJSON["ROOM_"+joined.result.hostID] = roomInfo;
    for(var i in rooms){
        if(rooms[i].hostID == joined.result.hostID){
            rooms[i] = roomInfo;
        }
    }
}

const updateRoomStatus = (hostID, status) =>{
    roomsJSON["ROOM_"+hostID].status = status;
    for(var i in rooms){
        if(rooms[i].hostID == hostID){
            rooms[i].status = status;
        }
    }
}

const deleteRoom = (socket) =>{
    let joined = amIjoined(socket);
    if(joined.fail) return {fail:true, result:"You are not in the room"};
    //roomsJSON["ROOM_"+joined.result.hostID] = roomInfo;
    delete roomsJSON["ROOM_"+joined.result.hostID];
    for(var i in rooms){
        if(rooms[i].hostID == joined.result.hostID){
            rooms.splice(i,1);
            break;
        }
    }
}


//특정 룸에 멤버가 들어오고 값들 재계산.
//코인 값도 레벨 평균에 맞춰서 재계산
const addMemberToRoom = (socket, room) =>{
    room.IDS.push(socket.handshake.session.uid);
    room.level = room.level + socket.handshake.session.level / room.IDS.length;
    room.point = room.point + socket.handshake.session.point / room.IDS.length;
    room.target = getRandomTarget(room.level)
    return room
}


//특정 룸에 멤버가 삭제되고 값들 재계산.
//코인 값도 레벨 평균에 맞춰서 재계산
const delMemberToRoom = (socket, room) =>{
    //arr.splice(arr.indexOf("A"),1); // "A"를 찾아서 삭제한다.
    let result = {fail:true, result:""};
    try{
        room.IDS.splice(room.IDS.indexOf("socket.handshake.session.uid"),1);
        room.level = room.level - socket.handshake.session.level / room.IDS.length;
        room.point = room.point - socket.handshake.session.point / room.IDS.length;
        room.target = getRandomTarget(room.level)
        result = {fail:false, result:room};
    } catch(e){
        console.log(e);
    }
    return result;
}

//내가 방장인 룸 삭제.
const deleteMyRoom = (socket) =>{
    for(var i in rooms){
        if(rooms[i].hostID == socket.handshake.session.uid){
            rooms.splice(i,1);
            delete roomsJSON["ROOM_"+socket.handshake.session.uid];
            return true;
        }
    }
    delete roomsJSON["ROOM_"+socket.handshake.session.uid];
    return false;
}

const amIjoined = (socket) => {
    for(var i in socket.rooms){
        if(i.includes("ROOM_",0)) return {fail:false, result:roomsJSON[i]}; 
    }
    return {fail:true, result:""};
}

const amIhost = (socket, joined) => {
    //내가 방에 있고, 방의 아이디와 내 아이디가 같은 경우.
    if(!joined.fail && socket.handshake.session.uid == joined.result.hostID) return {fail: false, result:joined.result};
    return {fail: true, result:""}; 
}

const getChallengePoint = (History, target) =>{
    if(!Array.isArray(History)) return -1;
    for(var i in History){
        target -= History[i].Coin;
    }
    if(target == 0) return 1;
    return 0;
}

// 첫번째. 맞춘 사람 ID.
// 두번째. 맞춘 사람들 중에 가장 history 시간의 합이 적은사람.
// 아무도 맞춘 사람이 없으면 null
// 시간이 완전히 같으면 ? 
//  네트워크 상황이 안좋아서 조금이라도 더 늦게 도착한 패킷.
//  -> 시작도 조금 늦었을 것이라고 가정
//histories : {ID : {Coinsum, Secsum}}
const whoIsTheBest = (histories, target) =>{
    let bestSec = 9999999999999;
    let bestID = null;
    for(var i in histories){
        if(histories[i].Coinsum == target){
            if( bestSec > histories[i].Secsum ){
                bestID = i;
            }
        }
    }
    return bestID;
}

const addHistoryToRoom = (socket, myHistory) =>{
    let joined = amIjoined(socket);
    if(joined.fail) return {fail:true, result:"You are not in the room"};
    let ID = socket.handshake.session.uid;
    /*
    let roomInfo = {
        ...
            histories : {ID : {Coinsum, Secsum}, ...}
        }
    */
   //myHistory = [{Coin: 500, Sec : 100}, {Coin: 100, Sec : 250}, {Coin: 100, Sec : 500}]
    let Coinsum = 0;
    let Secsum = 0;
    for(var i in myHistory) {
        Coinsum += myHistory[i].Coin;
        Secsum += myHistory[i].Sec;
    }
    
    roomsJSON["ROOM_"+joined.result.hostID].histories[ID] = {Coinsum : Coinsum, Secsum : Secsum};
    for(var i in rooms){
        if(rooms[i].hostID == joined.result.hostID){
            rooms[i] = roomsJSON["ROOM_"+joined.result.hostID];
        }
    }
    return {fail:false, result:roomsJSON["ROOM_"+joined.result.hostID]};
}

module.exports = {
    isChallengeOK,
    isNone,
    isLogout,
    isLogoutWS,
    getChallengePoint,
    getIntoRoom,
    makeRoom,
    amIjoined,
    amIhost,
    getUserInfo,
    addHistoryToRoom,
    whoIsTheBest,
    delMemberToRoom,
    updateRoom,
    deleteRoom,
    deleteMyRoom,
    roomsJSON,
    rooms,
    toJSON,
    updateRoomStatus
};



//socket io -> 
//https://archive.codeplex.com/?p=socketio4net
//Install-Package SocketIO4Net.Client -Version 0.6.26

/*
//다른 파일에서 사용하는 방법 : 
//cobeLib.cs 파일을 동일 폴더에 넣고 아래와 같이 사용하면 됨.
// 단, 아래 패키지 설치 필요
https://github.com/nhn/socket.io-client-unity3d/releases/download/v.1.1.2/socket.io-client-unity3d.unitypackage

        var cobe = new cobeLib();

        try{
            cobe.init(init_ => {
                //CALLBACK : connected
                Debug.Log(init_);
                
                cobe.register("myID5", "myPW", "myEmail5@email.com", "myNickName", "NA", "Web", result=>{
                    //실패시 : {"fail":true,"result":{"code":"ER_DUP_ENTRY","errno":1062,"sqlMessage":"Duplicate entry 'myID' ...
                    //성공시 : {"fail":false,"result":"Success"}
                    Debug.Log(result);
                });

                cobe.isloggedIn(isLoggedIn_=>{
                    //{"fail":true}
                    Debug.Log("isLoggedIn1 "+isLoggedIn_);
                });
                cobe.login("myID","myPW", login_=>{
                    //{"fail":false,"result":"Success"}
                    Debug.Log(login_);

                    cobe.isloggedIn(isLoggedIn_=>{
                        //{"fail":false,"result":"myID"}
                        Debug.Log("isLoggedIn2 "+isLoggedIn_);
                    });
                });
                cobe.isloggedIn(isLoggedIn_=>{
                    //{"fail":true}
                    Debug.Log("isLoggedIn3 "+isLoggedIn_);
                });
            });
        } catch {
            Debug.Log("ERROR ! ");
        }
        
*/

//socket io -> 
//https://archive.codeplex.com/?p=socketio4net
//Install-Package SocketIO4Net.Client -Version 0.6.26

using UnityEngine;
using System;
using System.Collections;
using System.Text;
// FOR NETWORKING /////////////////////////////////////////
//  using SocketIO; // -> socketIO Lib
using socket.io;    // -> NHN Library
using UnityEngine.Networking;
using System.Security.Cryptography;
///////////////////////////////////////////////////////////

public class cobeLib : MonoBehaviour {

//[HEADER]
static int H_SUCCESS_REQ         = 200;
static int H_SUCCESS_MODIFY      = 201;
static int H_FAIL_BAD_REQUEST    = 400;
static int H_FAIL_UNAUTHORIZED   = 401;
static int H_FAIL_FORBIDDEN      = 403;
static int H_FAIL_NOT_FOUND      = 404;
static int H_FAIL_NOT_ACCEPTABLE = 406;
static int H_FAIL_SERVER_ERR     = 500;
static int H_FAIL_SERVER_HACKED  = 501;


    public Socket socket = Socket.Connect("http://aws.securekim.com");
    //readonly Dictionary<string, Action<string>> _handlers = new Dictionary<string, Action<string>>();

    public void init(System.Action<string> callback){
    /////////////////////////////////////////////// TEST SERVER //////////////////////////
        // 서버로 접속 시도~
        
        // 접속 완료 이벤트 처리

        socket.On("connect", () => {
            callback("CALLBACK : connected");
        });

        /////////// SOCKET ON - RES PACKET FROM SERVER /////////


        //방이 꽉차면 
        //  TODO : 스타트게임!
        socket.On("fullRoom", (string data)=>{
            Debug.Log("fullRoom : "+data);
            startGame(result=>{
                Debug.Log("startGame : " + result);
            });
        });

        //누군가 들어왔거나 나갔을 때 동작
        socket.On("playerChanged", (string data) => {
            Debug.Log("playerChanged : " + data);
//            TODO : 방에 사람이 꽉차면 게임을 시작해 주세요
//            if(data.roomInfo.total <= data.roomInfo.IDS.length){
//              방에 사람이 꽉차부렀네
                startGame(result=>{
                    Debug.Log("startGame : " + result);
                });
//            }
        });

        //누군가 코인을 쌓았을 때 
        socket.On("coinPush", (string data) => {
            Debug.Log("coinPush : "+data);
        });
        
        //방의 변경 정보를 받습니다.
        socket.On("roomHistory", (string data)=>{
            Debug.Log("roomHistory : "+data);
        });
        
        //게임이 종료되었다는 알림.
        socket.On("endGame", (string data) => {
            Debug.Log("endGame : "+data);
            //게임을 종료합니다
            exitGame("endGame");
        });
    }
//ID, PW, Email, NM, type, platform
    public void register(string ID, string PW, string Email, string NM, string type, string platform, System.Action<string> callback){
        string PW_Hashed=computeSHA256(PW);
        Debug.Log("register ID: "+ID+" PW : "+PW+" Hashed: "+PW_Hashed);
//{ID:ID, PW:SHA256(PW), Email:Email, NM:NM, type:type, platform:platform}
        socket.Emit("register", "{'ID':'"+ID+"','PW':'"+PW_Hashed+"','Email':'"+Email+"','NM':'"+NM+"','type':'"+type+"','platform':'"+platform+"'}");

        socket.On("register", (string data) => {
            //Body
            callback(data);
        });
    }

    public void login(string ID, string PW, System.Action<string> callback){
        string PW_Hashed=computeSHA256(PW);
        Debug.Log("login ID: "+ID+" PW : "+PW+" Hashed: "+PW_Hashed);
        socket.Emit("login", "{'ID':'"+ID+"','PW':'"+PW_Hashed+"'}");
        socket.On("login", (string data) => {
            //Body
            callback(data);
        });
    }
    public void isloggedIn(System.Action<string> callback){
        socket.Emit("isLoggedIn");
        socket.On("isLoggedIn", (string data)=>{
            //True / False & ID
            callback(data);
        });
    }
    
    //TODO : TEST
    public void getRoom(System.Action<string> callback){
        socket.Emit("getRoom");
        
        //방을 가져왔다. 방이 하나도 없으면 만들어서 가져온다.
        socket.On("getRoom", (string data) => {
            //{"fail":false,"result":{"hostID":"myID","total":2,"IDS":["myID"],"target":null,"histories":{}}}
            callback(data);
        });
    }
    
    //TODO : TEST
    public void makeRoom(System.Action<string> callback){
        socket.Emit("makeRoom");
        
        // 내가 참여를 해놓고 새로 방을 팔 수도 있다. 
        socket.On("makeRoom", (string data)=>{
            // [WS] makeRoom :{"fail":true,"result":"Your room is already exist."}
            callback(data);
        });
    }

    //TODO : TEST
    public void exitRoom(System.Action<string> callback){
        socket.Emit("exitRoom");
        socket.On("exitRoom", (string data)=>{
            callback(data);
        });
    }


    //TODO : TEST
    public void startGame(System.Action<string> callback){
        socket.Emit("startGame");
        //게임이 시작되었습니다 알림.
        socket.On("startGame", (string data) => {
            //{"fail":false,"result":{"hostID":"myID","hostNM":"myNickName","level":0,"point":0,"total":2,"IDS":["myID","myID2"],"target":600,"histories":{}}}
            callback(data);
        });
    }


    //TODO : TEST
    //writeHistory([{Coin: 500, Sec : 100}, {Coin: 100, Sec : 250}, {Coin: 100, Sec : 500}])
    public void writeHistory(string history, System.Action<string> callback){
        socket.Emit("writeHistory", history);
        //게임이 시작되었습니다 알림.
        socket.On("writeHistory", (string data) => {
            //{"fail":false,"result":{"hostID":"myID","hostNM":"myNickName","level":0,"point":0,"total":2,"IDS":["myID","myID2"],"target":600,"histories":{}}}
            callback(data);
        });
    }

    public void coinPush(string coin){
        //{"fail":false,"result":{"coinData":100,"userInfo":{"ID":"myID","NM":"myNickName","level":0,"point":0}}}
        socket.Emit("coinPush", coin);
    }

    //TODO : TEST
    // 게임을 종료합니다.
//게임 참여 후 정상 종료시 status 가 endGame
//게임 참여 후 도중에 강제 종료시 status 가 exitGame
    public void exitGame(string status){
        //socket.Emit("login", "{'ID':'"+ID+"','PW':'"+PW_Hashed+"'}");
        socket.Emit("exitGame", "{'status':'"+status+"'}");
        socket.Emit("exitRoom", "{'status':'"+status+"'}");
    }



    public static string computeSHA256(string rawData)  
        {  
            // Create a SHA256   
            using (SHA256 sha256Hash = SHA256.Create())  
            {  
                // ComputeHash - returns byte array  
                byte[] bytes = sha256Hash.ComputeHash(Encoding.UTF8.GetBytes(rawData));  
  
                // Convert byte array to a string   
                StringBuilder builder = new StringBuilder();  
                for (int i = 0; i < bytes.Length; i++)  
                {  
                    builder.Append(bytes[i].ToString("x2"));  
                }  
                return builder.ToString();  
            }  
        }  
}
const   express         = require('express'),
        config          = require('config'),
        bodyParser      = require("body-parser"),
        cors            = require("cors"),
        tools           = require('./tools'),
        database        = require('./database'),
        lotto           = require('./clientLib/dreamLottoLib_v2'),
        path            = require('path'),
        fs              = require('fs'),
        crypto          = require('crypto');
        var request     = require('request');
 
    ///////////////////////////////

    const session = require('express-session');
    const redis = require('redis');
    const redisClient = redis.createClient();
    const redisStore = require('connect-redis')(session);
    
    const app       = express();
    const server    = require('http').createServer(app);
    const io        = require('socket.io')(server);
    const sharedsession = require("express-socket.io-session");

    //////////////////////////////////
    
    const {
        isNone,
    } = tools;

    const {
        generateLotto,
    } = lotto;

    const {
        generalQ,
        QUERY
    } = database;

    ///////////////////////////////////////

    redisClient.on('error', (err) => {
      console.log('Redis error: ', err);
    });
    
    var generalSession = session({
        secret: '_redisSessionSecret',
        key: '_redisKey',
        name: '_redisSession',
        resave: false,
        saveUninitialized: true,
        cookie: { 
          maxAge : 1000 * 60 * 60 * 5 //5시간
        },
        store: new redisStore({ host: 'localhost', port: 6379, client: redisClient, ttl: 86400 }),
      })

    app.use(generalSession);
    io.use(sharedsession(generalSession));

    io.on('connection', (socket) => {
        console.log(socket.handshake.session.uid + ' connected');
        
        socket.on('disconnect', () => {
            console.log("disconnect");
            console.log(socket.handshake.session.uid+' disconnected');
        });
      });
    let userPool = [];

//////////////////////HEADER/////////////////////
const H_SUCCESS_REQ         = 200;
const H_SUCCESS_MODIFY      = 201;
const H_FAIL_BAD_REQUEST    = 400;
const H_FAIL_UNAUTHORIZED   = 401;
const H_FAIL_FORBIDDEN      = 403;
const H_FAIL_NOT_FOUND      = 404;
const H_FAIL_NOT_ACCEPTABLE = 406;
const H_FAIL_SERVER_ERR     = 500;
const H_FAIL_SERVER_HACKED  = 501;

//////////////////////BODY/////////////////////
const B_SUCCESS_REQ         = "Success";
const B_SUCCESS_MODIFY      = "Modified";
const B_FAIL_ID             = "ID is incorrect.";
const B_FAIL_PW             = "PW is incorrect.";
const B_FAIL_LOGIN          = "ID or PW is incorrect.";
const B_FAIL_UNAUTHORIZED   = "You are not logged in.";
const B_FAIL_FORBIDDEN      = "You don't have permission.";
const B_FAIL_WEIRD_DATA     = "Your data is weird.";
const B_FAIL_NOT_FOUND      = "There is no data.";
const B_FAIL_NOT_ACCEPTABLE = "Request is not acceptable.";
const B_FAIL_SERVER_ERR     = "Undefined feature.";
const B_FAIL_SERVER_HACKED  = "Undefined feature! Your log was logged!";
const B_FAIL_SERVER_READY   = "Server is not ready yet.";


class RESULT {
    constructor(reason, result, header){
        this.reason = reason;
        this.result = result;
        this.header = header;
    }
}

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended : true }));

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/public/dimension/index.html'));
});

app.route('/users')
    //todo [users] 전체 유저 정보 가져오기
    .get((req,res)=>{ 
        console.log("GET /users");
        res.status(H_FAIL_SERVER_ERR).send(B_FAIL_SERVER_ERR);
    })
    .post((req,res)=>{ 
        try{
            console.log("POST /users");
            //"INSERT INTO users(ID, Email, NM, type, point, level, platform) VALUES(_GENQ_);",
            let ID       =   req.body.ID
                ,PW      =   req.body.PW
                ,Email   =   req.body.Email
                ,NM      =   req.body.NM
                ,type    =   req.body.type
                ,point   =   0
                ,level   =   0
                ,platform =  req.body.platform;

            if(isNone(ID)){
                res.status(H_FAIL_BAD_REQUEST).send(B_FAIL_ID);
            } else if(isNone(NM)) {
                res.status(H_FAIL_BAD_REQUEST).send(B_FAIL_ID);
            } else if(isNone(PW)) {
                res.status(H_FAIL_BAD_REQUEST).send(B_FAIL_PW);
            } else {
                if(isNone(Email))       Email   = "none@none.com";
                if(isNone(type))        type    = "NA";
                if(isNone(platform))    platform= "NA";
                // 한번 더 HASH
                PW = crypto.createHash('sha256').update(PW).digest('hex');
                let params = [ID, PW, Email, NM, type, point, level, platform];
                generalQ(QUERY.USERS_POST,params,(result)=>{
                    if(result.fail){
                        res.status(H_FAIL_NOT_ACCEPTABLE).send(result.error);
                    } else {
                        res.status(H_SUCCESS_REQ).send(B_SUCCESS_REQ);
                    }
                });
            }
        }catch(e){
            console.log(e);
        }
    })
    //todo [users]회원 정보 수정
    .put((req,res)=>{ 
        res.status(H_FAIL_SERVER_ERR).send(B_FAIL_SERVER_ERR);
    })
    //todo [users]회원들 삭제 
    .delete((req,res)=>{ 
        res.status(H_FAIL_SERVER_ERR).send(B_FAIL_SERVER_ERR);
    })

//todo
app.route('/login')
    .get((req,res)=>{ 
        console.log("isLoggedIn");
        if(isLogout(req)) {
            res.status(H_FAIL_NOT_FOUND).send(B_FAIL_NOT_FOUND);
        } else {
            res.status(H_SUCCESS_REQ).send(req.session.uid);
        }
    })
    .post((req,res)=>{
        // req.body.ID
        // req.body.PW
        let ID = req.body.ID,
            PW = req.body.PW;
        if(isNone(ID)){
            res.status(H_FAIL_BAD_REQUEST).send(B_FAIL_ID);
        } else if(isNone(PW)) {
            res.status(H_FAIL_BAD_REQUEST).send(B_FAIL_PW);
        } else {
            //한번 더 해싱
            PW = crypto.createHash('sha256').update(PW).digest('hex');
            let params = [ID, PW];
            generalQ(QUERY.LOGIN_POST,params,(result)=>{
                if(result.fail){
                    res.status(H_FAIL_NOT_FOUND).send(result.error);
                } else {
                    if(result.rows.length == 0){
                        res.status(H_FAIL_NOT_FOUND).send(B_FAIL_NOT_FOUND);
                    } else {
                        req.session.uid = req.body.ID;
                        res.status(H_SUCCESS_REQ).send(result.rows);
                    }
                }
            });
        }
    })
    .delete((req,res)=>{
        console.log("logout");
        req.session.destroy();
        res.status(H_SUCCESS_REQ).send(B_SUCCESS_REQ);
    })

//todo
app.route('/history')
    .get((req,res)=>{
        if(isLogout(req)) res.status(H_FAIL_UNAUTHORIZED).send(B_FAIL_UNAUTHORIZED);
        else {
            let ID      = req.session.uid;
            generalQ(QUERY.HISTORY_GET,[ID],(result)=>{
                if(result.fail){
                    res.status(H_FAIL_NOT_FOUND).send(result.error);
                } else {
                    if(result.rows.length == 0){
                        res.status(H_FAIL_NOT_FOUND).send(B_FAIL_NOT_FOUND);
                    } else {
                        res.status(H_SUCCESS_REQ).send(result.rows);
                    }
                }
            });
        }
    }) // todo : 시각
    .post((req,res)=>{
        if(isLogout(req)) res.status(H_FAIL_UNAUTHORIZED).send(B_FAIL_UNAUTHORIZED);
        else {
            let History = req.body.History,
                target  = req.body.target,
                ID      = req.session.uid;
            if(isNone(History) || isNone(target)){
                res.status(H_FAIL_BAD_REQUEST).send(B_FAIL_WEIRD_DATA);
            } else {
                let point = getChallengePoint(History, target)
                let params = [ID, JSON.stringify(History), target, point];
                    generalQ(QUERY.HISTORY_POST,params,(result)=>{
                        if(result.fail){
                            res.status(H_FAIL_NOT_FOUND).send(result.error);
                        } else {
                            if(result.rows.length == 0){
                                res.status(H_FAIL_NOT_FOUND).send(B_FAIL_NOT_FOUND);
                            } else {
                                res.status(H_SUCCESS_REQ).send(result.rows);
                            }
                        }
                    });
            }
        }
        //req.body.ID
        //req.body.History []
        //req.body.target
    })

    //https://www.nlotto.co.kr/common.do?method=getLottoNumber&drwNo=905
    //{"totSellamnt":90357634000,"returnValue":"success","drwNoDate":"2020-04-04","firstWinamnt":3017862536,"drwtNo6":40,"drwtNo4":27,"firstPrzwnerCo":7,"drwtNo5":38,"bnusNo":20,"firstAccumamnt":21125037752,"drwNo":905,"drwtNo2":4,"drwtNo3":16,"drwtNo1":3}
    //https://www.nlotto.co.kr/common.do?method=getLottoNumber&drwNo=904
    //{"totSellamnt":88938220000,"returnValue":"success","drwNoDate":"2020-03-28","firstWinamnt":2718077813,"drwtNo6":45,"drwtNo4":26,"firstPrzwnerCo":8,"drwtNo5":43,"bnusNo":11,"firstAccumamnt":21744622504,"drwNo":904,"drwtNo2":6,"drwtNo3":8,"drwtNo1":2}
    //https://www.nlotto.co.kr/common.do?method=getLottoNumber&drwNo=2020
    //{"returnValue":"fail"}
    /*
    {returnValue:"실행 결과",totSellamnt:"누적금",drwNo:"회차",drwNoDate:"당첨일",firstWinamnt:"1등 당첨금",firstPrzwnerCo:"1등 당첨 인원",firstAccumamnt:"1등 당첨금 총액",drwtNo1:"번호1",drwtNo2:"번호2",drwtNo3:"번호3",drwtNo4:"번호4",drwtNo5:"번호5",drwtNo6:"번호6",bnusNo:"보너스"}
    */    
   const lottoResult = {"returnValue":"실행 결과","totSellamnt":"누적금","drwNo":"회차","drwNoDate":"당첨일","firstWinamnt":"1등 당첨금","firstPrzwnerCo":"1등 당첨 인원","firstAccumamnt":"1등 당첨금 총액","drwtNo1":"번호1","drwtNo2":"번호2","drwtNo3":"번호3","drwtNo4":"번호4","drwtNo5":"번호5","drwtNo6":"번호6","bnusNo":"보너스"}

app.get('/dream/number/:token/:dream', (req,res)=>{
        //if(isLogout(req)) return res.status(H_FAIL_UNAUTHORIZED).send(B_FAIL_UNAUTHORIZED);
        let token   = req.params.token,
            id      = req.session.uid,
            dream   = req.params.dream;
            
        
            if(token == "WEB"){
                token = req.headers['x-forwarded-for'] ||
                req.connection.remoteAddress ||
                req.socket.remoteAddress ||
                req.connection.socket.remoteAddress;
            }
        if(isNone(token) || isNone(dream)){
                res.status(H_FAIL_BAD_REQUEST).send(B_FAIL_WEIRD_DATA);
            } else {
                if(isNone(id)) id = "NULL";
                let params = [token, id, dream];
                console.log(params);
                generalQ(QUERY.DREAM_NUMBER_GET,params,(result)=>{
                    if(result.fail){
                        res.status(H_FAIL_SERVER_ERR).send(result.error);
                    } else {
                        if(result.rows.length == 0){
                            res.status(H_FAIL_NOT_FOUND).send(B_FAIL_NOT_FOUND);
                        } else {
                            res.status(H_SUCCESS_REQ).send(result.rows);
                        }
                    }
                });
            }
             
    })
    app.post("/dream/number",(req,res)=>{
        //if(isLogout(req)) return res.status(H_FAIL_UNAUTHORIZED).send(B_FAIL_UNAUTHORIZED);
        let token   = req.body.token,
            id      = req.session.uid,
            dream   = req.body.dream,
            round   = req.body.round,
            numArr = req.body.numArr,
            wordArr   = req.body.wordArr; // data.number, data.word
            let numbs = [];
            let words = [];
            if(token == "WEB"){
                token = req.headers['x-forwarded-for'] ||
                req.connection.remoteAddress ||
                req.socket.remoteAddress ||
                req.connection.socket.remoteAddress;
            }

            if(isNone(token) || isNone(dream)){
                res.status(H_FAIL_BAD_REQUEST).send(B_FAIL_WEIRD_DATA);
            } else {
                if(isNone(id)) id = "NULL";
                try {
                    numbs = numArr.join();
                    words = wordArr.join();
                } catch (E) {
                    return res.status(H_FAIL_UNAUTHORIZED).send(B_FAIL_UNAUTHORIZED);
                }

                let params = [token, id, dream, round, numbs, words];
                    generalQ(QUERY.DREAM_NUMBER_POST,params,(result)=>{
                        if(result.fail){
                            res.status(H_FAIL_SERVER_ERR).send(result.error);
                        } else {
                            if(result.rows.length == 0){
                                res.status(H_FAIL_SERVER_ERR).send(B_FAIL_SERVER_ERR);
                            } else {
                                res.status(H_SUCCESS_REQ).send(result.rows);
                            }
                        }
                    });
            }
    })

    app.post("/dream/score",(req,res)=>{
            let token   = req.body.token;
            let id      = req.session.uid;
            let title   = req.body.title;
            let dream   = req.body.dream;

            if(token == "WEB"){
                token = req.headers['x-forwarded-for'] ||
                req.connection.remoteAddress ||
                req.socket.remoteAddress ||
                req.connection.socket.remoteAddress;
            }

            if(isNone(token) || isNone(dream) || isNone(title))
                return res.status(H_FAIL_BAD_REQUEST).send(B_FAIL_WEIRD_DATA);
        
            if(isNone(id)) id = "NULL";
                request({
                    url: 'http://127.0.0.1:5000/dreamScore',
                    method: "POST",
                    headers: {
                        "content-type": "application/json",
                        },
                    json: {"dream":dream}
                //  body: JSON.stringify(requestData)
                    }, function (err, t_res, body) {
                        if(err) {
                            res.status(H_FAIL_SERVER_ERR).send(B_FAIL_SERVER_READY);
                        } else {
                            if(t_res.statusCode != 200) res.status(t_res.statusCode).send(B_FAIL_SERVER_READY)
                            else {
                                res.status(H_SUCCESS_REQ).send(body);
                                let params = [token, id, title, dream, body.score.toString()];
                                generalQ(QUERY.DREAM_AI_POST,params,(result)=>{
                                    if(result.fail){
                                        console.log(result);
                                    } else {
                                        if(result.rows.length == 0){
                                            console.log(result);
                                        } else {
                                            //성공적.
                                            //res.status(H_SUCCESS_REQ).send(result.rows);
                                        }
                                    }
                                });
                            }
                        }
                });
    })

    app.post("/dream/analyze",(req,res)=>{
        let id      = req.session.uid,
            dream   = req.body.dream

            request({
                url: 'http://127.0.0.1:5000/dreamAnalyze',
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    },
                json: {"dream":dream}
            //  body: JSON.stringify(requestData)
                }, function (err, t_res, body) {
                    if(err) {
                        res.status(H_FAIL_SERVER_ERR).send(B_FAIL_SERVER_READY);
                    } else {
                        if(t_res.statusCode != 200) res.status(t_res.statusCode).send(B_FAIL_SERVER_READY)
                        else res.status(H_SUCCESS_REQ).send(body);
                    }
            });
            
    })

    app.post("/contact",(req,res)=>{
        let ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
        console.log("[NEW Message]\n  IP : "+ip+", Name : "+req.body.name+ ", Email : "+req.body.email, "\n  Message : "+req.body.message);
        res.status(H_SUCCESS_REQ).send("좋은 의견 감사합니다.");
    })
   
process.on('uncaughtException', function (err) {
	//예상치 못한 예외 처리
	console.log('uncaughtException : ' + err);
});

server.listen(80); 

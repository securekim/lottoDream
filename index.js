const   express         = require('express'),
        config          = require('config'),
        bodyParser      = require("body-parser"),
        cors            = require("cors"),
        tools           = require('./tools'),
        database        = require('./database'),
        path            = require('path'),
        fs              = require('fs'),
        crypto          = require('crypto');
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
    
    // const {
    // } = tools;

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
const B_FAIL_NOT_ACCEPTABLE = "Request is not acceptable."
const B_FAIL_SERVER_ERR     = "Undefined feature.";
const B_FAIL_SERVER_HACKED  = "Undefined feature.";


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

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/public/clientCode.html'));
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


app.route('dream')
    .get((req,res)=>{
        if(isLogout(req)) return res.status(H_FAIL_UNAUTHORIZED).send(B_FAIL_UNAUTHORIZED);

    })
    .post((req,res)=>{
        if(isLogout(req)) return res.status(H_FAIL_UNAUTHORIZED).send(B_FAIL_UNAUTHORIZED);

    })


// app.get('/get/:value',(req,res)=>{
//     res.send(`
//             get value is : `+req.params.value+`
//     `)
// })
 
// app.post('/post',(req,res)=>{
//     res.send(`
//             post value is : `+req.body.value+`
//     `)
// })

app.get('/*', function(req, res) { 
    //todo : .. 이런거 다 삭제하기
    res.sendfile(req.url,function(err){
     if(err){
        console.log(err);
        res.status(H_FAIL_NOT_FOUND).send(B_FAIL_NOT_FOUND);
     }
    });
   });
   
process.on('uncaughtException', function (err) {
	//예상치 못한 예외 처리
	console.log('uncaughtException : ' + err);
});

server.listen(80); 

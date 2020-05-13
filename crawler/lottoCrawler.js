
const request  = require('request');
const fs  = require('fs');
const database = require('../database');
const lottoWinFile = "lottoWinNumData.json";
const userWinFile = "lottoWinUserData.json";


/*
lottoWinData 구조
{
    totalRound : 910,
    wins : [
        {returnValue, totSellamnt, drwNo, drwNoDate, firstWinamnt, firstPrzwnerCo, firstAccumamnt, drwtNo1, drwtNo2, drwtNo3, drwtNo4, drwtNo5, drwtNo6, bnusNo},
        ...,
    ]
}
*/
//{"returnValue":"실행 결과","totSellamnt":"누적금","drwNo":"회차","drwNoDate":"당첨일","firstWinamnt":"1등 당첨금","firstPrzwnerCo":"1등 당첨 인원","firstAccumamnt":"1등 당첨금 총액","drwtNo1":"번호1","drwtNo2":"번호2","drwtNo3":"번호3","drwtNo4":"번호4","drwtNo5":"번호5","drwtNo6":"번호6","bnusNo":"보너스"}

/*
//             userWinData 구조
// {
//     totalWins : [],
//     win : [0, [{dream, numbs, time, round, lotto}], ...],
// }

*/

let lottoWinData = {};
let userWinData = {totalWins:[0,0,0,0,0,0], win:[0,[],[],[],[]]}; 
try{
    lottoWinData = JSON.parse(fs.readFileSync(lottoWinFile));
}catch(E){
    //파일이 없다네
    console.error(E);
    lottoWinData = {totalRound:0, wins : []};
}

//For 문 돌면서 새로운 라운드를 찾아 넣어줄 함수
const pushLottoWinNum = (round) => {
    return new Promise((resolve) =>{
        request({url:'https://www.nlotto.co.kr/common.do?method=getLottoNumber&drwNo='+round,encoding: null, rejectUnauthorized: false}, (error, response, body) => {
            if(error){
                console.error(error) // Print the error if one occurred
                return resolve(true);  
            } 
            jbody = JSON.parse(body.toString());
            if(jbody.returnValue == "fail") return resolve(true);
            lottoWinData.wins.push(jbody)
            lottoWinData.totalRound = lottoWinData.wins.length;
            return resolve(false);
        });
    })
}

async function dataLoad(){ //로또 데이터를 로딩해줌. 마지막 지점부터 다시.
    for(var i = lottoWinData.totalRound+1 ; ; i++){ //종료조건 없다
        let result = await pushLottoWinNum(i);
        if(result) break;
    }
    fs.writeFileSync(lottoWinFile,JSON.stringify(lottoWinData));
}

dataLoad();





const {
    generalQnoparam,
    QUERY
} = database;


const getAllNumbsInDreams = (callback) =>{
    generalQnoparam(QUERY.NUMBER_ALL_GET,(result)=>{
        let rows = result.rows;
        let ret = [];
        rows.forEach(element => {
            let tempNumbs = element.numbs.replace(/[^0-9^,]/g,"");
            let numbs = tempNumbs.split(',').map(Number);
            date = new Date(element.time);
            ret.push({numbs:numbs, title:element.dream, time: date.toLocaleString()});
        });
        callback(ret);
    });
}



//1등 : 6개의 번호가 일치
//2등 : 5개의 번호가 일치 + 보너스 번호 일치
//3등 : 5개의 번호가 일치
//4등 : 4개의 번호가 일치
//5등 : 3개의 번호가 일치


    //https://www.nlotto.co.kr/common.do?method=getLottoNumber&drwNo=905
    //{"totSellamnt":90357634000,"returnValue":"success","drwNoDate":"2020-04-04","firstWinamnt":3017862536,"drwtNo6":40,"drwtNo4":27,"firstPrzwnerCo":7,"drwtNo5":38,"bnusNo":20,"firstAccumamnt":21125037752,"drwNo":905,"drwtNo2":4,"drwtNo3":16,"drwtNo1":3}
    //https://www.nlotto.co.kr/common.do?method=getLottoNumber&drwNo=904
    //{"totSellamnt":88938220000,"returnValue":"success","drwNoDate":"2020-03-28","firstWinamnt":2718077813,"drwtNo6":45,"drwtNo4":26,"firstPrzwnerCo":8,"drwtNo5":43,"bnusNo":11,"firstAccumamnt":21744622504,"drwNo":904,"drwtNo2":6,"drwtNo3":8,"drwtNo1":2}
    //https://www.nlotto.co.kr/common.do?method=getLottoNumber&drwNo=2020
    //{"returnValue":"fail"}
    /*
    {returnValue:"실행 결과",totSellamnt:"누적금",drwNo:"회차",drwNoDate:"당첨일",firstWinamnt:"1등 당첨금",firstPrzwnerCo:"1등 당첨 인원",firstAccumamnt:"1등 당첨금 총액",drwtNo1:"번호1",drwtNo2:"번호2",drwtNo3:"번호3",drwtNo4:"번호4",drwtNo5:"번호5",drwtNo6:"번호6",bnusNo:"보너스"}
    */    
//   const lottoResult = {"returnValue":"실행 결과","totSellamnt":"누적금","drwNo":"회차","drwNoDate":"당첨일","firstWinamnt":"1등 당첨금","firstPrzwnerCo":"1등 당첨 인원","firstAccumamnt":"1등 당첨금 총액","drwtNo1":"번호1","drwtNo2":"번호2","drwtNo3":"번호3","drwtNo4":"번호4","drwtNo5":"번호5","drwtNo6":"번호6","bnusNo":"보너스"}

const findWinnerInEachRound = (round,usersDatas,callback) =>{
    let winner = [0,0,0,0,0,0]; // 1등부터 5등, 나머지까지의 명수
    usersDatas.forEach(userDatas => {
        let winNumbs = lottoWinData.wins[round];
        winNumbs = [winNumbs.drwtNo1, winNumbs.drwtNo2, winNumbs.drwtNo3, winNumbs.drwtNo4, winNumbs.drwtNo5, winNumbs.drwtNo6, winNumbs.bnusNo];
        win = getWin(userDatas.numbs, winNumbs);
        winner[win]++;



//             userWinData 구조
// {
//     totalWins : [],
//     win : [0, [{userDatas, round, lotto}], ...],
// }

        if(win == 1 || win == 2 || win == 3 || win == 4){
            userWinData.win[win].push({userData : userDatas, round : round, lotto : winNumbs});
            //console.log("[Round "+(Number(round)+1)+"] "+ win+"등 탄생 !!"+JSON.stringify(userDatas));
        }
    });
    //console.log("[ROUND "+round+"]"+winner);
    callback(round,winner);
}

const getWin = (userNumbs, winNumbs) => {
    tempUser = userNumbs.slice(0);
    tempWin = winNumbs.slice(0);
    let win_bonus  = tempWin.pop(); // 보너스 숫자
    let win_numbs  = tempWin; //6개 숫자
    let user_bonus = tempUser.pop(); // 보너스 숫자
    let user_numbs = tempUser; //6개 숫자
    let win = win_numbs.filter((num) => user_numbs.includes(num)).length;
    switch (win) {
        case 6 :
          return 1;
        case 5 :
          if(win_bonus == user_bonus) return 2;
          return 3;
        case 4 :
          return 4;
        case 3 :
          return 5;
        default :
          return 0;
      }

}


const main = () =>{
    //[{arrNumbs, title}]
    getAllNumbsInDreams((usersDatas) =>{
        sum = [0,0,0,0,0,0];
        for(var i=0; i<lottoWinData.totalRound; i++){
            findWinnerInEachRound(i, usersDatas, (round,winner)=>{
                console.log("[ROUND "+(Number(round)+1)+"] : "+winner)
                for(var i in sum){
                    sum[i] += winner[i];
                }
            });
        }
        console.log(sum);
        userWinData.totalWins = sum;
        fs.writeFileSync(userWinFile,JSON.stringify(userWinData));
    })
}

main()

const request  = require('request');
const database = require('../database');


const {
    generalQnoparam,
    QUERY
} = database;


const getAllNumbsInDreams = (callback) =>{
    generalQnoparam(QUERY.NUMBER_ALL_GET,(result)=>{
        let rows = result.rows;
        let ret = [];
        rows.forEach(element => {
            let temp = element.numbs.replace(/[^0-9^,]/g,"");
            ret.push(temp.split(','));
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

const getLottoWinNum = (round, callback) => {
    request({url:'https://www.nlotto.co.kr/common.do?method=getLottoNumber&drwNo='+round,encoding: null, rejectUnauthorized: false}, (error, response, body) => {
        if(error) return console.log('error ! :', error); // Print the error if one occurred
        let ret = null;
        jbody = JSON.parse(body.toString());
        if(jbody.returnValue == "fail") return ret;
        ret = [jbody.drwtNo1, jbody.drwtNo2, jbody.drwtNo3, jbody.drwtNo4, jbody.drwtNo5, jbody.drwtNo6, jbody.bnusNo];
        return callback(ret);
    });
}


const findWinnerInEachRound = (round) =>{
    getAllNumbsInDreams = (allNums) =>{

        getLottoWinNum(round,(result)=>{
            console.log(result);
            if(result == null) return console.log("END in "+round);
            bonus = result.pop() // 보너스 숫자
            numbs = result; //6개 숫자
    
    
        })
    }


}

getLottoWinNum(1,(result)=>{
    console.log(result);
})



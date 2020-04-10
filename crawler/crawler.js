//1 ~ 287 page
// ERROR npm install iconv ERROR
//npm install --global --production windows-build-tools@4.0.0
//Microsoft.Cpp.Default.props 변경된 위치를 환경변수에 추가
//npm config set msvs_version 2015

var request = require('request');
const cheerio = require('cheerio');
//http://www.barotong.com/dream/search.asp?page=287&search_keyword=%B2%DE

const Iconv = require('iconv').Iconv;
const iconv = new Iconv('CP949', 'utf-8//translit//ignore');
const fs = require('fs');

//길몽      : 2
//태몽      : 8
//태몽(남)  : 7
//태몽(여)  : 9
//횡재      : 4
//일반      : 6
//반반      : 10
//흉몽      : 3

const interpret2OX = (ico) =>{
    if(ico == 2 || ico == 8 || ico == 7 || ico == 9 || ico ==4 || ico == 6) return 1
    else if(ico ==10 || ico ==3) return 0
    else return -1
}

const icon2interpret = (icon) =>{
    return interpret2OX(icon.split("_")[1].split(".")[0]);
}

const getDetail = (icon) =>{
    let point = icon.split("_")[1].split(".")[0];
    switch (Number(point)){
        case 2 :
            return "길몽"
        case 8 :
            return "태몽"
        case 7 :
            return "태몽(남)"
        case 9 :
            return "태몽(여)"
        case 4 :
            return "횡재"
        case 6 :
            return "일반"
        case 10 :
            return "반반"
        case 3 :
            return "흉몽"
        default :
            return point;
    }
}

const getDream = (page, callback) => {
    request({url:'http://www.barotong.com/dream/search.asp?page='+page+'&search_keyword=%B2%DE',encoding: null}, (error, response, body) => {
        if(error) console.log('error ! :', error); // Print the error if one occurred
        //console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
        //console.log('body:', body); // Print the HTML for the Google homepage.
        let korean_body = iconv.convert(body).toString();
        const $ = cheerio.load(korean_body);
        //let tableArr    = $("body > table:nth-child(5) > tbody > tr > td:nth-child(3) > table:nth-child(2) > tbody > tr:nth-child(2) > td:nth-child(2) > table > tbody > tr:nth-child(2) > td")
                                                                                                                                                                                                //2부터 51까지. 
        //TODO : 마지막 페이지 신경 쓸 것
        let resultArr = [];
        for(let i =2; i<52; i++){
            var icon        = $("body > table:nth-child(5) > tbody > tr > td:nth-child(3) > table:nth-child(2) > tbody > tr:nth-child(2) > td:nth-child(2) > table > tbody > tr:nth-child(2) > td > \
                        table:nth-child("+i+") > tbody > tr:nth-child(1) > td:nth-child(1) > div > img")
            if(!icon) break;
            icon = icon[0].attribs.src
            var dream       = $("body > table:nth-child(5) > tbody > tr > td:nth-child(3) > table:nth-child(2) > tbody > tr:nth-child(2) > td:nth-child(2) > table > tbody > tr:nth-child(2) > td > \
                        table:nth-child("+i+") > tbody > tr:nth-child(1) > td:nth-child(2) > a")[0].children[0].data
            var interpret   = $("body > table:nth-child(5) > tbody > tr > td:nth-child(3) > table:nth-child(2) > tbody > tr:nth-child(2) > td:nth-child(2) > table > tbody > tr:nth-child(2) > td > \
                        table:nth-child("+i+") > tbody > tr:nth-child(2) > td:nth-child(2) table tbody tr td table tbody tr td:nth-child(3)")[0].children[0].data
            var point       = icon2interpret(icon);
            var detail      = getDetail(icon)
            resultArr.push({point:point, dream:dream, interpret:interpret, detail: detail});
        }
        return callback(resultArr);
      });
}

function JSON2CSV(objArray) {
    var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
    var str = '';
    var line = '';
    for (var i = 0; i < array.length; i++) {
        line = '';
        for (var index in array[i]) {
            line += array[i][index] + '\t';
        }
        line = line.slice(0, -1);
        str += line + '\r\n';
    }
    return str;
}

const getDreams = (start,end) =>{
    for(var i= start; i<=end; i++ ){
        getDream(i, (ret)=>{
            console.log(ret);
            let csv = JSON2CSV(ret);
            fs.appendFileSync('dreams.txt', csv);
        });
    }
}

getDreams(1,286);

//SELECTOR
//#use_after_con > td:nth-child(2) > table:nth-child(1) > tbody > tr > td > table > tbody > tr:nth-child(1) > td:nth-child(3)

//( SELECTOR )
//icon
//body > table:nth-child(5) > tbody > tr > td:nth-child(3) > table:nth-child(2) > tbody > tr:nth-child(2) > td:nth-child(2) > table > tbody > tr:nth-child(2) > td > table:nth-child(2) > tbody > tr:nth-child(1) > td:nth-child(1) > div > img
//DREAM 
//body > table:nth-child(5) > tbody > tr > td:nth-child(3) > table:nth-child(2) > tbody > tr:nth-child(2) > td:nth-child(2) > table > tbody > tr:nth-child(2) > td > table:nth-child(2) > tbody > tr:nth-child(1) > td:nth-child(2) > a
//Interpret
//body > table:nth-child(5) > tbody > tr > td:nth-child(3) > table:nth-child(2) > tbody > tr:nth-child(2) > td:nth-child(2) > table > tbody > tr:nth-child(2) > td > table:nth-child(2) > tbody > tr:nth-child(2) > td:nth-child(2) table tbody tr td table tbody tr td:nth-child(3)

//body/table[3]/tbody/tr/td[3]/table[2]/tbody/tr[2]/td[2]/table/tbody/tr[2]/td/table[2]/tbody/tr[2]/td[2]/table[1]/tbody/tr/td/table/tbody/tr[1]/td[3]
//
//#use_after_con > td:nth-child(2) > table:nth-child(1) > tbody > tr > td > table > tbody > tr:nth-child(1) > td:nth-child(3)



// Point
// #use_after_con > td:nth-child(2) > table:nth-child(1) > tbody > tr > td > table > tbody > tr:nth-child(2) > td:nth-child(3)

//Number
//#use_after_con > td:nth-child(2) > table:nth-child(1) > tbody > tr > td > table > tbody > tr:nth-child(3) > td:nth-child(3) > b


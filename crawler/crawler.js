//1 ~ 287 page
var request = require('request');
const cheerio = require('cheerio');
//http://www.barotong.com/dream/search.asp?page=287&search_keyword=%B2%DE

const Iconv = require('iconv').Iconv;
const iconv = new Iconv('CP949', 'utf-8//translit//ignore');

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

const getDream = (page) => {
    request('http://www.barotong.com/dream/search.asp?page='+page+'&search_keyword=%B2%DE', function (error, response, body) {
        if(error) console.log('error ! :', error); // Print the error if one occurred
        //console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
        console.log('body:', body); // Print the HTML for the Google homepage.
        const $ = cheerio.load(body);
        //let tableArr    = $("body > table:nth-child(5) > tbody > tr > td:nth-child(3) > table:nth-child(2) > tbody > tr:nth-child(2) > td:nth-child(2) > table > tbody > tr:nth-child(2) > td")
                                                                                                                                                                                                //2부터 51까지. 
        //TODO : 마지막 페이지 신경 쓸 것

        for(let i =2; i<52; i++){
            let icon        = $("body > table:nth-child(5) > tbody > tr > td:nth-child(3) > table:nth-child(2) > tbody > tr:nth-child(2) > td:nth-child(2) > table > tbody > tr:nth-child(2) > td > \
                        table:nth-child("+i+") > tbody > tr:nth-child(1) > td:nth-child(1) > div > img")
            if(!icon) break;
            let dream       = $("body > table:nth-child(5) > tbody > tr > td:nth-child(3) > table:nth-child(2) > tbody > tr:nth-child(2) > td:nth-child(2) > table > tbody > tr:nth-child(2) > td > \
                        table:nth-child("+i+") > tbody > tr:nth-child(1) > td:nth-child(2) > a")
            let interpret   = $("body > table:nth-child(5) > tbody > tr > td:nth-child(3) > table:nth-child(2) > tbody > tr:nth-child(2) > td:nth-child(2) > table > tbody > tr:nth-child(2) > td > \
                        table:nth-child("+i+") > tbody > tr:nth-child(2) > td:nth-child(2) table tbody tr td table tbody tr td:nth-child(3)")
            
        }
        for(let i = 1; i < colArr.length; i++){
          resultArr.push(colArr[i].children[1].attribs.title)
        }    
        res.json(resultArr)
      });
}

tableArr[0].children[i].children[0].next.children[0].

getDream(1);

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


let myInfo = "WEB"
$.get('https://www.cloudflare.com/cdn-cgi/trace', function(data) {
    myInfo = data.ip;
})

const BUTTON_INTEPRET = () =>{
    let dream = $('#TEXTAREA_DREAM').val()
    if(dream == "") return alert("내용을 입력하세요.");
    
    alertify.prompt("꿈의 제목을 입력하세요.", "재물을 얻는 꿈",
    function(evt, value){
        post_dream_score(myInfo, dream, (result)=>{ 
            if(result.status == 200) {
                let score = JSON.parse(result.result).score;
                let message = "";
                console.log(score);
                if(score >0.5) {
                    score = Math.round(score*100000)/1000;
                    console.log(score);
                    message = "길몽의 기운이 더 많습니다. 길몽력 : " + score + "%"
                } else {
                    score = Math.round((1-score)*100000)/1000;
                    console.log(score);
                    message = "흉몽의 기운이 더 많습니다. 흉몽력 : " + score + "%"
                }
                alert(message);
            } else {
                alert(result.status);
            }
        })
    },
    function(){
        alertify.error('Cancel');
    });

}


const BUTTON_TEMPSAVE = () =>{
    let dream = $('#TEXTAREA_DREAM').val()
    if(dream == "") return alert("내용을 입력하세요.");
    post_dream_analyze(myInfo, dream, (result)=>{
        if(result.status == 200) {
            console.log(result.result);
        } else {
            alert(result.status) 
        }
    })

}



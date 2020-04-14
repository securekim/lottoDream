let myInfo = "WEB"

refreshTableWithStorage_LOCKER();
refreshTableWithStorage_LOTTO();

const BUTTON_INTEPRET = () =>{
    let dream = $('#TEXTAREA_DREAM').val()
    dream = dream.replace(/\"/g,'');
    if(dream == "") return alertify.alert("내용을 입력하세요.");
    
    post_dream_analyze(myInfo, dream, (result)=>{
        if(result.status == 200) {
            let morph = JSON.parse(result.result).morph;
            if (morph.length == 0 ) 
                return alertify.alert("꿈의 내용이 이상합니다. 다시 입력하세요.")
            console.log(morph);
            alertify.prompt("꿈의 제목을 입력하세요.", "재물을 얻는 꿈",
            function(evt, title){
                post_dream_score(myInfo, dream, (result)=>{ 
                    if(result.status == 200) {
                        let score = JSON.parse(result.result).score;
                        let message = "";
                        console.log(score);
                        STORAGE_addDream(title, dream,  (score*100).toFixed(2));
                        if(score >0.5) {
                            score = (score*100).toFixed(2);
                            message = "길몽의 기운이 더 많습니다. 길몽력 : " + score + "%"
                        } else {
                            score = ((1-score)*100).toFixed(2);
                            message = "흉몽의 기운이 더 많습니다. 흉몽력 : " + score + "%"
                        }
                        alertify.alert(message);
                    } else {
                        alertify.alert(result.status);
                    }
                })
            },
            function(){
                alertify.error('취소');
            });
        } else { 
            alertify.alert("실패. AI 가 학습중이거나 서버에 문제가 발생하였습니다.")
        }
    })
}


const BUTTON_TEMPSAVE = () =>{
    let dream = $('#TEXTAREA_DREAM').val()
    dream = dream.replace(/\"/g,'');
    if(dream == "") return alertify.alert("내용을 입력하세요.");
    STORAGE_saveTemp(dream);
}

const BUTTON_CONTACTSAVE = () =>{
    let message = $('#message').val()
    let name = $('#name').val()
    let email = $('#email').val()
    message = message.replace(/\"/g,'');
    if(message == "") return alertify.alert("내용을 입력하세요.");
    if(name == "") return alertify.alert("이름을 입력하세요.");
    if(email == "") return alertify.alert("이메일을 입력하세요.");
    STORAGE_saveContact(message, name, email);
    STORAGE_loadContact();
}

const BUTTON_DELDREAMS = () =>{
    alertify.confirm('정말로 삭제하시겠습니까?', function(){ 
        alertify.success('네')
        STORAGE_delDreams();
    }
    , function(){ alertify.error('취소')});
}

const BUTTON_GETLOTTO = (title, dream) =>{
    alertify.confirm("["+title+"] 꿈으로 <br>로또 번호 추출을 하시겠습니까?",
    function(){
        let timerInterval
        Swal.fire({
          title: 'A.I. Dream Reader',
          html: '문장 분석 및 번호 추출 중...',
          timer: 2000,
          timerProgressBar: true,
          onBeforeOpen: () => {
            Swal.showLoading()
            timerInterval = setInterval(() => {
              const content = Swal.getContent()
              if (content) {
                const b = content.querySelector('b')
                if (b) {
                  b.textContent = Swal.getTimerLeft()
                }
              }
            }, 100)
          },
          onClose: () => {
            clearInterval(timerInterval)
          }
        }).then((result) => {
          /* Read more about handling dismissals below */
          if (result.dismiss === Swal.DismissReason.timer) {
            console.log('I was closed by the timer')
                post_dream_analyze(myInfo, dream, (result)=>{
                    if(result.status == 200) {
                        let morph = JSON.parse(result.result).morph;
                        if (morph.length == 0 ) 
                            return alertify.alert("꿈의 내용이 이상합니다. 다시 입력하세요.")
                        console.log(morph);
                        let nouns = [];
                        for(var i in morph) {
                            if(morph[i].split("/")[1] == "Noun") nouns.push(morph[i].split("/")[0]);
                        }
                        let lottos = generateLotto(nouns);
                        console.log(lottos);
                        if(lottos.flag){ // 7개 이상
                            alertify.alert("7개 이상의 번호가 검출되어 <br>현재 시각을 고려해 뽑았습니다. <br>"+ lottos.result.join("번, ")); 
                        } else {
                            alertify.alert("7개 미만의 번호가 검출되어 <br>나머지 숫자를 랜덤하게 골랐습니다. <br>"+ lottos.result.join("번, "));
                        }
                        post_dream_number(
                            myInfo, 
                            title+" : "+dream, 
                             0, 
                             {numArr:lottos.result, wordArr:nouns}, 
                             (result) => 
                             { 
                                console.table(result); 
                                if(result.status == H_SUCCESS_REQ || result.status == H_SUCCESS_MODIFY) console.log("성공 ! ");
                                else console.log("실패 ! ");
                             }) 


                    } else {
                        alertify.alert("AI 서버가 준비중이거나 서버에 문제가 있습니다.")
                    }
                })
          }
        })




    },
    function(){
      alertify.error('Cancel');
    });

}

var textCountLimit = 2000;
 
$(document).ready(function() {
    $('textarea[name=TEXTAREA_DREAM]').keyup(function() {
        // 텍스트영역의 길이를 체크
        var textLength = $(this).val().length;
 
        // 입력된 텍스트 길이를 #textCount 에 업데이트 해줌
        $('#textCount').text(textLength);
         
        // 제한된 길이보다 입력된 길이가 큰 경우 제한 길이만큼만 자르고 텍스트영역에 넣음
        if (textLength > textCountLimit) {
            $(this).val($(this).val().substr(0, textCountLimit));
        }
    });
});
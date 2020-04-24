let myInfo = "WEB";
const defaultLongTime = 2000;
const defaultShortTime = 1500;
const essential_tags = [
    //'MDN', 
    'NN', 
    'NNG', 
    'NNP', 
    //'VA', 
    //'VV', 
    //'VXA'
] 

refreshTableWithStorage_LOCKER();
refreshTableWithStorage_LOTTO();

const isEssential = (word) =>{
    //word 의 형태 : "나/NN"
    try{
    let speach = word.split("/")[1];
    } catch(e) {
        console.log(e);
        return false;
    }
    essential_tags.forEach(tag => {
        if(speach == tag){
            return true;
        }
    });
    return false;
}

const BUTTON_INTEPRET = () =>{
    let dream = $('#TEXTAREA_DREAM').val()
    dream = dream.replace(/\"/g,'');
    if(dream == "") return alertify.alert("내용을 입력하세요.");
    let startTime = new Date().getTime();
    Swal.fire({
        position: 'top-end',
        type: 'success',
        title: '꿈 형태소 분석 중',
        showConfirmButton: false,
        timer: 1000,
        onOpen:()=>{
            Swal.showLoading();
            post_dream_analyze(myInfo, dream, (result)=>{
                let endTime = new Date().getTime();
                minDelay(startTime,endTime,defaultShortTime);
                Swal.hideLoading();
                if(result.status == 200) {
                    let morph = JSON.parse(result.result).morph;
                    if (morph.length == 0 ) {
                        return alertify.alert("꿈의 내용이 이상합니다. 다시 입력하세요.")
                    }
                    console.log(morph);
                    alertify.prompt("꿈의 제목을 입력하세요.", "꿈 제목",
                    function(evt, title){
                        //TIMER
                        //let timerInterval
                        let startTime = new Date().getTime();
                        Swal.fire({
                          title: 'A.I. Dream Reader',
                          html: '꿈 해몽 중',
                          //allowOutsideClick: () => !Swal.isLoading(),
                          onOpen:()=>{
                            Swal.showLoading();
                            post_dream_score(myInfo, title, dream, (result)=>{ 
                              let endTime = new Date().getTime();
                              minDelay(startTime, endTime,defaultLongTime);
                              Swal.hideLoading();
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
        
                                    Swal.fire({
                                        title: '"'+title+'"',
                                        text: message,
                                        imageUrl: 'images/AI.jpg',
                                        imageWidth: '30em',
                                        //imageHeight: 200,
                                        imageAlt: 'Custom image',
                                        showCancelButton: true,
                                        confirmButtonColor: '#3085d6',
                                        cancelButtonColor: '#d33',
                                        confirmButtonText: '로또 번호 요청',
                                        cancelButtonText: '취소'
                                      }).then((result) => {
                                        if (result.value) {
                                            BUTTON_GETLOTTO(title,dream);
                                        }
                                      })
                                } else {
                                    alertify.alert(result.status);
                                }
                            })
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
        alertify.success('삭제 완료')
        STORAGE_delDreams();
    }
    , function(){ alertify.error('취소')});
}

const BUTTON_GETLOTTO = (title, dream) =>{
    let alreadyGetNumber = STORAGE_getLotto(dream);
        if(alreadyGetNumber){
            Swal.fire({
                title: '"'+title+'"',
                text: alreadyGetNumber,
                imageUrl: 'images/ball.jpeg',
                imageWidth: '30em',
                //imageHeight: 210,
                imageAlt: 'Custom image',
                confirmButtonText: '확인',
              })
              return;
        }
        Swal.fire({
          title: 'A.I. Dream Reader',
          html: '번호 추출 중...',
          onBeforeOpen: () => {
            Swal.showLoading()
            let startTime = new Date().getTime();
            post_dream_analyze(myInfo, dream, (result)=>{
              let endTime = new Date().getTime();
              minDelay(startTime, endTime, defaultShortTime);
              Swal.hideLoading()
              if(result.status == 200) {
                  let morph = JSON.parse(result.result).morph;
                  if (morph.length == 0 ) 
                      return alertify.alert("꿈의 내용이 이상합니다. 다시 입력하세요.")
                  console.log(morph);
                  let words = [];
                  for(var i in morph) {
                      
                      if(isEssential(morph[i])) words.push(morph[i].split("/")[0]);
                  }
                  let lottos = generateLotto(words);
                  let message = ""
                  console.log(lottos);
                  message = lottos.result.join("번, ");
                  STORAGE_saveLotto(dream, message);
                  // if(lottos.flag){ // 7개 이상
                  //     alertify.alert("7개 이상의 번호가 검출되어 <br>현재 시각을 고려해 뽑았습니다. <br>"+ lottos.result.join("번, ")); 
                  // } else {
                  //     alertify.alert("7개 미만의 번호가 검출되어 <br>나머지 숫자를 랜덤하게 골랐습니다. <br>"+ lottos.result.join("번, "));
                  // }
                  Swal.fire({
                      title: '"'+title+'"',
                      text: message,
                      imageUrl: 'images/ball.jpeg',
                      imageWidth: '30em',
                      //imageHeight: 210,
                      imageAlt: 'Custom image',
                      confirmButtonText: '확인',
                    })
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
          },
        })
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

const isTooFast = (startTime, endTime, ms) => {
  //getTime : new Date().getTime();
  if(endTime - startTime < ms) return true;
  return false;
}

function pause(ms) {
	var dt = new Date();
	while ((new Date()) - dt <= ms) { /* Do nothing */ }
}

const minDelay = (startTime, endTime, minDelay) =>{
  //delay for other
  if(isTooFast(startTime, endTime, minDelay)) pause(minDelay - (endTime - startTime));
}


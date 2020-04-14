
const removeRow_LOCKER = () =>{
    $("#TBODY_LOCKER").children().remove()
}

const removeRow_LOTTO = () =>{
    $("#TBODY_LOTTO").children().remove()
}

const addRow_LOCKER = (date, title, dream, score) => {
    let markup = '<tr onclick="alertify.alert(`'+dream+'`)">\
    <td>'+date+'</td>\
    <td>'+title+'</td>\
    <td>'+score+'</td>\
    </tr>'
    $('#TBODY_LOCKER').append(markup);
}

//token, dream, round, data
const addRow_LOTTO = (date, title, dream, score) => {
    let markup = '<tr onclick="BUTTON_GETLOTTO(`'+title+'`,`'+dream+'`)">\
    <td>'+date+'</td>\
    <td>'+title+'</td>\
    <td>'+score+'</td>\
    </tr>'
    $('#TBODY_LOTTO').append(markup);
}

const refreshTableWithStorage_LOCKER = () =>{
    let dreams = STORAGE_getDreams();
    removeRow_LOCKER();
    for(var i in dreams){
        addRow_LOCKER(dreams[i].date, dreams[i].title, dreams[i].dream, dreams[i].score);
    }
}


const refreshTableWithStorage_LOTTO = () =>{
    let dreams = STORAGE_getDreams();
    removeRow_LOTTO();
    for(var i in dreams){
        addRow_LOTTO(dreams[i].date, dreams[i].title, dreams[i].dream, dreams[i].score);
    }
}
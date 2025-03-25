document.addEventListener('DOMContentLoaded', async () => {
    eval('btn_'+actived_scroll).classList.add('active');
    eval('scroll_'+actived_scroll).style.display = '';

    fetch(window.location.origin+'/api/query/pc_list')
        .then(response => response.json())
        .then(json => load_character_selector(json))
        .catch(err => alert('fetch1 错误: ' + err)); 

    fetch(window.location.origin+'/api/query/'+pc_id)
        .then(response => response.json())
        .then(json => {saved_data = json; load_data(saved_data);})
        .catch(err => alert('fetch2 错误: ' + err)); 
});

// 导航栏按钮
['background', 'main', 'backpack', 'spellcasting', 'maps'].forEach(label => {
    eval('btn_'+label).addEventListener('click', () => {
        const url = window.location;
        const path = url.pathname.split('/');
        path.pop();
        path.push(label);
        history.pushState('', '', url.origin+path.join('/')+url.search);
    
        ['background', 'main', 'backpack', 'spellcasting', 'maps'].forEach(x => {
            eval('scroll_'+x).style.display = 'none';
            eval('btn_'+x).classList.remove('active')
        });

        eval('scroll_'+label).style.display = '';
        eval('btn_'+label).classList.add('active')
    });
});

// 投骰 + 骰盘显示
scroll_main.querySelectorAll('.dice').forEach(dice => {
    Object.defineProperty(dice, 'innerText', {
        set(value) {
            if (typeof value === 'number') {
                this._innerText = value >= 0 ? '+'+value.toString() : value.toString();
            } else {
                this._innerText = value;
            }
            this.textContent = this._innerText;
        },
        get() {
            return this._innerText;
        }
    });
    dice.addEventListener("click", () => {
        if (roll_board.innerHTML != '') roll_board.innerHTML += '<br\>';
        roll_board.innerHTML += get_label(dice);
        console.log(dice.innerText, dice)
        roll_board.innerHTML += roll_dice(dice.innerText);
        roll_board.scroll({top: roll_board.scrollHeight, left: 0, behavior: "smooth"});
    });
});
// 骰盘输入
roll_input.addEventListener("keypress", (e) => {
    if (e.keyCode == '13') {
        if (roll_board.innerHTML != '') roll_board.innerHTML += '<br\>';
        roll_board.innerHTML += '输入: ' + roll_dice(roll_input.value);
        roll_input.value = '';
        roll_board.scroll({top: roll_board.scrollHeight, left: 0, behavior: "smooth"});
    }
});

// Input, Select 内容改变后保存并上传
scroll_main.querySelectorAll('input, select').forEach(element => {
    element.addEventListener("change", () => {
        change_data(element);
        fetch(window.location.origin+'/api/update/'+pc_id, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(saved_data)
        }).catch(err => alert('fetch3 错误: ' + err)); 
    });
});
document.addEventListener('DOMContentLoaded', async () => {
    eval('btn_'+actived_scroll).classList.add('active');
    eval('scroll_'+actived_scroll).style.display = '';

    fetch(window.location.origin+'/api/query/pc_list')
        .then(response => response.json())
        .then(json => load_character_selector(json))
        .catch(err => alert('Fetch1 错误: ' + err)); 

    fetch(window.location.origin+'/api/query/'+pc_id)
        .then(response => response.json())
        .then(json => {saved_data = json; load_main();})
        .catch(err => alert('Fetch2 错误: ' + err)); 
    
    fetch(window.location.origin+'/api/query/items')
        .then(response => response.json())
        .then(json => {saved_items = json; load_items();})
        .catch(err => alert('Fetch4 错误: ' + err)); 
});

/**
 * 绑定导航栏菜单按钮
 */
let nav_item_list = ['background', 'main', 'backpack', 'spellcasting', 'maps', 'items', 'spells']
nav_item_list.forEach(label => {
    eval('btn_'+label).addEventListener('click', () => {
        const url = window.location;
        const path = url.pathname.split('/');
        path.pop();
        path.push(label);
        history.pushState('', '', url.origin+path.join('/')+url.search);
    
        nav_item_list.forEach(x => {
            eval('scroll_'+x).style.display = 'none';
            eval('btn_'+x).classList.remove('active');
        });

        eval('scroll_'+label).style.display = '';
        eval('btn_'+label).classList.add('active');
    });
});

/**
 * 绑定投骰按钮和骰盘显示器
 */
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
        roll_board.innerHTML += roll_dice(dice.innerText);
        roll_board.scroll({top: roll_board.scrollHeight, left: 0, behavior: "smooth"});
    });
});

/**
 * 绑定骰盘输入框
 */
roll_input.addEventListener("keypress", (e) => {
    if (e.keyCode == '13') {
        if (roll_board.innerHTML != '') roll_board.innerHTML += '<br\>';
        roll_board.innerHTML += '输入: ' + roll_dice(roll_input.value);
        roll_input.value = '';
        roll_board.scroll({top: roll_board.scrollHeight, left: 0, behavior: "smooth"});
    }
});

/**
 * Input, Select 内容改变后保存并上传
 */
scroll_main.querySelectorAll('input, select').forEach(element => {
    element.addEventListener("change", () => {
        change_data(element);
        fetch(window.location.origin+'/api/update/'+pc_id, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(saved_data)
        }).catch(err => alert('Fetch3 错误: ' + err)); 
    });
});
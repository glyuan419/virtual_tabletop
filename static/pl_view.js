document.addEventListener('DOMContentLoaded', async () => {
    eval('btn_'+actived_scroll).classList.add('active');
    eval('scroll_'+actived_scroll).style.display = '';

    Promise.all([
        fetch(window.location.origin+'/api/query/pc_list')
            .then(response => response.json())
            .then(json => load_character_selector(json))
            .catch(err => alert('Fetch 错误: ' + err)),
        fetch(window.location.origin+'/api/query/'+pc_id)
            .then(response => response.json())
            .then(json => saved_data = json)
            .catch(err => alert('Fetch 错误: ' + err)),
        fetch(window.location.origin+'/api/query/items')
            .then(response => response.json())
            .then(json => saved_items = json)
            .catch(err => alert('Fetch 错误: ' + err)),
        fetch(window.location.origin+'/api/query/spells')
            .then(response => response.json())
            .then(json => saved_spells = json)
            .catch(err => alert('Fetch 错误: ' + err))
    ])
    .then(() => {
        load_items();
        load_backpack();
        load_coins();

        load_spells();
        load_spellcasting();

        load_main();
    })
    .catch(err => alert('Fetch 错误: ' + err));
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

document.addEventListener('keydown', (event) => {
    if (document.activeElement.tagName != 'BODY') return;
    let btn_ref = {
        '': 'background', 'i':'main', 'b':'backpack', 's':'spellcasting', 'm':'maps',
        '':'items', '':'spells'
    }
    if (Object.keys(btn_ref).includes(event.key.toLowerCase())) {
        event.preventDefault();
        eval('btn_' + btn_ref[event.key.toLowerCase()]).click();
    }
  });

/**
 * 绑定长休按钮
 */
long_rest.addEventListener('click', () => {
    saved_data.abstract['hit_point'][0] = saved_data.abstract['hit_point'][1];
    saved_data.abstract['hit_point'][2] = '0';
    saved_data.abstract['hit_dice'] = saved_data.main.class_level;
    saved_data.abstract['special_value'][1] = saved_data.abstract['special_value'][2];
    saved_data.abstract['inspiration'] = '';

    load_abstract();
    death_saving.querySelectorAll('input').forEach(box => box.checked = false);
    for (let i=0; i<9; i++) {
        let label = spell_slot.rows[1].cells[i+1].children[0].innerText;
        saved_data.spell_slots[i] = label.split(' ')[2];
        
    }
    load_spellcasting_info();

    fetch(window.location.origin+'/api/update/'+pc_id, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(saved_data)
    }).catch(err => alert('Fetch 错误: ' + err));
});

/**
 * 绑定投骰按钮和骰盘显示器
 */
document.querySelectorAll('.dice').forEach(dice => {
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
            return this.textContent;
        }
    });
    dice.addEventListener('click', (event) => {
        if (roll_board.innerHTML != '') roll_board.innerHTML += '<br\>';
        roll_board.innerHTML += roll_dice(get_label(dice), dice.innerText, (event.ctrlKey?2:1));
        roll_board.scroll({top: roll_board.scrollHeight, left: 0, behavior: 'smooth'});
    });
});

/**
 * 绑定骰盘输入框
 */
roll_input.addEventListener('keypress', (e) => {
    if (e.keyCode == '13') {
        if (roll_board.innerHTML != '') roll_board.innerHTML += '<br\>';
        roll_board.innerHTML += roll_dice('输入', roll_input.value);
        roll_input.value = '';
        roll_board.scroll({top: roll_board.scrollHeight, left: 0, behavior: 'smooth'});
    }
});

/**
* 绑定激励按钮 + 死亡豁免按钮
*/
document.querySelectorAll('.silent-dice').forEach(dice => {
    switch (dice.innerText) {
        case '死亡豁免':
            dice.addEventListener('click', () => {
                if (roll_board.innerHTML != '') roll_board.innerHTML += '<br\>';
                roll_board.innerHTML += roll_dice('死亡豁免', '1d20');
                roll_board.scroll({top: roll_board.scrollHeight, left: 0, behavior: 'smooth'});
            });
            break;
        case '激励':
            dice.addEventListener('click', () => {
                if ((new RegExp(/^[0-9]+d[0-9]+$/)).test(inspiration.cells[1].children[0].value)) {
                    // 匹配 1d20
                    if (roll_board.innerHTML != '') roll_board.innerHTML += '<br\>';
                    roll_board.innerHTML += roll_dice('激励', inspiration.cells[1].children[0].value);
                    roll_board.scroll({top: roll_board.scrollHeight, left: 0, behavior: 'smooth'});
                } else if ((new RegExp(/^[0-9]+$/)).test(inspiration.cells[1].children[0].value)) {
                    // 匹配 1
                    assign(inspiration.cells[1].children[0], (
                        Number(inspiration.cells[1].children[0].value) > 0 ?
                        Number(inspiration.cells[1].children[0].value)-1 :
                        0
                    ));
                }

            });
            break;
    }

});

/**
 * 绑定物品栏的排序按钮
 */
items_table.rows[0].addEventListener('click', (event) => {
    let hding_ref = {
        '名称': 'name',
        '类型': 'type',
        '价值': 'value',
        '重量': 'weight',
        '来源': 'source'
    }
    saved_items.sort((x1, x2) => {
        let ret = 0;
        if (x1[hding_ref[event.target.innerText]] == x2[hding_ref[event.target.innerText]])
            ret = 0;
        if (x1[hding_ref[event.target.innerText]] < x2[hding_ref[event.target.innerText]])
            ret = -1;
        else ret = 1;
        
        return event.ctrlKey ? -1*ret : ret;
    });

    load_items();
});

/**
 * 绑定背包栏、仓库栏的排序按钮
 */
['backpack', 'storage'].forEach(name => {
    eval(name + '_table').rows[0].addEventListener('click', (event) => {
        let hding_ref = {
            '类型': 'type',
            '特性': 'properties',
            '价值': 'value',
            '重量': 'weight',
            '名称': 'label',
            '数量': 'amount',
        }
        saved_data[name].sort((x1, x2) => {
            let ret = 0;
            let hding = hding_ref[event.target.innerText];
            if (['label', 'amount'].includes(hding)) {
                if (x1[hding_ref[event.target.innerText]] == x2[hding_ref[event.target.innerText]])
                    ret = 0;
                if (x1[hding_ref[event.target.innerText]] < x2[hding_ref[event.target.innerText]])
                    ret = -1;
                else ret = 1;
            } else {
                let y1 = saved_items.find(element => element.name == x1.name);
                let y2 = saved_items.find(element => element.name == x2.name);
                
                if (y1[hding_ref[event.target.innerText]] == y2[hding_ref[event.target.innerText]])
                    ret = 0;
                if (y1[hding_ref[event.target.innerText]] < y2[hding_ref[event.target.innerText]])
                    ret = -1;
                else ret = 1;
            }
            
            return event.ctrlKey ? -1*ret : ret;
        });
        eval('load_' + name + '()');

        fetch(window.location.origin+'/api/update/'+pc_id, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(saved_data)
        }).catch(err => alert('Fetch 错误: ' + err));
    });
});

/**
 * 绑定法术参照界面法术表格的排序按钮
 */
spells_table.rows[0].addEventListener('click', (event) => {
    let hding_ref = {
        '名称': 'name',
        '环阶': 'level',
        '学派': 'school',
        '射程': 'range',
        '来源': 'source'
    }
    saved_spells.sort((x1, x2) => {
        let ret = 0;
        if (x1[hding_ref[event.target.innerText]] == x2[hding_ref[event.target.innerText]])
            ret = 0;
        if (x1[hding_ref[event.target.innerText]] < x2[hding_ref[event.target.innerText]])
            ret = -1;
        else ret = 1;
        
        return event.ctrlKey ? -1*ret : ret;
    });

    load_spells();
});

/**
 * 绑定施法表格的排序按钮
 */
spellcasting_table.rows[0].addEventListener('click', (event) => {
    let hding_ref = {
        '名称': 'name',
        '环阶': 'level',
        '学派': 'school',
        '射程': 'range',
        '来源': 'source'
    }
    saved_data.spells.sort((x1, x2) => {
        let ret = 0;
        let y1 = saved_spells.find(element => element.name == x1);
        let y2 = saved_spells.find(element => element.name == x2);
        if (y1[hding_ref[event.target.innerText]] == y2[hding_ref[event.target.innerText]])
            ret = 0;
        if (y1[hding_ref[event.target.innerText]] < y2[hding_ref[event.target.innerText]])
            ret = -1;
        else ret = 1;
        
        return event.ctrlKey ? -1*ret : ret;
    });

    load_spellcasting();

    fetch(window.location.origin+'/api/update/'+pc_id, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(saved_data)
    }).catch(err => alert('Fetch 错误: ' + err));
});

/**
 * 绑定法术位追踪器按钮
 */
document.querySelectorAll('.slot').forEach(slot => {
    slot.addEventListener('click', () => {
        let n = Number(slot.innerText.split(' ')[0]);
        if (n > 0) {
            saved_data.spell_slots[slot.parentElement.cellIndex-1] -= 1;
            load_spellcasting_info();
            show_toast('施放 ' + slot.parentElement.cellIndex + ' 环法术', 1000);
        
            fetch(window.location.origin+'/api/update/'+pc_id, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(saved_data)
            }).catch(err => alert('Fetch 错误: ' + err));
        } else {
            show_toast('无可用法术位', 1000);
        }
    });
});

/**
 * 绑定添加自定义物品按钮
 */
scroll_backpack.querySelectorAll('.btn-add').forEach(ele => {
    ele.addEventListener('click', () => {
        saved_data.backpack.push({
            "name": "自定义  Custom Thing",
            "label": "自定义",
            "weight": "0",
            "amount": "1"
        });
        load_backpack();
        backpack_table.rows[backpack_table.rows.length-1].click()
    });
});

/**
 * Input, Select 内容改变后保存并上传
 */
document.querySelectorAll('input, select').forEach(element => {
    if (element.id == 'character_selector') return;
    if (element.id == 'roll_input') return;
    element.addEventListener('change', () => {
        let character_selector = document.getElementById('character_selector');
        if (element.tagName == 'SELECT') {
            if (element.id == 'class_name') {
                // 职业选择器
                saved_data.main.class = element.selectedOptions[0].innerText;
                character_selector.selectedOptions[0].innerText = saved_data.main.race
                    + saved_data.main.class + ': ' + saved_data.main.character_name;
                document.title = saved_data.main.race + saved_data.main.class + ': ' + saved_data.main.character_name;
            } else if (element.id == 'subclass_name') {
                // 子职业选择器
                saved_data.main.subclass = element.selectedOptions[0].innerText;
            } else if (element.parentElement.parentElement.parentElement.parentElement.id == 'skills') {
                // 技能熟练选择器
                let skls_ref = ['', 
                    'athletics',
                    'acrobatics', 'sleight_of_hand', 'stealth',
                    'investigation', 'arcana', 'history', 'nature', 'religion',
                    'perception', 'insight', 'animal_handling', 'medicine', 'survival',
                    'persuasion', 'deception', 'intimidation', 'performance'
                ];
                let skill = skls_ref[element.parentElement.parentElement.rowIndex];
                saved_data.skill_proficiency = saved_data.skill_proficiency.filter(x => x!=skill);
                saved_data.double_skill_proficiency = saved_data.double_skill_proficiency.filter(x => x!=skill);
                saved_data.half_skill_proficiency = saved_data.half_skill_proficiency.filter(x => x!=skill);
                
                switch (element.selectedOptions[0].innerText) {
                    case 'O': saved_data.skill_proficiency.push(skill); break;
                    case 'D': saved_data.double_skill_proficiency.push(skill); break;
                    case 'H': saved_data.half_skill_proficiency.push(skill); break;
                }
            }
        } else if (element.tagName == 'INPUT') {
            if (element.id != '') {
                // 主要信息栏
                saved_data.main[element.id] = element.value;
                character_selector.selectedOptions[0].innerText = saved_data.main.race
                    + saved_data.main.class + ': ' + saved_data.main.character_name;
                document.title = saved_data.main.race + saved_data.main.class + ': ' + saved_data.main.character_name;
            } else if (element.parentElement.parentElement.id != '') {
                // 摘要栏
                switch (element.parentElement.parentElement.id) {
                    case 'initiative': saved_data.abstract['initiative_bonus'] = element.value; break;
                    case 'armor_class': saved_data.abstract['armor_class_bonus'] = element.value; break;
                    case 'hit_point': saved_data.abstract['hit_point'][element.parentElement.cellIndex-1] = element.value; break;
                    case 'hit_dice': saved_data.abstract['hit_dice'] = element.value; break;
                    case 'special_value': saved_data.abstract['special_value'][element.parentElement.cellIndex] = element.value; break;
                    case 'temporary_hit_point': saved_data.abstract['hit_point'][2] = element.value; break;
                    case 'inspiration': saved_data.abstract['inspiration'] = element.value; break;
                }
            } else if (element.parentElement.parentElement.parentElement.parentElement.id != '') {
                // 属性栏、技能栏、状态栏、钱币栏、装备栏
                switch (element.parentElement.parentElement.parentElement.parentElement.id) {
                    case 'skills':
                        let skls_ref = ['', 
                            'athletics',
                            'acrobatics', 'sleight_of_hand', 'stealth',
                            'investigation', 'arcana', 'history', 'nature', 'religion',
                            'perception', 'insight', 'animal_handling', 'medicine', 'survival',
                            'persuasion', 'deception', 'intimidation', 'performance'
                        ];
                        let skill = skls_ref[element.parentElement.parentElement.rowIndex];
                        saved_data.skill_bonus[skill] = element.value;
                        break;
                    case 'abilities':
                        let abs_ref = ['', 'strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
                        let ability = abs_ref[element.parentElement.parentElement.rowIndex];
                        saved_data.abilities[ability] = element.value;
                        break;
                    case 'conditions':
                        let cons_ref = {'状态': 'conditions', '免疫': 'immunizations', '易伤': 'vulnerabilities', '抗性': 'resistances'};
                        let label = cons_ref[element.parentElement.previousElementSibling.innerText];
                        saved_data.abstract[label] = element.value;
                        break;
                    case 'coins_in_main':
                        let coins1_ref = ['gold_pieces', 'silver_pieces', 'copper_pieces'];
                        let pieces1 = coins1_ref[element.parentElement.parentElement.rowIndex];
                        saved_data.coins[pieces1] = element.value;
                        load_coins();
                        break;
                    case 'coins_in_backpack':
                        let coins2_ref = ['gold_pieces', 'silver_pieces', 'copper_pieces'];
                        let pieces2 = coins2_ref[element.parentElement.parentElement.rowIndex];
                        saved_data.coins[pieces2] = element.value;
                        load_coins();
                        break;
                    case 'gear_table':
                        saved_data.gear[
                            element.parentElement.previousElementSibling.innerText
                        ] = element.value;
                        break;
                }
            }
        }
    
        load_main();

        fetch(window.location.origin+'/api/update/'+pc_id, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(saved_data)
        }).catch(err => alert('Fetch 错误: ' + err)); 
    });
});
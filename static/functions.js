/**
 * 加载角色选择器
 * 
 * 根据传入的角色列表 data 设定角色选择器
 */
function load_character_selector(data) {
    let character_selector = document.getElementById('character_selector');
    for (let i in data) {
        let label = data[i][1]+': '+data[i][2]
        if (data[i][0] == 'template') label = '创建新角色';
        if (data[i][1]=='' && data[i][2]==0) label = '正在创建';

        const option = new Option(label, data[i][0]);
        character_selector.add(option);

        if (data[i][0] == pc_id) {
            character_selector.selectedIndex = i;
            document.title = label;
        }
    }

    character_selector.addEventListener('change', () => {
        window.location.href = (
            [window.location.origin, character_selector.selectedOptions[0].value, 'main'].join('/')
        );
    });
}

/**
 * 加载主要情况栏
 * 
 * 依次加载主要信息、装备、属性、技能、摘要
 * 并计算需要的数值
 */
function load_main() {
    if (saved_data.main.character_name!='' && saved_data.main.class!='' && saved_data.main.race!='') {
        load_info();
        load_gear();
        load_abilities();
        load_skills();
        load_abstract();
    }
}

/**
 * 加载钱币
 */
function load_coins() {
    assign(coins_1.children[0].children[0].children[1].children[0], saved_data.coins.gold_pieces);
    assign(coins_1.children[0].children[1].children[1].children[0], saved_data.coins.silver_pieces);
    assign(coins_1.children[0].children[2].children[1].children[0], saved_data.coins.copper_pieces);
    assign(coins_2.children[0].children[0].children[1].children[0], saved_data.coins.gold_pieces);
    assign(coins_2.children[0].children[1].children[1].children[0], saved_data.coins.silver_pieces);
    assign(coins_2.children[0].children[2].children[1].children[0], saved_data.coins.copper_pieces);
}


/**
 * 加载物品栏
 * 
 * 将 saved_items 内的条目依次插入表格 items_table
 */
function load_items() {
    for (let i=0; i<saved_items.length; i++) {
        const row = items_table.insertRow();
        row.classList.add('table-item');
        row.insertCell().innerText = saved_items[i].name.split('  ')[0];
        row.insertCell().innerText = saved_items[i].type.join('、');
        row.insertCell().innerText = saved_items[i].value + ' gp';
        row.insertCell().innerText = saved_items[i].weight + ' 磅';
        row.insertCell().innerText = saved_items[i].source;

        row.addEventListener("click", (event) => {
            items_item_board.children[0].innerHTML = saved_items[i].name;
            items_item_board.children[1].innerHTML = saved_items[i].type.join('、') + '<br/>';
            items_item_board.children[1].innerHTML += saved_items[i].value + ' gp、' + saved_items[i].weight + ' 磅';
            items_item_board.children[1].innerHTML += (
                (saved_items[i].type.includes('武器'))
                ?('<br/><span id="item_dice" class="dice">' + saved_items[i].dmg[1] + '</span> ' + saved_items[i].dmg[0])
                :('')
            );
            items_item_board.children[1].innerHTML += (
                (saved_items[i].properties.includes('可双手'))
                ?(' - 可双手 (<span id="item_dice" class="dice">' + saved_items[i].dmg[2] + '</span>)')
                :('')
            );
            items_item_board.children[2].innerHTML = '';
            for (let j=0; j<saved_items[i].entries.length; j++) {
                items_item_board.children[2].innerHTML += '<p>' + saved_items[i].entries[j] + '</p>';
            }
            for (let j=0; j<saved_items[i].properties.length; j++) {
                let element = '<p>'
                    + '<span class="board-item">' + saved_items[i].properties[j] + '. </span>'
                    + data_properties[saved_items[i].properties[j]].entries.join('<br/><br/>')
                    + '</p>';
                    items_item_board.children[2].innerHTML += element;
            }

            items_item_board.children[1].querySelectorAll('.dice').forEach(dice => {
                dice.addEventListener("click", () => {
                    if (roll_board.innerHTML != '') roll_board.innerHTML += '<br\>';
                    roll_board.innerHTML += get_label(dice);
                    roll_board.innerHTML += roll_dice(dice.innerText);
                    roll_board.scroll({top: roll_board.scrollHeight, left: 0, behavior: "smooth"});
                });
            });

            if (event.ctrlKey) {
                saved_data.backpack.push({name: saved_items[i].name, label: '', amount: '1'});
                load_backpack();
                show_toast('已添加【' + saved_items[i].name.split('  ')[0] + '】至背包', 3000);
                fetch(window.location.origin+'/api/update/'+pc_id, {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(saved_data)
                }).catch(err => alert('Fetch3 错误: ' + err));
            }

            if (event.shiftKey) {
                saved_data.storage.push({name: saved_items[i].name, label: '', amount: '1'});
                load_storage();
                show_toast('已添加【' + saved_items[i].name.split('  ')[0] + '】至仓库', 3000);
                fetch(window.location.origin+'/api/update/'+pc_id, {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(saved_data)
                }).catch(err => alert('Fetch3 错误: ' + err));
            }
        });
    }
}

/**
 * 加载背包
 * 
 */
function load_backpack() {
    while (backpack_table.rows.length > 1) {
        backpack_table.deleteRow(1);
    }

    let current_weight = 0;
    for (let i in saved_data.backpack) {
        let item = saved_items.find(element => element.name == saved_data.backpack[i].name);
        current_weight += Number(item.weight) * Number(saved_data.backpack[i].amount);

        const row = backpack_table.insertRow();
        row.classList.add('table-item');
        row.value = item.name;
        let label = row.insertCell()
        label.innerHTML = '<input type="text" class="form-control"/>';
        label.children[0].value = saved_data.backpack[i].label!='' ?
            saved_data.backpack[i].label : item.name.split('  ')[0];
        row.insertCell().innerText = item.type.join('、');
        row.insertCell().innerText = item.properties.join('、');
        row.insertCell().innerText = item.value + ' gp';
        row.insertCell().innerText = item.weight + ' 磅';
        let amount = row.insertCell()
        amount.innerHTML = '<input type="text" class="form-control"/>';
        amount.children[0].value = saved_data.backpack[i].amount;

        row.addEventListener("click", (event) => {
            backpack_item_board.children[0].innerHTML = item.name;
            backpack_item_board.children[1].innerHTML = item.type.join('、') + '<br/>';
            backpack_item_board.children[1].innerHTML += item.value + ' gp、' + item.weight + ' 磅';
            backpack_item_board.children[1].innerHTML += (
                (item.type.includes('武器'))
                ?('<br/><span id="item_dice" class="dice">' + item.dmg[1] + '</span> ' + item.dmg[0])
                :('')
            );
            backpack_item_board.children[1].innerHTML += (
                (item.properties.includes('可双手'))
                ?(' - 可双手 (<span id="item_dice" class="dice">' + item.dmg[2] + '</span>)')
                :('')
            );
            backpack_item_board.children[2].innerHTML = '';
            for (let j=0; j<item.entries.length; j++) {
                backpack_item_board.children[2].innerHTML += '<p>' + item.entries[j] + '</p>';
            }
            for (let j=0; j<item.properties.length; j++) {
                let element = '<p>'
                    + '<span class="board-item">' + item.properties[j] + '. </span>'
                    + data_properties[item.properties[j]].entries.join('<br/><br/>')
                    + '</p>';
                backpack_item_board.children[2].innerHTML += element;
            }

            backpack_item_board.children[1].querySelectorAll('.dice').forEach(dice => {
                dice.addEventListener("click", () => {
                    if (roll_board.innerHTML != '') roll_board.innerHTML += '<br\>';
                    roll_board.innerHTML += get_label(dice);
                    roll_board.innerHTML += roll_dice(dice.innerText);
                    roll_board.scroll({top: roll_board.scrollHeight, left: 0, behavior: "smooth"});
                });
            });

            if (event.ctrlKey) {
                saved_data.storage.push(saved_data.backpack[i]);
                saved_data.backpack.splice(i, 1);
                load_backpack();
                load_storage();
                show_toast('已存放【' + label.children[0].value + '】至仓库', 3000);
                fetch(window.location.origin+'/api/update/'+pc_id, {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(saved_data)
                }).catch(err => alert('Fetch3 错误: ' + err));
            }
        });

        label.addEventListener("change", () => {
            saved_data.backpack[i].label = label.children[0].value;
            fetch(window.location.origin+'/api/update/'+pc_id, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(saved_data)
            }).catch(err => alert('Fetch3 错误: ' + err));
        });

        amount.addEventListener("change", () => {
            if (amount.children[0].value == '0') {
                saved_data.backpack.splice(i, 1);
                load_backpack();
                show_toast('已丢弃【' + label.children[0].value + '】', 3000);
            } else {
                saved_data.backpack[i].amount = amount.children[0].value;
                load_backpack();
            }
            
            fetch(window.location.origin+'/api/update/'+pc_id, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(saved_data)
            }).catch(err => alert('Fetch3 错误: ' + err));
        });
    }
    assign(current_weight_1, current_weight + ' 磅');
    assign(current_weight_2, current_weight + ' 磅');
}

/**
 * 加载仓库
 * 
 */
function load_storage() {
    while (storage_table.rows.length > 1) {
        storage_table.deleteRow(1);
    }

    for (let i in saved_data.storage) {
        let item = saved_items.find(element => element.name == saved_data.storage[i].name);

        const row = storage_table.insertRow();
        row.classList.add('table-item');
        row.value = item.name;
        let label = row.insertCell()
        label.innerHTML = '<input type="text" class="form-control"/>';
        label.children[0].value = saved_data.storage[i].label!='' ?
            saved_data.storage[i].label : item.name.split('  ')[0];
        row.insertCell().innerText = item.type.join('、');
        row.insertCell().innerText = item.properties.join('、');
        row.insertCell().innerText = item.value + ' gp';
        row.insertCell().innerText = item.weight + ' 磅';
        let amount = row.insertCell()
        amount.innerHTML = '<input type="text" class="form-control"/>';
        amount.children[0].value = saved_data.storage[i].amount;

        row.addEventListener("click", (event) => {
            backpack_item_board.children[0].innerHTML = item.name;
            backpack_item_board.children[1].innerHTML = item.type.join('、') + '<br/>';
            backpack_item_board.children[1].innerHTML += item.value + ' gp、' + item.weight + ' 磅';
            backpack_item_board.children[1].innerHTML += (
                (item.type.includes('武器'))
                ?('<br/><span id="item_dice" class="dice">' + item.dmg[1] + '</span> ' + item.dmg[0])
                :('')
            );
            backpack_item_board.children[1].innerHTML += (
                (item.properties.includes('可双手'))
                ?(' - 可双手 (<span id="item_dice" class="dice">' + item.dmg[2] + '</span>)')
                :('')
            );
            backpack_item_board.children[2].innerHTML = '';
            for (let j=0; j<item.entries.length; j++) {
                backpack_item_board.children[2].innerHTML += '<p>' + item.entries[j] + '</p>';
            }
            for (let j=0; j<item.properties.length; j++) {
                let element = '<p>'
                    + '<span class="board-item">' + item.properties[j] + '. </span>'
                    + data_properties[item.properties[j]].entries.join('<br/><br/>')
                    + '</p>';
                backpack_item_board.children[2].innerHTML += element;
            }

            backpack_item_board.children[1].querySelectorAll('.dice').forEach(dice => {
                dice.addEventListener("click", () => {
                    if (roll_board.innerHTML != '') roll_board.innerHTML += '<br\>';
                    roll_board.innerHTML += get_label(dice);
                    roll_board.innerHTML += roll_dice(dice.innerText);
                    roll_board.scroll({top: roll_board.scrollHeight, left: 0, behavior: "smooth"});
                });
            });

            if (event.ctrlKey) {
                saved_data.backpack.push(saved_data.storage[i]);
                saved_data.storage.splice(i, 1);
                load_backpack();
                load_storage();
                show_toast('已拿取【' + label.children[0].value + '】至背包', 3000);
                fetch(window.location.origin+'/api/update/'+pc_id, {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(saved_data)
                }).catch(err => alert('Fetch3 错误: ' + err));
            }
        });

        label.addEventListener("change", () => {
            saved_data.storage[i].label = label.children[0].value;
            fetch(window.location.origin+'/api/update/'+pc_id, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(saved_data)
            }).catch(err => alert('Fetch3 错误: ' + err));
        });

        amount.addEventListener("change", () => {
            if (amount.children[0].value == '0') {
                saved_data.storage.splice(i, 1);
                load_storage();
                show_toast('已丢弃【' + label.children[0].value + '】', 3000);
            } else {
                saved_data.storage[i].amount = amount.children[0].value;
            }
            
            fetch(window.location.origin+'/api/update/'+pc_id, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(saved_data)
            }).catch(err => alert('Fetch3 错误: ' + err));
        });
    }
}

/**
 * 加载主要信息
 */
function load_info() {
    assign(character_name, saved_data.main.character_name);
    assign(race, saved_data.main.race);
    assign(class_name, saved_data.main.class);
    assign(class_level, saved_data.main.class_level);
    assign(experience_points, saved_data.main.experience_points);

    computed_data.proficiency_bonus = parseInt((saved_data.main.class_level-1)/4)+2;
    assign(proficiency_bonus, computed_data.proficiency_bonus);
}

/**
 * 载入装备
 */
function load_gear() {
    // for (all gear) {
    //     equip this gear
    // }
}

/**
 * 载入属性
 */
function load_abilities() {
    for (let x in saved_data.abilities) {
        computed_data[x] = saved_data.abilities[x];
    }

    
    // 根据装备修改属性
    // for (all gear) {
    //     modify info
    // }

    let abs_ref = ['', 'strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
    let prof_ref = {
        '野蛮人': ['strength', 'constitution'],
        '吟游诗人': ['dexterity', 'charisma'],
        '牧师': ['wisdom', 'charisma'],
        '德鲁伊': ['intelligence', 'wisdom'],
        '战士': ['strength', 'constitution'],
        '武僧': ['strength', 'dexterity'],
        '圣武士': ['wisdom', 'charisma'],
        '游侠': ['strength', 'dexterity'],
        '游荡者': ['dexterity', 'intelligence'],
        '术士': ['constitution', 'charisma'],
        '契术师': ['wisdom', 'charisma'],
        '法师': ['intelligence', 'wisdom']
    }
    let rows = abilities.tBodies[0].children;
    for (i=1; i<rows.length; i++) {
        let value = sum(computed_data[abs_ref[i]]);
        let proficiency = prof_ref[saved_data.main.class].includes(abs_ref[i]);

        assign(rows[i].children[0], proficiency?'O':'X') // 熟练
        assign(rows[i].children[2].children[0], value); // 属性值
        assign(rows[i].children[3].children[0], parseInt(value/2)-5); // 调整值
        assign(rows[i].children[4].children[0],
            parseInt(value/2)-5 + (proficiency?computed_data.proficiency_bonus:0)
        ); // 豁免
    }
}

/**
 * 载入技能
 */
function load_skills() {
    let skls_ref = ['', 
        'athletics',
        'acrobatics', 'sleight_of_hand', 'stealth',
        'investigation', 'arcana', 'history', 'nature', 'religion',
        'perception', 'insight', 'animal_handling', 'medicine', 'survival',
        'persuasion', 'deception', 'intimidation', 'performance'
    ];
    let abs_ref = ['', 
        'strength', 
        'dexterity', 'dexterity', 'dexterity', 
        'intelligence', 'intelligence', 'intelligence', 'intelligence', 'intelligence', 
        'wisdom', 'wisdom', 'wisdom', 'wisdom', 'wisdom', 
        'charisma', 'charisma', 'charisma', 'charisma'
    ];
    let rows = skills.tBodies[0].children;
    for (i=1; i<rows.length; i++) {
        let proficiency = 0;
        if (saved_data.skill_proficiency.includes(skls_ref[i])) proficiency = 1;
        if (saved_data.double_skill_proficiency.includes(skls_ref[i])) proficiency = 2;
        if (saved_data.half_skill_proficiency.includes(skls_ref[i])) proficiency = 3;

        assign(rows[i].children[0].children[0], ['X', 'O', 'D', 'H'][proficiency]) // 熟练
        assign(rows[i].children[2].children[0], saved_data.skill_bonus[skls_ref[i]]); // 修正
        assign(rows[i].children[3].children[0],
            parseInt(sum(computed_data[abs_ref[i]])/2)-5
            + Number(saved_data.skill_bonus[skls_ref[i]])
            + parseInt([0, 1, 2, 0.5][proficiency] * Number(computed_data.proficiency_bonus))
        ); // 总值
    }
}

/**
 * 载入摘要
 */
function load_abstract() {
    assign(initiative.children[1].children[0], saved_data.abstract['initiative_bonus']);
    assign(initiative.children[2].children[0],
        parseInt(sum(computed_data['dexterity'])/2)-5 + Number(saved_data.abstract['initiative_bonus'])
    ); // 先攻

    assign(armor_class.children[1].children[0], saved_data.abstract['armor_class_bonus']);
    assign(armor_class.children[2],
        10 + parseInt(sum(computed_data['dexterity'])/2)-5
        + Number(saved_data.abstract['armor_class_bonus'])
    ); // 护甲等级

    let abs_ref = {
        '野蛮人': '体质',
        '吟游诗人': '魅力',
        '牧师': '感知',
        '德鲁伊': '感知',
        '战士': '智力',
        '武僧': '感知',
        '圣武士': '魅力',
        '游侠': '感知',
        '游荡者': '智力',
        '术士': '魅力',
        '契术师': '魅力',
        '法师': '智力'
    };
    assign(spellcasting_ability.children[1], abs_ref[saved_data.main['class']]); // 施法关键属性
    
    assign(difficulty_class.children[1],
        8 + parseInt(sum(computed_data['intelligence'])/2)-5 + Number(computed_data.proficiency_bonus)
    ); // 法术豁免难度等级

    assign(passive_perception.children[1],
        10 + Number(skills.tBodies[0].children[10].children[3].innerText)
    ); // 被动察觉

    assign(hit_point.children[1].children[0], saved_data.abstract['hit_point'][0]); // 当前生命值
    assign(hit_point.children[2].children[0], saved_data.abstract['hit_point'][1]); // 最大生命值
    assign(temporary_hit_point.children[1].children[0], saved_data.abstract['hit_point'][2]); // 临时生命值

    let hd_ref = {
        '野蛮人': '1d12',
        '吟游诗人': '1d8',
        '牧师': '1d8',
        '德鲁伊': '1d8',
        '战士': '1d10',
        '武僧': '1d8',
        '圣武士': '1d10',
        '游侠': '1d10',
        '游荡者': '1d8',
        '术士': '1d6',
        '契术师': '1d8',
        '法师': '1d6'
    };
    assign(hit_dice.children[1].children[0], saved_data.abstract['hit_dice']); // 剩余生命骰数量
    assign(hit_dice.children[2], saved_data.main['class_level']); // 最大生命骰数量
    assign(hit_dice_value.children[1].children[0], hd_ref[saved_data.main['class']]); // 生命骰数值

    assign(special_value.children[0].children[0], saved_data.abstract['special_value'][0]); // 特殊能力名称
    assign(special_value.children[1].children[0], saved_data.abstract['special_value'][1]); // 特殊能力剩余数量
    assign(special_value.children[2].children[0], saved_data.abstract['special_value'][2]); // 特殊能力最大数量
    
    assign(inspiration.children[1].children[0], saved_data.abstract['inspiration']); // 激励

    assign(conditions.children[0].children[0].children[1].children[0],
        saved_data.abstract['conditions']); // 状态
    assign(conditions.children[0].children[0].children[3].children[0],
        saved_data.abstract['immunizations']); // 免疫
    assign(conditions.children[0].children[1].children[1].children[0],
        saved_data.abstract['vulnerabilities']); // 易伤
    assign(conditions.children[0].children[1].children[3].children[0],
        saved_data.abstract['resistances']); // 抗性
}


/**
 * 为元素 element 设置值 value
 */
function assign(element, value) {
    switch (element.tagName) {
        case 'INPUT': element.value = value; break;
        case 'BUTTON': element.innerText = value; break;
        case 'SELECT':
            let isFound = false;
            for (let i=0; i<element.options.length; i++) {
                if (element.options[i].value == value) {
                    element.selectedIndex = i;
                    isFound = true;
                    break;
                }
            }
            if (!isFound) {
                console.log(element.options[0])
                alert('未知选项 in ' + element.id + ': ' + value + '!');
            }
            break;
        default: element.innerText = value;
    }
}

/**
 * 给数值列表求和
 * 
 * sum([[d1,s1], [d2,s3]]) == d1+d2
 */
function sum(list) {
    let res = 0;
    if (!isNaN(Number(list))) return Number(list);

    for (let i in list) {
        res += Number(list[i][0]);
    }
    return res;
}

/**
 * 当某个可输入元素变动时调用
 * 修改 saved_data 
 * 并重新载入数据
 */
function change_data(element) {
    let character_selector = document.getElementById('character_selector');

    if (element.tagName == 'SELECT') {
        if (element.id != '') {
            saved_data.main.class = element.selectedOptions[0].innerText;
            character_selector.selectedOptions[0].innerText = saved_data.main.race
                + saved_data.main.class + ': ' + saved_data.main.character_name;
            document.title = saved_data.main.race + saved_data.main.class + ': ' + saved_data.main.character_name;
        } else if (element.parentElement.parentElement.parentElement.parentElement.id == 'skills') {
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
            saved_data.main[element.id] = element.value;
            character_selector.selectedOptions[0].innerText = saved_data.main.race
                + saved_data.main.class + ': ' + saved_data.main.character_name;
            document.title = saved_data.main.race + saved_data.main.class + ': ' + saved_data.main.character_name;
        } else if (element.parentElement.parentElement.id != '') {
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
                case 'coins_1':
                    let coins1_ref = ['gold_pieces', 'silver_pieces', 'copper_pieces'];
                    let pieces1 = coins1_ref[element.parentElement.parentElement.rowIndex];
                    saved_data.coins[pieces1] = element.value;
                    load_coins();
                    break;
                case 'coins_2':
                    let coins2_ref = ['gold_pieces', 'silver_pieces', 'copper_pieces'];
                    let pieces2 = coins2_ref[element.parentElement.parentElement.rowIndex];
                    saved_data.coins[pieces2] = element.value;
                    load_coins();
                    break;
            }
        }
    }

    load_main();
}

/**
 * 生成骰子元素 element 的显示标签
 */
function get_label(element) {
    let label = '';
    if (element.parentElement.parentElement.parentElement.parentElement.id == 'skills') {
        label += element.parentElement.parentElement.children[1].innerText;
    } else if (element.parentElement.parentElement.parentElement.parentElement.id == 'abilities') {
        label += element.parentElement.parentElement.children[1].innerText;
        if (element.parentElement.cellIndex == 4) label += '豁免';
    } else if (element.parentElement.parentElement.id != '') {
        label += element.parentElement.parentElement.children[0].innerText.split(' ')[0];
    } else {
        return '';
    }
    return label + ': ';
}

/**
 * 投骰
 */
function roll_dice(dice_value) {
    let dice_result = 0;
    let dice_info = ' = ';

    if ((new RegExp(/^[0-9]+$/)).test(dice_value)) { // 1
        let dice = Math.floor(Math.random() * 20) + 1;
        dice_result += dice;
        dice_result += Number(dice_value);
        if (dice==1) dice = '<span style=\'color: #ef4444;\'>' + dice + '</span>';
        if (dice==20) dice = '<span style=\'color: #22c55e;\'>' + dice + '</span>';
        dice_info += '[' + dice + ']+';
        dice_info += dice_value;
    } else if ((new RegExp(/^[0-9]+d[0-9]+\+[0-9]+$/)).test(dice_value)) { // 1d20+1
        let N = Number(dice_value.split('d')[0]);
        for (let i=0; i < N; i++) {
            let dice = Math.floor(Math.random() * Number(dice_value.split('d')[1].split('+')[0])) + 1;
            dice_result += dice;
            if (Number(dice_value.split('d')[1].split('+')[0])==20 && dice==1) {
                dice = '<span style=\'color: #ef4444;\'>' + dice + '</span>';
            }
            if (Number(dice_value.split('d')[1].split('+')[0])==20 && dice==20) {
                dice = '<span style=\'color: #22c55e;\'>' + dice + '</span>';
            }
            dice_info += '[' + dice + ']+';
        }
        dice_result += Number(dice_value.split('+')[1]);
        dice_info += Number(dice_value.split('+')[1]);
    } else if ((new RegExp(/^[0-9]+d[0-9]+$/)).test(dice_value)) { // 1d20
        let N = Number(dice_value.split('d')[0]);
        for (let i=0; i < N; i++) {
            let dice = Math.floor(Math.random() * Number(dice_value.split('d')[1])) + 1;
            dice_result += dice;
            if (Number(dice_value.split('d')[1])==20 && dice==1) {
                dice = '<span style=\'color: #ef4444;\'>' + dice + '</span>';
            }
            if (Number(dice_value.split('d')[1])==20 && dice==20) {
                dice = '<span style=\'color: #22c55e;\'>' + dice + '</span>';
            }
            dice_info += '[' + dice + ']+';
        }
        dice_info = dice_info.slice(0, -1);
    } else if ((new RegExp(/^\+[0-9]+$/)).test(dice_value)) { // +1
        let dice = Math.floor(Math.random() * 20) + 1;
        dice_result += dice;
        dice_result += Number(dice_value);
        if (dice==1) dice = '<span style=\'color: #ef4444;\'>' + dice + '</span>';
        if (dice==20) dice = '<span style=\'color: #22c55e;\'>' + dice + '</span>';
        dice_info += '[' + dice + ']';
        dice_info += dice_value;
    } else if ((new RegExp(/^-[0-9]+$/)).test(dice_value)) { // -1
        let dice = Math.floor(Math.random() * 20) + 1;
        dice_result += dice;
        dice_result += Number(dice_value);
        if (dice==1) dice = '<span style=\'color: #ef4444;\'>' + dice + '</span>';
        if (dice==20) dice = '<span style=\'color: #22c55e;\'>' + dice + '</span>';
        dice_info += '[' + dice + ']';
        dice_info += dice_value;
    } else if ((new RegExp(/^[0-9]+d[0-9]+-[0-9]+$/)).test(dice_value)) {
        let N = Number(dice_value.split('d')[0]);
        for (let i=0; i < N; i++) {
            let dice = Math.floor(Math.random() * Number(dice_value.split('d')[1].split('-')[0])) + 1;
            dice_result += dice;
            if (Number(dice_value.split('d')[1].split('-')[0])==20 && dice==1) {
                dice = '<span style=\'color: #ef4444;\'>' + dice + '</span>';
            }
            if (Number(dice_value.split('d')[1].split('-')[0])==20 && dice==20) {
                dice = '<span style=\'color: #22c55e;\'>' + dice + '</span>';
            }
            dice_info += '[' + dice + ']+';
        }
        dice_result -= Number(dice_value.split('-')[1]);
        console.log(dice_info, dice_value)
        dice_info = dice_info.slice(0, -1);
        dice_info += '-' + dice_value.split('-')[1];
    } else {
        alert('这骰的是啥? [' + dice_value + ']');
    }
    
    return '<span style=\'color: #3b82f6;\'>' + dice_result + '</span>' + dice_info;
}

/**
 * 展示浮动消息
 */
function show_toast(message, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    toast.addEventListener('click', () => toast.remove());
    setTimeout(() => toast.remove(), duration);
  }
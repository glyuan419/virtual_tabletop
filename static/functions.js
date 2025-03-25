
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

function sum(list) {
    let res = 0;
    if (!isNaN(Number(list))) return Number(list);
    for (let i=0; i<list.length; i++) {
        res += Number(list[i][0]);
    }
    return res;
}

function change_data(element) {
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
            }
        }
    }

    load_data(saved_data);
}

function get_label(element) {
    let label = '';
    if (element.parentElement.parentElement.parentElement.parentElement.id == 'skills') {
        label += element.parentElement.parentElement.children[1].innerText;
    } else if (element.parentElement.parentElement.parentElement.parentElement.id == 'abilities') {
        label += element.parentElement.parentElement.children[1].innerText;
        if (element.parentElement.cellIndex == 4) label += '豁免';
    } else if (element.parentElement.parentElement.id != '') {
        label += element.parentElement.parentElement.children[0].innerText;
    } else {
        return '';
    }
    return label + ': ';
}

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

function load_character_selector(data) {
    for (let i=0; i<data.length; i++) {
        let label = data[i][1]+': '+data[i][2]
        if (data[i][0] == 'template') label = '创建新角色';
        const option = new Option(label, data[i][0]);
        character_selector.add(option);
        if (data[i][0] == pc_id) {
            character_selector.selectedIndex = i;
            document.title = data[i][1]+': '+data[i][2];
        }
    }
    character_selector.addEventListener('change', () => {
        window.location.href = window.location.origin + '/'
                               + character_selector.selectedOptions[0].value + '/main';
    });

    if (saved_data.main.character_name=='' || saved_data.main.class=='' || saved_data.main.race=='') {
        character_selector.selectedOptions[0].innerText = '正在创建';
        document.title = '创建新角色';
    }
}

function load_main(data) {
    assign(character_name, data.character_name);
    assign(race, data.race);
    assign(class_name, data.class);
    assign(class_level, data.class_level);
    assign(experience_points, data.experience_points);

    info.proficiency_bonus = parseInt((data.class_level-1)/4)+2;
    assign(proficiency_bonus, info.proficiency_bonus);
}



// 载入技能
function load_skills(data) {
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
    let trs = skills.tBodies[0].children;
    for (i=1; i<trs.length; i++) {
        let proficiency = 0;
        if (data.skill_proficiency.includes(skls_ref[i])) proficiency = 1;
        if (data.double_skill_proficiency.includes(skls_ref[i])) proficiency = 2;
        if (data.half_skill_proficiency.includes(skls_ref[i])) proficiency = 3;
        assign(trs[i].children[0].children[0], ['X', 'O', 'D', 'H'][proficiency]) // 熟练
        assign(trs[i].children[2].children[0], data.skill_bonus[skls_ref[i]]); // 修正
        assign(trs[i].children[3].children[0], 
            parseInt(sum(info[abs_ref[i]])/2)-5
            + Number(data.skill_bonus[skls_ref[i]])
            + parseInt([0, 1, 2, 0.5][proficiency] * Number(info.proficiency_bonus))
        ); // 总值
    }
}

function load_abstract(data) {
    // 先攻
    assign(initiative.children[1].children[0], data.abstract['initiative_bonus']);
    assign(initiative.children[2].children[0],
        parseInt(sum(info['dexterity'])/2)-5 + Number(data.abstract['initiative_bonus'])
    );
    // 护甲等级
    assign(armor_class.children[1].children[0], data.abstract['armor_class_bonus']);
    assign(armor_class.children[2],
        10 + parseInt(sum(info['dexterity'])/2)-5 + Number(data.abstract['armor_class_bonus'])
    );
    // 施法关键属性
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
    assign(spellcasting_ability.children[1], abs_ref[data.main['class']]);
    // 法术豁免难度等级
    assign(difficulty_class.children[1],
        8 + parseInt(sum(info['intelligence'])/2)-5 + Number(info.proficiency_bonus)
    );
    // 被动察觉
    assign(passive_perception.children[1],
        10 + Number(skills.tBodies[0].children[10].children[3].innerText)
    );
    // 生命值
    assign(hit_point.children[1].children[0], data.abstract['hit_point'][0]); // 当前生命值
    assign(hit_point.children[2].children[0], data.abstract['hit_point'][1]); // 最大生命值
    assign(temporary_hit_point.children[1].children[0], data.abstract['hit_point'][2]); // 临时生命值
    // 生命骰
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
    assign(hit_dice.children[1].children[0], data.abstract['hit_dice']); // 剩余生命骰数量
    assign(hit_dice.children[2], data.main['class_level']); // 最大生命骰数量
    assign(hit_dice_value.children[1].children[0], hd_ref[data.main['class']]); // 生命骰数值
    // 特殊能力
    assign(special_value.children[0].children[0], data.abstract['special_value'][0]); // 名称
    assign(special_value.children[1].children[0], data.abstract['special_value'][1]); // 剩余数量
    assign(special_value.children[2].children[0], data.abstract['special_value'][2]); // 最大数量
    // 激励
    assign(inspiration.children[1].children[0], data.abstract['inspiration']);

    // 状态	免疫 易伤 抗性
    assign(conditions.children[0].children[0].children[1].children[0], data.abstract['conditions']);
    assign(conditions.children[0].children[0].children[3].children[0], data.abstract['immunizations']);
    assign(conditions.children[0].children[1].children[1].children[0], data.abstract['vulnerabilities']);
    assign(conditions.children[0].children[1].children[3].children[0], data.abstract['resistances']);
}


// 载入属性
function load_abilities(data) {
    for (k in data.abilities) {
        info[k] = data.abilities[k];
    }
    
    // for (;'all items';) {
    //     'modify info'
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
    let trs = abilities.tBodies[0].children;
    for (i=1; i<trs.length; i++) {
        let value = sum(info[abs_ref[i]]);
        let proficiency = prof_ref[saved_data.main.class].includes(abs_ref[i]);
        assign(trs[i].children[0], proficiency?'O':'X') // 熟练
        assign(trs[i].children[2].children[0], value); // 属性值
        assign(trs[i].children[3].children[0], parseInt(value/2)-5); // 调整值
        assign(trs[i].children[4].children[0],
            parseInt(value/2)-5 + (proficiency?info.proficiency_bonus:0)
        ); // 豁免
    }

    load_skills(data);
    load_abstract(data);
}

// 装备服饰、护甲、武器
function equip_items(data) {

    // for (;'all items';) {
    //     if ('equip success') {
    //         'continue'
    //     } else if ('equip failed') {
    //         lunch_load_chains();
    //         return;
    //     }
    // }

    load_abilities(data);
}

// 启动加载链：测试性载入属性 -> 确认装备可穿戴 -> 穿戴装备 -> 载入属性 -> 载入技能 -> 载入摘要
function lunch_loading_chain(data) {
    // 测试性载入属性
    for (k in data.abilities) {
        info[k] = sum(data.abilities[k]);
    }

    equip_items(data);
}

function load_data(data) {
    if (saved_data.main.character_name!='' && saved_data.main.class!='' && saved_data.main.race!='') {
        load_main(data.main);
        lunch_loading_chain(data);
    }
}
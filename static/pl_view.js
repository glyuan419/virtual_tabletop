document.addEventListener('DOMContentLoaded', async () => {
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
        load_background();
        load_features();

        load_items();
        load_inventory();
        load_currency();

        load_spells();
        load_spellcasting();

        load_profile();
    })

    bind_nav();
    bind_long_rest_button();

    bind_background();
    bind_features();
    bind_profile();
    bind_inventory();
    bind_spellcasting();
    bind_items();
    bind_spells();

    bind_dice_box();
});

/**
 * 绑定导航栏菜单
 */
function bind_nav() {
    query('nav_' + actived_panel).classList.add('active');
    query(actived_panel + '_panel').style.display = '';

    const nav_shortcut_key = {
        'background': 'b',
        'features': 'f',
        'profile': 'p',
        'inventory': 'b',
        'spellcasting': 's',
        // 'maps': '',
        'items': '',
        'spells': ''
    }

    Object.keys(nav_shortcut_key).forEach(nav_name => {
        query('nav_' + nav_name).addEventListener('click', () => {
            const url = window.location;
            const path = url.pathname.split('/');
            path.pop();
            path.push(nav_name);
            history.pushState('', '', url.origin+path.join('/') + url.search);
        
            Object.keys(nav_shortcut_key).forEach(nav_name_2 => {
                query(nav_name_2 + '_panel').style.display = 'none';
                query('nav_' + nav_name_2).classList.remove('active');
            });

            query(nav_name + '_panel').style.display = '';
            query('nav_' + nav_name).classList.add('active');
        });
    });

    document.addEventListener('keydown', (event) => {
        if (event.ctrlKey) {
            if (event.key.toLowerCase() === 's') event.preventDefault();
            return;
        }
        if (['INPUT', 'TEXTAREA', 'DIV'].includes(document.activeElement.tagName)) return;

        Object.keys(nav_shortcut_key).forEach(nav_name => {
            if (nav_shortcut_key[nav_name] === event.key.toLowerCase()) {
                event.preventDefault();
                query('nav_' + nav_name).click();
            }
        });
    });
}

/**
 * 绑定长休按钮
 */
function bind_long_rest_button() {
    query('long_rest_button').addEventListener('click', () => {
        saved_data.combat_stats['hit_point'][0] = saved_data.combat_stats['hit_point'][1];
        saved_data.combat_stats['hit_point'][2] = '0';
        saved_data.combat_stats['hit_dice'] = saved_data.metadata.level;
        saved_data.combat_stats['special_value'][1] = saved_data.combat_stats['special_value'][2];
        saved_data.combat_stats['inspiration'] = '';
        load_combat_stats();

        death_saving.querySelectorAll('input').forEach(box => box.checked = false);

        for (let i=0; i<9; i++) {
            const label = spell_slot.rows[1].cells[i+1].children[0].innerText;
            saved_data.spell_slots[i] = label.split(' ')[2];   
        }
        load_spell_slots();

        update(saved_data);
    });
}

/**
 * 绑定骰盘
 */
function bind_dice_box() {
    document.querySelectorAll('button.dice').forEach(dice => {
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
            show_dice(dice, roll_dice(dice.innerText, (event.ctrlKey?2:1)));
        });
    });
    
    // 绑定骰盘输入框
    roll_input.addEventListener('keypress', (e) => {
        if (e.keyCode == '13') {
            if (roll_input.value === '') return;
            show_dice('输入', roll_dice(roll_input.value));
            roll_input.value = '';
        }
    });
}

/**
 * 绑定背景界面的事件
 */
function bind_background() {
    query('background_panel').querySelectorAll('input, textarea').forEach(ele => {
        ele.addEventListener('change', () => {
            if (['race_in_background', 'sex_in_background'].includes(ele.id)) {
                // 种族、性别
                saved_data.characteristics[ele.id.split('_')[0]] = ele.value;
                load_page_info();
                load_profile();
            } else if (
                ['background_in_background', 'alignment_in_background'].includes(ele.id)
            ) {
                // 背景、阵营
                saved_data.background[ele.id.split('_')[0]] = ele.value;
            } else if (
                [
                    "age", "height", "weight",
                    "hair", "skin", "eyes", "appearance"
                ].includes(ele.id)
            ) {
                saved_data.characteristics[ele.id] = ele.value;
                log(saved_data.characteristics[ele.id], ele.value)
            } else if (
                [
                    "faith", "personality_1", "personality_2",
                    "ideal", "bind", "flaw", "backstory"
                ].includes(ele.id)
            ) {
                saved_data.background[ele.id] = ele.value;
            }
    
            update(saved_data); 
        });
    });
}

/**
 * 绑定特性界面的事件
 */
function bind_features() {
    // 绑定添加按钮
    ['proficiencies', 'language', 'features'].forEach(table_name => {
        const button = query(table_name + '_table')
            .previousElementSibling.querySelector('.btn-add');
        button.addEventListener('click', () => {
            if (table_name === 'proficiencies') {
                saved_data[table_name].push(['', '']);
            } else if (table_name === 'language') {
                saved_data[table_name].push(['语言', '']);
            } else if (table_name === 'features') {
                saved_data[table_name].push(['', '', '']);
            }
    
            load_features();
    
            update(saved_data);
        });

        query(table_name + '_table').rows[0].addEventListener('click', (event) => {
            const heading_ref = {
                '类型': '0',
                '名称': '1'
            }
            
            const heading = heading_ref[event.target.innerText];
            saved_data[table_name].sort((x1, x2) => {
                let flag = 0;

                if (x1[heading] === x2[heading]) flag = 0;
                else if (x1[heading] < x2[heading]) flag = -1;
                else if (x1[heading] > x2[heading]) flag = 1;
                
                return event.ctrlKey ? -1*flag : flag;
            });

            load_features();

            update(saved_data);
        });
    });
}

/**
 * 绑定角色面板界面的事件
 */
function bind_profile() {
    // 绑定激励按钮 + 死亡豁免按钮
    query('profile_panel').querySelectorAll('.silent-dice').forEach(dice => {
        switch (dice.innerText) {
            case '死亡豁免':
                dice.addEventListener('click', () => {
                    show_dice('死亡豁免', roll_dice('1d20'));
                });
                break;
            case '激励':
                dice.addEventListener('click', () => {
                    if ((new RegExp(/^[0-9]+d[0-9]+$/)).test(inspiration.cells[1].children[0].value)) {
                        // 匹配 1d20
                        show_dice('激励', roll_dice(inspiration.cells[1].children[0].value));
                        saved_data.combat_stats.inspiration = '';
                    } else if ((new RegExp(/^[0-9]+$/)).test(inspiration.cells[1].children[0].value)) {
                        // 匹配 1
                        saved_data.combat_stats.inspiration = (
                            Number(saved_data.combat_stats.inspiration) > 1 ?
                            Number(saved_data.combat_stats.inspiration)-1 :
                            ''
                        );
                    } else {
                        saved_data.combat_stats.inspiration = '';
                    }
                    
                    load_combat_stats();

                    update(saved_data);
    
                });
                break;
        }
    });

    // 更新 Input 的修改
    query('profile_panel').querySelectorAll('input').forEach(ele => {
        ele.addEventListener('change', () => {
            if (['character_name'].includes(ele.id)) {
                // 角色名
                saved_data.metadata[ele.id] = ele.value;
                load_page_info();
            } else if (['level'].includes(ele.id)) {
                // 等级
                saved_data.metadata[ele.id] = ele.value;
                for (let x of level_ref) {
                    if (ele.value === x[0]) {
                        saved_data.metadata['experience_points'] = x[1];
                        break;
                    }
                }
                load_page_info();
            } else if (['experience_points'].includes(ele.id)) {
                // 经验值
                for (let x of level_ref) {
                    if (Number(ele.value) >= Number(x[1])) {
                        saved_data.metadata['level'] = x[0];
                        break;
                    }
                }
                saved_data.metadata[ele.id] = ele.value;
                load_page_info();
            } else if (['race_in_profile', 'sex_in_profile'].includes(ele.id)) {
                // 种族、性别
                saved_data.characteristics[ele.id.split('_')[0]] = ele.value;
                load_page_info();
                load_background();
            } else if (['background_in_profile', 'alignment_in_profile'].includes(ele.id)) {
                // 背景、阵营
                saved_data.background[ele.id.split('_')[0]] = ele.value;
                load_background()
            } else if (ele.closest('tr').id === 'initiative') {
                // 先攻
                saved_data.combat_stats['initiative_bonus'] = ele.value;
            } else if (ele.closest('tr').id === 'armor_class') {
                // 护甲等级
                saved_data.combat_stats['armor_class_bonus'] = ele.value;
            } else if (ele.closest('tr').id === 'hit_point') {
                // 生命值
                const index = ele.closest('td').cellIndex - 1;
                saved_data.combat_stats['hit_point'][index] = ele.value;
            } else if (ele.closest('tr').id === 'hit_dice') {
                // 生命骰数量
                saved_data.combat_stats['hit_dice'] = ele.value;
            } else if (ele.closest('tr').id === 'special_value') {
                // 特殊能力
                const index = ele.parentElement.cellIndex;
                saved_data.combat_stats['special_value'][index] = ele.value;
            } else if (ele.closest('tr').id === 'temporary_hit_point') {
                // 临时生命值
                saved_data.combat_stats['hit_point'][2] = ele.value;
            } else if (ele.closest('tr').id === 'inspiration') {
                // 激励
                saved_data.combat_stats['inspiration'] = ele.value;
            } else if (ele.closest('table').id === 'skills') {
                // 技能栏
                const skill = [
                    'athletics',
                    'acrobatics', 'sleight_of_hand', 'stealth',
                    'investigation', 'arcana', 'history', 'nature', 'religion',
                    'perception', 'insight', 'animal_handling', 'medicine', 'survival',
                    'persuasion', 'deception', 'intimidation', 'performance'
                ][ele.closest('tr').rowIndex - 1];
                saved_data.skills[skill][1] = ele.value;
            } else if (ele.closest('table').id === 'abilities') {
                // 属性栏
                const ability = [
                    'strength', 'dexterity', 'constitution',
                    'intelligence', 'wisdom', 'charisma'
                ][ele.closest('tr').rowIndex - 1];
                saved_data.abilities[ability] = ele.value;
            } else if (ele.closest('table').id === 'conditions') {
                // 状态栏
                const condition_ref = {
                    '状态': 'conditions', '免疫': 'immunizations',
                    '易伤': 'vulnerabilities', '抗性': 'resistances'
                };
                const label = condition_ref[
                    ele.parentElement.previousElementSibling.innerText
                ];
                saved_data.combat_stats[label] = ele.value;
            } else if (ele.closest('table').id === 'coins_in_profile') {
                // 货币栏
                const index = ele.closest('tr').rowIndex;
                saved_data.currency[index] = ele.value;
                load_currency();
            } else if (ele.closest('table').id === 'gear_table') {
                // 装备栏
                const gear_ref = [[0, 1], [3, 2], [4, 5], [7, 6], [8, 9]];
                const r = ele.closest('tr').rowIndex - 1;
                const c = parseInt(ele.closest('td').cellIndex / 2);
                saved_data.gear[gear_ref[r][c]] = ele.value;
            }
        
            load_profile();
    
            update(saved_data);
        });
    });

    // 更新 Select 的修改
    query('profile_panel').querySelectorAll('select').forEach(ele => {
        ele.addEventListener('change', () => {
            if (ele.id == 'class') {
                // 职业选择器
                saved_data.metadata.class = ele.selectedOptions[0].innerText;
                saved_data.metadata.subclass = '';
                load_page_info();
            } else if (ele.id == 'subclass') {
                // 子职业选择器
                saved_data.metadata.subclass = ele.selectedOptions[0].innerText;
            } else if (ele.closest('table').id == 'skills') {
                // 技能熟练选择器
                const skill = [
                    'athletics',
                    'acrobatics', 'sleight_of_hand', 'stealth',
                    'investigation', 'arcana', 'history', 'nature', 'religion',
                    'perception', 'insight', 'animal_handling', 'medicine', 'survival',
                    'persuasion', 'deception', 'intimidation', 'performance'
                ][ele.closest('tr').rowIndex - 1];
                saved_data.skills[skill][0] = ele.selectedOptions[0].innerText;
            }
        
            load_profile();
    
            update(saved_data); 
        });
    });
}

/**
 * 绑定背包界面的事件
 */
function bind_inventory() {
    // 绑定背包栏、仓库栏的排序按钮
    ['backpack', 'storage'].forEach(table_name => {
        query(table_name + '_table').rows[0].addEventListener('click', (event) => {
            let heading_ref = {
                '类型': 'type',
                '特性': 'properties',
                '价值': 'value',
                '重量/磅': 'weight',
                '名称': 'label',
                '数量': 'amount',
            }
            
            const heading = heading_ref[event.target.innerText];
            saved_data[table_name].sort((x1, x2) => {
                let flag = 0;
                let y1, y2;
                if (heading in x1) {
                    y1 = isNaN(parseFloat(x1[heading])) ? x1[heading] : parseFloat(x1[heading]);
                } else {
                    y1 = saved_items.find(ele => ele.name == x1.name);
                    y1 = isNaN(parseFloat(y1[heading])) ? y1[heading] : parseFloat(y1[heading]);
                }
                if (heading in x2) {
                    y2 = isNaN(parseFloat(x2[heading])) ? x2[heading] : parseFloat(x2[heading]);
                } else {
                    y2 = saved_items.find(ele => ele.name == x2.name);
                    y2 = isNaN(parseFloat(y2[heading])) ? y2[heading] : parseFloat(y2[heading]);
                }
                
                if (y1 === y2) flag = 0;
                else if (y1 < y2) flag = -1;
                else if (y1 > y2) flag = 1;
                
                return event.ctrlKey ? -1*flag : flag;
            });

            load_inventory();

            update(saved_data);
        });
    });

    // 绑定添加按钮
    const button = query('backpack_table').previousElementSibling.querySelector('.btn-add');
    button.addEventListener('click', () => {
        saved_data.backpack.push({
            name: '自定义  Custom Thing',
            label: '自定义',
            weight: '0',
            amount: '1'
        });

        load_inventory();
        load_profile();

        show_toast('已添加【自定义】至背包', 3000);

        update(saved_data);
    });

    // 更新货币栏的修改
    query('inventory_panel').querySelectorAll('input').forEach(ele => {
        ele.addEventListener('change', () => {
            const index = ele.closest('tr').rowIndex;
            saved_data.currency[index] = ele.value;
        
            load_currency();
            update(saved_data); 
        });
    });
}

/**
 * 绑定施法界面的事件
 */
function bind_spellcasting() {
    // 绑定施法表格的排序按钮
    query('spellcasting_table').rows[0].addEventListener('click', (event) => {
        const heading_ref = {
            '名称': 'name',
            '环阶': 'level',
            '学派': 'school',
            '来源': 'source'
        }
        const heading = heading_ref[event.target.innerText];
        if (heading === undefined) return;
        saved_data.spells.sort((x1, x2) => {
            let flag = 0;
            let y1 = saved_spells.find(ele => ele.name == x1);
            let y2 = saved_spells.find(ele => ele.name == x2);

            y1 = isNaN(parseFloat(y1[heading])) ? y1[heading] : parseFloat(y1[heading]);
            y2 = isNaN(parseFloat(y2[heading])) ? y2[heading] : parseFloat(y2[heading]);

            if (y1 === y2) flag = 0;
            else if (y1 < y2) flag = -1;
            else if (y1 > y2) flag = 1;
            
            return event.ctrlKey ? -1*flag : flag;
        });

        load_spellcasting();

        update(saved_data);
    });

    // 绑定法术位追踪器按钮
    document.querySelectorAll('.slot').forEach(slot => {
        slot.addEventListener('click', () => {
            let n = Number(slot.innerText.split(' ')[0]);
            if (n > 0) {
                saved_data.spell_slots[slot.parentElement.cellIndex-1] -= 1;
                load_spell_slots();
                show_toast('施放 ' + slot.parentElement.cellIndex + ' 环法术', 1000);
            
                update(saved_data);
            } else {
                show_toast('无可用法术位', 1000);
            }
        });
    });
}

/**
 * 绑定物品参照界面的事件
 */
function bind_items() {
    // 列表排序
    const heading_ref = {
        '名称': 'name',
        '类型': 'type',
        '价值': 'value',
        '重量': 'weight',
        '来源': 'source'
    };
    query('items_table').rows[0].addEventListener('click', (event) => {
        const heading = heading_ref[event.target.innerText];
        saved_items.sort((x1, x2) => {
            let flag = 0;
            const y1 = isNaN(parseFloat(x1[heading])) ? x1[heading] : parseFloat(x1[heading]);
            const y2 = isNaN(parseFloat(x2[heading])) ? x2[heading] : parseFloat(x2[heading]);
            if (y1 === y2) flag = 0;
            else if (y1 < y2) flag = -1;
            else if (y1 > y2) flag = 1;
            
            return event.ctrlKey ? -1*flag : flag;
        });
    
        load_items();
    });
}

/**
 * 绑定法术参照界面的事件
 */
function bind_spells() {
    // 列表排序
    const heading_ref = {
        '名称': 'name',
        '环阶': 'level',
        '学派': 'school',
        '施法时间': 'time',
        '射程': 'range',
        '来源': 'source'
    };
    query('spells_table').rows[0].addEventListener('click', (event) => {
        const heading = heading_ref[event.target.innerText];
        saved_spells.sort((x1, x2) => {
            let flag = 0;
            const y1 = isNaN(parseFloat(x1[heading])) ? x1[heading] : parseFloat(x1[heading]);
            const y2 = isNaN(parseFloat(x2[heading])) ? x2[heading] : parseFloat(x2[heading]);
            if (y1 === y2) flag = 0;
            else if (y1 < y2) flag = -1;
            else if (y1 > y2) flag = 1;
            
            return event.ctrlKey ? -1*flag : flag;
        });
    
        load_spells();
    });
}


/**
 * 加载角色选择器
 * 
 * 根据传入的角色列表 data 设定角色选择器
 */
function load_character_selector(data) {
    const character_selector = query('character_selector');
    for (let i in data) {
        let label = data[i][1]+': '+data[i][2]
        if (data[i][0] == 'template') {
            label = '创建新角色';
        } else if (data[i][1]=='' && data[i][2]=='') {
            label = '正在创建';
        }

        character_selector.add(new Option(label, data[i][0]));

        if (data[i][0] === pc_id) {
            character_selector.selectedIndex = i;
            document.title = label;
        }
    }

    character_selector.addEventListener('change', () => {
        window.location.href = [
            window.location.origin,
            character_selector.selectedOptions[0].value,
            'profile'
        ].join('/');
    });
}

/**
 * 加值页面信息
 */
function load_page_info() {
    query('character_selector').selectedOptions[0].innerText = (
        saved_data.characteristics.race
        + saved_data.metadata.class + ': '
        + saved_data.metadata.character_name
    );
    document.title = (
        saved_data.characteristics.race
        + saved_data.metadata.class + ': '
        + saved_data.metadata.character_name
    );
}

/**
 * 加载背景
 */
function load_background() {
    assign(query('race_in_background'), saved_data.characteristics.race);
    assign(query('sex_in_background'), saved_data.characteristics.sex);
    assign(query('age'), saved_data.characteristics.age);
    assign(query('height'), saved_data.characteristics.height);
    assign(query('weight'), saved_data.characteristics.weight);
    assign(query('hair'), saved_data.characteristics.hair);
    assign(query('skin'), saved_data.characteristics.skin);
    assign(query('eyes'), saved_data.characteristics.eyes);
    assign(query('appearance'), saved_data.characteristics.appearance);

    assign(query('background_in_background'), saved_data.background.background);
    assign(query('alignment_in_background'), saved_data.background.alignment);
    assign(query('faith'), saved_data.background.faith);
    assign(query('personality_1'), saved_data.background.personality_1);
    assign(query('personality_2'), saved_data.background.personality_2);
    assign(query('ideal'), saved_data.background.ideal);
    assign(query('bind'), saved_data.background.bind);
    assign(query('flaw'), saved_data.background.flaw);
    assign(query('backstory'), saved_data.background.backstory);
}

/**
 * 加载特性
 */
function load_features() {
    ['proficiencies', 'language', 'features'].forEach(table_name => {
        const table = query(table_name + '_table');
        
        // 清空列表
        while (table.rows.length > 1) table.deleteRow(1);

        for (let i in saved_data[table_name]) {
            const term = saved_data[table_name][i];

            const row = table.insertRow();
            row.classList.add('table-item');

            let type = null;
            let name = null;
            if (table_name === 'proficiencies') {
                type = row.insertCell();
                assign(type, '<input value="' + term[0] + '"/>');
                name = row.insertCell();
                assign(name, '<input value="' + term[1] + '"/>');
            } else if (table_name === 'language') {
                name = row.insertCell();
                assign(name, '<input value="' + term[1] + '"/>');
            } else if (table_name === 'features') {
                type = row.insertCell();
                assign(type, '<input value="' + term[0] + '"/>');
                name = row.insertCell();
                assign(name, '<input value="' + term[1] + '"/>');
            }
            
            row.addEventListener('click', (event) => {
                if (table_name === 'features') {
                    // 标记选中的条目
                    table.querySelectorAll('.selected').forEach(
                        ele => ele.classList.remove('selected')
                    );
                    row.classList.add('selected');

                    // 在右栏显示详情
                    const board = query('features_board');
                    assign(board.children[0], term[1]);
                    assign(board.children[1], term[0]);
                    assign(
                        board.children[2],
                        '<textarea class="edit-board"></textarea>'
                    );
                    assign(board.children[2].children[0], term[2]);

                    board.querySelector('.edit-board').addEventListener('change', () => {
                        saved_data[table_name][i][2] = board.children[2].children[0].value;

                        update(saved_data);
                    });
                }

                if (event.ctrlKey) {
                    saved_data[table_name].splice(i, 1);

                    if (table_name === 'proficiencies') {
                        show_toast('使用【' + term[1] + '】变得生疏', 3000);
                    } else if (table_name === 'language') {
                        show_toast('已遗忘【' + term + '】', 3000);
                    } else if (table_name === 'features') {
                        show_toast('已失去【' + term[1] + '】' + term[0], 3000);
                    }
                    
                    load_features();

                    update(saved_data);
                }
            });
            
            const input_ref = [type, name];
            for (let i in input_ref) {
                if (input_ref[i] === null) continue;

                input_ref[i].addEventListener('change', () => {
                    term[i] = input_ref[i].children[0].value;
                    // load_features();
                    
                    update(saved_data);
                })
            }
        }
    });
}

/**
 * 加载物品参照界面
 */
function load_items() {
    const table = query('items_table');

    // 清空列表
    while (table.rows.length > 1) table.deleteRow(1);

    for (let i=0; i<saved_items.length; i++) {
        const row = table.insertRow();
        row.classList.add('table-item');

        assign(row.insertCell(), saved_items[i].name.split('  ')[0]);
        assign(row.insertCell(), saved_items[i].type.join('、'));
        assign(row.insertCell(), saved_items[i].value !== '0' ? saved_items[i].value + ' 金币' : '-');
        assign(row.insertCell(), saved_items[i].weight !== '0' ? saved_items[i].weight + ' 磅' : '-');
        assign(row.insertCell(), saved_items[i].source);

        row.addEventListener('click', (event) => {
            // 标记选中的条目
            table.querySelectorAll('.selected').forEach(ele => ele.classList.remove('selected'));
            row.classList.add('selected');

            // 在右栏显示详情
            const board = query('items_board');
            assign(board.children[0], saved_items[i].name);
            
            let abstract = "";
            abstract += saved_items[i].type.join('、');
            if (saved_items[i].value !== '0' && saved_items[i].weight !== '0') abstract += (
                '<br/>' + saved_items[i].value + ' 金币、' + saved_items[i].weight + ' 磅'
            );
            if (saved_items[i].type.includes('武器')) abstract += (
                '<br/>' + '<span class="dice">' + saved_items[i].dmg[1] + '</span> '
                + saved_items[i].dmg[0]
            );
            if (saved_items[i].properties.includes('可双手')) abstract += (
                ' - 可双手 (<span class="dice">' + saved_items[i].dmg[2] + '</span>)'
            );
            if (saved_items[i].properties.includes('弹药')) abstract += (
                ' - 弹药 (' + saved_items[i].range + ' 尺)'
            );
            if (saved_items[i].properties.includes('投掷')) abstract += (
                ' - 投掷 (' + saved_items[i].range + ' 尺)'
            );
            assign(board.children[1], abstract);

            let details = '';
            for (let j=0; j<saved_items[i].entries.length; j++) details += (
                '<p>' + saved_items[i].entries[j] + '</p>'
            );
            for (let j=0; j<saved_items[i].properties.length; j++) details += (
                '<p>'
                + '<span class="board-item">' + saved_items[i].properties[j] + '. </span>'
                + property_ref[saved_items[i].properties[j]].entries.join('<br/><br/>')
                + '</p>'
            );
            assign(board.children[2], details);

            board.children[1].querySelectorAll('.dice').forEach(dice => {
                dice.addEventListener('click', (event) => {
                    show_dice(
                        saved_items[i].name.split('  ')[0],
                        roll_dice(dice.innerText, (event.ctrlKey?2:1))
                    );
                });
            });

            if (event.ctrlKey) {
                saved_data.backpack.push({
                    name: saved_items[i].name,
                    label: saved_items[i].name.split('  ')[0],
                    weight: saved_items[i].weight,
                    amount: '1'
                });

                load_inventory();
                load_profile();

                show_toast('已添加【' + saved_items[i].name.split('  ')[0] + '】至背包', 3000);

                update(saved_data);
            }

        });

        row.addEventListener('contextmenu', e => {
            e.preventDefault();

            const menu = query('context_menu');
            menu.style.display = 'block';
            menu.style.left = e.clientX + 'px';
            menu.style.top = e.clientY + 'px';

            menu.children[0].innerHTML = '';
            let li = null;
            li = document.createElement('li');
            li.innerHTML = '添加至背包';
            li.addEventListener('click', () => {
                saved_data.backpack.push({
                    name: saved_items[i].name,
                    label: saved_items[i].name.split('  ')[0],
                    weight: saved_items[i].weight,
                    amount: '1'
                });

                load_inventory();
                load_profile();

                show_toast('已添加【' + saved_items[i].name.split('  ')[0] + '】至背包', 3000);

                update(saved_data);
            });
            menu.children[0].appendChild(li);

            li = document.createElement('li');
            li.innerHTML = '添加至仓库';
            li.addEventListener('click', () => {
                saved_data.storage.push({
                    name: saved_items[i].name,
                    label: saved_items[i].name.split('  ')[0],
                    weight: saved_items[i].weight,
                    amount: '1'
                });

                load_inventory();

                show_toast('已添加【' + saved_items[i].name.split('  ')[0] + '】至仓库', 3000);

                update(saved_data);
            });
            menu.children[0].appendChild(li);

            document.addEventListener('click', function close_handler() {
                menu.style.display = 'none';
                document.removeEventListener('click', close_handler);
            });
        });
    }
}

/**
 * 加载背包和仓库
 */
function load_inventory() {
    computed_data.current_weight = 0;
    
    ['backpack', 'storage'].forEach(table_name => {
        const table = query(table_name + '_table');
        
        // 清空列表
        while (table.rows.length > 1) table.deleteRow(1);

        for (let i in saved_data[table_name]) {
            const this_item = saved_data[table_name][i];
            const item = saved_items.find(ele => ele.name == this_item.name);

            // 背包内的物品计入负重
            if (table_name === 'backpack') computed_data.current_weight += (
                Number(this_item.weight) * Number(this_item.amount)
            );

            const row = table.insertRow();
            row.classList.add('table-item');
            row.value = item.name;

            const label = row.insertCell();
            assign(label, '<input value="' + this_item.label + '"/>');
            const type = row.insertCell();
            if (item.properties.includes('自定义')) {
                assign(type, (
                    'type' in this_item
                    ? '<input value="' + this_item.type.join('、') + '"/>'
                    : '<input value="' + item.type.join('、') + '"/>'
                ));
            } else {
                assign(type, item.type.join('、'));
            }
            assign(row.insertCell(), item.properties.join('、'));
            assign(row.insertCell(), item.value !== '0' ? item.value + ' 金币' : '-');
            const weight = row.insertCell();
            assign(weight, '<input value="' + this_item.weight + '"/>');
            const amount = row.insertCell();
            assign(amount, '<input value="' + this_item.amount + '"/>');

            row.addEventListener('click', (event) => {
                // 标记选中的条目
                [query('backpack_table'), query('storage_table')].forEach(table => {
                    if (table.selectedIndex === undefined) return;
                    if (table.rows[table.selectedIndex] === undefined) {
                        table.selectedIndex = undefined;
                        return;
                    }
                    table.rows[table.selectedIndex].classList.remove('selected');
                });
                row.closest('table').selectedIndex = row.rowIndex;
                row.classList.add('selected');

                // 在右栏显示详情
                const board = query('inventory_board');
                if (item.properties.includes('自定义')) {
                    assign(board.children[0], this_item.label);
                    assign(board.children[1], '');
                    assign(board.children[2], '<textarea class="edit-board"></textarea>');
                    
                    if ("description" in this_item) {
                        assign(board.children[2].children[0], this_item.description);
                    }

                    board.querySelector('.edit-board').addEventListener('change', () => {
                        this_item.description = board.children[2].children[0].value;

                        update(saved_data);
                    });
                } else {
                    assign(board.children[0], this_item.name);

                    let abstract = "";
                    abstract += item.type.join('、');
                    if (item.value !== '0' && this_item.weight !== '0') abstract += (
                        '<br/>' + item.value + ' 金币、' + this_item.weight + ' 磅'
                    );
                    if (item.type.includes('武器')) abstract += (
                        '<br/>' + '<span class="dice">' + item.dmg[1] + '</span> '
                        + item.dmg[0]
                    );
                    if (item.properties.includes('可双手')) abstract += (
                        ' - 可双手 (<span class="dice">' + item.dmg[2] + '</span>)'
                    );
                    if (item.properties.includes('弹药')) abstract += (
                        ' - 弹药 (' + item.range + ' 尺)'
                    );
                    if (item.properties.includes('投掷')) abstract += (
                        ' - 投掷 (' + item.range + ' 尺)'
                    );
                    assign(board.children[1], abstract);

                    let details = '';
                    for (let j=0; j<item.entries.length; j++) details += (
                        '<p>' + item.entries[j] + '</p>'
                    );
                    for (let j=0; j<item.properties.length; j++) details += (
                        '<p>'
                        + '<span class="board-item">' + item.properties[j] + '. </span>'
                        + property_ref[item.properties[j]].entries.join('<br/><br/>')
                        + '</p>'
                    );
                    assign(board.children[2], details);            

                    board.querySelectorAll('.dice').forEach(dice => {
                        dice.addEventListener('click', (event) => {
                            show_dice(
                                this_item.name.split('  ')[0],
                                roll_dice(dice.innerText, (event.ctrlKey?2:1))
                            )
                        });
                    });
                }

                if (event.ctrlKey) {
                    if (table_name === 'backpack') {
                        saved_data.storage.push(this_item);
                        saved_data[table_name].splice(i, 1);
                        show_toast('已存放【' + label.children[0].value + '】至仓库', 3000);
                    } else if (table_name === 'storage') {
                        saved_data.backpack.push(this_item);
                        saved_data.storage.splice(i, 1);
                        show_toast('已拿取【' + label.children[0].value + '】至背包', 3000);
                    }

                    load_inventory();
                    load_profile();

                    update(saved_data);
                }
            });

            row.addEventListener('contextmenu', e => {
                e.preventDefault();

                const menu = query('context_menu');
                menu.style.display = 'block';
                menu.style.left = e.clientX + 'px';
                menu.style.top = e.clientY + 'px';

                menu.children[0].innerHTML = '';
                let li = null;
                li = document.createElement('li');
                li.innerHTML = {'backpack': '存放至仓库', 'storage': '拿取至背包'}[table_name];
                li.addEventListener('click', () => {
                    if (table_name === 'backpack') {
                        saved_data.storage.push(this_item);
                        saved_data[table_name].splice(i, 1);
                        show_toast('已存放【' + label.children[0].value + '】至仓库', 3000);
                    } else if (table_name === 'storage') {
                        saved_data.backpack.push(this_item);
                        saved_data.storage.splice(i, 1);
                        show_toast('已拿取【' + label.children[0].value + '】至背包', 3000);
                    }

                    load_inventory();
                    load_profile();

                    update(saved_data);
                });
                menu.children[0].appendChild(li);

                li = document.createElement('li');
                li.innerHTML = '丢弃';
                li.addEventListener('click', () => {
                    saved_data[table_name].splice(i, 1);
                    log(i, saved_data[table_name][i])
                    show_toast('已丢弃【' + this_item.label + '】', 3000);

                    load_inventory();
                    load_profile();

                    update(saved_data);
                });
                menu.children[0].appendChild(li);

                document.addEventListener('click', function close_handler() {
                    menu.style.display = 'none';
                    document.removeEventListener('click', close_handler);
                });
            });

            // 绑定标签、类型、重量、熟练的修改
            const input_ref = {
                'label': label,
                'type': type,
                'weight': weight,
                'amount': amount,
            };
            for (let x of Object.keys(input_ref)) {
                input_ref[x].addEventListener('change', () => {
                    if (x === 'type') {
                        this_item[x] = input_ref[x].children[0].value.split('、');
                    } else {
                        this_item[x] = input_ref[x].children[0].value;
                    }

                    load_inventory();
                    load_profile();

                    update(saved_data);
                });
            }
        }
    });
}

/**
 * 加载货币
 */
function load_currency() {
    for (let i=0; i<3; i++) {
        assign(
            coins_in_profile.children[0].children[i].children[1].children[0],
            saved_data.currency[i]
        );
        assign(
            coins_in_inventory.children[0].children[i].children[1].children[0],
            saved_data.currency[i]
        );
    }
}

/**
 * 加载法术参照界面
 */
function load_spells() {
    const table = query('spells_table');

    // 清空列表
    while (table.rows.length > 1) table.deleteRow(1);

    for (let i=0; i<saved_spells.length; i++) {
        const row = table.insertRow();
        row.classList.add('table-item');

        assign(row.insertCell(), saved_spells[i].name.split('  ')[0]);
        assign(row.insertCell(), saved_spells[i].level + ' 环');
        assign(row.insertCell(), saved_spells[i].school);
        assign(row.insertCell(), saved_spells[i].time.join(' '));
        assign(row.insertCell(), saved_spells[i].range.join(' '));
        assign(row.insertCell(), saved_spells[i].source);

        row.addEventListener('click', (event) => {
            // 标记选中的条目
            table.querySelectorAll('.selected').forEach(ele => ele.classList.remove('selected'));
            row.classList.add('selected');

            // 在右栏显示详情
            const board = query('spells_board');
            assign(board.children[0], saved_spells[i].name);

            let abstract = "";
            abstract += saved_spells[i].level + '环 ' + saved_spells[i].school;
            abstract += (
                '<br/><span class="board-item">施法时间: </span>'
                + saved_spells[i].time.join(' ')
            );
            abstract += (
                '<br/><span class="board-item">射程: </span>'
                + saved_spells[i].range.join(' ')
            );
            abstract += (
                '<br/><span class="board-item">构材: </span>'
                + saved_spells[i].components.join('、')
            );
            abstract += (
                '<br/><span class="board-item">持续时间: </span>'
                + saved_spells[i].duration.join(' ')
            );
            assign(board.children[1], abstract);

            let details = '';
            for (let j=0; j<saved_spells[i].entries.length; j++) details += (
                '<p>' + parse_description(saved_spells[i].entries[j]) + '</p>'
            );
            for (let j=0; j<saved_spells[i].length; j++) details += (
                '<p>'
                + '<span class="board-item">升环施法效应. </span>'
                + saved_spells[i].higher_level[j]
                + '</p>'
            );
            
            details += (
                '<hr/><p>'
                + '<span class="board-item">职业: </span>'
                + saved_spells[i].classes.join('、')
                + '</p>'
            );
            const subclass_list = [];
            for (let x of Object.keys(saved_spells[i].subclasses)) {
                let subclass = saved_spells[i].subclasses[x];
                for (let y of subclass) {
                    subclass_list.push(y + ' ' + x);
                }
            }
            if (subclass_list.length > 0) details += (
                '<p>'
                + '<span class="board-item">子职业: </span>'
                + subclass_list.join('、')
                + '</p>'
            );
            assign(board.children[2], details);
            
            board.children[2].querySelectorAll('.dice').forEach(dice => {
                dice.addEventListener('click', (event) => {
                    show_dice(
                        saved_spells[i].name.split('  ')[0],
                        roll_dice(dice.innerText, (event.ctrlKey?2:1))
                    );
                });
            });

            if (event.ctrlKey) {
                saved_data.spells.push(saved_spells[i].name);

                load_spellcasting();
                load_profile();

                show_toast('已记忆法术【' + saved_spells[i].name.split('  ')[0] + '】', 3000);

                update(saved_data);
            }
        });

        row.addEventListener('contextmenu', e => {
            e.preventDefault();

            const menu = query('context_menu');
            menu.style.display = 'block';
            menu.style.left = e.clientX + 'px';
            menu.style.top = e.clientY + 'px';

            menu.children[0].innerHTML = '';
            let li = null;
            li = document.createElement('li');
            li.innerHTML = '记忆该法术';
            li.addEventListener('click', () => {
                saved_data.spells.push(saved_spells[i].name);

                load_spellcasting();
                load_profile();

                show_toast('已记忆法术【' + saved_spells[i].name.split('  ')[0] + '】', 3000);

                update(saved_data);
            });
            menu.children[0].appendChild(li);

            document.addEventListener('click', function close_handler() {
                menu.style.display = 'none';
                document.removeEventListener('click', close_handler);
            });
        });
    }
}

/**
 * 加载施法界面
 */
function load_spellcasting() {
    // 法术位追踪器
    load_spell_slots();

    const table = query('spellcasting_table');

    // 清空列表
    while (table.rows.length > 1) table.deleteRow(1);

    for (let i in saved_data.spells) {
        let spell = saved_spells.find(ele => ele.name == saved_data.spells[i]);
        
        const row = spellcasting_table.insertRow();
        row.classList.add('table-item');
        
        assign(row.insertCell(), spell.name.split('  ')[0]);
        assign(row.insertCell(), spell.level + ' 环');
        assign(row.insertCell(), spell.school);
        assign(row.insertCell(), spell.time.join(' '));
        assign(row.insertCell(), spell.range.join(' '));
        assign(row.insertCell(), spell.source);

        row.addEventListener('click', (event) => {
            // 标记选中的条目
            table.querySelectorAll('.selected').forEach(ele => ele.classList.remove('selected'));
            row.classList.add('selected');

            // 在右栏显示详情
            const board = query('spellcasting_board');
            assign(board.children[0], spell.name);

            let abstract = "";
            abstract += spell.level + '环 ' + spell.school;
            abstract += (
                '<br/><span class="board-item">施法时间: </span>'
                + spell.time.join(' ')
            );
            abstract += (
                '<br/><span class="board-item">射程: </span>'
                + spell.range.join(' ')
            );
            abstract += (
                '<br/><span class="board-item">构材: </span>'
                + spell.components.join('、')
            );
            abstract += (
                '<br/><span class="board-item">持续时间: </span>'
                + spell.duration.join(' ')
            );
            assign(board.children[1], abstract);

            let details = '';
            for (let j=0; j<spell.entries.length; j++) details += (
                '<p>' + parse_description(spell.entries[j]) + '</p>'
            );
            for (let j=0; j<spell.higher_level.length; j++) details += (
                '<p>'
                + '<span class="board-item">升环施法效应. </span>'
                + spell.higher_level[j]
                + '</p>'
            );
            details += (
                '<hr/><p>'
                + '<span class="board-item">职业: </span>'
                + spell.classes.join('、')
                + '</p>'
            );
            const subclass_list = [];
            for (let x of Object.keys(spell.subclasses)) {
                let subclass = spell.subclasses[x];
                for (let y of subclass) subclass_list.push(y + ' ' + x);
            }
            if (subclass_list.length > 0) details += (
                '<p>'
                + '<span class="board-item">子职业: </span>'
                + subclass_list.join('、')
                + '</p>'
            );
            assign(board.children[2], details);
            
            board.children[2].querySelectorAll('.dice').forEach(dice => {
                dice.addEventListener('click', (event) => {
                    show_dice(
                        saved_spells[i].name.split('  ')[0],
                        roll_dice(dice.innerText, (event.ctrlKey?2:1))
                    );
                });
            });

            if (event.ctrlKey) {
                saved_data.spells.splice(i, 1);

                load_spellcasting();
                load_profile();

                show_toast('已遗忘法术【' + spell.name.split('  ')[0] + '】', 3000);

                update(saved_data);
            }
        });

        row.addEventListener('contextmenu', e => {
            e.preventDefault();

            const menu = query('context_menu');
            menu.style.display = 'block';
            menu.style.left = e.clientX + 'px';
            menu.style.top = e.clientY + 'px';

            menu.children[0].innerHTML = '';
            let li = null;
            li = document.createElement('li');
            li.innerHTML = '遗忘该法术';
            li.addEventListener('click', () => {
                saved_data.spells.splice(i, 1);

                load_spellcasting();
                load_profile();

                show_toast('已遗忘法术【' + spell.name.split('  ')[0] + '】', 3000);

                update(saved_data);
            });
            menu.children[0].appendChild(li);

            document.addEventListener('click', function close_handler() {
                menu.style.display = 'none';
                document.removeEventListener('click', close_handler);
            });
        });
    }
}

/**
 * 加载施法界面中的法术位追踪器
 */
function load_spell_slots() {
    const spell_slots_ref = {
        '0':  ['0', '0', '0', '0', '0', '0', '0', '0', '0'],
        '1':  ['2', '0', '0', '0', '0', '0', '0', '0', '0'],
        '2':  ['3', '0', '0', '0', '0', '0', '0', '0', '0'],
        '3':  ['4', '2', '0', '0', '0', '0', '0', '0', '0'],
        '4':  ['4', '3', '0', '0', '0', '0', '0', '0', '0'],
        '5':  ['4', '3', '2', '0', '0', '0', '0', '0', '0'],
        '6':  ['4', '3', '3', '0', '0', '0', '0', '0', '0'],
        '7':  ['4', '3', '3', '1', '0', '0', '0', '0', '0'],
        '8':  ['4', '3', '3', '2', '0', '0', '0', '0', '0'],
        '9':  ['4', '3', '3', '3', '1', '0', '0', '0', '0'],
        '10': ['4', '3', '3', '3', '2', '0', '0', '0', '0'],
        '11': ['4', '3', '3', '3', '2', '1', '0', '0', '0'],
        '12': ['4', '3', '3', '3', '2', '1', '0', '0', '0'],
        '13': ['4', '3', '3', '3', '2', '1', '1', '0', '0'],
        '14': ['4', '3', '3', '3', '2', '1', '1', '0', '0'],
        '15': ['4', '3', '3', '3', '2', '1', '1', '1', '0'],
        '16': ['4', '3', '3', '3', '2', '1', '1', '1', '0'],
        '17': ['4', '3', '3', '3', '2', '1', '1', '1', '1'],
        '18': ['4', '3', '3', '3', '3', '1', '1', '1', '1'],
        '19': ['4', '3', '3', '3', '3', '2', '1', '1', '1'],
        '20': ['4', '3', '3', '3', '3', '2', '2', '1', '1']
    }
    // 计算施法等级（施法职业、半施法职业、可施法子职业）
    let level = 0;
    if (['吟游诗人', '牧师', '德鲁伊', '术士', '法师'].includes(saved_data.metadata.class)) {
        level = saved_data.metadata.level;
    } else if (['圣武士', '游侠'].includes(saved_data.metadata.class)) {
        level = parseInt(Number(saved_data.metadata.level)/2 + 0.9);
        if (saved_data.metadata.level == '1') level = 0;
    } else if (['诡术师'].includes(saved_data.metadata.subclass)) {
        level = parseInt(Number((saved_data.metadata.level)+1)/3) + 1;
        if (saved_data.metadata.level == '1') level = 0;
    }
    for (let i=0; i<9; i++) {
        let label = saved_data.spell_slots[i] + ' / ' + spell_slots_ref[level][i];
        assign(query('spell_slot').rows[1].cells[i+1].children[0], label);
    }
}



/**
 * 加载角色面板
 */
function load_profile() {
    if (
        saved_data.metadata.race != ''
        && saved_data.metadata.character_name != ''
        && saved_data.metadata.class != ''
        && saved_data.metadata.level != ''
    ) {
        load_summery();
        load_equipment();
        load_abilities();
        load_skills();
        load_combat_stats();
    
        load_weapons();
        load_quick_spellcasting();

        // 加载施法界面中的施法信息
        load_spellcasting_info();
    } else {
        load_summery();
    }
}

/**
 * 加载概要栏
 */
function load_summery() {
    assign(query('character_name'), saved_data.metadata.character_name);
    assign(query('sex_in_profile'), saved_data.characteristics.sex);
    assign(query('race_in_profile'), saved_data.characteristics.race);

    assign(query('class'), saved_data.metadata.class);
    // 加载子职业选择器
    const subclass_ref = {
        '奇械师': ['炼金师', '装甲师', '魔炮师', '战铸师'],
        '野蛮人': ['狂战士', '图腾勇士', '祖先守卫', '狂野魔法', '野兽', '战狂', '狂热者', '风暴先驱'],
        '吟游诗人': ['逸闻学院', '勇气学院', '雄辩学院', '创造学院', '剑舞学院', '迷惑学院', ' 低语学院', '灵魂学院'],
        '牧师': ['知识领域', '生命领域', '光明领域', '自然领域', '风暴领域', '诡术领域', '战争领域', '死亡领域', '秩序领域', '和平领域', '暮光领域', '奥秘领域', '锻造领域', '坟墓领域'],
        '德鲁伊': ['大地结社', '月亮结社', '孢子结社', '星辰结社', '野火结社', '梦境结社', '牧人结社'],
        '战士': ['勇士', '战斗大师', '魔能骑士', '魔射手', '骑兵', '武士', '灵能武士', '符文骑士', '紫龙骑士', '回音骑士'],
        '武僧': ['散打宗', '暗影宗', '四象宗', '醉拳宗', '剑圣宗', '日魂宗', '命流宗', '星我宗', '永亡宗'],
        '圣武士': ['奉献誓言', '远古誓言', '复仇誓言', '荣耀誓言', '守望誓言', '征服誓言', '救赎誓言', '破誓者'],
        '游侠': ['兽王', '猎人', '幽域追踪者', '境界行者', '怪物杀手', '妖精漫游者', '集群守卫'],
        '游荡者': ['刺客', '诡术师', '窃贼', '审讯者', '策士', '斥候', '风流剑客', '鬼魅', '魂刃'],
        '术士': ['龙族血脉', '狂野魔法', '幽影魔法', '神圣之魂', '暴风术法', '畸变心智' ,'时械之魂'],
        '契术师': ['至高妖精', '邪魔', '旧日支配者', '天界', '咒剑', '不朽者', '深海意志', '巨灵', '死灵'],
        '法师': ['防护学派', '咒法学派', '预言学派', '惑控学派', '塑能学派', '幻术学派', '死灵学派', '变化学派', '剑咏', '时间魔法', '重力魔法', '战争魔法', '书士']
    }
    query('subclass').innerHTML = '<option></option>';
    for (let i in subclass_ref[saved_data.metadata.class]) {
        query('subclass').add(new Option(subclass_ref[saved_data.metadata.class][i]));
    }
    assign(query('subclass'), saved_data.metadata.subclass);

    assign(query('level'), saved_data.metadata.level);
    assign(query('alignment_in_profile'), saved_data.background.alignment);
    assign(query('background_in_profile'), saved_data.background.background);
    assign(query('experience_points'), saved_data.metadata.experience_points);

    computed_data.proficiency_bonus = parseInt((saved_data.metadata.level-1)/4)+2;
    assign(query('proficiency_bonus'), '+' + computed_data.proficiency_bonus);
}

/**
 * 载入装备、武器、护甲
 */
function load_equipment() {
    // 测试性载入属性值
    for (let x in saved_data.abilities) {
        computed_data[x] = saved_data.abilities[x];
    }

    // 载入装备
    assign(gear_table.rows[1].children[1].children[0], saved_data.gear[0]);
    assign(gear_table.rows[1].children[3].children[0], saved_data.gear[1]);
    assign(gear_table.rows[2].children[3].children[0], saved_data.gear[2]);
    assign(gear_table.rows[2].children[1].children[0], saved_data.gear[3]);
    assign(gear_table.rows[3].children[1].children[0], saved_data.gear[4]);
    assign(gear_table.rows[3].children[3].children[0], saved_data.gear[5]);
    assign(gear_table.rows[4].children[3].children[0], saved_data.gear[6]);
    assign(gear_table.rows[4].children[1].children[0], saved_data.gear[7]);
    assign(gear_table.rows[5].children[1].children[0], saved_data.gear[8]);
    assign(gear_table.rows[5].children[3].children[0], saved_data.gear[9]);

    // 载入护甲
    const armor_table = query('armor_table');
    armor_table.rows[0].innerHTML = [
        '<td class="w-p15 primary-color"><select class="select primary-color"></select></td>',
        '<td class="w-p35"><select></select></td>',
        '<td class="w-p15 primary-color">盾牌</td>',
        '<td class="w-p35"><select><option></option></select></td>'
    ].join('');

    computed_data.armor = {
        '无甲': ['', '法师护甲'],
        '轻甲': [],
        '中甲': [],
        '重甲': []
    };
    if (saved_data.metadata.class == '野蛮人') {
        computed_data.armor['无甲'].push('野蛮人无甲防御');
    } else if (saved_data.metadata.class == '武僧') {
        computed_data.armor['无甲'].push('武僧无甲防御');
    }
    for (let i in saved_data.backpack) {
        const item = saved_items.find(ele => ele.name == saved_data.backpack[i].name);
        if (item.type.includes('盾牌')) {
            armor_table.rows[0].cells[3].children[0].add(
                new Option(saved_data.backpack[i].label)
            );
        } else if (item.type.includes('轻甲')) {
            computed_data.armor['轻甲'].push(saved_data.backpack[i].label);
        } else if (item.type.includes('中甲')) {
            computed_data.armor['中甲'].push(saved_data.backpack[i].label);
        } else if (item.type.includes('重甲')) {
            computed_data.armor['重甲'].push(saved_data.backpack[i].label);
        }
    }
    for (let armor_type of Object.keys(computed_data.armor)) {
        if (computed_data.armor[armor_type].length != 0) {
            armor_table.rows[0].cells[0].children[0].add(new Option(armor_type));
        }
    }

    if (
        saved_data.armor[0] != '无甲' &&
        saved_data.backpack.find(
            ele => ele.label === saved_data.armor[1]
        ) === undefined
    ) {
        saved_data.armor[0] = '无甲';
        saved_data.armor[1] = '';
    }
    if (
        saved_data.backpack.find(ele => ele.label === saved_data.armor[2])
        === undefined
    ) {
        saved_data.armor[2] = '';
    }

    assign(armor_table.rows[0].cells[0].children[0], saved_data.armor[0]);

    armor_table.rows[0].cells[1].children[0].innerHTML = '';
    for (let i in computed_data.armor[saved_data.armor[0]]) {
        armor_table.rows[0].cells[1].children[0].add(
            new Option(computed_data.armor[saved_data.armor[0]][i])
        );
    }
    assign(armor_table.rows[0].cells[1].children[0], saved_data.armor[1]);
    assign(armor_table.rows[0].cells[3].children[0], saved_data.armor[2]);

    const item = saved_data.backpack.find(ele => ele.label === saved_data.armor[1]);
    if (
        item !== undefined
        && [
            '全身板甲', '条板甲', '锁子甲', '环甲', '半身板甲', '半身板甲', '鳞甲', '绵甲'
        ].includes(item.name.split('  ')[0])
    ) {
        query('skills').rows[4].classList.add('selected-red'); // 添加隐匿劣势标记
    } else {
        query('skills').rows[4].classList.remove('selected-red'); // 移除隐匿劣势标记
    }
    
    armor_table.querySelectorAll('select').forEach(select => {
        select.addEventListener('change', () => {
            switch (select.parentElement.cellIndex) {
                case 0:
                    saved_data.armor[0] = select.selectedOptions[0].innerText;
                    saved_data.armor[1] = computed_data.armor[saved_data.armor[0]][0];
                    
                    for (let i in computed_data.armor[saved_data.armor[0]]) {
                        armor_table.rows[0].cells[1].children[0].add(
                            new Option(computed_data.armor[saved_data.armor[0]][i])
                        );
                    }
                    assign(armor_table.rows[0].cells[1].children[0], saved_data.armor[1]);
                    break;
                case 1:
                    saved_data.armor[1] = select.selectedOptions[0].innerText;
                    break;
                case 3:
                    saved_data.armor[2] = select.selectedOptions[0].innerText;
                    break;
            }

            load_profile();

            update(saved_data); 
        });
    });
}

/**
 * 载入属性
 */
function load_abilities() {
    let ability_ref = [
        'strength', 'dexterity', 'constitution',
        'intelligence', 'wisdom', 'charisma'
    ];
    let proficiencies_ref = {
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
    const rows = query('abilities').rows;
    for (i=1; i<rows.length; i++) {
        const value = Number(computed_data[ability_ref[i-1]]);
        const proficiency = (
            proficiencies_ref[saved_data.metadata.class].includes(ability_ref[i-1])
        );

        assign(rows[i].children[0], proficiency ? 'O' : 'X') // 熟练
        assign(rows[i].children[2].children[0], value); // 属性值
        assign(rows[i].children[3].children[0], parseInt(value/2) - 5); // 调整值
        assign(rows[i].children[4].children[0],
            parseInt(value/2)-5 + (proficiency?computed_data.proficiency_bonus:0)
        ); // 豁免
    }
}

/**
 * 载入技能
 */
function load_skills() {
    const skill_ref = ['', 
        'athletics',
        'acrobatics', 'sleight_of_hand', 'stealth',
        'investigation', 'arcana', 'history', 'nature', 'religion',
        'perception', 'insight', 'animal_handling', 'medicine', 'survival',
        'persuasion', 'deception', 'intimidation', 'performance'
    ];
    const ability_ref = ['', 
        'strength', 
        'dexterity', 'dexterity', 'dexterity', 
        'intelligence', 'intelligence', 'intelligence', 'intelligence', 'intelligence', 
        'wisdom', 'wisdom', 'wisdom', 'wisdom', 'wisdom', 
        'charisma', 'charisma', 'charisma', 'charisma'
    ];
    const rows = query('skills').rows;
    for (i=1; i<rows.length; i++) {
        assign(rows[i].children[0].children[0], saved_data.skills[skill_ref[i]][0]) // 熟练
        assign(rows[i].children[2].children[0], saved_data.skills[skill_ref[i]][1]); // 修正
        assign(rows[i].children[3].children[0],
            parseInt(Number(computed_data[ability_ref[i]])/2)-5
            + Number(saved_data.skills[skill_ref[i]][1])
            + parseInt(
                ({'X': 0, 'O': 1, 'D': 2, 'H': 0.5})[saved_data.skills[skill_ref[i]][0]]
                * Number(computed_data.proficiency_bonus)
            )
        ); // 总值
    }
}

/**
 * 载入摘要
 */
function load_combat_stats() {
    // 先确定负重信息
    const max_weight = 5 * Number(computed_data.strength);
    let weight_color = '#000000';
    let computed_speed = 0; // 移动速度
    if (computed_data.current_weight > 10*Number(computed_data.strength)) {
        // 超载：速度减少 20 尺，力量、敏捷、体质相关的属性检定、攻击检定、豁免检定都具有劣势
        weight_color = '#cc0000';
        computed_speed = -20;
        abilities.rows[1].classList.add('selected-red'); // 添加劣势标记
        abilities.rows[2].classList.add('selected-red'); // 添加劣势标记
        abilities.rows[3].classList.add('selected-red'); // 添加劣势标记
    } else if (computed_data.current_weight > 5*Number(computed_data.strength)) {
        // 重载：速度减少 10 尺
        weight_color = '#f7a100';
        computed_speed = -10;
        abilities.rows[1].classList.remove('selected-red'); // 移除劣势标记
        abilities.rows[2].classList.remove('selected-red'); // 移除劣势标记
        abilities.rows[3].classList.remove('selected-red'); // 移除劣势标记
    } else {
        computed_speed = -0;
        abilities.rows[1].classList.remove('selected-red'); // 移除劣势标记
        abilities.rows[2].classList.remove('selected-red'); // 移除劣势标记
        abilities.rows[3].classList.remove('selected-red'); // 移除劣势标记
    }
    query('current_weight_in_profile').style.color = weight_color;
    query('current_weight_in_inventory').style.color = weight_color;

    // 负重
    assign(
        query('current_weight_in_profile'),
        computed_data.current_weight + ' 磅 / ' + max_weight + ' 磅'
    );
    assign(
        query('current_weight_in_inventory'),
        computed_data.current_weight + ' 磅 / ' + max_weight + ' 磅'
    );
    
    // 先攻
    assign(
        query('initiative').children[1].children[0],
        saved_data.combat_stats['initiative_bonus']
    );
    assign(
        query('initiative').children[2].children[0],
        (
            parseInt(Number(computed_data['dexterity'])/2) - 5
            + Number(saved_data.combat_stats['initiative_bonus'])
        )
    );

    // 护甲等级
    let armor_class = 0;
    if (saved_data.armor[0] === '无甲') {
        if (saved_data.armor[1] === '') armor_class += (
            10 + parseInt(Number(computed_data['dexterity'])/2)-5
        );
        if (saved_data.armor[1] === '法师护甲') armor_class += (
            13 + parseInt(Number(computed_data['dexterity'])/2)-5
        );
        if (saved_data.armor[1] === '野蛮人无甲防御') armor_class += (
            10 + parseInt(Number(computed_data['dexterity'])/2)-5
            + parseInt(Number(computed_data['constitution'])/2)-5
        );
            
        if (saved_data.armor[1] === '武僧无甲防御')
            armor_class += (
                10 + parseInt(Number(computed_data['dexterity'])/2)-5
                + parseInt(Number(computed_data['wisdom'])/2)-5
            );
    } else {
        const item = saved_data.backpack.find(ele => ele.label === saved_data.armor[1]);
        armor_class += Number(armor_ref[item.name.split('  ')[0]][0]);
        armor_class += (
            armor_ref[item.name.split('  ')[0]][1] == '' ?
            parseInt(Number(computed_data['dexterity'])/2)-5 :
            Math.min(
                parseInt(Number(computed_data['dexterity'])/2)-5,
                Number(armor_ref[item.name.split('  ')[0]][1])
            )
        );
    }
    assign(
        query('armor_class').children[1].children[0],
        saved_data.combat_stats['armor_class_bonus']
    );
    assign(
        query('armor_class').children[2],
        armor_class
        + Number(saved_data.combat_stats['armor_class_bonus'])
        + (saved_data.armor[2]!='' ? 2 : 0)
    );

    const speed_ref = {
        '人类': 30,
        '矮人': 25,
        '高精灵': 30,
        '木精灵': 35,
        '卓尔精灵': 30,
        '半精灵': 30,
        '半身人': 25,
        '半兽人': 30,
        '提夫林': 30,
        '龙裔': 30,
        '侏儒': 25
    };
    for (let k in speed_ref) {
        if (saved_data.characteristics.race.slice(-k.length) === k) {
            computed_speed += speed_ref[k];
            break;
        }
    }
    // 移动速度
    assign(speed.children[1], (computed_speed>0?computed_speed:0) + ' 尺');

    assign(passive_perception.children[1],
        10 + Number(skills.tBodies[0].children[10].children[3].innerText)
    ); // 被动察觉

    assign(
        hit_point.children[1].children[0],
        saved_data.combat_stats['hit_point'][0]
    ); // 当前生命值
    assign(
        hit_point.children[2].children[0],
        saved_data.combat_stats['hit_point'][1]
    ); // 最大生命值
    assign(
        temporary_hit_point.children[1].children[0],
        saved_data.combat_stats['hit_point'][2]
    ); // 临时生命值
    let color = '';
    if (
        Number(saved_data.combat_stats['hit_point'][0])
        === Number(saved_data.combat_stats['hit_point'][1])
    ) {
        color = '#00bb20';
    } else if (
        Number(saved_data.combat_stats['hit_point'][0])
        > Number(saved_data.combat_stats['hit_point'][1]) / 2
    ) {
        color = '#c5ca00';
    } else if (
        Number(saved_data.combat_stats['hit_point'][0]) > 0
    ) {
        color = '#f7a100';
    } else {
        color = '#cc0000';
    }
    profile_panel.querySelectorAll('#hit_point input').forEach(ele => {
        ele.style.color = color;
        ele.style['font-size'] = '16px';
    });

    const hit_dice_ref = {
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
    assign(
        hit_dice.children[1].children[0],
        saved_data.combat_stats['hit_dice']
    ); // 剩余生命骰数量
    assign(
        hit_dice.children[2],
        saved_data.metadata['level']
    ); // 最大生命骰数量
    assign(
        hit_dice_value.children[1].children[0],
        hit_dice_ref[saved_data.metadata['class']]
    ); // 生命骰数值

    assign(
        special_value.children[0].children[0],
        saved_data.combat_stats['special_value'][0]
    ); // 特殊能力名称
    assign(
        special_value.children[1].children[0],
        saved_data.combat_stats['special_value'][1]
    ); // 特殊能力剩余数量
    assign(
        special_value.children[2].children[0],
        saved_data.combat_stats['special_value'][2]
    ); // 特殊能力最大数量
    
    assign(
        inspiration.children[1].children[0],
        saved_data.combat_stats['inspiration']
    ); // 激励

    assign(
        conditions.children[0].children[0].children[1].children[0],
        saved_data.combat_stats['conditions']
    ); // 状态
    assign(
        conditions.children[0].children[0].children[3].children[0],
        saved_data.combat_stats['immunizations']
    ); // 免疫
    assign(
        conditions.children[0].children[1].children[1].children[0],
        saved_data.combat_stats['vulnerabilities']
    ); // 易伤
    assign(
        conditions.children[0].children[1].children[3].children[0],
        saved_data.combat_stats['resistances']
    ); // 抗性
}

/**
 * 载入武器
 */
function load_weapons() {
    const weapons_table = query('weapons_table');

    // 清空武器栏显示
    for (let i=1; i<4; i++) {
        weapons_table.rows[i].innerHTML = [
            '<td><select></select></td>',
            '<td><select><option></option></select></td>',
            '<td></td>',
            '<td><select></select></td>',
            '<td></td>',
            '<td></td>',
        ].join('');
    }

    // 收集背包中的武器信息
    for (let item of saved_data.backpack) {
        let item_of_items = saved_items.find(ele => ele.name === item.name);
        if (item_of_items.type.includes('武器')) {
            weapons_table.rows[1].cells[1].children[0].add(new Option(item.label));
            weapons_table.rows[2].cells[1].children[0].add(new Option(item.label));
            weapons_table.rows[3].cells[1].children[0].add(new Option(item.label));
        }
    }

    // 将已装备的武器填入武器栏
    for (let i=0; i<saved_data.weapons.length; i++) {
        let item = saved_data.backpack.find(
            ele => ele.label === saved_data.weapons[i].label
        );
        if (item === undefined) {
            saved_data.weapons.splice(i, 1);
            continue;
        }
        item = saved_items.find(ele => ele.name == item.name);

        // 提供可装备的手
        if (item.properties.includes('双手')) {
            weapons_table.rows[i+1].cells[0].children[0].add(new Option('双手'));
        } else if (item.properties.includes('可双手')) {
            weapons_table.rows[i+1].cells[0].children[0].add(new Option('右手'));
            weapons_table.rows[i+1].cells[0].children[0].add(new Option('左手'));
            weapons_table.rows[i+1].cells[0].children[0].add(new Option('双手'));
        } else {
            weapons_table.rows[i+1].cells[0].children[0].add(new Option('右手'));
            weapons_table.rows[i+1].cells[0].children[0].add(new Option('左手'));
        }

        // 提供攻击可使用的属性
        if (item.properties.includes('灵巧')) {
            weapons_table.rows[i+1].cells[3].children[0].add(new Option('力量'));
            weapons_table.rows[i+1].cells[3].children[0].add(new Option('敏捷'));
        } else if (item.type.includes('远程')) {
            weapons_table.rows[i+1].cells[3].children[0].add(new Option('敏捷'));
        } else {
            weapons_table.rows[i+1].cells[3].children[0].add(new Option('力量'));
        }

        assign(weapons_table.rows[i+1].cells[0].children[0], saved_data.weapons[i].hand);
        assign(weapons_table.rows[i+1].cells[1].children[0], saved_data.weapons[i].label);

        let properties = [...item.properties];
        for (let j in properties) {
            if (properties[j] === '可双手')
                properties[j] = '可双手 (<span class="dice">' + item.dmg[2] + '</span>)';
            if (properties[j] === '弹药') properties[j] = '弹药 (' + item.range + ' 尺)';
            if (properties[j] === '投掷') properties[j] = '投掷 (' + item.range + ' 尺)';
        }
        assign(weapons_table.rows[i+1].cells[2], properties.join('、'));
        assign(weapons_table.rows[i+1].cells[3].children[0], saved_data.weapons[i].ability);

        const attack_dice = document.createElement('button');
        attack_dice.className = 'btn dice';
        const ability_ref = {'力量': 'strength', '敏捷': 'dexterity'};
        const ability_modifier = (
            parseInt(Number(computed_data[ability_ref[saved_data.weapons[i].ability]])/2) - 5
        );
        assign(attack_dice, '1d20+' + (
            ability_modifier + computed_data.proficiency_bonus
        ));
        weapons_table.rows[i+1].cells[4].appendChild(attack_dice);

        const damage_dice = document.createElement('button');
        damage_dice.className = 'btn dice';
        assign(damage_dice, (
            (
                item.properties.includes('可双手') && saved_data.weapons[i].hand === '双手'
                ? item.dmg[2] : item.dmg[1]
            ) + (
                ability_modifier < 0 ?
                ability_modifier :
                '+' + ability_modifier
            )
        ));
        weapons_table.rows[i+1].cells[5].appendChild(damage_dice);
    }

    weapons_table.querySelectorAll('.dice').forEach(dice => {
        dice.addEventListener('click', (event) => {
            const row_index = dice.closest('tr').rowIndex;
            const cell_index = dice.closest('td').cellIndex;
            let label = saved_data.weapons[row_index-1].label;
            if (dice.tagName === 'BUTTON') {
                label += weapons_table.rows[0].cells[cell_index].innerText.slice(2,4);
            }
            show_dice(label, roll_dice(dice.innerText, (event.ctrlKey?2:1)));
        });
    });

    weapons_table.querySelectorAll('select').forEach(select => {
        select.addEventListener('change', () => {
            switch (select.closest('td').cellIndex) {
                case 0:
                    saved_data.weapons[select.closest('tr').rowIndex-1]['hand'] = (
                        select.selectedOptions[0].innerText
                    );
                    break;
                case 1:
                    const label = select.selectedOptions[0].innerText;
                    if (label === '') {
                        saved_data.weapons.splice(select.closest('tr').rowIndex-1, 1);
                        break;
                    }
                    let item = saved_data.backpack.find(ele => ele.label == label);
                    item = saved_items.find(element => element.name == item.name);
                    saved_data.weapons[select.closest('tr').rowIndex-1] = {
                        "label": label,
                        "hand": item.properties.includes('双手')?'双手':'右手',
                        "ability": item.type.includes('远程')?"敏捷":'力量',
                    };
                    break;
                case 3:
                    saved_data.weapons[select.closest('tr').rowIndex-1]['ability'] = (
                        select.selectedOptions[0].innerText
                    );
                    break;
            }

            load_profile();

            update(saved_data); 
        });
    });
}

/**
 * 载入快速施法
 */
function load_quick_spellcasting() {
    const quick_spellcasting_table = query('quick_spellcasting_table');

    // 情况快捷施法栏显示
    for (let i=1; i<4; i++) {
        quick_spellcasting_table.rows[i].innerHTML = [
            '<td><select><option></option></select></td>',
            '<td></td>',
            '<td></td>',
            '<td></td>',
            '<td></td>'
        ].join('');
    }

    // 收集已经习得的法术
    const spells = {'0': [], '1': [], '2': [], '3': [], '4': [],
        '5': [], '6': [], '7': [], '8': [], '9': []};
    for (let spell_name of saved_data.spells) {
        let spell = saved_spells.find(ele => ele.name === spell_name);
        spells[spell.level].push(spell_name);
    }

    for (let x of Object.keys(spells)) {
        if (spells[x].length === 0) continue;
        quick_spellcasting_table.rows[1].cells[0].children[0].add(new Option(x + ' 环'));
        quick_spellcasting_table.rows[2].cells[0].children[0].add(new Option(x + ' 环'));
        quick_spellcasting_table.rows[3].cells[0].children[0].add(new Option(x + ' 环'));
    }

    for (let i=0; i<saved_data.quick_spellcasting.length; i++) {
        const spell = saved_data.quick_spellcasting[i];

        assign(
            quick_spellcasting_table.rows[i+1].cells[0].children[0],
            spell.level + ' 环'
        );

        // 提供可选择的法术
        const select = document.createElement('select');
        select.className = 'select';
        quick_spellcasting_table.rows[i+1].cells[1].appendChild(select);
        for (let spell_name of spells[spell.level]) {
            let option = new Option(spell_name.split('  ')[0]);
            option.name = spell_name;
            quick_spellcasting_table.rows[i+1].cells[1].children[0].add(option);
        }
        assign(
            quick_spellcasting_table.rows[i+1].cells[1].children[0],
            spell.name.split('  ')[0]
        );
        
        const input = document.createElement('input');
        input.className = 'input';
        quick_spellcasting_table.rows[i+1].cells[2].appendChild(input);
        assign(input, spell.damage)
        
        let ability_ref = {
            '野蛮人': 'constitution',
            '吟游诗人': 'charisma',
            '牧师': 'wisdom',
            '德鲁伊': 'wisdom',
            '战士': 'intelligence',
            '武僧': 'wisdom',
            '圣武士': 'charisma',
            '游侠': 'wisdom',
            '游荡者': 'intelligence',
            '术士': 'charisma',
            '契术师': 'charisma',
            '法师': 'intelligence'
        };
        const attack_dice = document.createElement('button');
        attack_dice.className = 'btn dice';
        quick_spellcasting_table.rows[i+1].cells[3].appendChild(attack_dice);
        const ability_modifier = (
            parseInt(
                Number(
                    computed_data[ability_ref[saved_data.metadata['class']]]
                ) / 2
            ) - 5
        );
        assign(attack_dice, '1d20+' + (
            ability_modifier + Number(computed_data.proficiency_bonus)
        ));

        const damage_dice = document.createElement('button');
        damage_dice.className = 'btn dice';
        quick_spellcasting_table.rows[i+1].cells[4].appendChild(damage_dice);
        assign(damage_dice, spell.damage);
    }

    quick_spellcasting_table.querySelectorAll('.dice').forEach(dice => {
        dice.addEventListener('click', (event) => {
            const label = (
                dice.closest('tr').cells[1].children[0].selectedOptions[0].value
                + ['命中', '伤害'][dice.closest('td').cellIndex-3]
            );
            show_dice(label, roll_dice(dice.innerText, (event.ctrlKey?2:1)));
        });
    });

    quick_spellcasting_table.querySelectorAll('select').forEach(select => {
        select.addEventListener('change', () => {
            const index = select.parentElement.parentElement.rowIndex;
            switch (select.closest('td').cellIndex) {
                case 0:
                    if (select.selectedOptions[0].innerText === '') {
                        saved_data.quick_spellcasting.splice(index-1, 1);
                    } else {
                        for (let spell_name of saved_data.spells) {
                            let spell = saved_spells.find(ele => ele.name === spell_name);
                            spells[spell.level].push(spell_name);
                        }

                        const level = select.selectedOptions[0].innerText.split(' ')[0];
                        const name = saved_data.spells.find(spell_name => (
                            saved_spells.find(ele => ele.name === spell_name).level
                            === level
                        ));
                        saved_data.quick_spellcasting[index-1] = {
                            'level': level,
                            'name': name,
                            'damage': ''
                        };
                    }
                    break;
                case 1:
                    saved_data.quick_spellcasting[index-1].name = (
                        select.selectedOptions[0].name
                    );
                    saved_data.quick_spellcasting[index-1].damage = '';
                    break;
            }
            
            load_profile();

            update(saved_data); 
        });
    });

    quick_spellcasting_table.querySelectorAll('input').forEach(input => {
        input.addEventListener('change', () => {
            const index = input.closest('tr').rowIndex;
            saved_data.quick_spellcasting[index-1].damage = input.value;

            load_profile();

            update(saved_data); 
        });
    });
}

/**
 * 加载施法界面中的施法信息
 */
function load_spellcasting_info() {
    const ability_ref = {
        '野蛮人': ['体质', 'constitution'],
        '吟游诗人': ['魅力', 'charisma'],
        '牧师': ['感知', 'wisdom'],
        '德鲁伊': ['感知', 'wisdom'],
        '战士': ['智力', 'intelligence'],
        '武僧': ['感知', 'wisdom'],
        '圣武士': ['魅力', 'charisma'],
        '游侠': ['感知', 'wisdom'],
        '游荡者': ['智力', 'intelligence'],
        '术士': ['魅力', 'charisma'],
        '契术师': ['魅力', 'charisma'],
        '法师': ['智力', 'intelligence']
    };

    assign(
        query('spellcasting_ability').children[1],
        ability_ref[saved_data.metadata.class][0]
    ); // 施法关键属性
    assign(
        query('difficulty_class').children[1],
        (
            parseInt(Number(computed_data[ability_ref[saved_data.metadata.class][1]])/2)
            + Number(computed_data.proficiency_bonus) - 5 + 8
        )
    ); // 法术豁免难度等级
    assign(
        query('attack_bonus').children[1].children[0],
        (
            parseInt(Number(computed_data[ability_ref[saved_data.metadata.class][1]])/2)
            + Number(computed_data.proficiency_bonus) - 5
        )
    ); // 法术命中加值
}
var log = console.log; // asinose
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
        load_items();
        load_inventory();
        load_currency();

        load_spells();
        load_spellcasting();

        load_profile();
    })

    bind_nav();
    bind_long_rest_button();

    bind_events_in_profile();
    bind_events_in_inventory();
    bind_events_in_spellcasting();
    bind_events_in_items();
    bind_events_in_spells();

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

        // 重构：使用可复用的更新函数
        fetch(window.location.origin+'/api/update/'+pc_id, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(saved_data)
        }).catch(err => alert('Fetch 错误: ' + err));
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
 * 绑定角色面板界面的事件
 */
function bind_events_in_profile() {
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

                    // 重构：使用可复用的更新函数
                    fetch(window.location.origin+'/api/update/'+pc_id, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(saved_data)
                    }).catch(err => alert('Fetch 错误: ' + err));
    
                });
                break;
        }
    });

    // 更新 Input 的修改
    query('profile_panel').querySelectorAll('input').forEach(ele => {
        ele.addEventListener('change', () => {
            if (['character_name', 'level', 'experience_points'].includes(ele.id)) {
                // 角色名、等级、经验值
                saved_data.metadata[ele.id] = ele.value;
                load_page_info();
            } else if (['race_in_profile', 'sex_in_profile'].includes(ele.id)) {
                // 种族、性别
                saved_data.characteristics[ele.id.split('_')[0]] = ele.value;
            } else if (['background_in_profile', 'alignment_in_profile'].includes(ele.id)) {
                // 背景、阵营
                saved_data.background[ele.id.split('_')[0]] = ele.value;
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
            } else if (ele.closest('table').id === 'gear_table') {
                // 装备栏
                const gear_ref = [[0, 1], [3, 2], [4, 5], [7, 6], [8, 9]];
                const r = ele.closest('tr').rowIndex - 1;
                const c = parseInt(ele.closest('td').cellIndex / 2);
                saved_data.gear[gear_ref[r][c]] = ele.value;
            }
        
            load_profile();
    
            // 重构：使用可复用的更新函数
            fetch(window.location.origin+'/api/update/'+pc_id, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(saved_data)
            }).catch(err => alert('Fetch 错误: ' + err)); 
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
    
            // 重构：使用可复用的更新函数
            fetch(window.location.origin+'/api/update/'+pc_id, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(saved_data)
            }).catch(err => alert('Fetch 错误: ' + err)); 
        });
    });
}

/**
 * 绑定背包界面的事件
 */
function bind_events_in_inventory() {
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
                if (['label', 'weight', 'amount'].includes(heading)) {
                    y1 = isNaN(parseFloat(x1[heading])) ? x1[heading] : parseFloat(x1[heading]);
                    y2 = isNaN(parseFloat(x2[heading])) ? x2[heading] : parseFloat(x2[heading]);

                    if (y1 === y2) flag = 0;
                    else if (y1 < y2) flag = -1;
                    else if (y1 > y2) flag = 1;
                } else {
                    y1 = saved_items.find(ele => ele.name == x1.name);
                    y2 = saved_items.find(ele => ele.name == x2.name);
                    y1 = isNaN(parseFloat(y1[heading])) ? y1[heading] : parseFloat(y1[heading]);
                    y2 = isNaN(parseFloat(y2[heading])) ? y2[heading] : parseFloat(y2[heading]);
                    
                    if (y1 === y2) flag = 0;
                    else if (y1 < y2) flag = -1;
                    else if (y1 > y2) flag = 1;
                }
                
                return event.ctrlKey ? -1*flag : flag;
            });

            load_inventory();

            // 重构：使用可复用的更新函数
            fetch(window.location.origin+'/api/update/'+pc_id, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(saved_data)
            }).catch(err => alert('Fetch 错误: ' + err));
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

        // 重构：使用可复用的更新函数
        fetch(window.location.origin+'/api/update/'+pc_id, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(saved_data)
        }).catch(err => alert('Fetch 错误: ' + err));
    });

        // 更新货币栏的修改
        query('inventory_panel').querySelectorAll('input').forEach(ele => {
            ele.addEventListener('change', () => {
                const index = ele.closest('tr').rowIndex;
                saved_data.currency[index] = ele.value;
            
                load_profile();
        
                // 重构：使用可复用的更新函数
                fetch(window.location.origin+'/api/update/'+pc_id, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(saved_data)
                }).catch(err => alert('Fetch 错误: ' + err)); 
            });
        });
}

/**
 * 绑定施法界面的事件
 */
function bind_events_in_spellcasting() {
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

        // 重构：使用可复用的更新函数
        fetch(window.location.origin+'/api/update/'+pc_id, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(saved_data)
        }).catch(err => alert('Fetch 错误: ' + err));
    });

    // 绑定法术位追踪器按钮
    document.querySelectorAll('.slot').forEach(slot => {
        slot.addEventListener('click', () => {
            let n = Number(slot.innerText.split(' ')[0]);
            if (n > 0) {
                saved_data.spell_slots[slot.parentElement.cellIndex-1] -= 1;
                load_spell_slots();
                show_toast('施放 ' + slot.parentElement.cellIndex + ' 环法术', 1000);
            
                // 重构：使用可复用的更新函数
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
}

/**
 * 绑定物品参照界面的事件
 */
function bind_events_in_items() {
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
function bind_events_in_spells() {
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
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

        const option = new Option(label, data[i][0]);
        character_selector.add(option);

        if (data[i][0] == pc_id) {
            character_selector.selectedIndex = i;
            document.title = label;
        }
    }

    character_selector.addEventListener('change', () => {
        window.location.href = (
            [window.location.origin, character_selector.selectedOptions[0].value, 'profile'].join('/')
        );
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
            const board = query('item_board');
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
                    // 重构：使用可复用的投骰函数
                    if (roll_board.innerHTML != '') roll_board.innerHTML += '<br\>';
                    roll_board.innerHTML += roll_dice(get_label(dice), dice.innerText, (event.ctrlKey?2:1));
                    roll_board.scroll({top: roll_board.scrollHeight, left: 0, behavior: 'smooth'});
                });
            });

            // Ctrl + 左键: 将该物品添加到背包中
            // 重构：使用右键菜单
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

                // 重构：使用可复用的更新函数
                fetch(window.location.origin+'/api/update/'+pc_id, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(saved_data)
                }).catch(err => alert('Fetch 错误: ' + err));
            }

            // Shift + 左键: 将该物品添加到仓库中
            // 重构：使用右键菜单
            if (event.shiftKey) {
                saved_data.storage.push({
                    name: saved_items[i].name,
                    label: saved_items[i].name.split('  ')[0],
                    weight: saved_items[i].weight,
                    amount: '1'
                });

                load_inventory();

                show_toast('已添加【' + saved_items[i].name.split('  ')[0] + '】至仓库', 3000);

                // 重构：使用可复用的更新函数
                fetch(window.location.origin+'/api/update/'+pc_id, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(saved_data)
                }).catch(err => alert('Fetch 错误: ' + err));
            }
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
            assign(row.insertCell(), item.type.join('、'));
            assign(row.insertCell(), item.properties.join('、'));
            assign(row.insertCell(), item.value !== '' ? item.value + ' 金币' : '-');
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
                    assign(board.children[2], '<textarea class="edit-board"/>');
                    
                    if ("description" in this_item) {
                        assign(board.children[2].children[0], this_item.description);
                    }

                    board.querySelector('.edit-board').addEventListener('change', () => {
                        this_item.description = board.children[2].children[0].value;

                        // 重构：使用可复用的更新函数
                        fetch(window.location.origin+'/api/update/'+pc_id, {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify(saved_data)
                        }).catch(err => alert('Fetch 错误: ' + err));
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
                            // 重构：使用可复用的投骰函数
                            if (roll_board.innerHTML != '') roll_board.innerHTML += '<br\>';
                            roll_board.innerHTML += roll_dice(get_label(dice), dice.innerText, (event.ctrlKey?2:1));
                            roll_board.scroll({top: roll_board.scrollHeight, left: 0, behavior: 'smooth'});
                        });
                    });
                }

                if (event.ctrlKey) {
                    if (table_name == 'backpack') {
                        saved_data.storage.push(this_item);
                        saved_data[table_name].splice(i, 1);
                        show_toast('已存放【' + label.children[0].value + '】至仓库', 3000);
                    } else if (table_name == 'storage') {
                        saved_data.backpack.push(this_item);
                        saved_data.storage.splice(i, 1);
                        show_toast('已拿取【' + label.children[0].value + '】至背包', 3000);
                    }
                    
                    load_inventory();
                    load_profile();

                    // 重构：使用可复用的更新函数
                    fetch(window.location.origin+'/api/update/'+pc_id, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(saved_data)
                    }).catch(err => alert('Fetch 错误: ' + err));
                }
            });

            const input_ref = {
                'label': label,
                'weight': weight,
                'amount': amount,
            };
            for (let x of Object.keys(input_ref)) {
                input_ref[x].addEventListener('change', () => {
                    this_item[x] = input_ref[x].children[0].value;
                    console.log(x)
                    // 重构：使用右键菜单
                    if (
                        x === 'amount' && (
                            input_ref[x].children[0].value === '0'
                            || input_ref[x].children[0].value === ''
                        )
                    ) {
                        saved_data[table_name].splice(i, 1);
                        show_toast('已丢弃【' + this_item.label + '】', 3000);
                    }

                    load_inventory();
                    load_profile();

    
                    // 重构：使用可复用的更新函数
                    fetch(window.location.origin+'/api/update/'+pc_id, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(saved_data)
                    }).catch(err => alert('Fetch 错误: ' + err));
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
            const board = query('spell_board');
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
                '<p>' + saved_spells[i].entries[j] + '</p>'
            );
            for (let j=0; j<saved_spells[i].length; j++) details += (
                '<p>'
                + '<span class="board-item">升环施法效应. </span>'
                + saved_spells[i].higher_level[j]
                + '</p>'
            );
            details += (
                '<p>'
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

            // Ctrl + 左键: 学习该法术
            // 重构：使用右键菜单
            if (event.ctrlKey) {
                saved_data.spells.push(saved_spells[i].name);

                load_spellcasting();
                load_profile();

                show_toast('已记忆法术【' + saved_spells[i].name.split('  ')[0] + '】', 3000);

                // 重构：使用可复用的更新函数
                fetch(window.location.origin+'/api/update/'+pc_id, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(saved_data)
                }).catch(err => alert('Fetch 错误: ' + err));
            }
        });
    }
}

/**
 * 加载施法界面
 */
function load_spellcasting() {
    while (spellcasting_table.rows.length > 1) {
        spellcasting_table.deleteRow(1);
    }

    for (let i in saved_data.spells) {
        let spell = saved_spells.find(element => element.name == saved_data.spells[i]);

        const row = spellcasting_table.insertRow();
        row.classList.add('table-item');
        row.insertCell().innerText = spell.name.split('  ')[0];
        row.insertCell().innerText = spell.level + ' 环';
        row.insertCell().innerText = spell.school;
        row.insertCell().innerText = spell.time.join(' ');
        row.insertCell().innerText = spell.range.join(' ');
        row.insertCell().innerText = spell.source;

        row.addEventListener('click', (event) => {
            let table = row.closest('table');
            if (table.selectedIndex != undefined) 
                table.rows[table.selectedIndex].classList.remove('selected');
            table.selectedIndex = row.rowIndex;
            row.classList.add('selected');

            spellcasting_spell_board.children[0].innerHTML = spell.name;
            spellcasting_spell_board.children[1].innerHTML = spell.level + '环 ';
            spellcasting_spell_board.children[1].innerHTML += spell.school + '<br/>';
            spellcasting_spell_board.children[1].innerHTML += (
                '<span class="board-item">施法时间: </span>' + spell.time.join(' ') + '<br>'
            );
            spellcasting_spell_board.children[1].innerHTML += (
                '<span class="board-item">射程: </span>' + spell.range.join(' ') + '<br>'
            );
            spellcasting_spell_board.children[1].innerHTML += (
                '<span class="board-item">构材: </span>' + spell.components.join('、') + '<br>'
            );
            spellcasting_spell_board.children[1].innerHTML += (
                '<span class="board-item">持续时间: </span>' + spell.duration.join(' ') + '<br>'
            );
            spellcasting_spell_board.children[2].innerHTML = '';
            for (let j=0; j<spell.entries.length; j++) {
                spellcasting_spell_board.children[2].innerHTML += '<p>' + spell.entries[j] + '</p>';
            }
            for (let j=0; j<spell.higher_level.length; j++) {
                spellcasting_spell_board.children[2].innerHTML += (
                    '<p><span class="board-item">升环施法效应. </span>'
                    + spell.higher_level[j]
                    + '</p>'
                );
            }
            spellcasting_spell_board.children[2].innerHTML += (
                '<p><span class="board-item">职业: </span>'
                + spell.classes.join('、') + '</p>'
            );
            let subclass_list = [];
            for (let j of Object.keys(spell.subclasses)) {
                let subclass = saved_spells[i].subclasses[j];
                for (let k in subclass) {
                    subclass_list.push(subclass[k] + ' ' + j);
                }
            }
            spellcasting_spell_board.children[2].innerHTML += (
                subclass_list.length > 0 ?
                '<p><span class="board-item">子职业: </span>' + subclass_list.join('、') + '</p>' :
                ''
            );

            if (event.ctrlKey) {
                saved_data.spells.splice(i, 1);
                load_spellcasting();
                load_profile();
                show_toast('已遗忘法术【' + spell.name.split('  ')[0] + '】', 3000);

                fetch(window.location.origin+'/api/update/'+pc_id, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(saved_data)
                }).catch(err => alert('Fetch 错误: ' + err));
            }
        });
    }
}

/**
 * 加载角色面板
 * 
 * 依次加载概要栏、战斗栏、装备栏、属性栏、快捷施法栏
 * 并计算需要的数值
 */
function load_profile() {
    if (
        saved_data.metadata.race != ''
        && saved_data.metadata.character_name != ''
        && saved_data.metadata.class != ''
        && saved_data.metadata.level != ''
    ) {
        load_summery();
        load_gear();
        load_abilities();
        load_skills();
        load_combat_stats();
    
        load_weapons();
        load_quick_spellcasting();
    
        // 顺便加载施法界面的施法信息
        load_spellcasting_info();
    } else {
        load_summery();
    }
}

/**
 * 加载概要栏
 */
function load_summery() {
    assign('character_name', saved_data.metadata.character_name);
    assign('sex_in_profile', saved_data.characteristics.sex);
    assign('race_in_profile', saved_data.characteristics.race);

    assign('class', saved_data.metadata.class);
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
    query('subclass').add(new Option(''));
    for (let i in subclass_ref[saved_data.metadata.class]) {
        query('subclass').add(new Option(subclass_ref[saved_data.metadata.class][i]));
    }
    assign('subclass', saved_data.metadata.subclass);

    assign('level', saved_data.metadata.level);
    assign('alignment_in_profile', saved_data.background.alignment);
    assign('background_in_profile', saved_data.background.background);
    assign('experience_points', saved_data.metadata.experience_points);

    computed_data.proficiency_bonus = parseInt((saved_data.metadata.level-1)/4)+2;
    assign('proficiency_bonus', '+' + computed_data.proficiency_bonus);
}

/**
 * 载入装备、武器、护甲
 */
function load_gear() {
    for (let x in saved_data.abilities) {
        computed_data[x] = saved_data.abilities[x];
    }

    // 载入装备
    assign(gear_table.rows[1].children[1].children[0], saved_data.gear['头部']);
    assign(gear_table.rows[2].children[1].children[0], saved_data.gear['胸部']);
    assign(gear_table.rows[3].children[1].children[0], saved_data.gear['腰部']);
    assign(gear_table.rows[4].children[1].children[0], saved_data.gear['手部']);
    assign(gear_table.rows[5].children[1].children[0], saved_data.gear['腿部']);
    assign(gear_table.rows[1].children[3].children[0], saved_data.gear['颈部']);
    assign(gear_table.rows[2].children[3].children[0], saved_data.gear['肩部']);
    assign(gear_table.rows[3].children[3].children[0], saved_data.gear['背部']);
    assign(gear_table.rows[4].children[3].children[0], saved_data.gear['腕部']);
    assign(gear_table.rows[5].children[3].children[0], saved_data.gear['脚部']);

    // 载入护甲
    armor_table.rows[0].innerHTML = [
        '<td class="w-p15 primary-color"><select class="select primary-color"></select></td>',
        '<td class="w-p35"><select></select></td>',
        '<td class="w-p15 primary-color">盾牌</td>',
        '<td class="w-p35"><select><option></option></select></td>'
    ].join('');

    computed_data.armor_type = {
        '无甲': ['', '法师护甲'],
        '轻甲': [],
        '中甲': [],
        '重甲': []
    };
    if (saved_data.metadata.class == '野蛮人') computed_data.armor_type['无甲'].push('野蛮人无甲防御');
    if (saved_data.metadata.class == '武僧') computed_data.armor_type['无甲'].push('武僧无甲防御');
    for (let i in saved_data.backpack) {
        let item = saved_items.find(element => element.name == saved_data.backpack[i].name);
        if (item.type.includes('盾牌')) {
            armor_table.rows[0].cells[3].children[0].add(new Option(saved_data.backpack[i].label));
        } else if (item.type.includes('轻甲')) {
            computed_data.armor_type['轻甲'].push(saved_data.backpack[i].label);
        } else if (item.type.includes('中甲')) {
            computed_data.armor_type['中甲'].push(saved_data.backpack[i].label);
        } else if (item.type.includes('重甲')) {
            computed_data.armor_type['重甲'].push(saved_data.backpack[i].label);
        }
    }
    armor_table.rows[0].cells[0].children[0].add(new Option('无甲'));
    if (computed_data.armor_type['轻甲'].length != 0)
        armor_table.rows[0].cells[0].children[0].add(new Option('轻甲'));
    if (computed_data.armor_type['中甲'].length != 0)
        armor_table.rows[0].cells[0].children[0].add(new Option('中甲'));
    if (computed_data.armor_type['重甲'].length != 0)
        armor_table.rows[0].cells[0].children[0].add(new Option('重甲'));

    if (
        saved_data.armor[0] != '无甲' &&
        saved_data.backpack.find(element => element.label == saved_data.armor[1]) == undefined
    ) {
        saved_data.armor[0] = '无甲';
        saved_data.armor[1] = '';
    }
    if (saved_data.backpack.find(element => element.label == saved_data.armor[2]) == undefined) {
        saved_data.armor[2] = '';
    }
    assign(armor_table.rows[0].cells[0].children[0], saved_data.armor[0]);
    armor_table.rows[0].cells[1].children[0].innerHTML = '';
    for (let i in computed_data.armor_type[saved_data.armor[0]]) {
        armor_table.rows[0].cells[1].children[0]
            .add(new Option(computed_data.armor_type[saved_data.armor[0]][i]));
    }
    assign(armor_table.rows[0].cells[1].children[0], saved_data.armor[1]);
    assign(armor_table.rows[0].cells[3].children[0], saved_data.armor[2]);
    let item = saved_data.backpack.find(ele => ele.label == saved_data.armor[1]);
    if (
        item != undefined
        && (
            ['全身板甲', '条板甲', '锁子甲', '环甲', '半身板甲', '半身板甲', '鳞甲', '绵甲']
                .includes(item.name.split('  ')[0])
        )
    ) {
        skills.rows[4].classList.add('selected-red'); // 添加隐匿劣势标记
    } else {
        skills.rows[4].classList.remove('selected-red'); // 移除隐匿劣势标记
    }
    
    armor_table.querySelectorAll('select').forEach(select => {
        select.addEventListener('change', () => {
            switch (select.parentElement.cellIndex) {
                case 0:
                    saved_data.armor[0] = select.selectedOptions[0].innerText;
                    saved_data.armor[1] = computed_data.armor_type[saved_data.armor[0]][0];
                    armor_table.rows[0].cells[1].children[0].innerHTML = '';
                    for (let i in computed_data.armor_type[saved_data.armor[0]]) {
                        armor_table.rows[0].cells[1].children[0]
                            .add(new Option(computed_data.armor_type[saved_data.armor[0]][i]));
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

            fetch(window.location.origin+'/api/update/'+pc_id, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(saved_data)
            }).catch(err => alert('Fetch 错误: ' + err)); 
        });
    });
}

/**
 * 载入属性
 */
function load_abilities() {
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
        let proficiency = prof_ref[saved_data.metadata.class].includes(abs_ref[i]);

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
            parseInt(sum(computed_data[ability_ref[i]])/2)-5
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
    // 先确定载重信息
    let max_weight = 5 * Number(computed_data.strength);
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
        computed_speed = 0;
        abilities.rows[1].classList.remove('selected-red'); // 移除劣势标记
        abilities.rows[2].classList.remove('selected-red'); // 移除劣势标记
        abilities.rows[3].classList.remove('selected-red'); // 移除劣势标记
    }
    document.querySelectorAll('#current_weight_in_profile, #current_weight_in_inventory').forEach(el => {
        el.style.color = weight_color;
    });
        
    assign(
        current_weight_in_profile,
        computed_data.current_weight + ' 磅 / ' + max_weight + ' 磅'
    );
    assign(
        current_weight_in_inventory,
        computed_data.current_weight + ' 磅 / ' + max_weight + ' 磅'
    );

    assign(initiative.children[1].children[0], saved_data.combat_stats['initiative_bonus']);
    assign(initiative.children[2].children[0],
        parseInt(sum(computed_data['dexterity'])/2)-5 + Number(saved_data.combat_stats['initiative_bonus'])
    ); // 先攻

    let tmp_armor_class = 0;
    if (saved_data.armor[0] == '无甲') {
        if (saved_data.armor[1] == '')
            tmp_armor_class += (10 + parseInt(sum(computed_data['dexterity'])/2)-5);
        if (saved_data.armor[1] == '法师护甲')
            tmp_armor_class += (13 + parseInt(sum(computed_data['dexterity'])/2)-5);
        if (saved_data.armor[1] == '野蛮人无甲防御')
            tmp_armor_class += (
                10 + parseInt(sum(computed_data['dexterity'])/2)-5
                + parseInt(sum(computed_data['constitution'])/2)-5
            );
        if (saved_data.armor[1] == '武僧无甲防御')
            tmp_armor_class += (
                10 + parseInt(sum(computed_data['dexterity'])/2)-5
                + parseInt(sum(computed_data['wisdom'])/2)-5
            );
    } else {
        let item = saved_data.backpack.find(ele => ele.label == saved_data.armor[1]);
        tmp_armor_class += Number(armor_ref[item.name.split('  ')[0]][0]);
        tmp_armor_class += (
            armor_ref[item.name.split('  ')[0]][1] == '' ?
            parseInt(sum(computed_data['dexterity'])/2)-5 :
            Math.min(
                parseInt(sum(computed_data['dexterity'])/2)-5,
                Number(armor_ref[item.name.split('  ')[0]][1])
            )
        );
    }
    assign(armor_class.children[1].children[0], saved_data.combat_stats['armor_class_bonus']);
    assign(armor_class.children[2], 
        tmp_armor_class
        + Number(saved_data.combat_stats['armor_class_bonus'])
        + (saved_data.armor[2]!='' ? 2 : 0)
    ); // 护甲等级

    let spds_ref = {
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
    for (let k in spds_ref) {
        if (saved_data.characteristics.race.slice(0, k.length) == k) {
            computed_speed += spds_ref[k];
            break;
        }
    }
    assign(speed.children[1], (computed_speed>0?computed_speed:0) + ' 尺'); // 移动速度

    assign(passive_perception.children[1],
        10 + Number(skills.tBodies[0].children[10].children[3].innerText)
    ); // 被动察觉

    assign(hit_point.children[1].children[0], saved_data.combat_stats['hit_point'][0]); // 当前生命值
    assign(hit_point.children[2].children[0], saved_data.combat_stats['hit_point'][1]); // 最大生命值
    assign(temporary_hit_point.children[1].children[0], saved_data.combat_stats['hit_point'][2]); // 临时生命值
    let color = '';
    if (
        Number(saved_data.combat_stats['hit_point'][0]) == Number(saved_data.combat_stats['hit_point'][1])
    ) {color = '#00bb20';} else if (
        Number(saved_data.combat_stats['hit_point'][0]) > Number(saved_data.combat_stats['hit_point'][1])/2
    ) {color = '#c5ca00';} else if (
        Number(saved_data.combat_stats['hit_point'][0]) > 0
    ) {color = '#f7a100';} else {color = '#cc0000';}
    profile_panel.querySelectorAll('#hit_point input').forEach(el => {
        el.style.color = color;
        el.style['font-size'] = '16px';
    });

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
    assign(hit_dice.children[1].children[0], saved_data.combat_stats['hit_dice']); // 剩余生命骰数量
    assign(hit_dice.children[2], saved_data.metadata['level']); // 最大生命骰数量
    assign(hit_dice_value.children[1].children[0], hd_ref[saved_data.metadata['class']]); // 生命骰数值

    assign(special_value.children[0].children[0], saved_data.combat_stats['special_value'][0]); // 特殊能力名称
    assign(special_value.children[1].children[0], saved_data.combat_stats['special_value'][1]); // 特殊能力剩余数量
    assign(special_value.children[2].children[0], saved_data.combat_stats['special_value'][2]); // 特殊能力最大数量
    
    assign(inspiration.children[1].children[0], saved_data.combat_stats['inspiration']); // 激励

    assign(conditions.children[0].children[0].children[1].children[0],
        saved_data.combat_stats['conditions']); // 状态
    assign(conditions.children[0].children[0].children[3].children[0],
        saved_data.combat_stats['immunizations']); // 免疫
    assign(conditions.children[0].children[1].children[1].children[0],
        saved_data.combat_stats['vulnerabilities']); // 易伤
    assign(conditions.children[0].children[1].children[3].children[0],
        saved_data.combat_stats['resistances']); // 抗性
}


/**
 * 载入武器
 */
function load_weapons() {
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

    for (let i in saved_data.backpack) {
        let item = saved_items.find(element => element.name == saved_data.backpack[i].name);
        if (item.type.includes('武器')) {
            weapons_table.rows[1].cells[1].children[0].add(new Option(saved_data.backpack[i].label));
            weapons_table.rows[2].cells[1].children[0].add(new Option(saved_data.backpack[i].label));
            weapons_table.rows[3].cells[1].children[0].add(new Option(saved_data.backpack[i].label));
        }
    }

    for (let i in saved_data.weapons) {
        let item = saved_data.backpack.find(element => element.label == saved_data.weapons[i].label);
        if (item == undefined) {
            saved_data.weapons.splice(i, 1);
            continue;
        }
        item = saved_items.find(element => element.name == item.name);

        if (item.properties.includes('双手')) {
            weapons_table.rows[Number(i)+1].cells[0]. children[0].add(new Option('双手'));
        } else if (item.properties.includes('可双手')) {
            weapons_table.rows[Number(i)+1].cells[0]. children[0].add(new Option('右手'));
            weapons_table.rows[Number(i)+1].cells[0]. children[0].add(new Option('左手'));
            weapons_table.rows[Number(i)+1].cells[0]. children[0].add(new Option('双手'));
        } else {
            weapons_table.rows[Number(i)+1].cells[0]. children[0].add(new Option('右手'));
            weapons_table.rows[Number(i)+1].cells[0]. children[0].add(new Option('左手'));
        }

        if (item.properties.includes('灵巧')) {
            weapons_table.rows[Number(i)+1].cells[3]. children[0].add(new Option('力量'));
            weapons_table.rows[Number(i)+1].cells[3]. children[0].add(new Option('敏捷'));
        } else if (item.type.includes('远程')) {
            weapons_table.rows[Number(i)+1].cells[3]. children[0].add(new Option('敏捷'));
        } else {
            weapons_table.rows[Number(i)+1].cells[3]. children[0].add(new Option('力量'));
        }

        assign(weapons_table.rows[Number(i)+1].cells[0].children[0], saved_data.weapons[i].hand);
        assign(weapons_table.rows[Number(i)+1].cells[1].children[0], saved_data.weapons[i].label);
        let tmp_properties = [...item.properties];
        for (let j in tmp_properties) {
            if (tmp_properties[j] == '可双手')
                tmp_properties[j] = '可双手 (<span class="dice">' + item.dmg[2] + '</span>)';
            if (tmp_properties[j] == '弹药') tmp_properties[j] = '弹药 (' + item.range + ' ft.)';
            if (tmp_properties[j] == '投掷') tmp_properties[j] = '投掷 (' + item.range + ' ft.)';
        }
        assign(weapons_table.rows[Number(i)+1].cells[2], tmp_properties.join('、'));
        assign(weapons_table.rows[Number(i)+1].cells[3]. children[0], saved_data.weapons[i].ability);

        const adice = document.createElement('button');
        adice.className = 'btn dice';
        const abs_ref = {'力量': 'strength', '敏捷': 'dexterity'};
        assign(adice, '1d20+' + (
            parseInt(sum(computed_data[abs_ref[saved_data.weapons[i].ability]])/2)-5
            + computed_data.proficiency_bonus
        ));
        weapons_table.rows[Number(i)+1].cells[4].appendChild(adice);

        const hdice = document.createElement('button');
        hdice.className = 'btn dice';
        assign(hdice, (
            (
                item.properties.includes('可双手') && saved_data.weapons[i].hand=='双手' ?
                item.dmg[2] :
                item.dmg[1]
            ) + (
                parseInt(sum(computed_data[abs_ref[saved_data.weapons[i].ability]])/2)-5 < 0 ?
                parseInt(sum(computed_data[abs_ref[saved_data.weapons[i].ability]])/2)-5 :
                '+' + (parseInt(sum(computed_data[abs_ref[saved_data.weapons[i].ability]])/2)-5)
            )
        ));
        weapons_table.rows[Number(i)+1].cells[5].appendChild(hdice);
    }

    weapons_table.querySelectorAll('.dice').forEach(dice => {
        dice.addEventListener('click', (event) => {
            let label = dice.parentElement.parentElement
                .children[1].children[0].selectedOptions[0].value;
            if (dice.tagName == 'BUTTON') {
                label += weapons_table.rows[0].cells[dice.parentElement.cellIndex].innerText.slice(2,4);
            }
            if (roll_board.innerHTML != '') roll_board.innerHTML += '<br\>';
            roll_board.innerHTML += roll_dice(label, dice.innerText, (event.ctrlKey?2:1));
            roll_board.scroll({top: roll_board.scrollHeight, left: 0, behavior: 'smooth'});
        });
    });

    weapons_table.querySelectorAll('select').forEach(select => {
        select.addEventListener('change', () => {
            switch (select.parentElement.cellIndex) {
                case 0:
                    saved_data.weapons[select.parentElement.parentElement.rowIndex-1]['hand'] = (
                        select.selectedOptions[0].innerText
                    );
                    break;
                case 1:
                    let label = select.selectedOptions[0].innerText;
                    if (label == '') {
                        saved_data.weapons.splice(select.parentElement.parentElement.rowIndex-1, 1);
                        break;
                    }
                    let item = saved_data.backpack.find(element => element.label == label);
                    item = saved_items.find(element => element.name == item.name);
                    saved_data.weapons[select.parentElement.parentElement.rowIndex-1] = {
                        "label": label,
                        "hand": item.properties.includes('双手')?'双手':'右手',
                        "ability": item.type.includes('远程')?"敏捷":'力量',
                    };
                    break;
                case 3:
                    saved_data.weapons[select.parentElement.parentElement.rowIndex-1]['ability'] = (
                        select.selectedOptions[0].innerText
                    );
                    break;
            }
            load_profile();

            fetch(window.location.origin+'/api/update/'+pc_id, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(saved_data)
            }).catch(err => alert('Fetch 错误: ' + err)); 
        });
    });
}

/**
 * 载入快速施法
 */
function load_quick_spellcasting() {
    let quick_spellcasting = document.querySelector('#quick_spellcasting');
    for (let i=1; i<4; i++) {
        quick_spellcasting.rows[i].innerHTML = [
            '<td><select><option></option></select></td>',
            '<td></td>',
            '<td></td>',
            '<td></td>',
            '<td></td>'
        ].join('');
    }

    let spells = {'0': [], '1': [], '2': [], '3': [], '4': [],
        '5': [], '6': [], '7': [], '8': [], '9': []};
    for (let i in saved_data.spells) {
        let spell = saved_spells.find(element => element.name == saved_data.spells[i]);
        spells[spell.level].push(spell.name);
    }
    for (let i in Object.keys(spells)) {
        if (spells[i].length == 0) continue;
        quick_spellcasting.rows[1].cells[0].children[0].add(new Option(i + ' 环'));
        quick_spellcasting.rows[2].cells[0].children[0].add(new Option(i + ' 环'));
        quick_spellcasting.rows[3].cells[0].children[0].add(new Option(i + ' 环'));
    }

    for (let i in saved_data.quick_spellcasting) {
        if (!saved_data.spells.includes(saved_data.quick_spellcasting[i][1])) {
            saved_data.quick_spellcasting[i] = ['', '', '']
        }

        assign(quick_spellcasting.rows[Number(i)+1].cells[0].children[0], (
            saved_data.quick_spellcasting[i][0] == '' ?
            '' :
            saved_data.quick_spellcasting[i][0] + ' 环'
        ));

        if (saved_data.quick_spellcasting[i][0] == '') continue;
        const ssel = document.createElement('select');
        ssel.className = 'select';
        quick_spellcasting.rows[Number(i)+1].cells[1].appendChild(ssel);
        for (let j in spells[saved_data.quick_spellcasting[i][0]]) {
            let opt = new Option(spells[saved_data.quick_spellcasting[i][0]][j].split('  ')[0]);
            opt.name = spells[saved_data.quick_spellcasting[i][0]][j];
            quick_spellcasting.rows[Number(i)+1].cells[1].children[0].add(opt);
        }
        assign(quick_spellcasting.rows[Number(i)+1].cells[1].children[0], (
            saved_data.quick_spellcasting[i][1].split('  ')[0]
        ));
        
        const dinp = document.createElement('input');
        dinp.className = 'input';
        assign(dinp, saved_data.quick_spellcasting[i][2])
        if (saved_data.quick_spellcasting[i][1] != '')
            quick_spellcasting.rows[Number(i)+1].cells[2].appendChild(dinp);
        
        let abs_ref = {
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
        const adice = document.createElement('button');
        adice.className = 'btn dice';
        assign(adice, '1d20+' + (
            parseInt(sum(computed_data[abs_ref[saved_data.metadata['class']][1]])/2)-5
            + Number(computed_data.proficiency_bonus)
        ));
        if (saved_data.quick_spellcasting[i][1] != '')
            quick_spellcasting.rows[Number(i)+1].cells[3].appendChild(adice);

        const ddice = document.createElement('button');
        ddice.className = 'btn dice';
        assign(ddice, (
            saved_data.quick_spellcasting[i][2] == '' ?
            '0' :
            saved_data.quick_spellcasting[i][2]
        ));
        if (saved_data.quick_spellcasting[i][1] != '')
            quick_spellcasting.rows[Number(i)+1].cells[4].appendChild(ddice);

    }

    quick_spellcasting.querySelectorAll('.dice').forEach(dice => {
        dice.addEventListener('click', (event) => {
            let label = (
                dice.parentElement.parentElement.children[1].children[0].selectedOptions[0].value
                + ['', '', '', '命中', '伤害'][dice.parentElement.cellIndex]
            );
            if (roll_board.innerHTML != '') roll_board.innerHTML += '<br\>';
            roll_board.innerHTML += roll_dice(label, dice.innerText, (event.ctrlKey?2:1));
            roll_board.scroll({top: roll_board.scrollHeight, left: 0, behavior: 'smooth'});
        });
    });

    quick_spellcasting.querySelectorAll('select').forEach(select => {
        select.addEventListener('change', () => {
            switch (select.parentElement.cellIndex) {
                case 0:
                    if (select.selectedOptions[0].innerText == '') {
                        saved_data.quick_spellcasting[
                            select.parentElement.parentElement.rowIndex-1
                        ] = ['', '', ''];
                    } else {
                        saved_data.quick_spellcasting[
                            select.parentElement.parentElement.rowIndex-1
                        ][0] = select.selectedOptions[0].innerText.split(' ')[0];
                        saved_data.quick_spellcasting[
                            select.parentElement.parentElement.rowIndex-1
                        ][1] = spells[select.selectedOptions[0].innerText.split(' ')[0]][0];
                        saved_data.quick_spellcasting[
                            select.parentElement.parentElement.rowIndex-1
                        ][2] = '';
                    }
                    break;
                case 1:
                    saved_data.quick_spellcasting[
                        select.parentElement.parentElement.rowIndex-1
                    ][1] = select.selectedOptions[0].name;
                    saved_data.quick_spellcasting[
                        select.parentElement.parentElement.rowIndex-1
                    ][2] = '';
                    break;
            }
            
            load_profile();

            fetch(window.location.origin+'/api/update/'+pc_id, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(saved_data)
            }).catch(err => alert('Fetch 错误: ' + err)); 
        });
    });

    quick_spellcasting.querySelectorAll('input').forEach(input => {
        input.addEventListener('change', () => {
            saved_data.quick_spellcasting[
                input.parentElement.parentElement.rowIndex-1
            ][2] = input.value;

            load_profile();

            fetch(window.location.origin+'/api/update/'+pc_id, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(saved_data)
            }).catch(err => alert('Fetch 错误: ' + err)); 
        });
    });
}

/**
 * 加载施法界面中的施法信息
 */
function load_spellcasting_info() {
    let sls_ref = {
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
    let level = 0;
    if (['吟游诗人', '牧师', '德鲁伊', '术士', '法师'].includes(saved_data.metadata.class)) {
        level = saved_data.metadata.level;
    } else if (['圣武士', '游侠'].includes(saved_data.metadata.class)) {
        level = parseInt(Number(saved_data.metadata.level)/2 + 0.9);
        if (saved_data.metadata.level == '1') level = 0;
    }
    for (let i=0; i<9; i++) {
        let label = saved_data.spell_slots[i] + ' / ' + sls_ref[level][i];
        assign(spell_slot.rows[1].cells[i+1].children[0], label);
    }

    let abs_ref = {
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

    assign(spellcasting_ability_in_spellcasting.children[1], (
        abs_ref[saved_data.metadata['class']][0]
    )); // 施法关键属性
    assign(difficulty_class_in_spellcasting.children[1], (
        8 + parseInt(sum(computed_data[abs_ref[saved_data.metadata['class']][1]])/2)-5
        + Number(computed_data.proficiency_bonus)
    )); // 法术豁免难度等级
    assign(attack_bonus_in_spellcasting.children[1].children[0], (
        parseInt(sum(computed_data[abs_ref[saved_data.metadata['class']][1]])/2)-5
        + Number(computed_data.proficiency_bonus)
    )); // 法术命中加值
}

/**
 * 为元素 element 设置值 value
 */
function assign(id, value) {
    // 重构：不直接传入元素
    let element = id;
    if (typeof id === 'string') element = query(id);
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
                console.log('Select Error: ', element.options[0])
                alert('未知选项 in ' + element.id + ': ' + value + '!');
            }
            break;
        default: element.innerHTML = value;
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
    return label;
}

/**
 * 投骰
 */
function roll_dice(label, dice_value, num=1) {
    let dice_parseer = ['', '', ''];
    let dice_result = 0;
    let dice_info = '';
    let res = '';

    for (let i=0; i<num; i++) {
        dice_parseer = ['', '', ''];
        dice_result = 0;
        dice_info = '';
        if ((new RegExp(/^[0-9]+$/)).test(dice_value)) { // 1
            dice_parseer = ['1', '20', '+' + dice_value];
        } else if ((new RegExp(/^[0-9]+d[0-9]+\+[0-9]+$/)).test(dice_value)) { // 1d20+1
            dice_parseer = [
                dice_value.split('d')[0],
                dice_value.split('d')[1].split('+')[0],
                '+' + dice_value.split('d')[1].split('+')[1]
            ];
        } else if ((new RegExp(/^[0-9]+d[0-9]+$/)).test(dice_value)) { // 1d20
            dice_parseer = [dice_value.split('d')[0], dice_value.split('d')[1].split('+')[0], ''];
        } else if ((new RegExp(/^\+[0-9]+$/)).test(dice_value)) { // +1
            dice_parseer = ['1', '20', dice_value];
        } else if ((new RegExp(/^-[0-9]+$/)).test(dice_value)) { // -1
            dice_parseer = ['1', '20', dice_value];
        } else if ((new RegExp(/^[0-9]+d[0-9]+-[0-9]+$/)).test(dice_value)) { // 1d20-1
            dice_parseer = [
                dice_value.split('d')[0],
                dice_value.split('d')[1].split('-')[0],
                '-' + dice_value.split('d')[1].split('-')[1]
            ];
        } else {
            alert('这骰的是啥? [' + dice_value + ']');
        }
    
        let N = Number(dice_parseer[0]);
        for (let i=0; i < N; i++) {
            let dice = Math.floor(Math.random() * Number(dice_parseer[1])) + 1;
            dice_result += dice;
            if (Number(dice_parseer[1])==20 && dice==1) {
                dice = '<span style=\'color: #ef4444;\'>' + dice + '</span>';
            }
            if (Number(dice_parseer[1])==20 && dice==20) {
                dice = '<span style=\'color: #22c55e;\'>' + dice + '</span>';
            }
            dice_info += '[' + dice + ']+';
        }
        dice_result += Number(dice_parseer[2]);
        dice_info = dice_info.slice(0,-1) + dice_parseer[2];
        res += label + ': <span style=\'color: #3b82f6;\'>' + dice_result + '</span> = ' + dice_info;
        res += '<br/>'
    }
    
    return (
        '<div style="border-bottom: 1px solid #e4e8ef; display: inline-block; width: 100%; margin-bottom: 1px;">'
        + res
        + '</div>'
    );
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

function query(id) {
    ret = document.getElementById(id);
    if (ret === null) alert('query(): 使用了未知的 ID 【' + id + '】!');
    return ret;
}
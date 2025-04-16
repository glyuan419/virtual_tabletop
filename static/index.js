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
                console.log('Select Error: ', element.options[0])
                alert('assign(): 未知选项 in ' + element.id + ': ' + value + '!');
            }
            break;
        default: element.innerHTML = value;
    }
}

/**
 * 投骰
 */
function roll_dice(dice_value, num=1) {
    if (dice_value === '') return [];
    let dice_parseer = ['', '', ''];
    let dice_result = 0;
    let dice_info = '';
    let res = [];

    for (let i=0; i<num; i++) {
        dice_parseer = ['', '', ''];
        dice_result = 0;
        dice_info = '';
        if ((new RegExp(/^[0-9]+$/)).test(dice_value)) { // 1
            dice_parseer = ['1', '20', '+' + dice_value];
        } else if ((new RegExp(/^\+[0-9]+$/)).test(dice_value)) { // +1
            dice_parseer = ['1', '20', dice_value];
        } else if ((new RegExp(/^-[0-9]+$/)).test(dice_value)) { // -1
            dice_parseer = ['1', '20', dice_value];
        } else if ((new RegExp(/^[0-9]+d[0-9]+$/)).test(dice_value)) { // 1d20
            dice_parseer = [dice_value.split('d')[0], dice_value.split('d')[1], ''];
        } else if ((new RegExp(/^[0-9]+d[0-9]+\+[0-9]+$/)).test(dice_value)) { // 1d20+1
            dice_parseer = [
                dice_value.split('d')[0],
                dice_value.split('d')[1].split('+')[0],
                '+' + dice_value.split('d')[1].split('+')[1]
            ];
        } else if ((new RegExp(/^[0-9]+d[0-9]+-[0-9]+$/)).test(dice_value)) { // 1d20-1
            dice_parseer = [
                dice_value.split('d')[0],
                dice_value.split('d')[1].split('-')[0],
                '-' + dice_value.split('d')[1].split('-')[1]
            ];
        } else if ((new RegExp(/^d[0-9]+$/)).test(dice_value)) { // d20
            dice_parseer = ['1', dice_value.split('d')[1], ''];
        } else {
            alert('这骰的是啥? 【' + dice_value + '】');
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
        res.push('<span style=\'color: #3b82f6;\'>' + dice_result + '</span> = ' + dice_info);
    }

    return res;
}

/**
 * 展示投骰结果
 */
function show_dice(dice, dice_result) {
    let label = '';
    if (typeof dice === 'string') {
        label = dice;
    } else if (dice.closest('table').id === 'skills') {
        label = dice.closest('tr').cells[1].innerText;
    } else if (dice.closest('table').id === 'abilities') {
        label = dice.closest('tr').cells[1].innerText;
        if (dice.closest('td').cellIndex === 4) label += '豁免';
    } else if (dice.closest('tr').id !== '') {
        label = dice.closest('tr').cells[0].innerText.split(' ')[0];
    } else {
        label = '';
    }

    const roll_board = query('roll_board');
    if (roll_board.innerHTML !== '') roll_board.innerHTML += '<br\>';
    roll_board.innerHTML += (
        '<div style="border-bottom: 1px solid #e4e8ef; display: inline-block; width: 100%; margin-bottom: 1px;">'
        + label + ': ' + dice_result.join('<br/>' + label + ': ')
        + '</div>'
    );
    roll_board.scroll({top: roll_board.scrollHeight, left: 0, behavior: 'smooth'});
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

/**
 * 查找名为 id 的元素
 */
function query(id) {
    ret = document.getElementById(id);
    if (ret === null) alert('query(): 使用了未知的 ID 【' + id + '】!');
    return ret;
}

/**
 * 下载数据 data
 */
function download(data, filename = 'data.json') {
    const jsonData = JSON.stringify(data, null, 4);
    
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * 上传数据更新
 */
function update(data) {
    fetch(window.location.origin+'/api/update/'+pc_id, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    }).catch(err => alert('Fetch 错误: ' + err));
}

/**
 * 解析法术描述
 */
function parse_description(entry) {
    if (typeof entry === 'string') {
        let text = entry;

        // 规则1: {@dice XdY} -> <span class="dice">XdY</span>（自动移除内部空格）
        text = text.replace(/\{@dice ([^}]+)\}/g, (_, dice) => (
            ' <span class="dice">' + dice.replace(/\s+/g, '') + '</span> '
        ));

        // 规则2: {@condition NAME} -> <strong>NAME</strong>（前后加空格）
        text = text.replace(/\{@condition ([^}]+)\}/g, ' <strong>$1</strong> ');

        return text;
    } else if (entry.type === 'list') {
        let text = '';
        for (let i in entry.items) {
            text += '<strong>·</strong> ';
            text += parse_description(entry.items[i]) + '<br/>';
        }
        return text;
    } else if (entry.type === 'entries') {
        let text = '';
        text += '<strong>' + entry.name + ':</strong> ';
        for (let i in entry.entries) {
            text += parse_description(entry.entries[i]) + '<br/>';
        }
        return text;
    } else if (entry.type === 'table') {
        let text = '';
        text += '<strong>' + entry.caption + '</strong><br/>';
        for (let i in entry.rows) {
            text += parse_description(entry.rows[i]) + '<br/>';
        }
        return text;
    } else {
        let text = ''
        for (let x of entry) {
            text += x + '';
        }
        return text;
    }
  }
#!/usr/bin/python3
from json import loads

def parser_type():
    with open('raw_items-base.json', 'r') as f:
        raw = loads(f.read())['itemType']
    res = {}
    for x in raw:
        if x['source'] != 'PHB' and x['source'] != 'DMG': continue
        tmp = {}
        tmp['name'] = x['name'] if 'name' in x else x['entries'][0]['name']
        tmp['source'] = x['source']
        tmp['entries'] = x['entries'] if 'name' in x else x['entries'][0]['entries']
        res[x['abbreviation']] = tmp
    # print(res)
    # for x in res: print(x)
    return res

def parser_property():
    with open('raw_items-base.json', 'r') as f:
        raw = loads(f.read())['itemProperty']
    res = {}
    for x in raw:
        if x['source'] != 'PHB' and x['source'] != 'DMG': continue
        if x['abbreviation'] == 'AF': continue
        tmp = {}
        # tmp['name'] = x['name'] if 'name' in x else x['entries'][0]['name']
        tmp['source'] = x['source']
        tmp['entries'] = [] if 'name' in x else (x['entries'][0]['entries'] if len(x['entries'])==1 else [x['entries'][0]['entries'][0], x['entries'][1]])
        res[x['name'] if 'name' in x else x['entries'][0]['name']] = tmp
    print(res)
    # for x in res: print(x)
    return res

def parser_items():
    types = parser_type()
    props = parser_property()
    with open('raw_items-base.json', 'r') as f:
        raw = loads(f.read())['baseitem']
    res = []
    for x in raw:
        if x['source'] != 'PHB' and x['source'] != 'DMG': continue
        if 'value' not in x: continue
        if x['type'] == 'AF': continue
        if 'property' in x and 'AF' in x['property'] : continue

        tmp = {}
        tmp['name'] = '%s  %s' % (x['name'], x['ENG_name'])
        tmp['source'] = x['source']

        if x['type'] == 'A':
            tmp['type'] = ['弹药']
        elif x['type'] == 'R':
            tmp['type'] = ['武器', '远程', '军用' if x['weaponCategory']=='martial' else '简易']
        elif x['type'] == 'M':
            tmp['type'] = ['武器', '近战', '军用' if x['weaponCategory']=='martial' else '简易']
        elif x['type'] == 'HA':
            tmp['type'] = ['护甲', '重甲']
        elif x['type'] == 'MA':
            tmp['type'] = ['护甲', '中甲']
        elif x['type'] == 'LA':
            tmp['type'] = ['护甲', '轻甲']
        elif x['type'] == 'SCF':
            tmp['type'] = ['法器']
        elif x['type'] == 'S':
            tmp['type'] = ['盾牌']
        else: print("????????")

        tmp['properties'] = []
        if 'property' in x:
            for y in x['property']:
                tmp['properties'].append(props[y]['name'])

        dmg_type_ref = {"B": "钝击", "P": "穿刺", "S": "挥砍", "A": "强酸", "C": "冷冻", "F": "火焰", "L": "闪电", "T": "雷鸣", "PO": "毒素", "N": "黯蚀", "R": "光耀", "Ps": "心灵", "Fo": "力场"}
        if x['type'] == 'R':
            tmp['dmg'] = [dmg_type_ref[x['dmgType']], x['dmg1']] if '捕网' not in tmp['name'].split('  ') else ['', '']
            if '可双手' in tmp['properties']: tmp['dmg'].append(x['dmg2'])
            tmp['range'] = x['range']
        if x['type'] == 'M':
            tmp['dmg'] = [dmg_type_ref[x['dmgType']], x['dmg1']] if '捕网' not in tmp['name'].split('  ') else ['', '']
            if '可双手' in tmp['properties']: tmp['dmg'].append(x['dmg2'])

        tmp['weight'] = x['weight'] if 'weight' in x else 0
        tmp['value'] = x['value']

        tmp['entries'] = x['entries'] if 'entries' in x else []

        res.append(tmp)

    # for x in res: print(x)
    print(res)

parser_property()
# parser_items()
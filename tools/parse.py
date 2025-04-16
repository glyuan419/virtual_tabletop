#!/usr/bin/python3
from json import loads, dumps

def parse_type():
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

def parse_property():
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

def parse_items():
    types = parse_type()
    props = parse_property()
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

def paser_spells():
    with open('raw_spells.json', 'r') as f:
        raw = loads(f.read())['spell']
    res = []
    for x in raw:
        tmp = {}
        tmp['name'] = '%s  %s' % (x['name'], x['ENG_name'])
        tmp['source'] = x['source']
        tmp['level'] = '%d' % x['level']
        tmp['school'] = x['school']
        tmp['time'] = ['%d' % x['time'][0]['number'], x['time'][0]['unit']]
        tmp['range'] = (
            [x['range']['type'], '', '']
            if x['range']['type']=='special'
            else (
                [x['range']['type'], x['range']['distance']['type'], '']
                if (
                    x['range']['distance']['type'] == 'self'
                    or x['range']['distance']['type'] == 'touch'
                    or x['range']['distance']['type'] == 'sight'
                    or x['range']['distance']['type'] == 'unlimited'
                )
                else [x['range']['type'], '%s'%x['range']['distance']['amount'], x['range']['distance']['type']]
            )
        )
        tmp['components'] = []
        if 'v' in x['components'] and x['components']['v']: tmp['components'].append('声音')
        if 's' in x['components'] and x['components']['s']: tmp['components'].append('姿势')
        if 'm' in x['components']: tmp['components'].append('材料（%s）'%x['components']['m'])
        tmp['duration'] = (
            [x['duration'][0]['type'], '', '']
            if x['duration'][0]['type']=='instant' or x['duration'][0]['type']=='special'
            else (
                [x['duration'][0]['type'], x['duration'][0]['ends'], '']
                if x['duration'][0]['type']=='permanent'
                else [
                    x['duration'][0]['type'],
                    '%s'%x['duration'][0]['duration']['amount'],
                    x['duration'][0]['duration']['type']
                ]
            )
        )
        tmp['entries'] = x['entries']
        tmp['higher_level'] = (
            [] if 'entriesHigherLevel' not in x
            else x['entriesHigherLevel'][0]['entries']
        )
        tmp['classes'] = []
        for y in x['classes']['fromClassList']:
            name = y['name']
            if name=='Artificer (Revisited)': name='Artificer'
            if name not in tmp['classes']: tmp['classes'].append(name)
        if 'fromClassListVariant' in x['classes']:
            for y in x['classes']['fromClassListVariant']:
                name = y['name']
                if name=='Artificer (Revisited)': name='Artificer'
                if name not in tmp['classes']: tmp['classes'].append(name)
        tmp['subclasses'] = {}
        if 'fromSubclass' in x['classes']:
            for y in x['classes']['fromSubclass']:
                name1 = y['class']['name'].split(' ')[0]
                tmp['subclasses'][name1] = []
            for y in x['classes']['fromSubclass']:
                name1 = y['class']['name'].split(' ')[0]
                name2 = y['subclass']['name']
                if name2[-5:] == ' (UA)': name2 = name2[:-5]
                if name2[-6:] == ' (PSA)': name2 = name2[:-6]
                if name2[-3:] == ' v2': name2 = name2[:-3]
                if name2 not in tmp['subclasses'][name1]: tmp['subclasses'][name1].append(name2)


        res.append(tmp)
    # for x in res: print(x)
    print(dumps(res))


# parse_property()
# parse_items()
paser_spells()
let property_ref = {
    "自定义": {
        "source": "自定义",
        "entries": []
    },
    "弹药": {
        "source": "PHB",
        "entries": [
            "你只能在拥有该武器射击所需要的弹药时，才能使用具有弹药属性的武器进行一次远程攻击。每次你使用该武器攻击，你消耗一发弹药。从箭袋、盒子、或其他容器抽出弹药被视为该攻击的一部份。装填单手武器需要一只空手。在战斗结束后，你可以借由花费一分钟的时间搜索战场，以拿回一半你所消耗掉的弹药量。",
            "如果你使用具有弹药属性的武器进行一次近战攻击，你将该武器视作临时武器。当你以这种方式使用时，投石索必须要在已装填的情况下才能造成伤害。"
        ]
    },
    "扫射": {
        "source": "DMG",
        "entries": [
            "具有扫射属性的武器可以进行一次单一目标的攻击，或可以在其正常射程内扫射复盖一个10尺锥形的范围。每个在范围内的生物都必须成功通过一次DC 15的敏捷豁免，否则受到该武器的正常伤害。这个动作将会消耗十发弹药。"
        ]
    },
    "灵巧": {
        "source": "PHB",
        "entries": [
            "当你使用灵巧武器进行攻击时，你可以选择在该次攻击检定和伤害骰中使用你的力量或敏捷调整值。这两次掷骰必须使用相同的调整值。"
        ]
    },
    "重型": {
        "source": "PHB",
        "entries": [
            "小型生物在使用重型武器进行攻击时会承受劣势。重型武器的尺寸和重量使它对小型生物而言太过庞大而无法有效使用。"
        ]
    },
    "轻型": {
        "source": "PHB",
        "entries": [
            "轻型武器小而易用，让其相当适合被用于双武器战斗。"
        ]
    },
    "装填": {
        "source": "PHB",
        "entries": [
            "由于装填此武器所需的时间，当你使用动作、附赠动作、或反应以该武器射击时，无论你原本可以进行几次攻击，你都只能用其射出一发弹药。"
        ]
    },
    "触及": {
        "source": "PHB",
        "entries": [
            "当你使用此武器攻击时，此武器让你的触及距离增加5尺。这个属性也影响你使用触及武器进行借机攻击的触及距离。"
        ]
    },
    "再装填": {
        "source": "DMG",
        "entries": [
            "具有再装填属性的武器只能够进行有限次数的攻击。一个生物必须接着使用一个动作或一个附赠动作（由角色决定）将之重新装填。"
        ]
    },
    "特殊": {
        "source": "PHB",
        "entries": []
    },
    "投掷": {
        "source": "PHB",
        "entries": [
            "如果一把武器具有投掷属性，则你可以投掷此武器以进行一次远程攻击。如果该武器是一把近战武器，则你在该攻击检定和伤害骰中使用与你用其进行近战攻击时相同的属性调整值。举例来说，若你投掷一把手斧，则你使用你的力量。但如果你投掷的是一把匕首，由于匕首具有灵巧属性，因此你可以从你的力量或敏捷中择一使用。"
        ]
    },
    "双手": {
        "source": "PHB",
        "entries": [
            "此武器需要双手使用。这个属性只关联于你使用此武器攻击时，而非单纯持握它的时候。"
        ]
    },
    "可双手": {
        "source": "PHB",
        "entries": [
            "此武器可以被单手或双手使用。这个属性后方所显示括号内的伤害数值，代表着以双手使用此武器进行一次近战攻击时的伤害。"
        ]
    }
};

let armor_ref = {
    "标签": ["基础护甲等级", "敏捷调整值", "隐匿"],
    "绵甲": ["11", "", "劣势"],
    "皮甲": ["11", "", ""],
    "镶钉皮甲": ["12", "", ""],
    "生皮甲": ["12", "2", ""],
    "链甲衫": ["13", "2", ""],
    "鳞甲": ["14", "2", "劣势"],
    "护胸甲": ["14", "2", ""],
    "半身板甲": ["15", "2", "劣势"],
    "环甲": ["14", "0", "劣势"],
    "锁子甲": ["16", "0", "劣势"],
    "条板甲": ["17", "0", "劣势"],
    "全身板甲": ["18", "0", "劣势"]
};
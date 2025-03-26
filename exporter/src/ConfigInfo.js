export var levelToXpMap = {
    1: 0,
    2: 15,
    3: 32,
    4: 51,
    5: 73,
    6: 99,
    7: 129,
    8: 163,
    9: 203,
    10: 249,
    11: 302,
    12: 363,
    13: 433,
    14: 514,
    15: 607,
    16: 715,
    17: 839,
    18: 982,
    19: 1147,
    20: 1337,
    21: 1555,
    22: 1807,
    23: 2097,
    24: 2431,
    25: 2815,
    26: 3258,
    27: 3768,
    28: 4355,
    29: 5031,
    30: 5810,
    31: 6707,
    32: 7740,
    33: 8929,
    34: 10298,
    35: 11875,
    36: 13691,
    37: 15782,
    38: 18190,
    39: 20963,
    40: 24156,
    41: 27833,
    42: 32067,
    43: 36943,
    44: 42558,
    45: 49024,
    46: 56470,
    47: 65044,
    48: 74917,
    49: 86286,
    50: 99377,
    51: 114452,
    52: 131811,
    53: 151800,
    54: 174818,
    55: 201324,
    56: 231846,
    57: 266992,
    58: 307463,
    59: 354067,
    60: 407732,
    61: 469528,
    62: 540687,
    63: 622627,
    64: 716982,
    65: 825633,
    66: 950747,
    67: 1094817,
    68: 1260716,
    69: 1451751,
    70: 1671730,
    71: 1925039,
    72: 2216727,
    73: 2552610,
    74: 2939384,
    75: 3384760,
    76: 3897616,
    77: 4488177,
    78: 5168216,
    79: 5951290,
    80: 6853010,
    81: 7891353,
    82: 9087018,
    83: 10463843,
    84: 12049275,
    85: 13874922,
    86: 15977179,
    87: 18397956,
    88: 21185513,
    89: 24395422,
    90: 28091675,
    91: 32347960,
    92: 37249129,
    93: 42892890,
    94: 49391757,
    95: 56875289,
    96: 65492676,
    97: 75415713,
    98: 86842222,
    99: 100000000,
    100: Number.MAX_SAFE_INTEGER
};

export var skillToFieldMap = {
    'health': ['khe', 'mhp', 'hp'],
    'accuracy': ['kae', 'kal', 'kac'],
    'defense': ['kde', 'kdl', 'kdc'],
    'strength': ['kse', 'ksl', 'ksc'],
    'fidelity': ['kfe', 'kfl', 'kfc'],
    'archery': ['kare', 'karl', 'karc'],
    'fishing': ['kfie', 'kfil', 'kfic'],
    'forestry': ['kfoe', 'kfol', 'kfoc'],
    'cooking': ['kcoe', 'kcol', 'kcoc'],
    'mining': ['kme', 'kml', 'kmc'],
    'smithing': ['ksme', 'ksml', 'ksmc'],
    'crafting': ['kce', 'kcl', 'kcc'],
    'farming': ['kfae', 'kfal', 'kfac'],
    'combat': ['cbl']
}

export var materialToSuccessChanceMap = {
    'copper': .5,
    'brass': .55,
    'bronze': 0.6,
    'nickelbronze': 0.625,
    'iron': 0.65,
    'steel': 0.65,
    'unknown_a': 0.675,
    'unknown_b': 0.7
};

export var materialToLevelMap = {
    'copper': 1,
    'zinc': 5,
    'brass': 5,
    'tin': 10,
    'bronze': 10,
    'nickel': 15,
    'nickelbronze': 15,
    'iron': 20,
    'steel': 25,
    'unknown_a': 30,
    'unknown_b': 35,
}

export var materialToXPMap = {
    'copper': 1,
    'zinc': 2,
    'brass': 2,
    'tin': 4,
    'bronze': 4,
    'nickel': 6,
    'nickelbronze': 6,
    'iron': 9,
    'steel': 12,
}

export var characterTypeOptions = [{
    name: 'Hair',
    id: 'sha',
    options: [2, 5, 7, 1, 6, 3, 4, 0],
    optionsWoman: [8, 9, 10]
},
{
    name: 'Eyes',
    id: 'se',
    options: [0, 1]
},
{
    name: 'Nose',
    id: 'sno',
    options: [0, 1]
},
{
    name: 'Beard',
    id: 'sbe',
    options: [0, 5, 1, 2, 6, 4, 7, 3],
    optionsWoman: [0]
}];

export var characterColorOptions = [{
    name: 'Hair',
    id: 'sham',
    options: [0, 1, 2, 3, 4]
},
{
    name: 'Eyes',
    id: 'sem',
    options: [0, 1, 2, 3, 4, 5]
},
{
    name: 'Shirt',
    id: 'sshim',
    options: [0, 1, 3, 4, 2, 7, 5]
},
{
    name: 'Pants',
    id: 'spm',
    options: [0, 1, 3, 4, 2, 5]
}];


export var prayerList = [
    {
        name: "Defend Me",
        nameId: "defendMe",
        id: 0,
        drainRate: 10,
        level: 1,
        thumbnail: 'defense',
        description: 'Increases defense'
    },
    {
        name: "Heal Me",
        nameId: "healMe",
        id: 1,
        drainRate: 4,
        level: 5,
        thumbnail: 'health',
        description: 'Slowly heals hitpoints'
    },
    {
        name: "Focus Me",
        nameId: "focusMe",
        id: 2,
        drainRate: 10,
        level: 10,
        thumbnail: 'eagle',
        description: 'Increases accuracy'
    },
    {
        name: "Strengthen Me",
        nameId: "strengthenMe",
        id: 3,
        drainRate: 12,
        level: 15,
        thumbnail: 'bear',
        description: 'Increases strength'
    },
    {
        name: "Protect from Wind",
        nameId: "protectFromWind",
        id: 4,
        drainRate: 12,
        level: 20,
        thumbnail: 'air',
        description: 'Protects from wind attacks'
    },
    {
        name: "Protect from Water",
        nameId: "protectFromWater",
        id: 5,
        drainRate: 12,
        level: 25,
        thumbnail: 'water',
        description: 'Protects from water attacks'
    },
    {
        name: "Protect from Fire",
        nameId: "protectFromFire",
        id: 6,
        drainRate: 12,
        level: 30,
        thumbnail: 'flame',
        description: 'Protects from fire attacks'
    }
];

export var questList = {
    'q000': ['Goblin King', [11, 21]],
    'q002': ['Prove Yourself', [9]],
    'q003': ['Riddle Me This I', [1]],
    'q004': ['Riddle Me This II', [1]],
    'q005': ['Troll Lair', [5,11]],
    'q006': ['Imp Hunter', [5]],
    'q007': ['Den of Thieves', [5, 10]],
    'q008': ['Royal Gardener', [5]],
    'q009': ['Fight Arena', [3]],
    'q011': ['Into the Coop', [4]],
    'q012': ['Innocent Blood', [9]],
}

export var collectionLog = [
    'red_hat',
    'orange_hat',
    'yellow_hat',
    'green_hat',
    'blue_hat',
    'white_hat',
    'silver_hat',
    'brown_hat',
    'black_hat',
    'golden_egg',
    'bear_tooth',
    'draconic_scale'
]
export var segmentToPVPMultiplier = {
    "500-500": 0,
    "499-500": 0,
    "499-501": .01,
    "500-501": .01,

    "486-510": .02,
    "486-511": .02,
    "485-510": .05,
    "485-511": .05,
    '496-497': .05,
    '496-495': .05,
    '496-493': .05,
    '496-493': .05,
    '485-512': .05,
    '486-512': .05,
    '496-493': .10,
    '485-513': 1,
    '486-513': 1,
    '496-499': .20,
    '486-509': .10
}

export var spawnPoints = [
    [[500, 500, 4, 10], [500, 500, 6, 10], [500, 500, 8, 10], [500, 500, 4, 12], [500, 500, 6, 12], [500, 500, 8, 12], [500, 500, 4, 14], [500, 500, 6, 14], [500, 500, 8, 14]],
    [[486, 511, 17, 28], [486, 511, 15, 28], [486, 511, 17, 26], [486, 511, 15, 26]]
]
export var segmentToSpawnPoints = {
    "500-500": 0,
    "499-500": 0,
    "500-501": 0,
    "499-501": 0,
    "499-504": 0,
    "499-506": 0,

    "486-510": 1,
    "486-511": 1,
    "486-512": 1,
    "485-512": 1,
    "485-510": 1,
    "485-511": 1,
    "501-506": 1,
    '496-497': 1,
    '496-495': 1,
    '496-493': 1,
    '496-491': 1,
    '485-513': 1,
    '486-513': 1,
    '496-499': 1,
    '486-509': 1
}

export var forceSongChanges = {
    '499-504': true,
    '496-493': true,
    '496-497': true,
    '496-491': true,
    '485-513': true,
    '486-513': true,
    '496-499': true
}

export var segmentToSongs = {
    "500-500": ['Palastinalied', 'Ash_Grove', 'The_Minstrel_Boy'],
    "499-500": ['Palastinalied', 'Ash_Grove', 'The_Minstrel_Boy'],
    "500-501": ['Palastinalied', 'Ash_Grove', 'The_Minstrel_Boy'],
    "499-501": ['Palastinalied', 'Ash_Grove', 'The_Minstrel_Boy'],
    "499-504": ['Ash_Grove_Minor'],
    "499-506": ['Palastinalied', 'Ash_Grove', 'The_Minstrel_Boy'],

    "486-510": ['Jesus_Christ_is_Risen_Today', 'I_Heard_the_Voice_of_Jesus_Say', 'Foggy_Dew'],
    "486-511": ['Jesus_Christ_is_Risen_Today', 'I_Heard_the_Voice_of_Jesus_Say', 'Foggy_Dew'],
    "486-512": ['Jesus_Christ_is_Risen_Today', 'I_Heard_the_Voice_of_Jesus_Say', 'Foggy_Dew'],
    "485-512": ['Jesus_Christ_is_Risen_Today', 'I_Heard_the_Voice_of_Jesus_Say', 'Foggy_Dew'],
    "485-510": ['Jesus_Christ_is_Risen_Today', 'I_Heard_the_Voice_of_Jesus_Say', 'Foggy_Dew'],
    "485-511": ['O_Mary_of_Graces'],
    "501-506": ['Jesus_Christ_is_Risen_Today', 'I_Heard_the_Voice_of_Jesus_Say', 'Foggy_Dew'],
    '496-497': ['Farewell_to_Nova_Scotia_Minor'],
    '496-495': ['Farewell_to_Nova_Scotia_Minor'],
    '496-493': ['Castle_of_Dromore_Minor'],
    '496-491': ['Jerusalem_the_Golden_Minor'],
    '485-513': ['Ash_Grove_Minor'],
    '486-513': ['Ash_Grove_Minor'],
    '496-499': ['Saltarello'],
    '486-509': ['Folia']
}

export var segmentToBackgroundColor = {
    '499-504': 0x2c3e50,
    '499-506': 0x2c3e50,
    '501-506': 0x2c3e50,
    '496-497': 0x2c3e50,
    '496-495': 0x2c3e50,
    '496-493': 0x2c3e50,
    '496-491': 0x2c3e50,
    '496-489': 0x2c3e50,
    '496-499': 0x2c3e50,
    '496-501': 0x2c3e50,
}
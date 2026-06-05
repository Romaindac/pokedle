// ============================================================
// MODE ARÈNE — 75 Dresseurs (15 boss emblématiques tous les 5)
// Équipes thématiques (noms PokeAPI valides), niveaux progressifs,
// déblocage lié aux zones franchies. Boss = estBoss:true (plus forts).
// ============================================================

const SPRITE_DRESSEUR = 'https://play.pokemonshowdown.com/sprites/trainers/'

export const DRESSEURS = [
  {
    id: 'dr1', nom: 'Montagnard Jade', titre: 'Roche',
    emoji: '🥾', theme: 'Roche', debloqueA: 1, sprite: SPRITE_DRESSEUR + 'hiker-gen4.png', niveau: 6,
    equipe: ['spearow', 'psyduck', 'venonat'],
    recompense: { argent: 400 },
  },
  {
    id: 'dr2', nom: 'Mystik Noah', titre: 'Spectre',
    emoji: '👻', theme: 'Spectre', debloqueA: 3, sprite: SPRITE_DRESSEUR + 'hexmaniac-gen6.png', niveau: 9,
    equipe: ['vulpix', 'meowth', 'oddish'],
    recompense: { argent: 800 },
  },
  {
    id: 'dr3', nom: 'Karatéka Anna', titre: 'Combat',
    emoji: '🥋', theme: 'Combat', debloqueA: 4, sprite: SPRITE_DRESSEUR + 'blackbelt-gen4dp.png', niveau: 11,
    equipe: ['farfetchd', 'poliwag', 'geodude'],
    recompense: { argent: 1200, bonbon: 1 },
  },
  {
    id: 'dr4', nom: 'Ouvrier Eden', titre: 'Sol',
    emoji: '⛏️', theme: 'Sol', debloqueA: 5, sprite: SPRITE_DRESSEUR + 'worker-gen4.png', niveau: 14,
    equipe: ['onix', 'shellder', 'oddish'],
    recompense: { argent: 1600, bonbon: 1 },
  },
  {
    id: 'boss5', nom: 'Giovanni', titre: 'Chef de la Team Rocket',
    emoji: '🚀', theme: 'Sol', debloqueA: 6, sprite: SPRITE_DRESSEUR + 'giovanni.png', niveau: 19,
    equipe: ['nidoking', 'nidoqueen', 'rhydon', 'dugtrio', 'persian', 'kangaskhan'],
    recompense: { argent: 7500, bonbon: 3, objet: 'muscle-band' },
    special: 'mewtwo-mega-x',
    estBoss: true,
  },
  {
    id: 'dr6', nom: 'Vétéran Zoé', titre: 'Varié',
    emoji: '🎖️', theme: 'Varié', debloqueA: 8, sprite: SPRITE_DRESSEUR + 'veteran-gen4.png', niveau: 19,
    equipe: ['ponyta', 'staryu', 'shellder'],
    recompense: { argent: 2400 },
  },
  {
    id: 'dr7', nom: 'Matelot Lila', titre: 'Eau',
    emoji: '⚓', theme: 'Eau', debloqueA: 9, sprite: SPRITE_DRESSEUR + 'sailor.png', niveau: 22,
    equipe: ['drowzee', 'lapras', 'cubone'],
    recompense: { argent: 2800 },
  },
  {
    id: 'dr8', nom: 'Gamin Axel', titre: 'Normal',
    emoji: '🧒', theme: 'Normal', debloqueA: 10, sprite: SPRITE_DRESSEUR + 'youngster-gen4.png', niveau: 24,
    equipe: ['krabby', 'kangaskhan', 'pinsir'],
    recompense: { argent: 3200, bonbon: 1 },
  },
  {
    id: 'dr9', nom: 'Montagnard Tess', titre: 'Roche',
    emoji: '🥾', theme: 'Roche', debloqueA: 12, sprite: SPRITE_DRESSEUR + 'hiker-gen4.png', niveau: 27,
    equipe: ['rhyhorn', 'hoothoot', 'totodile'],
    recompense: { argent: 3600, bonbon: 1 },
  },
  {
    id: 'boss10', nom: 'Archie', titre: 'Maître de la Team Aqua',
    emoji: '🌊', theme: 'Eau', debloqueA: 13, sprite: SPRITE_DRESSEUR + 'archie.png', niveau: 35,
    equipe: ['sharpedo', 'crobat', 'mightyena', 'gyarados', 'kingdra', 'wailord'],
    recompense: { argent: 15000, bonbon: 3 },
    special: 'kyogre-primal',
    estBoss: true,
  },
  {
    id: 'dr11', nom: 'Karatéka Max', titre: 'Combat',
    emoji: '🥋', theme: 'Combat', debloqueA: 14, sprite: SPRITE_DRESSEUR + 'blackbelt-gen4dp.png', niveau: 32,
    equipe: ['chansey', 'natu', 'totodile'],
    recompense: { argent: 4400 },
  },
  {
    id: 'dr12', nom: 'Ouvrier Nina', titre: 'Sol',
    emoji: '⛏️', theme: 'Sol', debloqueA: 16, sprite: SPRITE_DRESSEUR + 'worker-gen4.png', niveau: 35,
    equipe: ['jolteon', 'unown', 'girafarig'],
    recompense: { argent: 4800 },
  },
  {
    id: 'dr13', nom: 'As Emma', titre: 'Varié',
    emoji: '⭐', theme: 'Varié', debloqueA: 17, sprite: SPRITE_DRESSEUR + 'acetrainer-gen4dp.png', niveau: 37,
    equipe: ['snorlax', 'hoppip', 'pineco'],
    recompense: { argent: 5200, bonbon: 1 },
  },
  {
    id: 'dr14', nom: 'Vétéran Yann', titre: 'Varié',
    emoji: '🎖️', theme: 'Varié', debloqueA: 18, sprite: SPRITE_DRESSEUR + 'veteran-gen4.png', niveau: 40,
    equipe: ['flaaffy', 'sunkern', 'hoppip'],
    recompense: { argent: 5600, bonbon: 1 },
  },
  {
    id: 'boss15', nom: 'Maxie', titre: 'Chef de la Team Magma',
    emoji: '🌋', theme: 'Feu', debloqueA: 20, sprite: SPRITE_DRESSEUR + 'maxie.png', niveau: 50,
    equipe: ['camerupt', 'crobat', 'mightyena', 'houndoom', 'torkoal', 'magcargo'],
    recompense: { argent: 22500, bonbon: 4 },
    special: 'groudon-primal',
    estBoss: true,
  },
  {
    id: 'dr16', nom: 'Gamin Vera', titre: 'Normal',
    emoji: '🧒', theme: 'Normal', debloqueA: 21, sprite: SPRITE_DRESSEUR + 'youngster-gen4.png', niveau: 45,
    equipe: ['politoed', 'gligar', 'miltank', 'houndour'],
    recompense: { argent: 6400 },
  },
  {
    id: 'dr17', nom: 'Montagnard Eva', titre: 'Roche',
    emoji: '🥾', theme: 'Roche', debloqueA: 22, sprite: SPRITE_DRESSEUR + 'hiker-gen4.png', niveau: 48,
    equipe: ['sudowoodo', 'phanpy', 'slugma', 'treecko'],
    recompense: { argent: 6800 },
  },
  {
    id: 'dr18', nom: 'Mystik Sam', titre: 'Spectre',
    emoji: '👻', theme: 'Spectre', debloqueA: 23, sprite: SPRITE_DRESSEUR + 'hexmaniac-gen6.png', niveau: 50,
    equipe: ['umbreon', 'surskit', 'lotad', 'treecko'],
    recompense: { argent: 7200, bonbon: 1 },
  },
  {
    id: 'dr19', nom: 'Karatéka Cléo', titre: 'Combat',
    emoji: '🥋', theme: 'Combat', debloqueA: 25, sprite: SPRITE_DRESSEUR + 'blackbelt-gen4dp.png', niveau: 53,
    equipe: ['pupitar', 'wingull', 'nincada', 'smoochum'],
    recompense: { argent: 7600, bonbon: 1 },
  },
  {
    id: 'boss20', nom: 'Cyrus', titre: 'Leader de la Team Galaxie',
    emoji: '🌌', theme: 'Ténèbres', debloqueA: 26, sprite: SPRITE_DRESSEUR + 'cyrus.png', niveau: 66,
    equipe: ['weavile', 'honchkrow', 'crobat', 'houndoom', 'gyarados', 'toxicroak'],
    recompense: { argent: 30000, bonbon: 4 },
    special: 'giratina-origin',
    estBoss: true,
  },
  {
    id: 'dr21', nom: 'As Remy', titre: 'Varié',
    emoji: '⭐', theme: 'Varié', debloqueA: 27, sprite: SPRITE_DRESSEUR + 'acetrainer-gen4dp.png', niveau: 58,
    equipe: ['silcoon', 'illumise', 'ralts', 'azurill'],
    recompense: { argent: 8400 },
  },
  {
    id: 'dr22', nom: 'Vétéran Tom', titre: 'Varié',
    emoji: '🎖️', theme: 'Varié', debloqueA: 29, sprite: SPRITE_DRESSEUR + 'veteran-gen4.png', niveau: 61,
    equipe: ['lombre', 'gulpin', 'nosepass', 'nincada'],
    recompense: { argent: 8800 },
  },
  {
    id: 'dr23', nom: 'Matelot Paul', titre: 'Eau',
    emoji: '⚓', theme: 'Eau', debloqueA: 30, sprite: SPRITE_DRESSEUR + 'sailor.png', niveau: 63,
    equipe: ['dustox', 'torkoal', 'spoink', 'swablu'],
    recompense: { argent: 9200, bonbon: 1 },
  },
  {
    id: 'dr24', nom: 'Gamin Liam', titre: 'Normal',
    emoji: '🧒', theme: 'Normal', debloqueA: 31, sprite: SPRITE_DRESSEUR + 'youngster-gen4.png', niveau: 66,
    equipe: ['lairon', 'corphish', 'wailmer', 'meditite'],
    recompense: { argent: 9600, bonbon: 1 },
  },
  {
    id: 'boss25', nom: 'Ghetsis', titre: 'Team Plasma',
    emoji: '👁️', theme: 'Poison', debloqueA: 32, sprite: SPRITE_DRESSEUR + 'ghetsis.png', niveau: 82,
    equipe: ['hydreigon', 'cofagrigus', 'bouffalant', 'seismitoad', 'bisharp', 'eelektross'],
    recompense: { argent: 37500, bonbon: 4, objet: 'loupe-savante' },
    special: 'kyurem-black',
    estBoss: true,
  },
  {
    id: 'dr26', nom: 'Mystik Iris', titre: 'Spectre',
    emoji: '👻', theme: 'Spectre', debloqueA: 34, sprite: SPRITE_DRESSEUR + 'hexmaniac-gen6.png', niveau: 71,
    equipe: ['vibrava', 'seviper', 'luvdisc', 'cacnea'],
    recompense: { argent: 10400 },
  },
  {
    id: 'dr27', nom: 'Karatéka Otis', titre: 'Combat',
    emoji: '🥋', theme: 'Combat', debloqueA: 35, sprite: SPRITE_DRESSEUR + 'blackbelt-gen4dp.png', niveau: 74,
    equipe: ['wailord', 'relicanth', 'beldum', 'feebas'],
    recompense: { argent: 10800 },
  },
  {
    id: 'dr28', nom: 'Ouvrier Hugo', titre: 'Sol',
    emoji: '⛏️', theme: 'Sol', debloqueA: 36, sprite: SPRITE_DRESSEUR + 'worker-gen4.png', niveau: 76,
    equipe: ['crawdaunt', 'kecleon', 'tropius', 'kricketot'],
    recompense: { argent: 11200, bonbon: 1 },
  },
  {
    id: 'dr29', nom: 'As Inès', titre: 'Varié',
    emoji: '⭐', theme: 'Varié', debloqueA: 38, sprite: SPRITE_DRESSEUR + 'acetrainer-gen4dp.png', niveau: 79,
    equipe: ['walrein', 'shieldon', 'clamperl', 'starly'],
    recompense: { argent: 11600, bonbon: 1 },
  },
  {
    id: 'boss30', nom: 'Lysandre', titre: 'Team Flare',
    emoji: '🔥', theme: 'Feu', debloqueA: 39, sprite: SPRITE_DRESSEUR + 'lysandre.png', niveau: 97,
    equipe: ['pyroar-male', 'mienshao', 'honchkrow', 'gyarados', 'murkrow', 'pyroar-male'],
    recompense: { argent: 45000, bonbon: 5 },
    special: 'charizard-mega-y',
    estBoss: true,
  },
  {
    id: 'dr31', nom: 'Matelot Lena', titre: 'Eau',
    emoji: '⚓', theme: 'Eau', debloqueA: 40, sprite: SPRITE_DRESSEUR + 'sailor.png', niveau: 84,
    equipe: ['grotle', 'monferno', 'chatot', 'mime-jr'],
    recompense: { argent: 12400 },
  },
  {
    id: 'dr32', nom: 'Gamin Suki', titre: 'Normal',
    emoji: '🧒', theme: 'Normal', debloqueA: 42, sprite: SPRITE_DRESSEUR + 'youngster-gen4.png', niveau: 87,
    equipe: ['staraptor', 'rampardos', 'skorupi', 'munchlax'],
    recompense: { argent: 12800 },
  },
  {
    id: 'dr33', nom: 'Montagnard Lou', titre: 'Roche',
    emoji: '🥾', theme: 'Roche', debloqueA: 43, sprite: SPRITE_DRESSEUR + 'hiker-gen4.png', niveau: 89,
    equipe: ['ambipom', 'gastrodon', 'mantyke', 'happiny'],
    recompense: { argent: 13200, bonbon: 1 },
  },
  {
    id: 'dr34', nom: 'Mystik Théo', titre: 'Spectre',
    emoji: '👻', theme: 'Spectre', debloqueA: 44, sprite: SPRITE_DRESSEUR + 'hexmaniac-gen6.png', niveau: 92,
    equipe: ['cherrim', 'bronzong', 'pansage', 'bronzor'],
    recompense: { argent: 13600, bonbon: 1 },
  },
  {
    id: 'boss35', nom: 'Brock', titre: 'Champion de Roche',
    emoji: '🪨', theme: 'Roche', debloqueA: 46, sprite: SPRITE_DRESSEUR + 'brock.png', niveau: 113,
    equipe: ['onix', 'golem', 'rhyperior', 'steelix', 'aerodactyl', 'kabutops'],
    recompense: { argent: 52500, bonbon: 5 },
    special: 'aggron-mega',
    estBoss: true,
  },
  {
    id: 'dr36', nom: 'Ouvrier Kai', titre: 'Sol',
    emoji: '⛏️', theme: 'Sol', debloqueA: 47, sprite: SPRITE_DRESSEUR + 'worker-gen4.png', niveau: 97,
    equipe: ['glaceon', 'leafeon', 'panpour', 'pidove'],
    recompense: { argent: 14400 },
  },
  {
    id: 'dr37', nom: 'As Owen', titre: 'Varié',
    emoji: '⭐', theme: 'Varié', debloqueA: 48, sprite: SPRITE_DRESSEUR + 'acetrainer-gen4dp.png', niveau: 100,
    equipe: ['leafeon', 'gallade', 'patrat', 'purrloin'],
    recompense: { argent: 14800 },
  },
  {
    id: 'dr38', nom: 'Vétéran Léo', titre: 'Varié',
    emoji: '🎖️', theme: 'Varié', debloqueA: 49, sprite: SPRITE_DRESSEUR + 'veteran-gen4.png', niveau: 102,
    equipe: ['servine', 'dusknoir', 'maractus', 'tympole'],
    recompense: { argent: 15200, bonbon: 1 },
  },
  {
    id: 'dr39', nom: 'Matelot Jade', titre: 'Eau',
    emoji: '⚓', theme: 'Eau', debloqueA: 51, sprite: SPRITE_DRESSEUR + 'sailor.png', niveau: 105,
    equipe: ['porygon-z', 'pignite', 'woobat', 'tirtouga'],
    recompense: { argent: 15600, bonbon: 1 },
  },
  {
    id: 'boss40', nom: 'Erika', titre: 'Reine des Plantes',
    emoji: '🌸', theme: 'Plante', debloqueA: 52, sprite: SPRITE_DRESSEUR + 'erika.png', niveau: 128,
    equipe: ['vileplume', 'victreebel', 'tangela', 'bellossom', 'venusaur', 'roserade'],
    recompense: { argent: 60000, bonbon: 5 },
    special: 'venusaur-mega',
    estBoss: true,
  },
  {
    id: 'dr41', nom: 'Montagnard Anna', titre: 'Roche',
    emoji: '🥾', theme: 'Roche', debloqueA: 53, sprite: SPRITE_DRESSEUR + 'hiker-gen4.png', niveau: 110,
    equipe: ['herdier', 'seismitoad', 'tirtouga', 'dwebble'],
    recompense: { argent: 16400 },
  },
  {
    id: 'dr42', nom: 'Mystik Eden', titre: 'Spectre',
    emoji: '👻', theme: 'Spectre', debloqueA: 55, sprite: SPRITE_DRESSEUR + 'hexmaniac-gen6.png', niveau: 114,
    equipe: ['scolipede', 'musharna', 'vanillite', 'karrablast'],
    recompense: { argent: 16800 },
  },
  {
    id: 'dr43', nom: 'Karatéka Dante', titre: 'Combat',
    emoji: '🥋', theme: 'Combat', debloqueA: 56, sprite: SPRITE_DRESSEUR + 'blackbelt-gen4dp.png', niveau: 116,
    equipe: ['carracosta', 'whirlipede', 'litwick', 'pawniard'],
    recompense: { argent: 17200, bonbon: 1 },
  },
  {
    id: 'dr44', nom: 'Ouvrier Zoé', titre: 'Sol',
    emoji: '⛏️', theme: 'Sol', debloqueA: 57, sprite: SPRITE_DRESSEUR + 'worker-gen4.png', niveau: 120,
    equipe: ['gothitelle', 'cinccino', 'golett', 'stunfisk'],
    recompense: { argent: 17600, bonbon: 1 },
  },
  {
    id: 'boss45', nom: 'Sabrina', titre: 'Maîtresse Psy',
    emoji: '🔮', theme: 'Psy', debloqueA: 58, sprite: SPRITE_DRESSEUR + 'sabrina.png', niveau: 148,
    equipe: ['alakazam', 'gardevoir', 'gallade', 'espeon', 'gothitelle', 'reuniclus'],
    recompense: { argent: 67500, bonbon: 6 },
    special: 'gardevoir-mega',
    estBoss: true,
  },
  {
    id: 'dr46', nom: 'Vétéran Axel', titre: 'Varié',
    emoji: '🎖️', theme: 'Varié', debloqueA: 60, sprite: SPRITE_DRESSEUR + 'veteran-gen4.png', niveau: 127,
    equipe: ['vanilluxe', 'klinklang', 'pancham', 'bouffalant', 'furfrou'],
    recompense: { argent: 18400 },
  },
  {
    id: 'dr47', nom: 'Matelot Tess', titre: 'Eau',
    emoji: '⚓', theme: 'Eau', debloqueA: 61, sprite: SPRITE_DRESSEUR + 'sailor.png', niveau: 131,
    equipe: ['escavalier', 'jellicent-male', 'flabebe', 'fletchling', 'froakie'],
    recompense: { argent: 18800 },
  },
  {
    id: 'dr48', nom: 'Gamin Lana', titre: 'Normal',
    emoji: '🧒', theme: 'Normal', debloqueA: 62, sprite: SPRITE_DRESSEUR + 'youngster-gen4.png', niveau: 135,
    equipe: ['beheeyem', 'galvantula', 'clauncher', 'fletchling', 'binacle'],
    recompense: { argent: 19200, bonbon: 1 },
  },
  {
    id: 'dr49', nom: 'Montagnard Max', titre: 'Roche',
    emoji: '🥾', theme: 'Roche', debloqueA: 64, sprite: SPRITE_DRESSEUR + 'hiker-gen4.png', niveau: 140,
    equipe: ['accelgor', 'mandibuzz', 'pancham', 'litleo', 'amaura'],
    recompense: { argent: 19600, bonbon: 1 },
  },
  {
    id: 'boss50', nom: 'Lance', titre: 'Maître Dragon',
    emoji: '🐉', theme: 'Dragon', debloqueA: 65, sprite: SPRITE_DRESSEUR + 'lance.png', niveau: 173,
    equipe: ['dragonite', 'salamence', 'garchomp', 'haxorus', 'kingdra', 'gyarados'],
    recompense: { argent: 75000, bonbon: 6, objet: 'porte-bonheur' },
    special: 'rayquaza-mega',
    estBoss: true,
  },
  {
    id: 'dr51', nom: 'Karatéka Emma', titre: 'Combat',
    emoji: '🥋', theme: 'Combat', debloqueA: 66, sprite: SPRITE_DRESSEUR + 'blackbelt-gen4dp.png', niveau: 149,
    equipe: ['greninja', 'diggersby', 'dedenne', 'phantump', 'oricorio-baile'],
    recompense: { argent: 20400 },
  },
  {
    id: 'dr52', nom: 'Ouvrier Yann', titre: 'Sol',
    emoji: '⛏️', theme: 'Sol', debloqueA: 68, sprite: SPRITE_DRESSEUR + 'worker-gen4.png', niveau: 155,
    equipe: ['frogadier', 'aromatisse', 'oricorio-baile', 'bergmite', 'dedenne'],
    recompense: { argent: 20800 },
  },
  {
    id: 'dr53', nom: 'As Nael', titre: 'Varié',
    emoji: '⭐', theme: 'Varié', debloqueA: 69, sprite: SPRITE_DRESSEUR + 'acetrainer-gen4dp.png', niveau: 159,
    equipe: ['gogoat', 'aegislash-shield', 'wimpod', 'oricorio-baile', 'oranguru'],
    recompense: { argent: 21200, bonbon: 1 },
  },
  {
    id: 'dr54', nom: 'Vétéran Vera', titre: 'Varié',
    emoji: '🎖️', theme: 'Varié', debloqueA: 70, sprite: SPRITE_DRESSEUR + 'veteran-gen4.png', niveau: 165,
    equipe: ['aurorus', 'heliolisk', 'yungoos', 'salandit', 'morelull'],
    recompense: { argent: 21600, bonbon: 1 },
  },
  {
    id: 'boss55', nom: 'Steven', titre: 'Champion Acier',
    emoji: '⚙️', theme: 'Acier', debloqueA: 72, sprite: SPRITE_DRESSEUR + 'steven.png', niveau: 205,
    equipe: ['metagross', 'aggron', 'skarmory', 'excadrill', 'aegislash-shield', 'bronzong'],
    recompense: { argent: 82500, bonbon: 6 },
    special: 'metagross-mega',
    estBoss: true,
  },
  {
    id: 'dr56', nom: 'Gamin Sam', titre: 'Normal',
    emoji: '🧒', theme: 'Normal', debloqueA: 73, sprite: SPRITE_DRESSEUR + 'youngster-gen4.png', niveau: 177,
    equipe: ['torracat', 'trevenant', 'incineroar', 'oranguru', 'mimikyu-disguised'],
    recompense: { argent: 22400 },
  },
  {
    id: 'dr57', nom: 'Montagnard Cléo', titre: 'Roche',
    emoji: '🥾', theme: 'Roche', debloqueA: 74, sprite: SPRITE_DRESSEUR + 'hiker-gen4.png', niveau: 184,
    equipe: ['gumshoos', 'decidueye', 'toxapex', 'wimpod', 'xurkitree'],
    recompense: { argent: 22800 },
  },
  {
    id: 'dr58', nom: 'Mystik Milo', titre: 'Spectre',
    emoji: '👻', theme: 'Spectre', debloqueA: 75, sprite: SPRITE_DRESSEUR + 'hexmaniac-gen6.png', niveau: 191,
    equipe: ['golisopod', 'araquanid', 'mudsdale', 'drampa', 'scorbunny'],
    recompense: { argent: 23200, bonbon: 1 },
  },
  {
    id: 'dr59', nom: 'Karatéka Remy', titre: 'Combat',
    emoji: '🥋', theme: 'Combat', debloqueA: 77, sprite: SPRITE_DRESSEUR + 'blackbelt-gen4dp.png', niveau: 198,
    equipe: ['salazzle', 'toxapex', 'steenee', 'sobble', 'blacephalon'],
    recompense: { argent: 23600, bonbon: 1 },
  },
  {
    id: 'boss60', nom: 'Wallace', titre: 'Maître Eau',
    emoji: '💧', theme: 'Eau', debloqueA: 78, sprite: SPRITE_DRESSEUR + 'wallace.png', niveau: 246,
    equipe: ['milotic', 'gyarados', 'starmie', 'ludicolo', 'whiscash', 'wailord'],
    recompense: { argent: 90000, bonbon: 7 },
    special: 'gyarados-mega',
    estBoss: true,
  },
  {
    id: 'dr61', nom: 'As Paul', titre: 'Varié',
    emoji: '⭐', theme: 'Varié', debloqueA: 79, sprite: SPRITE_DRESSEUR + 'acetrainer-gen4dp.png', niveau: 214,
    equipe: ['corviknight', 'kommo-o', 'thievul', 'hatenna', 'rolycoly'],
    recompense: { argent: 24400 },
  },
  {
    id: 'dr62', nom: 'Vétéran Liam', titre: 'Varié',
    emoji: '🎖️', theme: 'Varié', debloqueA: 81, sprite: SPRITE_DRESSEUR + 'veteran-gen4.png', niveau: 223,
    equipe: ['corviknight', 'coalossal', 'thievul', 'chewtle', 'silicobra'],
    recompense: { argent: 24800 },
  },
  {
    id: 'dr63', nom: 'Matelot Romy', titre: 'Eau',
    emoji: '⚓', theme: 'Eau', debloqueA: 82, sprite: SPRITE_DRESSEUR + 'sailor.png', niveau: 231,
    equipe: ['thievul', 'barraskewda', 'flapple', 'dreepy', 'indeedee-male'],
    recompense: { argent: 25200, bonbon: 1 },
  },
  {
    id: 'dr64', nom: 'Gamin Iris', titre: 'Normal',
    emoji: '🧒', theme: 'Normal', debloqueA: 83, sprite: SPRITE_DRESSEUR + 'youngster-gen4.png', niveau: 241,
    equipe: ['barraskewda', 'hattrem', 'appletun', 'cufant', 'snom'],
    recompense: { argent: 25600, bonbon: 1 },
  },
  {
    id: 'boss65', nom: 'Alder', titre: 'Champion Unys',
    emoji: '🦗', theme: 'Insecte', debloqueA: 84, sprite: SPRITE_DRESSEUR + 'alder.png', niveau: 299,
    equipe: ['volcarona', 'bouffalant', 'escavalier', 'accelgor', 'vanilluxe', 'conkeldurr'],
    recompense: { argent: 97500, bonbon: 7 },
    special: 'eternatus-eternamax',
    estBoss: true,
  },
  {
    id: 'dr66', nom: 'Mystik Hugo', titre: 'Spectre',
    emoji: '👻', theme: 'Spectre', debloqueA: 86, sprite: SPRITE_DRESSEUR + 'hexmaniac-gen6.png', niveau: 260,
    equipe: ['overqwil', 'frosmoth', 'obstagoon', 'dracovish', 'lechonk'],
    recompense: { argent: 26400 },
  },
  {
    id: 'dr67', nom: 'Karatéka Inès', titre: 'Combat',
    emoji: '🥋', theme: 'Combat', debloqueA: 87, sprite: SPRITE_DRESSEUR + 'blackbelt-gen4dp.png', niveau: 272,
    equipe: ['overqwil', 'wyrdeer', 'drakloak', 'toedscool', 'fuecoco'],
    recompense: { argent: 26800 },
  },
  {
    id: 'dr68', nom: 'Ouvrier Enzo', titre: 'Sol',
    emoji: '⛏️', theme: 'Sol', debloqueA: 88, sprite: SPRITE_DRESSEUR + 'worker-gen4.png', niveau: 283,
    equipe: ['pawmot', 'meowscarada', 'maushold-family-of-four', 'rellor', 'squawkabilly-green-plumage'],
    recompense: { argent: 27200, bonbon: 1 },
  },
  {
    id: 'dr69', nom: 'As Lena', titre: 'Varié',
    emoji: '⭐', theme: 'Varié', debloqueA: 90, sprite: SPRITE_DRESSEUR + 'acetrainer-gen4dp.png', niveau: 295,
    equipe: ['quaxwell', 'meowscarada', 'oinkologne-male', 'varoom', 'tinkatink'],
    recompense: { argent: 27600, bonbon: 1 },
  },
  {
    id: 'boss70', nom: 'Blue', titre: 'Rival Légendaire',
    emoji: '🏆', theme: 'Varié', debloqueA: 91, sprite: SPRITE_DRESSEUR + 'blue.png', niveau: 369,
    equipe: ['pidgeot', 'alakazam', 'rhyperior', 'arcanine', 'exeggutor', 'blastoise'],
    recompense: { argent: 105000, bonbon: 7 },
    special: 'charizard-mega-x',
    estBoss: true,
  },
  {
    id: 'dr71', nom: 'Matelot Lou', titre: 'Eau',
    emoji: '⚓', theme: 'Eau', debloqueA: 92, sprite: SPRITE_DRESSEUR + 'sailor.png', niveau: 321,
    equipe: ['rabsca', 'grafaiai', 'wugtrio', 'finizen', 'varoom'],
    recompense: { argent: 28400 },
  },
  {
    id: 'dr72', nom: 'Gamin Théo', titre: 'Normal',
    emoji: '🧒', theme: 'Normal', debloqueA: 94, sprite: SPRITE_DRESSEUR + 'youngster-gen4.png', niveau: 336,
    equipe: ['annihilape', 'tinkatuff', 'rabsca', 'slither-wing', 'brute-bonnet'],
    recompense: { argent: 28800 },
  },
  {
    id: 'dr73', nom: 'Montagnard Maya', titre: 'Roche',
    emoji: '🥾', theme: 'Roche', debloqueA: 95, sprite: SPRITE_DRESSEUR + 'hiker-gen4.png', niveau: 350,
    equipe: ['cetitan', 'clodsire', 'gholdengo', 'iron-thorns', 'iron-treads'],
    recompense: { argent: 29200, bonbon: 1 },
  },
  {
    id: 'dr74', nom: 'Mystik Kai', titre: 'Spectre',
    emoji: '👻', theme: 'Spectre', debloqueA: 96, sprite: SPRITE_DRESSEUR + 'hexmaniac-gen6.png', niveau: 367,
    equipe: ['dipplin', 'archaludon', 'kingambit', 'frigibax', 'iron-crown'],
    recompense: { argent: 29600, bonbon: 1 },
  },
  {
    id: 'boss75', nom: 'Red', titre: 'Dresseur Ultime',
    emoji: '👑', theme: 'Légende', debloqueA: 98, sprite: SPRITE_DRESSEUR + 'red.png', niveau: 460,
    equipe: ['pikachu', 'charizard', 'venusaur', 'blastoise', 'snorlax', 'lapras'],
    recompense: { argent: 112500, bonbon: 8, objet: 'charme-chroma' },
    special: 'mewtwo-mega-y',
    estBoss: true,
  },
]

// Renvoie la liste des dresseurs débloqués selon le nombre de zones franchies.
export function dresseursDebloques(nbZones) {
  return DRESSEURS.filter((d) => nbZones >= d.debloqueA)
}

// Calcule l'état de chaque dresseur : 'vaincu', 'disponible', ou 'verrouille'.
// (Ancienne version, conservée pour compatibilité — n'est plus utilisée si on
//  branche etatsDresseursAvecReset, mais on la garde au cas où.)
export function etatsDresseurs(nbZones, dresseursVaincus) {
  const vaincus = dresseursVaincus || []
  return DRESSEURS.map((d, index) => {
    const dejaVaincu = vaincus.includes(d.id)
    const assezDeZones = nbZones >= d.debloqueA
    const precedentVaincu = index === 0 ? true : vaincus.includes(DRESSEURS[index - 1].id)
    let etat = 'verrouille'
    if (dejaVaincu) etat = 'vaincu'
    else if (assezDeZones && precedentVaincu) etat = 'disponible'
    return { ...d, etat, assezDeZones, precedentVaincu }
  })
}

// Décrit la récompense d'un dresseur en texte lisible.
export function decrireRecompenseDresseur(recompense) {
  const parts = []
  if (recompense.argent) parts.push(`${recompense.argent} 💰`)
  if (recompense.bonbon) parts.push(`${recompense.bonbon} super-bonbon(s)`)
  if (recompense.objet) parts.push(`1 objet rare ⚙️`)
  return parts.join(', ') || 'Gloire !'
}

// ============================================================
// RESET D'ARÈNE TOUTES LES 3H (créneaux fixes, synchronisés pour tous)
// On ne stocke plus une simple liste d'ids vaincus, mais le CRÉNEAU de 3h
// où chaque dresseur a été vaincu (objet { id: créneau }). Si le créneau actuel
// ≠ celui de la victoire, le dresseur redevient « à refaire ». Comme le créneau
// vient de l'horloge, tout le monde reset en même temps (0h/3h/6h... UTC), sans serveur.
// ============================================================

export const DUREE_CRENEAU_MS = 3 * 60 * 60 * 1000 // 3 heures

// Identifiant du créneau de 3h en cours (entier qui change toutes les 3h).
export function creneauActuel(maintenant = Date.now()) {
  return Math.floor(maintenant / DUREE_CRENEAU_MS)
}

// Temps restant (ms) avant le prochain reset (passage au créneau suivant).
export function tempsAvantResetMs(maintenant = Date.now()) {
  const finCreneau = (creneauActuel(maintenant) + 1) * DUREE_CRENEAU_MS
  return Math.max(0, finCreneau - maintenant)
}

// Formate un temps (ms) en « 1h23 » / « 12 min » / « 45 s ».
export function formaterTempsReset(ms) {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}`
  if (m > 0) return `${m} min`
  return `${s} s`
}

// Un dresseur est « vaincu » SEULEMENT si sa victoire date du créneau actuel.
// `dresseursVaincus` peut être :
//   - un OBJET { id: créneau }  → nouveau format
//   - un TABLEAU d'ids          → ancien format (considéré périmé : reset au lancement)
function estVaincuCeCreneau(dresseursVaincus, id, creneau) {
  if (!dresseursVaincus) return false
  if (Array.isArray(dresseursVaincus)) return false // ancien format → tout à refaire
  return dresseursVaincus[id] === creneau
}

// Calcule l'état de chaque dresseur EN TENANT COMPTE du créneau 3h.
export function etatsDresseursAvecReset(nbZones, dresseursVaincus, maintenant = Date.now()) {
  const creneau = creneauActuel(maintenant)
  return DRESSEURS.map((d, index) => {
    const dejaVaincu = estVaincuCeCreneau(dresseursVaincus, d.id, creneau)
    const assezDeZones = nbZones >= d.debloqueA
    const precedentVaincu = index === 0
      ? true
      : estVaincuCeCreneau(dresseursVaincus, DRESSEURS[index - 1].id, creneau)
    let etat = 'verrouille'
    if (dejaVaincu) etat = 'vaincu'
    else if (assezDeZones && precedentVaincu) etat = 'disponible'
    return { ...d, etat, assezDeZones, precedentVaincu }
  })
}
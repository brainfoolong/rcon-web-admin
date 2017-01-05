"use strict";

Widget.register(function (widget) {
    var icons = $('<h2 class="collapsable-trigger" data-collapsable-target="rustboard.serverstatus">' + widget.t("serverstatus") + '</h2>' +
        '<div class="icons collapsable-target" data-collapsable-id="rustboard.serverstatus"><div class="row">' +
        '<div class="icon host col-md-6"><span class="glyphicon glyphicon-home"></span> <span class="text"></span></div>' +
        '<div class="icon players col-md-6"><span class="glyphicon glyphicon-user"></span> <span class="text"></span></div>' +
        '</div>' +
        '<div class="row">' +
        '<div class="icon version col-md-6"><span class="glyphicon glyphicon-info-sign"></span> <span class="text"></span></div>' +
        '<div class="icon map col-md-6"><span class="glyphicon glyphicon-picture"></span> <span class="text"></span></div>' +
        '</div></div>');
    var playerlist = $('<div class="playerlist">' +
        '<h2 class="collapsable-trigger" data-collapsable-target="rustboard.playerlist">' + widget.t("playerlist") + ' <span class="count"></span></h2>' +
        '<table class="table table-striped table-condensed table-bordered collapsable-target" data-collapsable-id="rustboard.playerlist"><thead>' +
        '<tr>' +
        '<th>Id</th>' +
        '<th>Name</th>' +
        '<th>Time</th>' +
        '<th>IP</th>' +
        '<th>Ping</th>' +
        '<th>VacStats</th>' +
        '<th></th>' +
        '</tr></thead><tbody></tbody></table></div>');
    var banlist = $('<div class="banlist">' +
        '<h2 class="collapsable-trigger" data-collapsable-target="rustboard.banlist">' + widget.t("banlist") + ' <span class="count"></span></h2>' +
        '<table class="table table-striped table-condensed table-bordered collapsable-target" data-collapsable-id="rustboard.banlist"><thead>' +
        '<tr>' +
        '<th>Id</th>' +
        '<th>Name</th>' +
        '<th>Notes</th>' +
        '<th></th>' +
        '</tr></thead><tbody></tbody></table></div>');
    // from https://github.com/OxideMod/Docs/blob/master/source/includes/rust/item_list.md
    var itemlist = [
        {"id": "2115555558", "item": "ammo.handmade.shell", "info": "Handmade Shell"},
        {"id": "-533875561", "item": "ammo.pistol", "info": "Pistol Bullet"},
        {"id": "1621541165", "item": "ammo.pistol.fire", "info": "Incendiary Pistol Bullet"},
        {"id": "-422893115", "item": "ammo.pistol.hv", "info": "HV Pistol Ammo"},
        {"id": "815896488", "item": "ammo.rifle", "info": "5.56 Rifle Ammo"},
        {"id": "805088543", "item": "ammo.rifle.explosive", "info": "Explosive 5.56 Rifle Ammo"},
        {"id": "1152393492", "item": "ammo.rifle.hv", "info": "HV 5.56 Rifle Ammo"},
        {"id": "449771810", "item": "ammo.rifle.incendiary", "info": "Incendiary 5.56 Rifle Ammo"},
        {"id": "1578894260", "item": "ammo.rocket.basic", "info": "Rocket"},
        {"id": "1436532208", "item": "ammo.rocket.fire", "info": "Incendiary Rocket"},
        {"id": "542276424", "item": "ammo.rocket.hv", "info": "High Velocity Rocket"},
        {"id": "1594947829", "item": "ammo.rocket.smoke", "info": "Smoke Rocket WIP!!!!"},
        {"id": "-1035059994", "item": "ammo.shotgun", "info": "12 Gauge Buckshot"},
        {"id": "1819281075", "item": "ammo.shotgun.slug", "info": "12 Gauge Slug"},
        {"id": "1685058759", "item": "antiradpills", "info": "Anti-Radiation Pills"},
        {"id": "93029210", "item": "apple", "info": "Apple"},
        {"id": "-1565095136", "item": "apple.spoiled", "info": "Rotten Apple"},
        {"id": "-1280058093", "item": "arrow.hv", "info": "High Velocity Arrow"},
        {"id": "-420273765", "item": "arrow.wooden", "info": "Wooden Arrow"},
        {"id": "-148163128", "item": "attire.hide.boots", "info": "Hide Boots"},
        {"id": "936777834", "item": "attire.hide.helterneck", "info": "Hide Halterneck"},
        {"id": "-135651869", "item": "attire.hide.pants", "info": "Hide Pants"},
        {"id": "102672084", "item": "attire.hide.poncho", "info": "Hide Poncho"},
        {"id": "-132588262", "item": "attire.hide.skirt", "info": "Hide Skirt"},
        {"id": "-1666761111", "item": "attire.hide.vest", "info": "Hide Vest"},
        {"id": "563023711", "item": "autoturret", "info": "Auto Turret"},
        {"id": "790921853", "item": "axe.salvaged", "info": "Salvaged Axe"},
        {"id": "-337261910", "item": "bandage", "info": "Bandage"},
        {"id": "498312426", "item": "barricade.concrete", "info": "Concrete Barricade"},
        {"id": "504904386", "item": "barricade.metal", "info": "Metal Barricade"},
        {"id": "-1221200300", "item": "barricade.sandbags", "info": "Sandbag Barricade"},
        {"id": "510887968", "item": "barricade.stone", "info": "Stone Barricade"},
        {"id": "-814689390", "item": "barricade.wood", "info": "Wooden Barricade"},
        {"id": "1024486167", "item": "barricade.woodwire", "info": "Barbed Wooden Barricade"},
        {"id": "2021568998", "item": "battery.small", "info": "Battery - Small"},
        {"id": "1325935999", "item": "bearmeat", "info": "Bear Meat"},
        {"id": "-2066726403", "item": "bearmeat.burned", "info": "Burnt Bear Meat"},
        {"id": "-2043730634", "item": "bearmeat.cooked", "info": "Bear Meat Cooked"},
        {"id": "97409", "item": "bed", "info": "Bed"},
        {"id": "1611480185", "item": "black.raspberries", "info": "Black Raspberries"},
        {"id": "-1386464949", "item": "bleach", "info": "Bleach"},
        {"id": "93832698", "item": "blood", "info": "Blood"},
        {"id": "-1063412582", "item": "blueberries", "info": "Blueberries"},
        {"id": "-1887162396", "item": "blueprintbase", "info": "Blueprint"},
        {"id": "569119686", "item": "bone.armor.suit", "info": "Bone Armor"},
        {"id": "919780768", "item": "bone.club", "info": "Bone Club"},
        {"id": "-365801095", "item": "bone.fragments", "info": "Bone Fragments"},
        {"id": "68998734", "item": "botabag", "info": "Bota Bag"},
        {"id": "-853695669", "item": "bow.hunting", "info": "Hunting Bow"},
        {"id": "-1026117678", "item": "box.repair.bench", "info": "Repair Bench"},
        {"id": "-770311783", "item": "box.wooden", "info": "Wood Storage Box"},
        {"id": "271534758", "item": "box.wooden.large", "info": "Large Wood Box"},
        {"id": "1260209393", "item": "bucket.helmet", "info": "Bucket Helmet"},
        {"id": "-1192532973", "item": "bucket.water", "info": "Water Bucket"},
        {"id": "-307490664", "item": "building.planner", "info": "Building Plan"},
        {"id": "115739308", "item": "burlap.gloves", "info": "Leather Gloves"},
        {"id": "-1035315940", "item": "burlap.headwrap", "info": "Burlap Headwrap"},
        {"id": "707427396", "item": "burlap.shirt", "info": "Burlap Shirt"},
        {"id": "707432758", "item": "burlap.shoes", "info": "Burlap Shoes"},
        {"id": "1767561705", "item": "burlap.trousers", "info": "Burlap Trousers"},
        {"id": "-2079677721", "item": "cactusflesh", "info": "Cactus Flesh"},
        {"id": "-139769801", "item": "campfire", "info": "Camp Fire"},
        {"id": "-1043746011", "item": "can.beans", "info": "Can of Beans"},
        {"id": "2080339268", "item": "can.beans.empty", "info": "Empty Can Of Beans"},
        {"id": "-171664558", "item": "can.tuna", "info": "Can of Tuna"},
        {"id": "1050986417", "item": "can.tuna.empty", "info": "Empty Tuna Can"},
        {"id": "523409530", "item": "candycane", "info": "Candy Cane"},
        {"id": "1300054961", "item": "cctv.camera", "info": "CCTV Camera"},
        {"id": "-2095387015", "item": "ceilinglight", "info": "Ceiling Light"},
        {"id": "1436001773", "item": "charcoal", "info": "Charcoal"},
        {"id": "1711323399", "item": "chicken.burned", "info": "Burned Chicken"},
        {"id": "1734319168", "item": "chicken.cooked", "info": "Cooked Chicken."},
        {"id": "-1658459025", "item": "chicken.raw", "info": "Raw Chicken Breast"},
        {"id": "-726947205", "item": "chicken.spoiled", "info": "Spoiled Chicken"},
        {"id": "-341443994", "item": "chocholate", "info": "Chocolate Bar"},
        {"id": "94756378", "item": "cloth", "info": "Cloth"},
        {"id": "3059095", "item": "coal", "info": "Coal :("},
        {"id": "-2128719593", "item": "coffeecan.helmet", "info": "Coffee Can Helmet"},
        {"id": "3059624", "item": "corn", "info": "Corn"},
        {"id": "2123300234", "item": "crossbow", "info": "Crossbow"},
        {"id": "1983936587", "item": "crude.oil", "info": "Crude Oil"},
        {"id": "1257201758", "item": "cupboard.tool", "info": "Tool Cupboard"},
        {"id": "-1178289187", "item": "deer.skull.mask", "info": "Bone Helmet"},
        {"id": "-1598790097", "item": "door.double.hinged.metal", "info": "Sheet Metal Double Door"},
        {"id": "-933236257", "item": "door.double.hinged.toptier", "info": "Armored Double Door"},
        {"id": "-1575287163", "item": "door.double.hinged.wood", "info": "Wood Double Door"},
        {"id": "-2104481870", "item": "door.hinged.metal", "info": "Sheet Metal Door"},
        {"id": "-1571725662", "item": "door.hinged.toptier", "info": "Armored Door"},
        {"id": "1456441506", "item": "door.hinged.wood", "info": "Wooden Door"},
        {"id": "1200628767", "item": "door.key", "info": "Door Key"},
        {"id": "1891056868", "item": "ducttape", "info": "Duct Tape"},
        {"id": "1295154089", "item": "explosive.satchel", "info": "Satchel Charge"},
        {"id": "498591726", "item": "explosive.timed", "info": "Timed Explosive Charge"},
        {"id": "1755466030", "item": "explosives", "info": "Explosives"},
        {"id": "-1034048911", "item": "fat.animal", "info": "Animal Fat"},
        {"id": "-2078972355", "item": "fish.cooked", "info": "Cooked Fish"},
        {"id": "88869913", "item": "fish.minnows", "info": "Minnows"},
        {"id": "-533484654", "item": "fish.raw", "info": "Raw Fish"},
        {"id": "865679437", "item": "fish.troutsmall", "info": "Small Trout"},
        {"id": "1369769822", "item": "fishtrap.small", "info": "Survival Fish Trap"},
        {"id": "1045869440", "item": "flamethrower", "info": "Flame Thrower"},
        {"id": "97513422", "item": "flare", "info": "Flare"},
        {"id": "-1722829188", "item": "floor.grill", "info": "A floor grill"},
        {"id": "1849912854", "item": "floor.ladder.hatch", "info": "Ladder Hatch"},
        {"id": "-217113639", "item": "fun.guitar", "info": "Acoustic Guitar"},
        {"id": "-505639592", "item": "furnace", "info": "Furnace"},
        {"id": "1598149413", "item": "furnace.large", "info": "Large Furnace"},
        {"id": "-1779401418", "item": "gates.external.high.stone", "info": "High External Stone Gate"},
        {"id": "-57285700", "item": "gates.external.high.wood", "info": "High External Wooden Gate"},
        {"id": "98228420", "item": "gears", "info": "Gears"},
        {"id": "277631078", "item": "generator.wind.scrap", "info": "Wind Turbine"},
        {"id": "3175989", "item": "glue", "info": "Glue"},
        {"id": "718197703", "item": "granolabar", "info": "Granola Bar"},
        {"id": "384204160", "item": "grenade.beancan", "info": "Beancan Grenade"},
        {"id": "-1308622549", "item": "grenade.f1", "info": "F1 Grenade"},
        {"id": "-1580059655", "item": "gunpowder", "info": "Gun Powder"},
        {"id": "-1224598842", "item": "hammer", "info": "Hammer"},
        {"id": "-1976561211", "item": "hammer.salvaged", "info": "Salvaged Hammer"},
        {"id": "-1406876421", "item": "hat.beenie", "info": "Beenie Hat"},
        {"id": "-1397343301", "item": "hat.boonie", "info": "Boonie Hat"},
        {"id": "-1381682752", "item": "hat.candle", "info": "Candle Hat"},
        {"id": "696727039", "item": "hat.cap", "info": "Baseball Cap"},
        {"id": "-450738836", "item": "hat.miner", "info": "Miners Hat"},
        {"id": "124310981", "item": "hat.wolf", "info": "Wolf Headdress"},
        {"id": "698310895", "item": "hatchet", "info": "Hatchet"},
        {"id": "-1078788046", "item": "hazmat.boots", "info": "Hazmat Boots"},
        {"id": "1057685737", "item": "hazmat.gloves", "info": "Hazmat Gloves"},
        {"id": "1079752220", "item": "hazmat.helmet", "info": "Hazmat Helmet"},
        {"id": "1133046397", "item": "hazmat.jacket", "info": "Hazmat Jacket"},
        {"id": "-1066276787", "item": "hazmat.pants", "info": "Hazmat Pants"},
        {"id": "523855532", "item": "hazmatsuit", "info": "Hazmat Suit"},
        {"id": "-1211618504", "item": "hoodie", "info": "Hoodie"},
        {"id": "2133577942", "item": "hq.metal.ore", "info": "High Quality Metal Ore"},
        {"id": "-1014825244", "item": "humanmeat.burned", "info": "Burned Human Meat"},
        {"id": "-991829475", "item": "humanmeat.cooked", "info": "Cooked Human Meat"},
        {"id": "-642008142", "item": "humanmeat.raw", "info": "Raw Human Meat"},
        {"id": "661790782", "item": "humanmeat.spoiled", "info": "Spoiled Human Meat"},
        {"id": "-1440143841", "item": "icepick.salvaged", "info": "Salvaged Icepick"},
        {"id": "-1167640370", "item": "jacket", "info": "Jacket"},
        {"id": "-1616887133", "item": "jacket.snow", "info": "Snow Jacket - Red"},
        {"id": "-1284735799", "item": "jackolantern.angry", "info": "Jack O Lantern Angry"},
        {"id": "-1278649848", "item": "jackolantern.happy", "info": "Jack O Lantern Happy"},
        {"id": "776005741", "item": "knife.bone", "info": "Bone Knife"},
        {"id": "108061910", "item": "ladder.wooden.wall", "info": "Wooden Ladder"},
        {"id": "-51678842", "item": "lantern", "info": "Lantern"},
        {"id": "-789202811", "item": "largemedkit", "info": "Large Medkit"},
        {"id": "50834473", "item": "leather", "info": "Leather"},
        {"id": "193190034", "item": "lmg.m249", "info": "M249"},
        {"id": "-975723312", "item": "lock.code", "info": "Code Lock"},
        {"id": "1908195100", "item": "lock.key", "info": "Lock"},
        {"id": "146685185", "item": "longsword", "info": "Longsword"},
        {"id": "28178745", "item": "lowgradefuel", "info": "Low Grade Fuel"},
        {"id": "3343606", "item": "mace", "info": "Mace"},
        {"id": "825308669", "item": "machete", "info": "Machete"},
        {"id": "107868", "item": "map", "info": "Paper Map"},
        {"id": "997973965", "item": "mask.balaclava", "info": "Improvised Balaclava"},
        {"id": "-46188931", "item": "mask.bandana", "info": "Bandana Mask"},
        {"id": "-253819519", "item": "meat.boar", "info": "Pork"},
        {"id": "968732481", "item": "meat.pork.burned", "info": "Burned Pork"},
        {"id": "991728250", "item": "meat.pork.cooked", "info": "Cooked Pork"},
        {"id": "-46848560", "item": "metal.facemask", "info": "Metal Facemask"},
        {"id": "688032252", "item": "metal.fragments", "info": "Metal Fragments"},
        {"id": "-1059362949", "item": "metal.ore", "info": "Metal Ore"},
        {"id": "1265861812", "item": "metal.plate.torso", "info": "Metal Chest Plate"},
        {"id": "374890416", "item": "metal.refined", "info": "High Quality Metal"},
        {"id": "1567404401", "item": "metalblade", "info": "Metal Blade"},
        {"id": "-1057402571", "item": "metalpipe", "info": "Metal Pipe"},
        {"id": "1835797460", "item": "metalspring", "info": "Metal Spring"},
        {"id": "-758925787", "item": "mining.pumpjack", "info": "Pump Jack"},
        {"id": "-1411620422", "item": "mining.quarry", "info": "Mining Quarry"},
        {"id": "843418712", "item": "mushroom", "info": "Mushroom"},
        {"id": "3387378", "item": "note", "info": "Note"},
        {"id": "106433500", "item": "pants", "info": "Pants"},
        {"id": "-459156023", "item": "pants.shorts", "info": "Shorts"},
        {"id": "106434956", "item": "paper", "info": "Paper"},
        {"id": "-578028723", "item": "pickaxe", "info": "Pick Axe"},
        {"id": "-1379225193", "item": "pistol.eoka", "info": "Eoka Pistol"},
        {"id": "371156815", "item": "pistol.m92", "info": "M92 Pistol"},
        {"id": "-930579334", "item": "pistol.revolver", "info": "Revolver"},
        {"id": "548699316", "item": "pistol.semiauto", "info": "Semi-Automatic Pistol"},
        {"id": "142147109", "item": "planter.large", "info": "Large Planter Box"},
        {"id": "148953073", "item": "planter.small", "info": "Small Planter Box"},
        {"id": "640562379", "item": "pookie.bear", "info": "Pookie Bear"},
        {"id": "1974032895", "item": "propanetank", "info": "Empty Propane Tank"},
        {"id": "-225085592", "item": "pumpkin", "info": "Pumpkin"},
        {"id": "1987447227", "item": "research.table", "info": "Research Table"},
        {"id": "540154065", "item": "researchpaper", "info": "Research Paper"},
        {"id": "-1461508848", "item": "rifle.ak", "info": "Assault Rifle"},
        {"id": "-55660037", "item": "rifle.bolt", "info": "Bolt Action Rifle"},
        {"id": "-1716193401", "item": "rifle.lr300", "info": "LR-300 Assault Rifle"},
        {"id": "-1745053053", "item": "rifle.semiauto", "info": "Semi-Automatic Rifle"},
        {"id": "1939428458", "item": "riflebody", "info": "Rifle Body"},
        {"id": "340009023", "item": "riot.helmet", "info": "Riot Helmet"},
        {"id": "-288010497", "item": "roadsign.jacket", "info": "Road Sign Jacket"},
        {"id": "-1595790889", "item": "roadsign.kilt", "info": "Road Sign Kilt"},
        {"id": "-847065290", "item": "roadsigns", "info": "Road Signs"},
        {"id": "3506021", "item": "rock", "info": "Rock"},
        {"id": "649603450", "item": "rocket.launcher", "info": "Rocket Launcher"},
        {"id": "3506418", "item": "rope", "info": "Rope"},
        {"id": "-1775234707", "item": "salvaged.cleaver", "info": "Salvaged Cleaver"},
        {"id": "-388967316", "item": "salvaged.sword", "info": "Salvaged Sword"},
        {"id": "2007564590", "item": "santahat", "info": "Santa Hat"},
        {"id": "583366917", "item": "seed.corn", "info": "Corn Seed"},
        {"id": "583506109", "item": "seed.hemp", "info": "Hemp Seed"},
        {"id": "466113771", "item": "seed.pumpkin", "info": "Pumpkin Seed"},
        {"id": "1223860752", "item": "semibody", "info": "Semi Automatic Body"},
        {"id": "-419069863", "item": "sewingkit", "info": "Sewing Kit"},
        {"id": "-1617374968", "item": "sheetmetal", "info": "Sheet Metal"},
        {"id": "2057749608", "item": "shelves", "info": "Salvaged Shelves"},
        {"id": "24576628", "item": "shirt.collared", "info": "Shirt"},
        {"id": "-1659202509", "item": "shirt.tanktop", "info": "Tank Top"},
        {"id": "2107229499", "item": "shoes.boots", "info": "Boots"},
        {"id": "191795897", "item": "shotgun.double", "info": "Double Barrel Shotgun"},
        {"id": "-1009492144", "item": "shotgun.pump", "info": "Pump Shotgun"},
        {"id": "2077983581", "item": "shotgun.waterpipe", "info": "Waterpipe Shotgun"},
        {"id": "-529054135", "item": "shutter.metal.embrasure.a", "info": "Metal horizontal embrasure"},
        {"id": "-529054134", "item": "shutter.metal.embrasure.b", "info": "Metal Vertical embrasure"},
        {"id": "486166145", "item": "shutter.wood.a", "info": "Wood Shutters"},
        {"id": "1498516223", "item": "sign.hanging", "info": "Two Sided Hanging Sign"},
        {"id": "1628490888", "item": "sign.hanging.banner.large", "info": "Large Banner Hanging"},
        {"id": "-632459882", "item": "sign.hanging.ornate", "info": "Two Sided Ornate Hanging Sign"},
        {"id": "-626812403", "item": "sign.pictureframe.landscape", "info": "Landscape Picture Frame"},
        {"id": "385802761", "item": "sign.pictureframe.portrait", "info": "Portrait Picture Frame"},
        {"id": "2117976603", "item": "sign.pictureframe.tall", "info": "Tall Picture Frame"},
        {"id": "1338515426", "item": "sign.pictureframe.xl", "info": "XL Picture Frame"},
        {"id": "-1455694274", "item": "sign.pictureframe.xxl", "info": "XXL Picture Frame"},
        {"id": "1579245182", "item": "sign.pole.banner.large", "info": "Large Banner on pole"},
        {"id": "-587434450", "item": "sign.post.double", "info": "Double Sign Post"},
        {"id": "-163742043", "item": "sign.post.single", "info": "Single Sign Post"},
        {"id": "-1224714193", "item": "sign.post.town", "info": "One Sided Town Sign Post"},
        {"id": "644359987", "item": "sign.post.town.roof", "info": "Two Sided Town Sign Post"},
        {"id": "-1962514734", "item": "sign.wooden.huge", "info": "Huge Wooden Sign"},
        {"id": "-705305612", "item": "sign.wooden.large", "info": "Large Wooden Sign"},
        {"id": "-357728804", "item": "sign.wooden.medium", "info": "Wooden Sign"},
        {"id": "-698499648", "item": "sign.wooden.small", "info": "Small Wooden Sign"},
        {"id": "960793436", "item": "skull.human", "info": "Human Skull"},
        {"id": "1001265731", "item": "skull.wolf", "info": "Wolf Skull"},
        {"id": "1253290621", "item": "sleepingbag", "info": "Sleeping Bag"},
        {"id": "470729623", "item": "small.oil.refinery", "info": "Small Oil Refinery"},
        {"id": "927253046", "item": "smallwaterbottle", "info": "Small Water Bottle"},
        {"id": "109552593", "item": "smg.2", "info": "Custom SMG"},
        {"id": "-2094080303", "item": "smg.mp5", "info": "MP5A4"},
        {"id": "456448245", "item": "smg.thompson", "info": "Thompson"},
        {"id": "-2092529553", "item": "smgbody", "info": "SMG Body"},
        {"id": "-2118132208", "item": "spear.stone", "info": "Stone Spear"},
        {"id": "-1127699509", "item": "spear.wooden", "info": "Wooden Spear"},
        {"id": "-685265909", "item": "spikes.floor", "info": "Wooden Floor Spikes"},
        {"id": "1051155022", "item": "stash.small", "info": "Small Stash"},
        {"id": "-892259869", "item": "sticks", "info": "Sticks"},
        {"id": "-1623330855", "item": "stocking.large", "info": "SUPER Stocking"},
        {"id": "-1616524891", "item": "stocking.small", "info": "Small Stocking"},
        {"id": "789892804", "item": "stone.pickaxe", "info": "Stone Pick Axe"},
        {"id": "-1289478934", "item": "stonehatchet", "info": "Stone Hatchet"},
        {"id": "-892070738", "item": "stones", "info": "Stones"},
        {"id": "-891243783", "item": "sulfur", "info": "Sulfur"},
        {"id": "889398893", "item": "sulfur.ore", "info": "Sulfur Ore"},
        {"id": "-1625468793", "item": "supply.signal", "info": "Supply Signal"},
        {"id": "1293049486", "item": "surveycharge", "info": "Survey Charge"},
        {"id": "586484018", "item": "syringe.medical", "info": "Medical Syringe"},
        {"id": "2069925558", "item": "target.reactive", "info": "Reactive Target"},
        {"id": "1490499512", "item": "targeting.computer", "info": "Targeting Computer"},
        {"id": "3552619", "item": "tarp", "info": "Tarp"},
        {"id": "1471284746", "item": "techparts", "info": "Tech Trash"},
        {"id": "-1342405573", "item": "tool.camera", "info": "Camera"},
        {"id": "110547964", "item": "torch", "info": "Torch"},
        {"id": "1046072789", "item": "trap.bear", "info": "Snap Trap"},
        {"id": "255101535", "item": "trap.landmine", "info": "Land Mine"},
        {"id": "-864578046", "item": "tshirt", "info": "T-Shirt"},
        {"id": "1660607208", "item": "tshirt.long", "info": "Longsleeve T-Shirt"},
        {"id": "-1792066367", "item": "wall.external.high", "info": "High External Wooden Wall"},
        {"id": "-496055048", "item": "wall.external.high.stone", "info": "High External Stone Wall"},
        {"id": "-427925529", "item": "wall.frame.cell", "info": "Prison Cell Wall"},
        {"id": "562888306", "item": "wall.frame.cell.gate", "info": "Prison Cell Gate"},
        {"id": "-378017204", "item": "wall.frame.fence", "info": "Chainlink Fence"},
        {"id": "995306285", "item": "wall.frame.fence.gate", "info": "Chainlink Fence Gate"},
        {"id": "1175970190", "item": "wall.frame.shopfront", "info": "Shop Front"},
        {"id": "-1021702157", "item": "wall.window.bars.metal", "info": "Metal Window Bars"},
        {"id": "-402507101", "item": "wall.window.bars.toptier", "info": "Reinforced Window Bars"},
        {"id": "-1556671423", "item": "wall.window.bars.wood", "info": "Wooden Window Bars"},
        {"id": "112903447", "item": "water", "info": "Water"},
        {"id": "-1628526499", "item": "water.barrel", "info": "Water Barrel"},
        {"id": "1817873886", "item": "water.catcher.large", "info": "Large Water Catcher"},
        {"id": "1824679850", "item": "water.catcher.small", "info": "Small Water Catcher"},
        {"id": "1840561315", "item": "water.purifier", "info": "Water Purifier"},
        {"id": "1916127949", "item": "water.salt", "info": "Salt Water"},
        {"id": "547302405", "item": "waterjug", "info": "Water Jug"},
        {"id": "1229879204", "item": "weapon.mod.flashlight", "info": "Weapon Flashlight"},
        {"id": "-465236267", "item": "weapon.mod.holosight", "info": "Holosight"},
        {"id": "516382256", "item": "weapon.mod.lasersight", "info": "Weapon Lasersight"},
        {"id": "-1569356508", "item": "weapon.mod.muzzleboost", "info": "Muzzle Boost"},
        {"id": "-1569280852", "item": "weapon.mod.muzzlebrake", "info": "Muzzle Brake"},
        {"id": "1213686767", "item": "weapon.mod.silencer", "info": "Silencer"},
        {"id": "-141135377", "item": "weapon.mod.small.scope", "info": "4x Zoom Scope"},
        {"id": "-1714986849", "item": "wolfmeat.burned", "info": "Burned Wolf Meat"},
        {"id": "-1691991080", "item": "wolfmeat.cooked", "info": "Cooked Wolf Meat"},
        {"id": "179448791", "item": "wolfmeat.raw", "info": "Raw Wolf Meat"},
        {"id": "431617507", "item": "wolfmeat.spoiled", "info": "Spoiled Wolf Meat"},
        {"id": "3655341", "item": "wood", "info": "Wood"},
        {"id": "1554697726", "item": "wood.armor.jacket", "info": "Wood Chestplate"},
        {"id": "-1883959124", "item": "wood.armor.pants", "info": "Wood Armor Pants"},
        {"id": "-1732316031", "item": "xmas.present.large", "info": "Large Present"},
        {"id": "-2130280721", "item": "xmas.present.medium", "info": "Medium Present"},
        {"id": "-1725510067", "item": "xmas.present.small", "info": "Small Present"},
    ];

    var updatePlayerlist = function () {
        widget.backend("serverstatus", null, function (serverstatus) {
            var tbody = playerlist.find("tbody");
            tbody.html('');
            icons.find(".host .text").html(serverstatus.server.hostname);
            icons.find(".players .text").html(serverstatus.server.players);
            icons.find(".version .text").html("Version " + serverstatus.server.version);
            icons.find(".map .text").html(serverstatus.server.map);
            var tr = null;
            for (var playerIndex in serverstatus.players.online) {
                if (serverstatus.players.online.hasOwnProperty(playerIndex)) {
                    var playerRow = serverstatus.players.online[playerIndex];
                    tr = $('<tr>');
                    var vacstatus = [];
                    for (var vacIndex in playerRow.vacstatus) {
                        if (playerRow.vacstatus.hasOwnProperty(vacIndex)) {
                            var vacRow = playerRow.vacstatus[vacIndex];
                            vacstatus.push(vacIndex + ": " + vacRow);
                        }
                    }
                    var icon = playerRow.vacstatus.status == "ok" ? "ok" : "remove";
                    tr.attr("data-id", playerRow.steamid);
                    tr.append($('<td class="id">').text(playerRow.steamid));
                    tr.append($('<td class="name">').text(playerRow.username));
                    tr.append($('<td class="time">').text(playerRow.time));
                    tr.append($('<td class="ip">').text(playerRow.ip));
                    tr.append($('<td class="ping">').text(playerRow.ping));
                    tr.append($('<td class="vacstatus">')
                        .html('<span class="glyphicon glyphicon-' + icon + '-circle"></span>')
                        .attr("data-tooltip", vacstatus.join("<br/>"))
                    );
                    tr.append($('<td class="actions">').html('<select>' +
                        '<option value="">Action</option>' +
                        '<option value="kick">Kick</option>' +
                        '<option value="ban">Ban</option>' +
                        '<option value="give">Give</option>' +
                        '</select>'));
                    tbody.append(tr);
                }
            }
            playerlist.find(".count").text("(" + serverstatus.players.onlineCount + ")");
            tbody.find("td").wrapInner('<div>');
            tbody.find("select").selectpicker();

            tbody = banlist.find("tbody");
            tbody.html('');
            for (var banIndex in serverstatus.players.banned) {
                if (serverstatus.players.banned.hasOwnProperty(banIndex)) {
                    var ban = serverstatus.players.banned[banIndex];
                    tr = $('<tr>');
                    tr.attr("data-id", ban.steamid);
                    tr.append($('<td class="id">').text(ban.steamid));
                    tr.append($('<td class="name">').text(ban.username));
                    tr.append($('<td class="notes">').text(ban.notes));
                    tr.append($('<td class="actions">').html('<select>' +
                        '<option value="">Action</option>' +
                        '<option value="unban">Unban</option>' +
                        '</select>'));
                    tbody.append(tr);
                }
            }

            banlist.find(".count").text("(" + serverstatus.players.bannedCount + ")");
            tbody.find("select").selectpicker();
        });
    };

    /**
     * On initialization
     */
    widget.onInit = function () {
        widget.content.on("change", "tbody select", function () {
            var v = this.value;
            if (v.length) {
                $(this).selectpicker("val", "");
                var id = $(this).closest("tr").attr("data-id");
                if (v == "unban") {
                    widget.cmd(v + " " + id, function () {
                        updatePlayerlist();
                    });
                } else if (v == "give") {
                    var html = $('<div class="form-group has-feedback input-group form-inline">' +
                        '<input type="number" class="form-control" step="1" min="0">' +
                        '<select class="selectpicker" data-live-search="1">' +
                        '</select>' +
                        '</div>');
                    var input = html.find("input");
                    var select = html.find("select");
                    for (var i = 0; i < itemlist.length; i++) {
                        var item = itemlist[i];
                        select.append($('<option>').attr("value", item.item).text(item.item + " | " + item.info));
                    }
                    Modal.confirm(html, function (success) {
                        if (success) {
                            // todo give
                        }
                    });
                } else {
                    Modal.prompt(widget.t("kickban.reason"), "", function (reason) {
                        if (reason !== false) {
                            widget.cmd(v + " " + id + " \"" + reason + "\"", function () {
                                updatePlayerlist();
                            });
                        }
                    });
                }
            }
        });
        widget.content.append(icons);
        widget.content.append(playerlist);
        widget.content.append(banlist);
        collapsable(widget.content);
        updatePlayerlist();
    };

    // update playerlist when backend updates are done
    widget.onBackendUpdate = function () {
        updatePlayerlist();
    };
});
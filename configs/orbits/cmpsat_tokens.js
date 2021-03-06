
(function() {

function selectStageModel(name)
{
    console.log("selectStageModel "+name);
    game.program.selectStageModel(name);
}

var numToks = 0;
function getToken(name, tokenPos, spec) {
    parent = 'tokens';
    var modelOpts = spec.modelOpts || {};
    var scale = modelOpts.scale || 1.0;
    var modelPos = modelOpts.position || [0,0,0];
    var rot = modelOpts.rot;
    numToks++;
    var token = {
        type: 'Group', name: "tokenGroup"+numToks, parent, position: tokenPos,
        scale: 0.7,
         children: [
         {   type: 'Model', name: name,
             path: spec.modelUrl,
             //position: [.75, 0.55, 1.35],
             position: modelPos,
             rot: rot,
             scale: scale,
             //onMuseEvent: {'click': () => selectStageModel("dancer") }
             onMuseEvent: {'click': spec.onClick },
             castShadow: true,
        },
         {  type: 'Model',
            path: 'assets/models/pedestal/model.dae',
            position: [0, 0, 0],
            rot: [0, 0, 0],
            scale: 0.02,
            castShadow: true,
        }
    ]};
    return token;
}

function getTokens(angle, tokSpecs)
{
    game.getGroup('tokens', {parent: 'station' });
    var angle = 180;
    var spacing = 20;
    angle = angle - (tokSpecs.length-1) * (spacing)/2;
    var tokens = [];
    tokSpecs.forEach(spec => {
        var name = spec.name;
        var pos = Util.radialPosition(angle, 2.2, -.1);
        tokens.push(getToken(name, pos, spec ));
        angle += spacing;
    });
    return tokens;
}

var SAT_VIEWER = {  type: 'VirtualEarth', name: 'satViewer',
   radius: 1.25, position: [0,1.9,0],
   satTracks: { dataSet: 'stdb/all_stdb.json' },
   atmosphere: {name: 'SatAtmos', opacity: .2}
};

function toggleSatellites()
{
    //
    var sv = MUSE.game.getNode("satViewer");
    if (!sv) {
        game.loadSpecs(SAT_VIEWER);
        game.program.registerStageModel("satViewer");
    }
    selectStageModel("satViewer");
}

var tokSpecs = [
    {name: "dancerTok",
     modelUrl: "assets/models/tokens/dancer/model.dae",
     modelOpts: {position: [.75, 0.55, 1.35], scale: 0.010},
     onClick: () => selectStageModel("dancer")
    },
    {name: "earthTok",
     modelUrl: "assets/models/tokens/globe/model.dae",
     modelOpts: {position: [0.16, 0.55, -.16], scale: 0.003},
     onClick: () => selectStageModel("vEarth")
    },
    {name: "cmpTok",
     modelUrl: "assets/models/tokens/DataChart/DataChartToken.dae",
     modelOpts: {position: [.75, 0.55, 1.35], scale: 1.0},
     onClick: () => selectStageModel("cmp")
    },
    {name: "satTok",
     modelUrl: "assets/models/satellites/ComSat2/model.dae",
     modelOpts: {position: [0.2,.7,-0.2], rot: [0,0,-90], scale: 0.004},
     onClick: () => toggleSatellites()
    }
]

function toggleVisiblity(name) {
    var m = game.models[name];
    m.visible = !m.visible;
}

function playVideoOnSurface(name, url) {
    url = url || "assets/video/ErikAndBill_4Kx2K.mp4";
    var n = game.getNode(name);
    n.updateSource(url);
    var m = game.models[name];
    m.visible = true;
}

DUMMY_TOKEN =
{   type: 'Model', name: "coverControl",
    path: "assets/models/pedestal/model.dae",
    //position: [.75, 0.55, 1.35],
    position: Util.radialPosition(0, 2.2, -.1),
    //rot: [2, 0, 1],
    scale: .02,
    //onMuseEvent: {'click': () => selectStageModel("dancer") }
    onMuseEvent: {'click': () => toggleVisiblity("innerCover"),
                  'doubleClick': () => playVideoOnSurface("innerCover") }
},

TOKENS = getTokens(180, tokSpecs);
TOKENS.push(DUMMY_TOKEN);

/*
TOKENS = [
    {type: 'Group', name: "tokenGroup1", position: [0.2, -.1, 2.6],
     children: [
         {   type: 'Model', name: 'dancerToken',
             path: 'assets/models/tokens/dancer/model.dae',
             position: [.75, 0.55, 1.35],
             rot: [0, 0, 0],
             scale: 0.010,
             onMuseEvent: {'click': () => selectStageModel("dancer") }
         },
         {   type: 'Model',
         path: 'assets/models/pedestal/model.dae',
         position: [0, 0, 0],
         rot: [0, 0, 0],
         scale: 0.02,
     }
 ]}
];
*/

MUSE.returnValue(TOKENS);

})();

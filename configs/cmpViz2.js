
VEARTH = [
    {  type: 'VirtualEarth', name: 'vEarth',
       radius: 1.25, position: [0,0,0],
       satellites: 0, satTracks: 0,
       dataViz: 1,
       //videoTexture: 'videos/GlobalWeather2013.mp4',
       atmosphere: {'name': 'CO2Viz', opacity: .1}
    }
];

var SPECS = [
    {  type: 'JQControls' },
    {  type: 'Group', name: 'station'  },
    {  type: 'PointLight', name: 'sun',    color: 0xffffff, position: [-1000, 0, 0], distance: 5000},
    {  type: 'PointLight', name: 'sun',    color: 0xffffff, position: [3000, 0, 0], distance: 5000},
    {  type: 'CMPDataViz', name: 'cmp',
        //position: [0, 0, 0],
        position: [-10, 0, 0],
       rotation: [0, 0, 0], scale: [1.5, 1, 1.5],
       visible: true
    },
    {  type: 'Stars' },
    VEARTH
];

function updateFields(game, t)
{
    var earth = game.controllers.vEarth;
    var atm = earth.atmosphere;
    var startYear = 1800;
    var endYear = 2300;

    var year = GSS.timeToYear(t);
    var data = game.controllers.cmp.loader.data;
    if (data)
        data = data.rcp8p5;
    window.DATA = data;
    if (data && year) {
        yearf = Math.floor(year);
        i = Math.floor(yearf - 1850);
        T = data.temperature[i];
        co2 = data.co2[i];
        balance = data.balance[i];
        dyear = data.year[i];
        window.CO2 = co2;
        game.state.set("temp", sprintf("T: %.1f", T));
        game.state.set("co2", sprintf("CO2: %6.1f", co2));
        game.state.set("balance", sprintf("balance: %6.1f", balance));
        game.state.set("dyear", "dyear: "+dyear)
        var f = 0;
        if (year) {
            f = (year - 1800)/(2300 - 1800);
        }
        atm.setOpacity(0.9*f);
        var h = 0.6 + .4*f;
        atm.setHue(h);
    }
    else {
        game.state.set("temp", "");
        game.state.set("co2", "");
        game.state.set("balance", "");
        game.state.set("dyear", "");
    }
}

function onStart(game)
{
    //game.program.formatTime = t =>game.Util.toDate(t);
    game.program.formatTime = t => {
        updateFields(game, t);
        return sprintf("%8.2f", t);
    }
}

function setEarthVideo(game, url)
{
    var vEarth = game.controllers.vEarth;
    vEarth.setSurfaceVideo(url)
}


CONFIG = {
    'onStart': onStart,
    'program': {
       //duration: 400*365*24*60*60,
       //startTime: '1/1/1800',
       //playTime: 'now'
       //startTime: '6/1/2005 10:30'
       duration: 32*60,
       gss: "https://spreadsheets.google.com/feeds/list/1Vj4wbW0-VlVV4sG4MzqvDvhc-V7rTNI7ZbfNZKEFU1c/default/public/values?alt=json",
       channels: ['time', 'year', 'temp', 'co2', 'balance', 'dyear', 'spacer', 'narrative'],
       scripts: {
           'Show Earthquakes': (game) => setEarthVideo(game, "videos/earthquakes.mp4"),
           'Show 2013 Weather': (game) => setEarthVideo(game, "videos/GlobalWeather2013.mp4"),
           //'Show surface temp 1850-2300': (game) => setEarthVideo(game, "videos/tas_Amon_CCSM4_1850_2300.mp4"),
           'Show surface temp 1850-2300': (game) => setEarthVideo(game, "videos/tas_1850_2300.mp4"),
           'Climate Model Clouds': (game) => setEarthVideo(game, "videos/CloudTruth.mp4"),
           'CO2 flow for 2006': (game) => setEarthVideo(game, "videos/2006_co2_flow_1024x512.mp4"),
       }
    },
    'cameraControls': 'Orbit',
    'specs': SPECS
};

MUSE.returnValue(CONFIG);

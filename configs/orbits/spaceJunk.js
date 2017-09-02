
CONFIG = {
    'cameraControls': 'Orbit',
    'program': {
       //duration: 100000,
       duration: 65*365*24*60*60,
       //duration: 100*3600,
       //startTime: 1504131722.726 - 100*24*3600
       //startTime: 1504131722.726
       startTime: '10/4/1957',
       playTime: 'now'
       //startTime: '6/1/2005 10:30'
    },
    'specs': [
        {  type: 'JQControls' },
        {  type: 'Stars' },
        {  type: 'PointLight', name: 'sun', position: [-1000, 0, 0], distance: 5000},
        {  type: 'PointLight', name: 'sun', position: [3000, 1000, 0], distance: 5000},
        {  type: 'PointLight', name: 'sun', position: [3000, -1000, 0], distance: 5000},
        {  type: 'VirtualEarth', name: 'vEarth',
           radius: 1.25, rot: [0,0,0],
           //satTracks: {dataSet: 'historicalSats.json'},
           satTracks: {
               //dataSet: 'allSats.json',
               dataSet: 'tle-9-1-2017.json',
               //models: [
                //   'models/satellites/ComSat/model.dae',
                //   'models/satellites/ComSat2/model.dae'],
               filterHack: 1
           },
           //satTracks: 1,
           dataViz: 0,
           atmosphere: {'name': 'CO2Viz', opacity: .1}
        }
    ]
};
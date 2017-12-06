
var CONFIG = {
    'cameraControls': 'Orbit',
    specs: [
        {  type: 'Model', name: 'xxx',
           parent: 'station',
           path: 'assets/models/imaginarium-ship-dae/refined-ship-no-stripe.dae',
           position: [0.2, 0, 1.6],
           scale: .006
        },
        {  type: 'PointLight', name: 'light1',
           position: [-25, 20, 10],
           color: 0xffffff, intensity: 0.6, distance: 2000
        },
        {  type: 'PointLight', name: 'light2',
           position: [25, 20, 10],
           color: 0xffffff, intensity: 0.6, distance: 2000
        },
        {  type: 'PointLight', name: 'light3',
           position: [-25, 20, -20],
           color: 0xffffff, intensity: 0.6, distance: 2000
       },
        {  type: 'PointLight', name: 'light4',
           position: [25, 20, -20],
           color: 0xffffff, intensity: 0.6, distance: 2000
        }
    ]
}

MUSE.returnValue(CONFIG);

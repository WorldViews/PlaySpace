
(function() {
// For now this just sets the video.  It should set the program
// in a way that corresponds to that video.
function setProgram(name, vidURL, channel) {
    console.log("setProgram: "+name+" "+vidURL+" "+channel);
    channel = channel || "mainScreen";
    if (vidURL) {
        console.log("setting state "+channel+".url: "+vidURL);
        game.state.set(channel+".url", vidURL)
    }
}

function selectStageModel(name)
{
    console.log("selectStageModel "+name);
    var model = game.models[name];
    model.visible = !model.visible;
}

// Layout posters radially, centered at a given angle theta.
// note that poster sizes and poster spaces are in angles (degrees)
//
function getPosters(specs, theta, posterSize)
{
    posterSize = posterSize || 8;
    var posterSpacing = 4;
    var phiStart = 88 - posterSize;
    var thetaStart = theta - specs.length*(posterSize+posterSpacing)/2;
    var posters = specs.map(spec => {
        var poster = { type: 'Screen', name: spec.name,
            path: spec.logo, radius: 7.8,
            phiStart, thetaStart,
            phiLength: posterSize, thetaLength: posterSize,
            onMuseEvent: {'click': () => setProgram(spec.name, spec.video)}
        };
        thetaStart += (posterSize+posterSpacing);
        return poster;
    });
    console.log("POSTERS:", posters);
    return posters;
}

var POSTER_SPECS = [
    {name: "EarthClock",
     logo: "assets/images/CMPPosters/TimeToChange.jpg",
     video: "assets/video/Climate-Music-V3-Distortion_HD_540.webm"
    },
    {name: "CoolEffect",
     logo: "assets/images/PartnerLogos/CoolEffect.png",
     video: "assets/video/ExposingCarbonPollutionCoolEffect.webm"
    },
    {name: "SustainableSV",
     logo: "assets/images/PartnerLogos/SustainableSV.png",
     video: "assets/video/SustainableSiliconValley_BuildingSustainableRegion.webm"
    },
    {name: "OneDome",
     logo: "assets/images/LinkLogos/OneDome.png",
     video: "assets/video/OneDomeTrailer.webm"
    },
    {name: "KinetechArts",
     logo: "assets/images/PartnerLogos/KinetechArtsLogo.jpg",
     video: "assets/video/KinetechArts_ABriefHistory.webm"
    },
    {name: "ClimateMusicProject",
     logo: "assets/images/PartnerLogos/ClimateMusicProject.jpg",
     video: "assets/video/ClimateMusicProjectpromo.webm"
    },
    {name: "GlobalFootprintNetwork",
     logo: "assets/images/PartnerLogos/GlobalFootprintNetwork.jpg",
     video: "assets/video/NationalFootprintAccounts.webm"
     //video: "assets/video/EcologicalFootprintOfCountries.webm"
    },
    {name: "FxPal",
     logo: "assets/images/LinkLogos/FxPal.png",
     //video: "assets/video/FxPal_20Years.webm"
     video: "assets/video/FxPal_Creativity.webm"
     //video: "assets/video/FxPal_Future_of_Work.webm"
    },
];

FRONT_POSTERS = getPosters(POSTER_SPECS, 180);
REAR_POSTERS = getPosters(POSTER_SPECS, 0, 12);

POSTERS = [FRONT_POSTERS, REAR_POSTERS];

MUSE.returnValue(POSTERS);

})();
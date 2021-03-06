
import MIDI from 'midi.js';

var PLAYER = {};
PLAYER.ticksPerSec = 1000;
PLAYER.ticksPerBeat = 1200;
PLAYER.beatsPerMin = 100;
//PLAYER.delay0 = 1;
PLAYER.delay0 = 0.0;
PLAYER.isPlaying = false;
PLAYER.distPerSec = 0.2;
PLAYER.graphics = null;
PLAYER.object3D = null;
PLAYER.graphicsScale = null;
PLAYER.muted = {};
PLAYER.midiObj = null;
PLAYER.loadedInstruments = {};
PLAYER.lastEventPlayTime = 0;
PLAYER.lastEventClockTime = 0;
PLAYER.seqNum = 0;
//PLAYER.y0 = 4;
PLAYER.y0 = -7;
PLAYER.graphicsX0 = -8;
PLAYER.graphicsSpiral = true;
PLAYER.crankFactor = 0;
PLAYER.crankAngle0 = null;
PLAYER.crankAngle = null;
PLAYER.instruments = {};
PLAYER.loop = false;
PLAYER.USE_NEW_METHOD = true;


//PLAYER.tracks = {}

PLAYER.startPlaying = function () {
    console.log("startPlaying");
    if (PLAYER.midiObj == null) {
        console.log("No midi loaded");
        return;
    }
    $("#midiTogglePlaying").text("Pause");
    PLAYER.crankAngle0 = PLAYER.crankAngle;
    PLAYER.setupInstruments();
    PLAYER.playSync(PLAYER.midiObj);
}

PLAYER.pausePlaying = function () {
    console.log("Pause Playing");
    PLAYER.isPlaying = false;
    PLAYER.setPlayTime(PLAYER.getPlayTime());
    $("#midiTogglePlaying").text("Play");
}

PLAYER.stopPlaying = PLAYER.pausePlaying;

PLAYER.rewind = function () {
    console.log("rewind");
    PLAYER.i = 0;
    PLAYER.setPlayTime(0);
    PLAYER.crankAngle0 = PLAYER.crankAngle;
}

PLAYER.togglePlaying = function () {
    if ($("#midiTogglePlaying").text() == "Play") {
        PLAYER.startPlaying();
    }
    else {
        PLAYER.pausePlaying();
    }
}

PLAYER.playMelody = function (name) {
    PLAYER.loadMelody(name, true);
}

PLAYER.loadMelody = function (name, autoStart) {
    console.log("PLAYER.loadMelody " + name + " autostart: " + autoStart);
    PLAYER.stopPlaying();
    var melodyUrl = "assets/midi/" + name + ".json";
    $.getJSON(melodyUrl, function (obj) { PLAYER.playMidiObj(obj, autoStart) });
}

PLAYER.fmt = function (t) { return "" + Math.floor(t * 1000) / 1000; }

PLAYER.playMidiObj = function (obj, autoStart) {
    console.log("playMidiObj", obj, autoStart);
    PLAYER.midiObj = processMidiObj(obj);
    //TODO: make this really wait until instruments are loaded.
    PLAYER.i = 0;
    PLAYER.setPlayTime(0);
    if (PLAYER.object3D) {
        console.log("***** adding Note Graphics ******");
        PLAYER.addNoteGraphics(PLAYER.object3D, PLAYER.midiObj);
    }
    else {
        console.log("***** No registered scene so not adding Note Graphics ******");
    }
    if (autoStart) {
        console.log("melodyLoaded -- starting autoplay soon");
        setTimeout(() => PLAYER.startPlaying(), 1000);
       // PLAYER.startPlaying();
    }
}

/*
This takes a midiObj as returned by JSON and figures out what
instruments are requred, and also arranges a sequence of events
grouped by times.
 */
function processMidiObj(midiObj) {
    console.log("processMidiObj");
    if (midiObj.type != "MidiObj") {
        console.log("midiObj has unexpected type " + midiObj.type);
    }
    var tracks = midiObj.tracks;
    var ntracks = tracks.length;
    console.log("num tracks " + ntracks);
    console.log("Now merging " + ntracks + " tracks.");
    var seqTimes = [];
    var seqEvents = {};
    if (midiObj.resolution) {
        PLAYER.ticksPerBeat = midiObj.resolution;
    }
    else {
        console.log("**** WARNING NO RESOLUTON in the MidiObject ****");
        PLAYER.ticksPerBeat = 500;
    }

    var bpm = 100;
    PLAYER.ticksPerSec = PLAYER.ticksPerBeat * bpm / 60;
    // This is just a guess... we will override if there is a tempo
    PLAYER.trackChannels = {};  // These are 'global' tracks which
    // arise from a given channel of a
    // midi track                      
    PLAYER.instruments = {};
    PLAYER.loop = false;
    if (midiObj.loop) {
        console.log("***set to loop");
        PLAYER.loop = true;
    }
    for (var i = 0; i < tracks.length; i++) {
        var track = tracks[i];
        var ntchs = 0;
        //if (track.numNotes === 0)
        //    continue;
        if (track.channels) {
            for (var k = 0; k < track.channels.length; k++) {
                var ch = track.channels[k];
                var gch = ch; // global channel assignment
                //var tchName = "T"+i+"."+k+"_"+ch;
                var tchName = "T" + i + "_" + ch + "_" + gch;
                PLAYER.trackChannels[tchName] = {
                    'id': tchName,
                    'channel': ch,
                    'track': track,
                    'trackNo': i
                };
                ntchs++;
            }
        }
        if (ntchs == 0) {
            // No channels were assigned - we will use 0
            var ch = 0;
            var gch = 0; // 
            var tchName = "T" + i + "_" + ch + "_" + gch;
            PLAYER.trackChannels[tchName] = {
                'id': tchName,
                'channel': ch,
                'trackNo': i,
                'track': track
            };
        }
        if (track.instrument) {
            console.log("track.instrument: " + track.instrument);
            //PLAYER.instruments[track.instrument] = 1;
            PLAYER.instruments[track.instrument] = 1;
        }
        else {
            //PLAYER.instruments[0] = 1;
            PLAYER.instruments[0] = 1;
        }
        if (track.instruments) {
            console.log("track.instruments: " + track.instruments);
            for (var k = 0; k < PLAYER.instruments.length; k++) {
                var inst = PLAYER.instruments[k];
                PLAYER.instruments[inst] = 1;
            }
        }
        var evGroups = track.seq;
        for (var j = 0; j < evGroups.length; j++) {
            var evGroup = evGroups[j];
            var t0 = evGroup[0];
            var evs = evGroup[1];
            for (var k = 0; k < evs.length; k++) {
                var ev = evs[k];
                ev.track = i;
                if (ev.type == "tempo") {
                    var bpm = ev.bpm;
                    var mpqn = ev.mpqn;
                    console.log("tempo bpm: " + bpm + " mpqn: " + mpqn);
                    if (midiObj.tempo)
                        midiObj.tempo.push(ev);
                    else
                        midiObj.tempo = [ev];
                }
                if (ev.type == "programChange") {
                    var ch = ev.channel;
                    var gch = ch;
                    var inst = ev.instrument;
                    var tchName = "T" + i + "_" + ch + "_" + gch;
                    console.log(">> " + tchName);
                    PLAYER.trackChannels[tchName].instrument = inst;
                }
                //console.log("ev: "+JSON.stringify(ev)+" "+ev.track);
                if (seqEvents[t0]) {
                    seqEvents[t0][1].push(ev);
                }
                else {
                    seqEvents[t0] = [t0, [ev]];
                    seqTimes.push(t0);
                }
            }
        }
    }
    seqTimes.sort(function (a, b) { return a - b; });
    var seq = []
    var maxTime = 0;
    for (var i = 0; i < seqTimes.length; i++) {
        var t = seqTimes[i];
        var evGroup = seqEvents[t];
        seq.push([t, evGroup[1]]);
        maxTime = t;//
        //console.log("t: "+ t+ " nevents: "+evGroup.length);
    }
    midiObj.seq = seq;
    //midiObj.duration = maxTime/PLAYER.ticksPerBeat;
    midiObj.duration = maxTime / PLAYER.ticksPerSec;
    PLAYER.loadInstruments();
    if (!midiObj.tempo) {
        console.log("***** tempo unknown");
    }
    else {
        var tempos = midiObj.tempo;
        console.log("tempos: " + tempos.length);
        //console.log("tempos: "+JSON.stringify(tempos));
        if (tempos.length > 0) {
            var tempo = tempos[0];
            if (tempo.bpm) {
                PLAYER.beatsPerMin = tempo.bpm;
                PLAYER.ticksPerSec = PLAYER.ticksPerBeat * tempo.bpm / 60;
                console.log("tempo bpm: " + tempo.bpm + " -> ticksPerSec: " + PLAYER.ticksPerSec);
            }
            if (tempo.mpqn) {
                var mpqn = tempo.mpqn;
                var spqn = mpqn / 1000000.0;
                var qnps = 1 / spqn; //qnotes per sec
                var bpqn = 1; // really depends on time signature
                var bps = bpqn * qnps;
                PLAYER.ticksPerSec = PLAYER.ticksPerBeat * bps;
                console.log("tempo mpqn: " + tempo.mpqn + " -> bps: " + 60 * bps +
                    " ticksPerSec: " + PLAYER.ticksPerSec);
            }
        }
    }
    try {
        PLAYER.setupTrackInfo();
        PLAYER.showTempo();
    }
    catch (e) {
        console.log("err: " + e);
    }
    return midiObj;
    //    return midiObj.tracks[ntracks-1];
}


/*
  This version starts a series of callbacks for each time
  that events must be started.  There is one callback for
  each time that one or more new notes are played.
 */
PLAYER.playSync = function (obj) {
    console.log("playSync");
    PLAYER.seqNum += 1;
    //PLAYER.i = 0;
    PLAYER.delay0 = 0;
    PLAYER.events = obj.seq;
    PLAYER.isPlaying = true;
    //PLAYER.lastEventPlayTime = 0;
    //PLAYER.lastEventClockTime = Date.now()/1000.0;
    if (!PLAYER.USE_NEW_METHOD) {
        setTimeout(function () {
            PLAYER.playNextStep(PLAYER.seqNum)
        }, 0);
    }
}

PLAYER.getPlayTime = function () {
    if (PLAYER.crankFactor && PLAYER.crankAngle) {
        if (PLAYER.crankAngle0 == null)
            PLAYER.crankAngle0 = PLAYER.crankAngle;
        return PLAYER.crankFactor * (PLAYER.crankAngle - PLAYER.crankAngle0);
    }
    var ct = Date.now() / 1000.0;
    if (PLAYER.isPlaying) {
        var t = PLAYER.lastEventPlayTime + (ct - PLAYER.lastEventClockTime);
        return t;
    }
    else {
        PLAYER.lastEventClockTime = ct;
        return PLAYER.lastEventPlayTime;
    }
}

PLAYER.setPlayTime = function (t) {
    console.log("setPlayTime t: " + t);
    PLAYER.lastEventPlayTime = t;
    PLAYER.lastEventClockTime = Date.now() / 1000.0;
    //TODO: should set PLAYER.i to appopriate place...
}

//
// THis works and is self scheduling...
PLAYER.playNextStep = function (seqNum) {
    //console.log("playNextStep "+PLAYER.i);
    if (!PLAYER.isPlaying) {
        console.log("player stopped!");
        return;
    }
    if (seqNum != PLAYER.seqNum) {
        console.log("***** old sequence detected - dropping it *****");
        return
    }
    var evGroup = PLAYER.events[PLAYER.i];
    var t0 = evGroup[0];
    //var pt = t0/PLAYER.ticksPerBeat;
    var pt = t0 / PLAYER.ticksPerSec;
    PLAYER.lastEventPlayTime = pt;
    PLAYER.lastEventClockTime = Date.now() / 1000.0;
    PLAYER.handleEventGroup(evGroup);
    PLAYER.i += 1;
    if (PLAYER.i >= PLAYER.events.length) {
        if (PLAYER.loop) {
            console.log("Finished loop");
            PLAYER.i = 0;
            PLAYER.lastEventPlayTime = 0;
        }
        else {
            console.log("FInished playing");
            PLAYER.isPlaying = false;
            PLAYER.stopPlaying();
            return;
        }
    }
    var t1 = PLAYER.events[PLAYER.i][0];
    //var dt = (t1-t0)/PLAYER.ticksPerBeat;
    var dt = (t1 - t0) / PLAYER.ticksPerSec;
    setTimeout(function () {
        PLAYER.playNextStep(seqNum)
    }, dt * 1000);
}

//
PLAYER.checkForEvent = function () {
    //console.log("playNextStep "+PLAYER.i);
    if (!PLAYER.isPlaying) {
        console.log("player stopped!");
        return;
    }
    var pt = PLAYER.getPlayTime();
    var evGroup = PLAYER.events[PLAYER.i];
    var nextT0 = evGroup[0];
    //var nextPt = nextT0/PLAYER.ticksPerBeat;
    var nextPt = nextT0 / PLAYER.ticksPerSec;
    if (pt < nextPt) {
        if (PLAYER.i > 0) {
            var evGroup = PLAYER.events[PLAYER.i - 1];
            var prevT0 = evGroup[0];
            //var prevPt = prevT0/PLAYER.ticksPerBeat;
            var prevPt = prevT0 / PLAYER.ticksPerSec;
            if (pt > prevPt)
                return;
            PLAYER.lastEventPlayTime = pt;
            PLAYER.lastEventClockTime = Date.now() / 1000.0;
            PLAYER.handleEventGroup(evGroup);
            PLAYER.i -= 1;
            if (PLAYER.i < 0)
                PLAYER.i = 0;
        }
        return;
    }
    PLAYER.lastEventPlayTime = pt;
    PLAYER.lastEventClockTime = Date.now() / 1000.0;
    PLAYER.handleEventGroup(evGroup);
    PLAYER.i += 1;
    if (PLAYER.i >= PLAYER.events.length) {
        if (PLAYER.loop) {
            console.log("Finished loop");
            PLAYER.i = 0;
            PLAYER.lastEventPlayTime = 0;
            return;
        }
        console.log("Finished playing");
        PLAYER.isPlaying = false;
        PLAYER.stopPlaying();
        return;
    }
}

PLAYER.handleEventGroup = function (eventGroup) {
    var t0 = eventGroup[0];
    var events = eventGroup[1];
    for (var k = 0; k < events.length; k++) {
        var event = events[k];
        if (PLAYER.muted[event.track])
            continue;
        var etype = event.type;
        var t0_ = event.t0;
        var t = 0;
        if (etype == "tempo") {
            var bpm = event.bpm;
            var mpqn = event.mpqn;
            console.log("tempo bpm: " + bpm + "  mpqn: " + mpqn);
            continue;
        }
        var channel = event.channel;
        if (etype == "programChange") {
            var inst = event.instrument;
            console.log("programChange ch: " + channel + " inst: " + inst);
            //MIDI.programChange(channel, inst);
            PLAYER.programChange(event.track, channel, inst);
            continue;
        }
        if (etype == "note") {
            var note = event;
            //console.log("note: "+JSON.stringify(note));
            var pitch = note.pitch;
            var v = note.v;
            //var dur = note.dur/PLAYER.ticksPerBeat;
            var dur = note.dur / PLAYER.ticksPerSec;
            if (t0_ != t0) {
                console.log("*** mismatch t0: " + t0 + " t0_: " + t0_);
            }
            //console.log("noteOn "+channel+" "+pitch+" "+v+" "+t+PLAYER.delay0);
            //console.log("noteOff "+channel+" "+pitch+" "+v+" "+t+dur+PLAYER.delay0);
            MIDI.noteOn(channel, pitch, v, t + PLAYER.delay0);
            MIDI.noteOff(channel, pitch, v, t + dur + PLAYER.delay0);
            continue;
        }
        console.log("*** unexpected etype: " + etype);
    }
}

PLAYER.programChange = function (trackNo, ch, inst) {
    console.log("PLAYER.programChange trackNo: " + trackNo + " ch: " + ch + " inst: " + inst);
    MIDI.programChange(ch, inst);
    try {
        var selName = "selectT" + trackNo + "_" + ch + "_" + ch;
        console.log("programChange sel: " + selName + " " + inst);
        $("#" + selName).val(inst);
    }
    catch (e) {
        console.log("err: " + e);
    }
}

/*
PLAYER.setupChannels = function(instruments)
{
    if (!instruments)
	instruments = PLAYER.instruments;
    console.log("setupChannels "+JSON.stringify(instruments));
    for (var chNo in instruments) {
	var inst = instruments[chNo];
	console.log("ch "+chNo+" instrument: "+inst);
        if (PLAYER.loadedInstruments[inst]) {
	    console.log("instrument already loaded "+inst);
        }
	PLAYER.setupChannel(chNo, inst);
    }
}
*/

var instMap = {
    0: "acoustic_grand_piano",
    1: "violin",
    2: "harpsichord",
    3: "voice_oohs",
    4: "steel_drun",
    5: "choir_aahs",
    6: "paradiddle",
    7: "pad_3_polysynth",
};
instMap = {};

/*
PLAYER.getInstName = function(inst)
{
    if (typeof inst == typeof "str")
	return inst;
    if (instMap[inst])
	return instMap[inst];
    return inst;
}
*/
PLAYER.getInstName = function (inst) {
    if (typeof inst == typeof "str")
        return inst;
    var instObj = MIDI.GM.byId[inst];
    console.log("getInstName: " + JSON.stringify(instObj));
    if (instObj) {
        return instObj.id;
    }
    return inst;
}

PLAYER.setupInstruments = function () {
    console.log("setupInstruments");
    for (var tchName in PLAYER.trackChannels) {
        var tch = PLAYER.trackChannels[tchName];
        if (tch.instrument) {
            PLAYER.programChange(tch.trackNo, tch.channel, tch.instrument)
        }
    }
}

PLAYER.loadInstruments = function (successFn) {
    console.log("loadInstruments " + JSON.stringify(PLAYER.instruments));
    var instruments = [];
    for (var id in PLAYER.instruments) {
        var instObj = MIDI.GM.byId[id];
        instruments.push(instObj.id);
    }
    console.log("instruments: " + instruments);
    MIDI.loadPlugin({
        soundfontUrl: "assets/soundfont/",
        instruments: instruments,
        onprogress: function (state, progress) {
            MIDI.loader.setValue(progress * 100);
        },
        onprogress: function (state, progress) {
            if (MIDI.loader)
                MIDI.loader.setValue(progress * 100);
        },
        onsuccess: function () {
            console.log("** finished with loading instruments");
            for (var i = 0; i < instruments.length; i++) {
                var inst = instruments[i];
                console.log("loaded " + inst);
                PLAYER.loadedInstruments[inst] = true;
            }
            if (successFn)
                successFn();
        }
    });
}

PLAYER.setupChannel = function (chNo, inst, successFn) {
    var instName = PLAYER.getInstName(inst);
    if (chNo == 9) {
        console.log("Special Hack using gunshot");
        instName = "gunshot";
    }
    console.log("setupInstrument chNo: " + chNo + " inst: " + inst + " name: " + instName);
    var instrument = instName;
    MIDI.loadPlugin({
        soundfontUrl: "assets/soundfont/",
        instrument: instName,
        onprogress: function (state, progress) {
            MIDI.loader.setValue(progress * 100);
        },
        onprogress: function (state, progress) {
            if (MIDI.loader)
                MIDI.loader.setValue(progress * 100);
        },
        onsuccess: function () {
            PLAYER.loadedInstruments[instrument] = true;
            MIDI.programChange(chNo, instrument);
            if (successFn)
                successFn();
        }
    });
}


PLAYER.loadInstrument = function (instr, successFn) {
    console.log("loadInstrument " + instr);
    PLAYER.setupChannel(0, instr, successFn);
}

PLAYER.getTimeGraphicR = function () {
    var y0 = -6;
    var x0 = PLAYER.graphicsX0;
    var z0 = 0;
    var gap = .2;
    var w = .1;
    var material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    var geometry = new THREE.BoxGeometry(0.001, 300, w);
    var g = new THREE.Mesh(geometry, material);
    g._mat = material;
    g.position.x = x0;
    g.position.y = y0;
    g.position.z = z0;
    return g;
}

PLAYER.getNoteGraphicR = function (t, dur, pitch, material) {
    var y0 = -6;
    var x0 = 0;//PLAYER.graphicsX0;
    var z0 = 0;
    var gap = .2;
    var w = .1;
    var h = PLAYER.distPerSec * dur;
    material.color.setHSL((pitch % 12) / 12.0, .6, .5);
    var geometry = new THREE.BoxGeometry(h, w, w);
    var ng = new THREE.Mesh(geometry, material);
    ng._mat = material;
    ng.position.x = x0 + PLAYER.distPerSec * t + h / 2;
    ng.position.y = y0 + gap * pitch;
    ng.position.z = z0;
    return ng;
}

PLAYER.getTimeGraphicS = function () {
    var tDur = PLAYER.midiObj.duration;
    var c = tDur * PLAYER.distPerSec;
    var r = c / (2 * Math.PI);
    var y0 = PLAYER.y0;
    var x0 = 0;//PLAYER.graphicsX0;
    var z0 = 0;
    var w = 10;
    var material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    //var geometry = new THREE.BoxGeometry( 0.001, 300, w );
    var geometry = new THREE.BoxGeometry(0.01, 300, 2);
    var g = new THREE.Mesh(geometry, material);
    g._mat = material;
    material.transparent = true;
    material.opacity = .3;
    g.position.x = x0;
    g.position.y = y0;
    g.position.z = z0 + r;
    console.log("**** getTimeGraphicS " + JSON.stringify(g.position));
    return g;
}

PLAYER.getNoteGraphicS = function (t, dur, pitch, material) {
    var tDur = PLAYER.midiObj.duration;
    var c = tDur * PLAYER.distPerSec;
    var r = c / (2 * Math.PI);
    var y0 = PLAYER.y0;
    var x0 = 0;//PLAYER.graphicsX0;
    var z0 = 0;
    var gap = .2;
    var w = .1;
    var h = PLAYER.distPerSec * dur;
    material.color.setHSL((pitch % 12) / 12.0, .6, .5);
    var geometry = new THREE.BoxGeometry(h, w, w);
    var ng = new THREE.Mesh(geometry, material);
    ng._mat = material;
    var a = 2 * Math.PI * (t + dur / 2) / tDur;
    var p = ng.position;
    p.x = x0 + r * Math.sin(a);
    p.z = z0 + r * Math.cos(a);
    p.y = y0 + gap * pitch;
    //console.log("getNoteGraphicS a: "+a+"  r: "+r+"  x: "+p.x+"  y: "+p.y+"  z: "+p.z);
    ng.rotation.y = a;
    return ng;
}

PLAYER.graphicsHandleEventGroup = function (gObj, eventGroup) {
    var t0 = eventGroup[0];
    var events = eventGroup[1];
    for (var k = 0; k < events.length; k++) {
        var event = events[k];
        if (event.type != "note")
            continue;
        var note = event;
        var pitch = note.pitch;
        var v = note.v;
        //var dur = note.dur/PLAYER.ticksPerBeat;
        var dur = note.dur / PLAYER.ticksPerSec;
        //var t = t0/PLAYER.ticksPerBeat;
        var t = t0 / PLAYER.ticksPerSec;
        //console.log(t0+" graphic for note pitch: "+pitch+" v:"+v+" dur: "+dur);
        var material = new THREE.MeshPhongMaterial({ color: 0x00dddd });
        var noteGraphic;
        if (PLAYER.graphicsSpiral)
            noteGraphic = PLAYER.getNoteGraphicS(t, dur, pitch, material);
        else
            noteGraphic = PLAYER.getNoteGraphicR(t, dur, pitch, material);
        gObj.add(noteGraphic);
    }
}

PLAYER.addNoteGraphics = function (scene, midiTrack) {
    if (PLAYER.graphics) {
        PLAYER.graphics.parent.remove(PLAYER.graphics);
    }

    console.log("Adding note graphics...");
    var events = midiTrack.seq;
    PLAYER.graphics = new THREE.Object3D();
    PLAYER.notesGraphic = new THREE.Object3D();
    PLAYER.graphics.add(PLAYER.notesGraphic);
    if (PLAYER.graphicsSpiral)
        PLAYER.timeGraphic = PLAYER.getTimeGraphicS();
    else
        PLAYER.timeGraphic = PLAYER.getTimeGraphicR();
    for (var i = 0; i < events.length; i++) {
        PLAYER.graphicsHandleEventGroup(PLAYER.notesGraphic, events[i]);
    }
    PLAYER.graphics.add(PLAYER.timeGraphic)
    if (PLAYER.graphicsScale) {
        var s = PLAYER.graphicsScale;
        PLAYER.graphics.scale.x = s[0];
        PLAYER.graphics.scale.y = s[1];
        PLAYER.graphics.scale.z = s[2];
    }
    scene.add(PLAYER.graphics);
    return PLAYER.graphics;
}

PLAYER.prevPt = null;

PLAYER.update = function () {
    //console.log("PLAYER.update "+PLAYER.isPlaying);
    if (PLAYER.isPlaying && PLAYER.USE_NEW_METHOD)
        PLAYER.checkForEvent();
    if (!PLAYER.graphics)
        return;
    var clockTime = Date.now() / 1000;
    var pt = PLAYER.getPlayTime();
    if (PLAYER.prevPt && pt < PLAYER.prevPt) {
        console.log("**** pt < prevPt ****");
    }
    PLAYER.prevPt = pt;
    //$("#midiStatus").html("Time: "+PLAYER.fmt(pt));
    $("#midiTime").val(PLAYER.fmt(pt));
    if (PLAYER.graphicsSpiral) {
        var a = 2 * Math.PI * pt / PLAYER.midiObj.duration;
        PLAYER.notesGraphic.rotation.y = -a;
    }
    else {
        var x = PLAYER.graphicsX0 - pt * PLAYER.distPerSec;
        PLAYER.notesGraphic.position.x = x;
    }
}

//******************************************************************
// These have to do with the Web GUI for midi control
//
function muteCheckboxChanged(e) {
    console.log("muteCheckboxChanged")
    var id = $(this).attr('id');
    var i = id.lastIndexOf("_");
    var ch = id.slice(i + 1);
    console.log("id: " + id + " ch: " + ch);
    var val = $(this).is(":checked");
    //var val = $("#"+mute_id).is(":checked");
    val = eval(val);
    console.log("mute_id: " + id + " ch: " + ch + "  val: " + val);
    PLAYER.muted[ch] = val;
}

function instrumentChanged(e) {
    console.log("instrumentChanged")
    var id = $(this).attr('id');
    var i = id.lastIndexOf("_");
    var ch = id.slice(i + 1);
    var val = $(this).val();
    val = eval(val);
    //val = val - 1; // indices start at 0 but names start at 1
    console.log("id: " + id + " ch: " + ch + "  val: " + val);
    PLAYER.setupChannel(ch, val);
}

PLAYER.compositionChanged = function (e) {
    var name = $(this).val();
    console.log("compositionChanged: " + name);
    PLAYER.loadMelody(name);
}

PLAYER.setupMidiControlDiv = function () {
    console.log("setupMidiControlDiv");
    if ($("#midiControl").length == 0) {
        console.log("*** no midiControlDiv found ****");
        return;
    }
    str = '<button onclick="PLAYER.toggleTracks()">&nbsp;</button>\n' +
        '<button onclick="PLAYER.rewind()">|&#60; </button>\n' +
        '<button id="midiTogglePlaying" onclick="PLAYER.togglePlaying()" style="width:60px;">Play</button>\n' +
        '&nbsp;&nbsp;<select id="midiCompositionSelection"></select>\n' +
        '&nbsp;&nbsp;Time: <input type="text" id="midiTime" size="5"></input>\n' +
        '&nbsp;&nbsp;BPM: <input type="text" id="midiBPM" size="4"></input>\n' +
        '&nbsp;&nbsp;TPS: <input type="text" id="midiTPS" size="4"></input>\n' +
        '&nbsp;&nbsp;TPB: <input type="text" id="midiTPB" size="4"></input>\n' +
        '<div id="midiTrackInfo">\n' +
        'No Tracks Loaded<br>\n' +
        '</div>\n';
    $("#midiControl").html(str);
    //
    $("#midiCompositionSelection").change(PLAYER.compositionChanged);
    $("#midiBPM").change(PLAYER.timingChanged);
    $("#midiTPB").change(PLAYER.timingChanged);
    PLAYER.showCompositions();
}

PLAYER.showCompositions = function () {
    console.log("showCompositions");
    var sel = $("#midiCompositionSelection");
    sel.html("");
    sel.append($('<option>', { value: "None", text: "(None)" }));
    for (var i = 0; i < PLAYER.compositions.length; i++) {
        var compName = PLAYER.compositions[i];
        console.log("**** adding comp " + compName);
        sel.append($('<option>', { value: compName, text: compName }));
    }
}

PLAYER.compositions = [
    "chopin69",
    "wtc0",
    "beethovenSym5m1",
    "shepard",
    "BluesRhythm1",
    "minute_waltz",
    "jukebox",
    "risset0",
    "shimauta1",
    "passac",
    "DistantDrums",
    "EarthandSky",
    "silkroad",
    "shores_of_persia",
    "distdrums",
    "cello2",
    "Bach/bach_cello_suite",
];

PLAYER.loadCompositions = function (url) {
    console.log("LoadCompositions " + url);
    $.getJSON(url, function (obj) { PLAYER.compositionsLoaded(obj) });
}

PLAYER.compositionsLoaded = function (obj) {
    console.log("compositionsLoaded");
    console.log("comps: " + obj);
    PLAYER.compositions = obj;
    PLAYER.showCompositions();
}

PLAYER.timingChanged = function (e) {
    console.log("tpbChanged");
    var bpm, tpb;
    try {
        bpm = eval($("#midiBPM").val());
        tpb = eval($("#midiTPB").val());
    }
    catch (e) {
        console.log("err: " + e);
        return;
    }
    console.log("tpb: " + tpb + " bpm: " + bpm);
    if (bpm)
        PLAYER.beatsPerMin = bpm;
    if (tpb)
        PLAYER.ticksPerBeat = tpb;
    PLAYER.ticksPerSec = PLAYER.ticksPerBeat * PLAYER.beatsPerMin / 60;
    PLAYER.showTempo();
}

PLAYER.showTempo = function () {
    $("#midiBPM").val(PLAYER.fmt(PLAYER.beatsPerMin));
    $("#midiTPS").val(PLAYER.fmt(PLAYER.ticksPerSec));
    $("#midiTPB").val(PLAYER.fmt(PLAYER.ticksPerBeat));
}


PLAYER.setupTrackInfo = function () {
    console.log("showTrackInfo");
    //console.log("trackChannels: "+JSON.stringify(PLAYER.trackChannels));
    var d = $("#midiTrackInfo");
    if (d.length == 0) {
        console.log("**** No track info div found *****");
        PLAYER.setupMidiControlDiv();
    }
    d.html('<table id="midiTable"></table>');
    $("#midiTable").append("<tr><th>Track</th><th>mute</th><th>instrument</th></tr>\n");
    for (var tchName in PLAYER.trackChannels) {
        var trackChannel = PLAYER.trackChannels[tchName];
        var ch = trackChannel.channel;
        if (trackChannel.track.numNotes == 0)
            continue;
        console.log("Tchannel: " + tchName + " ch: " + ch);
        var mute_id = "mute" + tchName;
        var select_id = "select" + tchName;
        console.log("mute_id: " + mute_id + "   select_id: " + select_id);
        var s = '<td>TCH_NAME</td>';
        s += '<td><input type="checkbox" id="MUTE_ID"></td>\n';
        s += '<td><select id="SELECT_ID"></select></td>\n';
        s = s.replace("TCH_NAME", tchName);
        s = s.replace("MUTE_ID", mute_id);
        s = s.replace("SELECT_ID", select_id);
        $("#midiTable").append("<tr>" + s + "</tr>");
        var cb = $("#" + mute_id);
        cb.change(muteCheckboxChanged)
        var sel = $("#" + select_id);
        for (var i = 0; i < 128; i++) {
            var instObj = MIDI.GM.byId[i];
            //var instName = (i+1)+" "+instObj.name;
            var instName = i + " " + instObj.name;
            //sel.append($('<option>', { value: i+1, text: instName}));
            sel.append($('<option>', { value: i, text: instName }));
        }
        var inst = trackChannel.instrument;
        console.log("instrument: " + inst);
        if (inst) {
            sel.val(inst);
        }
        sel.change(instrumentChanged);
    }
    PLAYER.showTempo();
}

PLAYER.toggleTracks = function () {
    console.log("toggleTracks");
    var d = $("#midiTrackInfo");
    if (d.is(":visible")) {
        $("#midiTrackInfo").hide();
    }
    else {
        $("#midiTrackInfo").show();
    }
}

$(document).ready(function () {
    PLAYER.setupTrackInfo();
});

export { PLAYER };
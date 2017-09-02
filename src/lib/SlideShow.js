/*
  This is a code for a dynamic objects.  A dynamic object has state that changes
  with time.   The state at a given time is characterized by a 'record' which is
  just a JSON dictionary, which must have one field called 't', which is the time.
*/

import {DynamicObject} from './DynamicObject';
import {DynamicObjectDB} from './DynamicObjectDB';
import {Game} from '../Game';

function getRecs()
{
    var recs = {records: []};
    var t = 0;
    for (var i=1; i<= 13; i++) {
        var rec = {id: 'slide',
            t: t,
            url: "assets/images/ColabTalk/Slide"+i+".PNG"};
        recs.records.push(rec);
        t += 30;
    }
    console.log("slides:\n"+JSON.stringify(recs, null, 3));
    return recs;
}

class SlidePlayer extends DynamicObjectDB
{
    constructor(game, options) {
        var name = options.name;
        var screenName = options.screenName || 'mainScreen';
        super(name);
        this.screen = game.screens[screenName];
        this.playSpeed = 1;
        this.playTime = 0;
        console.log("Screen "+screenName, this.screen);
        var recs = options.records || getRecs();
        this.addRecords(recs);
        this.dump();
    }

    update(dt) {
    }

    play() {
    }

    pause() {
    }

    getPlayTime() {
        return this.playTime;
    }

    setPlaySpeed(s) {
        this.playSpeed = s;
    }

    getPlaySpeed() {
        return this.playSpeed;
    }

    postMessage(msg)
    {
        msg['name'] = msg['id'];
        if (msg['msgType'] != "v3d.delete") {
            //msg['imageUrl'] = "http://"+serverHost+"/"+msg['imageUrl'];
            var url = msg.url;
            console.log("handle "+msg.msgType+" "+url, this.screen);
            if (this.screen)
                this.screen.updateImage(url)
        }
        console.log("*** SlidePlayer "+this.name+" postMessage: "+JSON.stringify(msg));
    }
}


function runSlideShow(game)
{
    var recs = getRecs();
    var db = new SlidePlayer(game,
        {name: "slideShow1",
            screenName: "mainScreen",
            records: recs});
    /*    
    var recs = {"records": [
      { "id": "slide", "t": 1,    "label": "one" },
      { "id": "slide", "t": 1.3,  "label": "one.three" }
      ]
    }
*/
    db.addRecords(recs);
    db.dump();
    var low = 0;
    var high = t;
    for (var t=low; t<high; t+= 0.1) {
        //report("t: "+t);
        db.setPlayTime(t);
    }
    for (var t=high; t>=low; t-= 0.1) {
        //report("t: "+t);
        db.setPlayTime(t);
    }
}

Game.registerNodeType("SlidePlayer", (game, options) => {
    options = options || {};
    if (!options.name)
        options.name = "slidePlayer";
    var slideShow = new SlidePlayer(game, options);
    game.registerController(options.name, slideShow);
    game.registerPlayer(slideShow);
    return slideShow;
});

window.runSlideShow = runSlideShow;

export {SlidePlayer, runSlideShow};
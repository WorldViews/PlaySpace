/*
 * Cloth Simulation using a relaxed constrains solver
 */

// Suggested Readings

// Advanced Character Physics by Thomas Jakobsen Character
// http://freespace.virgin.net/hugo.elias/models/m_cloth.htm
// http://en.wikipedia.org/wiki/Cloth_modeling
// http://cg.alexandra.dk/tag/spring-mass-system/
// Real-time Cloth Animation http://www.darwin3d.com/gamedev/articles/col0599.pdf

import * as THREE from 'three'
//import {Math} from 'three'
import {Game} from 'core/Game'
import ImageSource from 'lib/ImageSource';
import {MUSENode} from 'core/Node';
import {Node3D} from 'core/Node3D';

function toRadians(v)
{
//    return v ? Math.degToRad(v) : v;
    return v * 2 * 3.14159 / 360;
}

let CLOTH = {};

CLOTH.cloths = [];
CLOTH.DAMPING = 0.03;
CLOTH.DRAG = 1 - CLOTH.DAMPING;
CLOTH.MASS = .1;
CLOTH.restDistance = 25;

CLOTH.xSegs = 10; //
CLOTH.ySegs = 10; //

CLOTH.GRAVITY = 981 * 1.4; // 
CLOTH.TIMESTEP = 18 / 1000;
CLOTH.TIMESTEP_SQ = CLOTH.TIMESTEP * CLOTH.TIMESTEP;

CLOTH.wind = .2;
CLOTH.ballPosition = new THREE.Vector3( 0, - 45, 0 );
CLOTH.ballSize = 60; //40
CLOTH.tmpForce = new THREE.Vector3();

var CLOTH_MAT;

CLOTH.update = function(time)
{
    for (var i=0; i<CLOTH.cloths.length; i++) {
	var cloth = CLOTH.cloths[i];
	cloth.update(time);
	cloth.updateCloth(time);
    }
}

CLOTH.plane = function( width, height ) {
	return function( u, v ) {
		var x = ( u - 0.5 ) * width;
		var y = ( v + 0.5 ) * height;
		var z = 0;
		return new THREE.Vector3( x, y, z );
	};
}

CLOTH.clothFunction = CLOTH.plane( CLOTH.restDistance * CLOTH.xSegs, CLOTH.restDistance * CLOTH.ySegs );

function Particle( x, y, z, mass ) {
	this.position = CLOTH.clothFunction( x, y ); // position
	this.previous = CLOTH.clothFunction( x, y ); // previous
	this.original = CLOTH.clothFunction( x, y ); 
	this.a = new THREE.Vector3( 0, 0, 0 ); // acceleration
	this.mass = mass;
	this.invMass = 1 / mass;
	this.tmp = new THREE.Vector3();
	this.tmp2 = new THREE.Vector3();
}

// Force -> Acceleration
Particle.prototype.addForce = function( force ) {
	this.a.add(
		this.tmp2.copy( force ).multiplyScalar( this.invMass )
	);
};


// Performs verlet integration
Particle.prototype.integrate = function( timesq ) {
	var newPos = this.tmp.subVectors( this.position, this.previous );
	newPos.multiplyScalar( CLOTH.DRAG ).add( this.position );
	newPos.add( this.a.multiplyScalar( timesq ) );

	this.tmp = this.previous;
	this.previous = this.position;
	this.position = newPos;

	this.a.set( 0, 0, 0 );
};


CLOTH.diff = new THREE.Vector3();

function satisifyConstrains( p1, p2, distance )
{
    var diff = CLOTH.diff;
    diff.subVectors( p2.position, p1.position );
    var currentDist = diff.length();
    if ( currentDist == 0 ) return; // prevents division by 0
    var correction = diff.multiplyScalar( 1 - distance / currentDist );
    var correctionHalf = correction.multiplyScalar( 0.5 );
    p1.position.add( correctionHalf );
    p2.position.sub( correctionHalf );
}


function Cloth( w, h, wind )
{
    report("**** Cloth "+w+" "+h);
        this.gravity = new THREE.Vector3( 0, - CLOTH.GRAVITY, 0 ).multiplyScalar( CLOTH.MASS );
        this.lastTime = null;
    CLOTH.cloths.push(this);
	w = w || CLOTH.xSegs;
	h = h || CLOTH.ySegs;
	this.w = w;
	this.h = h;
        this.windForce = new THREE.Vector3( 0, 0, 0 );
        this.wind = wind || CLOTH.wind;

	var particles = [];
	var constrains = [];

	var u, v;

	// Create particles
	for ( v = 0; v <= h; v ++ ) {

		for ( u = 0; u <= w; u ++ ) {

			particles.push(
				new Particle( u / w, v / h, 0, CLOTH.MASS )
			);

		}

	}

	// Structural

	for ( v = 0; v < h; v ++ ) {

		for ( u = 0; u < w; u ++ ) {

			constrains.push( [
				particles[ index( u, v ) ],
				particles[ index( u, v + 1 ) ],
				CLOTH.restDistance
			] );

			constrains.push( [
				particles[ index( u, v ) ],
				particles[ index( u + 1, v ) ],
				CLOTH.restDistance
			] );

		}

	}

	for ( u = w, v = 0; v < h; v ++ ) {

		constrains.push( [
			particles[ index( u, v ) ],
			particles[ index( u, v + 1 ) ],
			CLOTH.restDistance

		] );

	}

	for ( v = h, u = 0; u < w; u ++ ) {

		constrains.push( [
			particles[ index( u, v ) ],
			particles[ index( u + 1, v ) ],
			CLOTH.restDistance
		] );

	}


	// While many system uses shear and bend springs,
	// the relax constrains model seem to be just fine
	// using structural springs.
	// Shear
	// var diagonalDist = Math.sqrt(restDistance * restDistance * 2);


	// for (v=0;v<h;v++) {
	// 	for (u=0;u<w;u++) {

	// 		constrains.push([
	// 			particles[index(u, v)],
	// 			particles[index(u+1, v+1)],
	// 			diagonalDist
	// 		]);

	// 		constrains.push([
	// 			particles[index(u+1, v)],
	// 			particles[index(u, v+1)],
	// 			diagonalDist
	// 		]);

	// 	}
	// }


	this.particles = particles;
	this.constrains = constrains;
        this.setupPins();
	function index( u, v ) {

		return u + v * ( w + 1 );

	}

	this.index = index;

        this.updateCloth = function()
        {
	    var cloth = this;
	    var p = cloth.particles;
	    var clothGeometry = this.clothGeometry;

	    for ( var i = 0, il = p.length; i < il; i ++ ) {
		clothGeometry.vertices[ i ].copy( p[ i ].position );
	    }
	    clothGeometry.computeFaceNormals();
	    clothGeometry.computeVertexNormals();

	    clothGeometry.normalsNeedUpdate = true;
	    clothGeometry.verticesNeedUpdate = true;
	}
    
}

Cloth.prototype.update = function( time )
{
    //console.log("Cloth.update");
    if (time == null)
	time = Date.now();

    var windStrength = this.wind * (Math.cos( time / 7000 ) * 20 + 40);
    this.windForce.set( Math.sin( time / 2000 ) + Math.random(),
			 Math.cos( time / 3000 ) + Math.random(),
			 Math.sin( time / 1000 ) + Math.random())
                    .normalize().multiplyScalar( windStrength );
    //arrow.setLength( windStrength );
    //arrow.setDirection( windForce );
    //console.log("windStrength: ", CLOTH.windStrength, " force ", CLOTH.windForce);
    var cloth = this;
    
    if ( ! this.lastTime ) {
	this.lastTime = time;
        console.log("Cloth.update skipping...");
	return;
    }
	
    var i, il, particles, particle, pt, constrains, constrain;

    // Aerodynamics forces
    if ( this.wind ) {
	var face, faces = cloth.clothGeometry.faces, normal;
	particles = cloth.particles;
	var tmpForce = CLOTH.tmpForce;
	for ( i = 0, il = faces.length; i < il; i ++ ) {
	    face = faces[ i ];
	    normal = face.normal;
	    tmpForce.copy( normal ).normalize().multiplyScalar( normal.dot( this.windForce ) );
	    particles[ face.a ].addForce( tmpForce );
	    particles[ face.b ].addForce( tmpForce );
	    particles[ face.c ].addForce( tmpForce );
	}
    }
	
    for ( particles = cloth.particles, i = 0, il = particles.length
	  ; i < il; i ++ ) {
	particle = particles[ i ];
	particle.addForce( this.gravity );
	particle.integrate( CLOTH.TIMESTEP_SQ );
    }

	// Start Constrains

    constrains = cloth.constrains,
    il = constrains.length;
    for ( i = 0; i < il; i ++ ) {
	constrain = constrains[ i ];
	satisifyConstrains( constrain[ 0 ], constrain[ 1 ], constrain[ 2 ] );
    }

    // Ball Constrains
    CLOTH.ballPosition.z = - Math.sin( Date.now() / 600 ) * 90 ; //+ 40;
    CLOTH.ballPosition.x = Math.cos( Date.now() / 400 ) * 70;

/*
	if ( sphere && sphere.visible )
	for ( particles = cloth.particles, i = 0, il = particles.length
			; i < il; i ++ ) {

		particle = particles[ i ];
		pos = particle.position;
		diff.subVectors( pos, ballPosition );
		if ( diff.length() < ballSize ) {

			// collided
			diff.normalize().multiplyScalar( ballSize );
			pos.copy( ballPosition ).add( diff );

		}

	}
*/
    // Floor Constains
    for ( particles = cloth.particles, i = 0, il = particles.length
	  ; i < il; i ++ ) {

	particle = particles[ i ];
	var pos = particle.position;
	if ( pos.y < - 250 ) {
	    pos.y = - 250;
	}
    }

    // Pin Constrains
    var pins = cloth.pins;
    for ( i = 0, il = pins.length; i < il; i ++ ) {
	var xy = pins[ i ];
	var p = particles[ xy ];
	p.position.copy( p.original );
	p.previous.copy( p.original );
    }
}


Cloth.prototype.setupPins = function()
{
    var pinsFormation = [];
    var pins = [6];

    pinsFormation.push( pins );
    pins = [];
    for (var i=0; i<=this.w; i++)
	pins.push(i);
    //pins = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ];
    pinsFormation.push( pins );
    pins = [ 0 ];
    pinsFormation.push( pins );
    pins = []; // cut the rope ;)
    pinsFormation.push( pins );
			pins = [ 0, this.w ]; // classic 2 pins
			pinsFormation.push( pins );
    this.pinsFormation = pinsFormation;
    this.pins = pinsFormation[ 1 ];
}

Cloth.prototype.togglePins = function() {
    report("togglePins");
    this.pins = this.pinsFormation[ ~~( Math.random() * this.pinsFormation.length ) ];
}

Cloth.prototype.toggleWind = function() {
    report("toggleWind");
    CLOTH.wind = !CLOTH.wind;
}

Cloth.prototype.setupCloth = function(group, tex, clothMaterial)
{
    var clothTexture = tex;
    if (!tex)
	clothTexture = THREE.ImageUtils.loadTexture( 'textures/paisley1.jpg' );
    report("clothTexture: "+clothTexture);
    //clothTexture.wrapS = clothTexture.wrapT = THREE.RepeatWrapping;
    clothTexture.wrapS = clothTexture.wrapT = THREE.ClampToEdgeWrapping;
    //clothTexture.anisotropy = 16;

    if (!clothMaterial) {
        console.log("Getting MeshPhongMaterial for cloth");
	clothMaterial = new THREE.MeshPhongMaterial(
	    { alphaTest: 0.5, color: 0xffffff, specular: 0x030303,
	      emissive: 0x111111, shininess: 10, map: clothTexture,
	      transparent: true, side: THREE.DoubleSide } );
    }
    CLOTH_MAT = clothMaterial;
    this.clothMaterial = clothMaterial;
    // cloth geometry
    //var clothGeometry = new THREE.ParametricGeometry( CLOTH.clothFunction, cloth.w, cloth.h );
    var clothGeometry = new THREE.ParametricGeometry( CLOTH.clothFunction, this.w, this.h );
    clothGeometry.dynamic = true;
    clothGeometry.computeFaceNormals();
    this.clothGeometry = clothGeometry;
    
    var uniforms = { texture:  { type: "t", value: clothTexture } };
//    var vertexShader = document.getElementById( 'vertexShaderDepth' ).textContent;
//    var fragmentShader = document.getElementById( 'fragmentShaderDepth' ).textContent;

    // cloth mesh

    var object = new THREE.Mesh( this.clothGeometry, this.clothMaterial );
    object.position.set( 0, 0, 0 );
    object.castShadow = true;
    object.receiveShadow = true;
    group.add( object );
    //object.customDepthMaterial = new THREE.ShaderMaterial( { uniforms: uniforms, vertexShader: vertexShader, fragmentShader: fragmentShader } );
    this.obj = object;
    return object;
}

Cloth.prototype.invertTex = function()
{
    var geo = this.clothGeometry;
    var fuvs = geo.faceVertexUvs[0];
    var mat = this.clothMaterial;
    var flipX = true;
    var flipY = true;
   if (this.fuvs0 == null) {
        report("Copying initial UV's");
        this.fuvs0 = JSON.parse(JSON.stringify(fuvs));
        report("done");
    }
    var n = 0;
    for (var i=0; i<fuvs.length; i++) {
        var f = fuvs[i];
        var f0 = this.fuvs0[i];
        for (var j=0; j<3; j++) {
            if (flipX)
                f[j].x = 1.0 - f0[j].x;
            if (flipY)
                f[j].y = 1.0 - f0[j].y;
            n++;
        }
    }
    report("updated uv vals: "+n);
    mat.needsUpdate = true;
    geo.uvsNeedUpdate = true;
    geo.buffersNeedUpdate = true;
};

var CLOTH_SCREEN_SPEC = {x: 2, y: 2.5, z: -0.1};

function addClothScreen(group, vidTex, vidMat)
{
    console.log("addClothScreen ", vidTex);
    var pos = CLOTH_SCREEN_SPEC;
    CLOTH.wind = 0.2;
    var cloth = new Cloth(CLOTH.xSegs, CLOTH.ySegs, CLOTH.wind);
    cloth.setupCloth(group, vidTex, vidMat);
    cloth.obj.scale.z=.02;
    cloth.obj.scale.x=.025;
    cloth.obj.scale.y=.015;
    cloth.obj.rotation.y=toRadians(90);
    cloth.obj.position.x = pos.x;
    cloth.obj.position.y = pos.y;
    cloth.obj.position.z = pos.z;
    cloth.invertTex();
    return cloth;
}

class ClothNode extends Node3D {
    constructor(game, opts) {
        super(game, opts);
        console.log("ClothNode: ", opts);
        this.group = new THREE.Group();
        this.setObject3D(this.group);
        game.setFromProps(this.group, opts);
        game.addToGame(this.group, this.name, opts.parent);
        var opacity = 1;
        if (opts.opacity != null)
            opacity = opts.opacity;
        var videoTexture = null;
        var videoMaterial = null;
        if (opts.path) {
            console.log("ClothNode: image path ", opts.path);
            this.imageSource = ImageSource.getImageSource(opts.path, opts);
            videoTexture = this.imageSource.createTexture();
	    videoMaterial = new THREE.MeshBasicMaterial({
	        map: videoTexture,
	        transparent: true,
	        //transparent: false,
                alphaTest: 0.4,
                opacity: opacity,
	        side: THREE.DoubleSide,
	    });
        }
        this.cloth = addClothScreen(this.group, videoTexture, videoMaterial);
        this.t0 = null;
        if (opts.name) {
            game.screens[opts.name] = this;
            game.registerPlayer(this);
        }
    }

    play() {
        if (!this.imageSource) {
            //console.log("No imageSource");
            return;
        }
        this.imageSource.play();
    }

    pause() {
        if (!this.imageSource) {
            //console.log("No imageSource");
            return;
        }
        this.imageSource.pause();
    }

    setPlayTime(t) {
        if (!this.imageSource) {
            //console.log("No imageSource");
            return;
        }
        this.imageSource.setPlayTime(t);
    }

    update(arg) {
        var t = MUSE.Util.getClockTime();
        if (this.t0 == null)
            this.t0 = t;
        var dt = t - this.t0;
        CLOTH.update();
        //this.cloth.update();
        //this.cloth.updateCloth();
    }
}

function addCloth(game, opts)
{
    var cloth = new ClothNode(game, opts);
    game.registerController(opts.name, cloth);
    return cloth;
}

MUSENode.defineFields(Cloth, [
  "width",
  "height",
  "path",
  "autoPlay"
]);

Game.registerNodeType("Cloth", addCloth);

// Starraid game for Olle by Tobias
//
//

var canvas = document.getElementById('star-canvas');
var width = canvas.offsetWidth;
var height = canvas.offsetHeight;

// 3d-beräkningen behöver en mittpunkt
var centerX = width / 2;
var centerY = height / 2;

// Start Message
console.log('*********** Starting StarRaid for Olle ***************');
console.log('Width: ' + width + ' Height: ' + height);

var renderer = PIXI.autoDetectRenderer(width,height,{
	view: canvas
});
renderer.backgroundColor = 0x000020;

var stage = new PIXI.Container();

var starCount = 1000;
var asteroidCount = 5;

var stars = [];
var asteroids = [];

// Perspektivet bestämmer typ vilken brännvidd "kameran" har
// MaxZ är hur långt bort stjärnorna kan vara som mest
// Används även för att räkna ut skalning och alpha
var perspective = 3000;
var maxZ = 5000;

var speed = 30;
var asteroidSpeed = speed * 3;
var points = 0;
var move_speed = 8;
var maxMove = 500;

var moveX = 0;
var moveY = 0;
var resetMove = false;
var roll_dir = 0;

var starFieldRoll = 0;

var style = {
	fontFamily : 'Arial',
	fontSize : '36px',
	fontStyle : 'italic',
	fontWeight : 'bold',
	fill : '#F7EDCA',
	stroke : '#4a1850',
	strokeThickness : 5,
	dropShadow : true,
	dropShadowColor : '#000000',
	dropShadowAngle : Math.PI / 6,
	dropShadowDistance : 6,
};

var infoStyle = {
	fontFamily : 'Arial',
	fontSize : '20px',
	fontStyle : 'italic',
	fontWeight : 'bold',
	fill : '#F7EDCA',
	stroke : '#4a1850',
	strokeThickness : 5,
	dropShadow : true,
	dropShadowColor : '#000000',
	dropShadowAngle : Math.PI / 6,
	dropShadowDistance : 6,
};

var dXText = new PIXI.Text('Dx: 0', infoStyle); 
dXText.x = width - dXText.width;
dXText.y = 400;

var dYText = new PIXI.Text('Dy: 0', infoStyle); 
dYText.x = width - dYText.width;
dYText.y = 425;

var speedText= new PIXI.Text('Hastighet: ' + speed, infoStyle); 
speedText.x = 10;
speedText.y = 400;

var infoText = new PIXI.Text('W/S = Öka/minska farten\nA/D = Rotera\nPiltangenter = Styra', {fill:0xffffff, fontSize: 8, fontFamily: 'courier'} );
infoText.anchor.x = 0.5;
infoText.x = width/2;
infoText.y = height - 40;
stage.addChild(infoText);

var pointsText = new PIXI.Text('Poäng: ' + points, infoStyle); 
pointsText.x = 10;
pointsText.y = 425;

var titleText = new PIXI.Text('Olles Stjärnraid', style);
titleText.anchor.x = 0.5;
titleText.x = width/2;
titleText.y = 0;

var loader = PIXI.loader;
var starContainer = new PIXI.Container();
starContainer.pivot.x = width/2;
starContainer.pivot.y = height/2;
starContainer.x = width/2;
starContainer.y = height/2;
var graphics = new PIXI.Graphics();
graphics.lineStyle(2, 0xFF0000);
graphics.drawRect(width/2 - 150, height/2 -100, 300, 200);
//starContainer.addChild(graphics);

stage.addChild(starContainer);
loader.add('star','img/star.png')
      .add('comet', 'img/comet.png')
      .add('asteroid', 'img/asteroid.png')
      .once('complete',function () {

	stage.addChild(titleText);
	stage.addChild(speedText);
	stage.addChild(pointsText);

	stage.addChild(dXText);
	stage.addChild(dYText);

        initControl();

	for(var i=0;i<starCount;i++){
		var star = PIXI.Sprite.fromFrame('star');
		star.anchor.x = 0.5;
		star.anchor.y = 0.5;

		// x y z för stjärnornas position i 3d (som sen ska projiceras till 2d)
		// Slumpa ut positionen (i 3d då)
		star.starX = -width / 2 + Math.random()*width;
		star.starY = -height / 2 + Math.random()*height;
		star.starZ = Math.random()*maxZ;
		star.offsetx = 0;
		star.offsety = 0;
		star.roll = 0;

		star.starScale = 0.2 + Math.random()*0.2;

		starContainer.addChild(star);
		stars.push(star);
	}

	// Asteroids
	for(var i=0;i<asteroidCount;i++){
	    var asteroid = PIXI.Sprite.fromFrame('asteroid');
	    asteroid.anchor.x = 0.5;
	    asteroid.anchor.y = 0.5;

	    asteroid.asteroidX = centerX; //-width / 2 + Math.random()*width;
	    asteroid.asteroidY = centerY; //-height / 2 + Math.random()*height;
	    asteroid.asteroidZ = maxZ; //Math.random()*maxZ;
	    asteroid.asteroidScale = 1;

            //asteroid.x = asteroid.asteroidX;
            //asteroid.y = asteroid.asteroidY;
            //asteroid.x = centerX + (asteroid.asteroidX / asteroid.asteroidZ) * perspective;
            //asteroid.y = centerY + (asteroid.asteroidY / asteroid.asteroidZ) * perspective;

            //var starScale = 1 - asteroid.asteroidZ / maxZ;
            //asteroid.scale.x = asteroid.scale.y = starScale*starScale*asteroid.asteroidScale;

	    starContainer.addChild(asteroid);
	    asteroids.push(asteroid);
        }

	update();

});

loader.load();

function update() {

	for(var index in stars) {
		var star = stars[index];

		// räkna ut ett skalvärde baserat på hur långt bort stjärnan är
		var starScale = 1 - star.starZ / maxZ;

                if(resetMove == true) {
                    star.offsetx = star.offsety = starFieldRoll = 0;
                    starContainer.rotation = 0;
                }

		if(moveX != 0) {
	            star.offsetx += moveX * move_speed;
		    star.offsetx = Math.min(maxMove, star.offsetx);
		    star.offsetx = Math.max(-maxMove, star.offsetx);
		} 
		if(moveY != 0) {
		    star.offsety += moveY * move_speed;
		    star.offsety = Math.min(maxMove, star.offsety);
		    star.offsety = Math.max(-maxMove, star.offsety);
		} 
		
		var roll_speed = 0.15/perspective;
		if(roll_dir != 0) {
		    starFieldRoll += roll_dir * roll_speed; //0.0001; //= Math.min(2*3.14, starFieldRoll + 0.1);
		    starContainer.rotation = starFieldRoll;
                } 

		// Här är hela den magiska 3d-projektionsrutinen
		// dela x och y med z och gångra med perspektiv
		// samt utgå från en mittpunkt
		star.x = centerX + star.offsetx + (star.starX / star.starZ) * perspective;
		star.y = centerY + star.offsety + (star.starY / star.starZ) * perspective;

		// kör skalan i kubik för att inte stjärnorna långt bort ska bli
		// för stora
		star.scale.x = star.scale.y = starScale*starScale*star.starScale;
		star.alpha = starScale;

		star.starZ -= speed;

		if(star.starZ < 0) {
			star.starZ = maxZ;
			star.starX = -width / 2 + Math.random()*width;
			star.starY = -height / 2 + Math.random()*height;
		}
	}

	for(var index in asteroids) {
	    var asteroid = asteroids[index];
	    var asteroidScale = 1 - asteroid.asteroidZ / maxZ;

	     asteroid.x = centerX + (asteroid.asteroidX / asteroid.asteroidZ) * perspective;
	     asteroid.y = centerY + (asteroid.asteroidY / asteroid.asteroidZ) * perspective;
	     asteroid.scale.x = asteroid.scale.y = asteroidScale*asteroidScale*asteroid.asteroidScale;
	     asteroid.asteroidZ -= asteroidSpeed;

	     asteroid.rotation += 0.20; 

	      if(asteroid.asteroidZ < 0) {
	           asteroid.asteroidZ = maxZ;
	           asteroid.asteroidX = -width / 2 + Math.random()*width;
	           asteroid.asteroidY = -height / 2 + Math.random()*height;
	    }
        }

	dXText.text = 'Dx:' + star.offsetx;
	dYText.text = 'Dy:' + star.offsety;
	speedText.text = 'Hastighet: ' + speed;
	pointsText.text = 'Poäng: ' + points;

	requestAnimationFrame(update);

	renderer.render(stage);

}

function initControl() {

	var left = keyboard(37),
	up = keyboard(38),
	right = keyboard(39),
	down = keyboard(40),
	reset = keyboard(13), // enter
	fast = keyboard(87), // w
	slow = keyboard(83), // d
	rollr = keyboard(65), // a
        rolll = keyboard(68); // d

	// Speed
	fast.press = function() { speed += 5; };
	slow.press = function() { speed = Math.max(-15, speed -5); };

	// Left and right
	left.press    = function() { moveX = -1; }
	left.release  = function() { moveX = 0; }
	right.press   = function() { moveX = 1; }
	right.release = function() { moveX = 0; }

	// Up and down
	up.press     = function() { moveY = -1; }
	up.release   = function() { moveY = 0; }
	down.press   = function() { moveY = 1; }
	down.release = function() { moveY = 0; }

	// Roll
	rollr.press   = function() { roll_dir = 1; }
	rollr.release = function() { roll_dir = 0; }
	rolll.press   = function() { roll_dir = -1; }
	rolll.release = function() { roll_dir = 0; }	

        reset.press   = function() { resetMove = true; }
        reset.release = function() { resetMove = false; }

        window.addEventListener("gamepadconnected", function(e) {
            console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
                e.gamepad.index, e.gamepad.id,
                e.gamepad.buttons.length, e.gamepad.axes.length);
        });
}

// From PIXI.js cat-example:
function keyboard(keyCode) {
	var key = {};
	key.code = keyCode;
	key.isDown = false;
	key.isUp = true;
	key.press = undefined;
	key.release = undefined;
	//The `downHandler`

	key.downHandler = function(event) {
		if (event.keyCode === key.code) {
			if (key.isUp && key.press) key.press();
			key.isDown = true;
			key.isUp = false;
		}
		event.preventDefault();
	};

	//The `upHandler`
	key.upHandler = function(event) {
		if (event.keyCode === key.code) {
			if (key.isDown && key.release) key.release();
			key.isDown = false;
			key.isUp = true;
		}
		event.preventDefault();
	};

	//Attach event listeners
	window.addEventListener(
		"keydown", key.downHandler.bind(key), false
	);
	window.addEventListener(
		"keyup", key.upHandler.bind(key), false
	);
	return key;
} 

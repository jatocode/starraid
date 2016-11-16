
var starCount = 1000;

// Perspektivet bestämmer typ vilken brännvidd "kameran" har
var perspective = 3000;

// MaxZ är hur långt bort stjärnorna kan vara som mest
// Används även för att räkna ut skalning och alpha
var maxZ = 5000;
var stars = [];

// Hämta canvas-elementet så vi kan slänga in det till Pixi
var canvas = document.getElementById('star-canvas');
var width = canvas.offsetWidth;
var height = canvas.offsetHeight;

// 3d-beräkningen behöver en mittpunkt
var centerX = width / 2;
var centerY = height / 2;

var maxMove = 200;

var renderer = PIXI.autoDetectRenderer(width,height,{
	view: canvas
});

renderer.backgroundColor = 0x000020;

// Pixi behöver en grundcontainer som renderaren kan utgå från
var stage = new PIXI.Container();

var speed = 30;
var points = 0;

var rmove = false;
var lmove = false;
var umove = false;
var dmove = false;
var roll_right = false;
var roll_left = false;
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
loader.add('star','img/star.png');
loader.once('complete',function () {

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

	update();

});

loader.load();

function update() {

	for(var index in stars) {
		var star = stars[index];

		// räkna ut ett skalvärde baserat på hur långt bort stjärnan är
		var starScale = 1 - star.starZ / maxZ;

		if(lmove) {
			star.offsetx = Math.min(maxMove, star.offsetx + 2);
		} 
		if(rmove) {
			star.offsetx = Math.max(-maxMove, star.offsetx - 2);
		}
		if(umove) {
			star.offsety = Math.max(-maxMove, star.offsety - 2);
		} 
		if(dmove) {
			star.offsety = Math.min(maxMove, star.offsety + 2);
		}
		
		var roll_speed = 0.15/perspective;
		if(roll_right) {
                    // Rotera varje stjärna baserat på antal roll
		    starFieldRoll -= roll_speed; //0.0001; //= Math.min(2*3.14, starFieldRoll + 0.1);
		    starContainer.rotation = starFieldRoll;
                }
		if(roll_left) {
                    // Rotera varje stjärna baserat på antal roll
		    starFieldRoll += roll_speed; //= Math.min(2*3.14, starFieldRoll + 0.1);
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
	fast = keyboard(87), // w
	slow = keyboard(83), // d
	rollr = keyboard(65), // a
        rolll = keyboard(68); // d

	// Speed
	fast.press = function() {
		speed += 5;
	};
	slow.press = function() {
		speed = Math.max(-15, speed -5);
	};

	// Left and right
	left.press = function() {
		lmove = true;
	}
	left.release = function() {
		lmove = false;
	}
	right.press = function() {
		rmove = true;
	}
	right.release = function() {
		rmove = false;
	}

	// Up and down
	up.press = function() {
		umove = true;
	}
	up.release = function() {
		umove = false;
	}
	down.press = function() {
		dmove = true;
	}
	down.release = function() {
		dmove = false;
	}

	// Roll
	rollr.press = function() {
		roll_right = true;
	}
	rollr.release = function() {
		roll_right = false;
	}
	rolll.press = function() {
		roll_left = true;
	}
	rolll.release = function() {
		roll_left = false;
        }	
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

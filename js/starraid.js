/*

HEJ TOBIAS!!
Här har du stjärnor!
MED KOMMENTARER!!

*/

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

var rmove = false;
var lmove = false;
var umove = false;
var dmove = false;

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
dXText.x = 800;
dXText.y = 400;

var dYText = new PIXI.Text('Dy: 0', infoStyle); 
dYText.x = 800;
dYText.y = 425;

var speedText= new PIXI.Text('Hastighet: ' + speed, infoStyle); 
speedText.x = 10;
speedText.y = 400;

var loader = PIXI.loader;
loader.add('star','img/star.png');
loader.once('complete',function () {

	var titleText = new PIXI.Text('Olles Stjärnraid', style);
	titleText.x = 400;
	titleText.y = 0;
	stage.addChild(titleText);
	
	stage.addChild(speedText);

	var pointsText = new PIXI.Text('Poäng: ' + 42, infoStyle); 
	pointsText.x = 10;
	pointsText.y = 425;
	stage.addChild(pointsText);

	stage.addChild(dXText);
	stage.addChild(dYText);

	//Capture the keyboard arrow keys
	var left = keyboard(37),
	up = keyboard(38),
	right = keyboard(39),
	down = keyboard(40),
	fast = keyboard(65), // a
	slow = keyboard(90); // z

	fast.press = function() {
		speed += 5;
	};
	slow.press = function() {
		speed -= 5;
	};
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

		star.starScale = 0.2 + Math.random()*0.2;

		stage.addChild(star);
		stars.push(star);
	}

	update();

});

// dra igång loadern (och sen stjärnorna)
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

	requestAnimationFrame(update);

	renderer.render(stage);
}

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

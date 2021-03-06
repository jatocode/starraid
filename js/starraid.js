// Starraid game for Olle by Tobias
//
// https://github.com/jatocode/starraid

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
renderer.backgroundColor = 0x202040;

var stage = new PIXI.Container();

var stars = [];
var starCount = 1400;

var asteroids = [];
var asteroidCount = 1;

var ufos = [];
var ufoCount = 1;
var START_UFOSPEED = 6;
var ufoSpeed = START_UFOSPEED;

var level = 1;
var misses = 0;

var mode = 0;
var PLAY = 0;
var GAMEOVER = 1;
var MENU = 2;

// Perspektivet bestämmer typ vilken brännvidd "kameran" har
// MaxZ är hur långt bort stjärnorna kan vara som mest
// Används även för att räkna ut skalning och alpha
var perspective = 3000;
var maxZ = 5000;

var START_SPEED = 50;
var speed = START_SPEED;
var asteroidSpeed = speed * 2;
var keys_move_speed = 7;
var joystick_move_speed = 12;
var maxMove = 500;

var points = 0;
var highscore = localStorage.highscore == undefined?0:localStorage.highscore;

var moveX = 0;
var moveY = 0;
var resetMove = false;
var roll = 0;
var fire = false;
var hyper = false;

var hitSize = 20;

var starFieldRoll = 0;

var loader = PIXI.loader;

var starContainer = new PIXI.Container();
var faststarContainer = new PIXI.ParticleContainer(2000, {scale:true, alpha:true});
faststarContainer.pivot.x = width/2;
faststarContainer.pivot.y = height/2;
faststarContainer.x = width/2;
faststarContainer.y = height/2;
starContainer.pivot.x = width/2;
starContainer.pivot.y = height/2;
starContainer.x = width/2;
starContainer.y = height/2;

var graphics = new PIXI.Graphics();
graphics.lineStyle(2, 0xFFFF00);
graphics.drawRect(width/2 - 50, height/2 -25, 100, 50);
//starContainer.addChild(graphics);

var titleText;
var speedText;
var pointsText;
var highscoreText;
var missesText;
var maxMisses = 5;

var laser;

initTexts();

stage.addChild(starContainer);
loader.add('star','img/star.png')
.add('comet', 'img/comet.png')
.add('stone', 'img/stone.png')
.add('asteroid', 'img/asteroid.png')
.add('laser', 'img/laser.png')
.add('earth', 'img/earth.png')
.add('mars', 'img/mars.png')
.add('saturn', 'img/saturn.png')
.add('uranus', 'img/uranus.png')
.add('jupiter', 'img/jupiter.png')
.add('karlavagnen', 'img/karlavagnen.png')
.add('ufogrå1', 'img/ufo-grå1.png')
.add('pil', 'img/pil2.png')
.add('fire', 'img/red-button.png')
.once('complete',function () {

    stage.addChild(titleText);
    stage.addChild(speedText);
    stage.addChild(pointsText);
    stage.addChild(highscoreText);
//    stage.addChild(levelText);
    stage.addChild(missesText);

    initControl();
    createPlanets();

    var fireFrame = new PIXI.Graphics();
    fireFrame.lineStyle(2, 0xff0000);
    fireFrame.drawRect(centerX - hitSize, centerY - hitSize, hitSize * 2, hitSize * 2);
    //   starContainer.addChild(fireFrame);

    for(var i=0;i<ufoCount;i++) {
        var ufo = new PIXI.Sprite.fromFrame('ufogrå1');
        ufo.x = width + 100;
        ufo.y = height/2;
        ufo.startY = height/2;
        ufo.anchor.x = ufo.anchor.y = 0.5;
        ufo.hit = false;
        ufo.scale.x = ufo.scale.y = 1 / 10;    	
        starContainer.addChild(ufo);
        ufos.push(ufo);
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
        star.roll = 0;
        star.age = 0;

        star.starScale = 0.2 + Math.random()*0.2;

        faststarContainer.addChild(star);
        stars.push(star);
    }
    starContainer.addChild(faststarContainer);

    // Asteroids
    for(var i=0;i<asteroidCount;i++){
        var asteroid = PIXI.Sprite.fromFrame('stone');
        asteroid.anchor.x = 0.5;
        asteroid.anchor.y = 0.5;

        asteroid.asteroidX = centerX; 
        asteroid.asteroidY = centerY; 
        asteroid.asteroidZ = maxZ; 
        asteroid.asteroidScale = 0.35;
        asteroid.offsetx = 0;
        asteroid.offsety = 0;
        asteroid.hit = false;

        starContainer.addChild(asteroid);
        asteroids.push(asteroid);
    }

    createLaser();
    stage.addChild(laser);

    if ('ontouchstart' in window) {
        initTouchControls();
    }
    update();

});

loader.load();

var reduceAnimation = 0;

function update() {

    var joystick = [0,0,0];

    switch(mode) {
    case PLAY:
        joystick = pollGamepad();
        updateUfos(joystick);

        if( checkFire(joystick) ) {
            laser.visible = true;	
        } else {
            laser.visible = false;
        }
        break;
    case GAMEOVER:
        break;
    case MENU:
        break;
    default:
        break;
    }
    
    updateStars(joystick);
    updateAsteroids(joystick);

    speedText.text = 'Hastighet: ' + speed;
    pointsText.text = 'Poäng: ' + points;
    levelText.text = 'LEVEL: ' + level;
    missesText.text = 'Missar: ' + misses;
    highscoreText.text = 'Highscore: ' + highscore;

    renderer.render(stage);

    requestAnimationFrame(update);

}

function gameover() {
    var style = {
        fontFamily : 'courier',
        fontSize : '70px',
        fill : '#F7EDCA',
        stroke : '#4a1850',
        strokeThickness : 5,
        dropShadow : true,
        dropShadowColor : '#303030',
        dropShadowAngle : Math.PI / 6,
        dropShadowDistance : 6,
    };

    var gameovertext = new PIXI.Text("GAME OVER", style);
    gameovertext.anchor.x = gameovertext.anchor.y = 0.5;
    gameovertext.x = width/2;
    gameovertext.y = height/2;
    gameovertext.z = +100;
    stage.addChild(gameovertext);

    style.fontSize = '30px';

    var restarttext = new PIXI.Text("Skjut för att prova igen", style);
    restarttext.anchor.x = restarttext.anchor.y = 0.5;
    restarttext.x = width/2;
    restarttext.y = height/2 + gameovertext.height + 10;
    restarttext.z = +100;
    stage.addChild(restarttext);
    // Stop UFOS
    // Stop laser
    mode = GAMEOVER;

    // Starta om knapp
    (function waitForFire () {
        setTimeout(function () {
            var s = checkFire(pollGamepad());
            if (!s) {         
                waitForFire(); 
            } else {
                stage.removeChild(restarttext);
                stage.removeChild(gameovertext);
                mode = PLAY;
                restart();
            }
        }, 100);
    })();

}

function createLaser() {
    laser = new PIXI.Container();
    laser.x = 0;
    laser.y = 0;

    laser1 = PIXI.Sprite.fromFrame('laser');
    laser1.x = centerX + 10;
    laser1.y = centerY;
    laser1.rotation = -0.3;

    laser2 = PIXI.Sprite.fromFrame('laser');
    laser2.x = centerX - 10;
    laser2.y = centerY;
    laser2.rotation = 0.3;

    laser.addChild(laser1);
    laser.addChild(laser2);
}

function updateAsteroids(joystick) {
    for(var index in asteroids) {
        var asteroid = asteroids[index];
        var asteroidScale = 1 - asteroid.asteroidZ / maxZ;

        asteroid.x = centerX + (asteroid.asteroidX / asteroid.asteroidZ) * perspective;
        asteroid.y = centerY + (asteroid.asteroidY / asteroid.asteroidZ) * perspective;
        asteroid.scale.x = asteroid.scale.y = asteroidScale*asteroidScale*asteroid.asteroidScale;
        asteroid.asteroidZ -= Math.random()*asteroidSpeed*1.5;

        if(checkFire(joystick) && 
                (asteroid.hit == false) &&
                (asteroid.x > centerX - hitSize) && (asteroid.x < centerX + hitSize) &&
                (asteroid.y > centerY - hitSize) && (asteroid.y < centerY + hitSize)) {
            asteroid.visible = false;
            asteroid.hit = true;
        }

        asteroid.rotation += 0.1; 

        if(asteroid.asteroidZ < 0) {
            asteroid.asteroidZ = maxZ;
            // asteroid.asteroidX =  -width / 2 + Math.random()*width ;
            // asteroid.asteroidY =  -height / 2 + Math.random()*height;
            asteroid.asteroidX = Math.random()*width/7 * (Math.round(Math.random()) * 2 - 1);
            asteroid.asteroidY = Math.random()*height/7 * (Math.round(Math.random()) * 2 - 1);
            asteroid.visible = true;
            asteroid.hit = false;
        }
    }
}

function checkFire(joystick) {
    return ( (fire == true) || (joystick[2]) )
}

function updateUfos(joystick) {
    for(var index in ufos) {
        var ufo = ufos[index];

        ufoMovement(ufo);
        ufo.y += joystick[1] * joystick_move_speed;
        ufo.y += moveY * keys_move_speed;

        if(ufo.x < -( ufo.width + 50)) {
            ufo.x = width + 100;
            ufo.y = ufo.startY;
            ufo.visible = true;
            if(!ufo.hit) {
                misses++;
            }
            ufo.hit = false;
        }

        if(checkFire(joystick) &&
                (!ufo.hit) &&
                (ufo.x > centerX - hitSize) && (ufo.x < centerX + hitSize) &&
                (ufo.y > centerY - hitSize) && (ufo.y < centerY + hitSize)) {
            points += 1;
            checklevel(points);
            ufo.visible = false;
            ufo.hit = true;
        }

        if(misses >= maxMisses) {
            gameover();
        }
    }

}

function ufoMovement(ufo) {
    switch (level) {
        case 1:
            ufo.x -= ufoSpeed;
            break;
        case 2:
            ufo.x -= ufoSpeed;
            ufo.y -= 0.5;
            break;
        case 3: 
            ufo.x -= ufoSpeed;
            ufo.startY = height/3;
            break;
        default:
            ufo.x -= ufoSpeed;
            ufo.startY = Math.random() * height;
            break;
    }
}

function checklevel(points) {
    if(points == 2) {
        level = 2;
        ufoSpeed *= 1.2;
    } else if(points == 4) {
        level = 3;
        ufoSpeed *= 1.2;
    } else if(points == 6) {
        level = 4;
        ufoSpeed = 6;
    }

    if(points > highscore) {
        highscore = points;
        localStorage.highscore = highscore;
    }
}

function restart() {
    starContainer.rotation = 0;
    points = 0;
    speed = START_SPEED;
    ufoSpeed = START_UFOSPEED;
    level = 1;    
    misses = 0;

    for(var i=0;i<starCount;i++){
        var star = stars[i];
        star.offsetx = 0;
        star.offsety = 0;
        star.roll = 0;
        star.age = 0;
    }
}

function updateStars(joystick) {

    for(var index in stars) {
        var star = stars[index];

        // räkna ut ett skalvärde baserat på hur långt bort stjärnan är
        var starScale = 1 - star.starZ / maxZ;

        if(resetMove == true) {
            star.offsetx = star.offsety = starFieldRoll = 0;
            restart();
        }

        if(hyper == true) {
            perspective -= 0.08;
        } else {
            perspective = 3000;
        }

        star.age++;
        star.offsetx -= joystick[0] * joystick_move_speed;
        star.offsetx += moveX * keys_move_speed;
        star.offsetx = Math.min(maxMove, star.offsetx);
        star.offsetx = Math.max(-maxMove, star.offsetx);

        star.offsety += joystick[1] * joystick_move_speed;
        star.offsety += moveY * keys_move_speed;
        star.offsety = Math.min(maxMove, star.offsety);
        star.offsety = Math.max(-maxMove, star.offsety);

        var roll_speed = 0.15/perspective;
        if(roll != 0) {
            starFieldRoll += roll * roll_speed; //0.0001; //= Math.min(2*3.14, starFieldRoll + 0.1);
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
}

function createPlanets() {
    var skyobjects = ['earth','mars','jupiter','karlavagnen','uranus','saturn'];
    for(var o in skyobjects) {
        var img = PIXI.Sprite.fromFrame(skyobjects[o]);
        img.x = Math.random()*width;
        img.y = Math.random()*height;
        img.scale.x = img.scale.y = 0.15;
        starContainer.addChild(img);
    }
}

function initTouchControls() {
    var controls = new PIXI.Container();
    controls.x = width-120;
    controls.y = height-120;
    var pilv = PIXI.Sprite.fromFrame('pil');
    var pilh = PIXI.Sprite.fromFrame('pil');
    var pilu = PIXI.Sprite.fromFrame('pil');
    var piln = PIXI.Sprite.fromFrame('pil');
    pilv.anchor.x = pilv.anchor.y = 0.5;
    pilh.anchor.x = pilh.anchor.y = 0.5;
    pilu.anchor.x = pilu.anchor.y = 0.5;
    piln.anchor.x = piln.anchor.y = 0.5;

    pilv.scale.x = pilv.scale.y = 0.2;
    pilh.scale.x = pilh.scale.y = 0.2;
    pilu.scale.x = pilu.scale.y = 0.2;
    piln.scale.x = piln.scale.y = 0.2;
    pilh.rotation = Math.PI;
    pilu.rotation = Math.PI/2;
    piln.rotation = -Math.PI/2;

    pilv.x = -60;
    pilh.x = 60;
    pilu.y = -60;
    piln.y = 60;

    pilu.interactive = piln.interactive = pilv.interactive = pilh.interactive = true;
    pilu.mousedown = function(mouseData) { moveY = -1; }
    pilu.mouseup = function(mouseData) { moveY = 0; }     
    pilu.touchstart = function(touchData) { moveY = -1 }
    pilu.touchend = function(touchData) { moveY = 0; }

    piln.mousedown = function(mouseData) { moveY = 1; }
    piln.mouseup = function(mouseData) { moveY = 0; }     
    piln.touchstart = function(touchData) { moveY = 1; }
    piln.touchend = function(touchData) { moveY = 0; }

    pilv.mousedown = function(mouseData) { moveX = -1; }
    pilv.mouseup = function(mouseData) { moveX = 0; }     
    pilv.touchstart = function(touchData) { moveX = -1; }
    pilv.touchend = function(touchData) { moveX = 0; }

    pilh.mousedown = function(mouseData) { moveX = 1; }
    pilh.mouseup = function(mouseData) { moveX = 0; }     
    pilh.touchstart = function(touchData) { moveX = 1; }
    pilh.touchend = function(touchData) { moveX = 0; }

    controls.addChild(pilv);
    controls.addChild(pilh);
    controls.addChild(pilu);
    controls.addChild(piln);
    stage.addChild(controls);

    var firebutton = PIXI.Sprite.fromFrame('fire');
    firebutton.scale.x = firebutton.scale.y = 0.2;
    firebutton.x = 40;
    firebutton.y = height-200;
    firebutton.interactive = true;
    firebutton.mousedown = function(mouseData) { fire = true; }
    firebutton.mouseup = function(mouseData) { fire = false; }     
    firebutton.touchstart = function(touchData) { fire = true; }
    firebutton.touchend = function(touchData) { fire = false; }
       
    stage.addChild(firebutton);
}

function initTexts() {
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

    speedText= new PIXI.Text('Hastighet: ' + speed, infoStyle); 
    speedText.x = 10;
    speedText.y = height - 2*speedText.height;

    pointsText = new PIXI.Text('Poäng: ' + points, infoStyle); 
    pointsText.x = 10;
    pointsText.y = height - pointsText.height;

    highscoreText = new PIXI.Text('Highscore: ' + highscore, infoStyle); 
    highscoreText.x = width - highscoreText.width - 10;
    highscoreText.y = height - highscoreText.height;

    levelText= new PIXI.Text('LEVEL: ' + level, infoStyle); 
    levelText.anchor.x = 0.5;
    levelText.x = width/2;
    levelText.y = height - 2*levelText.height;

    missesText = new PIXI.Text('Missar: ' + misses, infoStyle); 
    missesText.anchor.x = 0.5;
    missesText.x = width/2;
    missesText.y = height - 2*missesText.height;

    titleText = new PIXI.Text('Olles Planetfärd', style);
    titleText.anchor.x = 0.5;
    titleText.x = width/2;
    titleText.y = 0;

    var rendertype = "";
    if(renderer instanceof PIXI.CanvasRenderer) { 
        rendertype = "canvas";   //canvas renderer
    } else {    //webgltype renderer
        rendertype = "webgl";
    }

    var infoText = new PIXI.Text('Piltangenter = Styr         A/D = roll       W/S = hastighet       Space = fire     Enter = reset  (' + rendertype +')', {fontFamily:'courier', fontSize: '10px', fill:'#ffffff'});
    infoText.anchor.x = 0.5;
    infoText.x = width/2;
    infoText.y = height - 20;
    stage.addChild(infoText);
}

function pollGamepad() {
    var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads : []);
    if (!gamepads) {
        console.log('No joystick connected');
        return [0,0,0];
    }

    var gp = gamepads[0];

    if(!gp) {
        return [0,0,0];
    }
    if (buttonPressed(gp.buttons[0])) {
        console.log('button 0');
    } else if (buttonPressed(gp.buttons[2])) {
        console.log('button 2');
    }
    if (buttonPressed(gp.buttons[1])) {
        console.log('button 1');
    } else if (buttonPressed(gp.buttons[3])) {
        console.log('button 3');
    }

    var button = buttonPressed(gp.buttons[0]) || 
        buttonPressed(gp.buttons[1]) ||
        buttonPressed(gp.buttons[2]) ||
        buttonPressed(gp.buttons[3]);

    var x = Math.floor(gp.axes[0]);
    var y = Math.floor(gp.axes[1]);

    return [x,y, button];
}

function initControl() {

    var left = keyboard(37),
        up = keyboard(38),
        right = keyboard(39),
        down = keyboard(40),
        reset = keyboard(13), // enter
        space = keyboard(32), // space
        fast = keyboard(87), // w
        slow = keyboard(83), // d
        rollr = keyboard(65), // a
        hyperk = keyboard(72), // h
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
    rollr.press   = function() { roll = 1; }
    rollr.release = function() { roll = 0; }
    rolll.press   = function() { roll = -1; }
    rolll.release = function() { roll = 0; }	

    reset.press   = function() { resetMove = true; }
    reset.release = function() { resetMove = false; }

    space.press   = function() { fire = true; }
    space.release = function() { fire = false; }

    hyperk.press   = function() { hyper = true; }
    hyperk.relasee = function() { hyper = false; }

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

// Helpers
function buttonPressed(b) {
    if (typeof(b) == "object") {
        return b.pressed;
    }
    return b == 1.0;
}


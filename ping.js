'use strict';

/* We begin by storing some useful constants. */
const screen = document.getElementById('game_screen');
const SFX_BLIP = document.getElementById('blip');
const SFX_WIN = document.getElementById('win');
SFX_BLIP.volume = SFX_WIN.volume = 0.2;
const SCREEN_WIDTH = screen.width;
const SCREEN_HEIGHT = screen.height;
const BAT_WIDTH = 10;
const BAT_HEIGHT = 50;
const BALL_DIA = 5;
const BAT_SPEED = 7;
const BALL_SPEED = 4;
const PLAYER_1 = 0;
const PLAYER_2 = 1;
const CTX = screen.getContext('2d');

class Ping {
	/* This function creates the main game object.
	 * It would typically be called with new Ping(). */
	constructor() {
		/* The scene is the function that we want to call as the
		 * game loop. This could be the title screen, main play
		 * screen, scoreboard and so forth. Whatever function is
		 * set as the scene will be called approximately 60 times
		 * per second, just like a good old-fashioned NTSC TV! */
		this.scene = this.title;

		/* Every time we start a new game, we need to reset all
		 * the variables which represent the game state. */
		this.initialize();

		/* VERY IMPORTANT! Finally, we establish event listeners
		 * on the browser window object, so we can listen out for
		 * key inputs so players can actually control the game.
		 * Note that these are properties of the BROWSER WINDOW,
		 * NOT THIS CLASS. */
		window.addEventListener('keydown', (e) => {
			this.controller[e.keyCode] = true;
		});

		window.addEventListener('keyup', (e) => {
			this.controller[e.keyCode] = false;
		});
	}

	initialize() {
		/* These variables are to represent the game
		 * state, which determines how the game evolves
		 * over each refresh. */
		this.controller = {};
		this.activePlayer = PLAYER_1;
		this.score = [0, 0];
		this.rally = 1;
		this.winner = null;

		/* These should be self-explanatory. They hold the
		 * key properties and state of the game objects. */
		this.ball = {x: SCREEN_WIDTH/2, y: SCREEN_HEIGHT/2, h: BALL_DIA, w: BALL_DIA, velX: 0, velY: 0, active: false};
		this.batA = {x: BAT_WIDTH, y: SCREEN_HEIGHT/2, h: BAT_HEIGHT, w: BAT_WIDTH};
		this.batB = {x: SCREEN_WIDTH-BAT_WIDTH, y: SCREEN_HEIGHT/2, h: BAT_HEIGHT, w: BAT_WIDTH};
	}

	run() {
		this.controls(); // Grab current control inputs.
		CTX.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT); // Blank the screen.
		this.scene(); // Run the current game screen for one frame.
		/* Now one game frame is over, so we request that this
		 * function is run again in about 1/60th of a second.
		 * The browser handles this automatically. */
		let nextCall = () => {this.run();};
		window.requestAnimationFrame(nextCall);
	}

	title() {
		let ctx = screen.getContext('2d');
		ctx.fillStyle = 'white';
		ctx.strokeStyle = 'gray';
		ctx.font = '132pt Baumans';
		ctx.textAlign = 'center';
		ctx.fillText('PING', SCREEN_WIDTH/2, SCREEN_HEIGHT/2);
		ctx.font = '16pt Baumans';
		ctx.fillText('THE STATE OF THE ART VIDEO TENNIS EXPERIENCE!', SCREEN_WIDTH/2, SCREEN_HEIGHT/2 + 40);
		ctx.fillText('Ⓒ 2016-2017 James Abdul Rahman Brierley', SCREEN_WIDTH/2, SCREEN_HEIGHT-60);
	}

	play() {
		/* Save the context and set some game variables for
		 * drawing to the canvas. */
		let ctx = screen.getContext('2d');
		ctx.fillStyle = 'white';
		ctx.strokeStyle = '1px gray';
		ctx.font = '20pt sans-serif';
		ctx.textBaseline = 'middle';
		ctx.lineWidth = 2;
		/* Note that in the method calls below, 'this' refers
		 * to the game object. */
		this.update(); // Update the game state.
		this.drawNet(ctx); // Draw the net.
		this.drawScoreboard(ctx); // Draw the scoreboard.
		if (this.ball.active === true) {
			 /* Check if the ball is in play.
			  * If it is, draw it based on its current position. */
			this.drawBall(ctx, this.ball.x, this.ball.y);
		}
		/* Draw both bats based on the current game state. */
		this.drawBat(ctx, this.batA.x, this.batA.y);
		this.drawBat(ctx, this.batB.x, this.batB.y);
	}

	umpire() {
		/* If the ball goes off the right hand side, player 1 wins
		 * the point. */
		if (this.ball.x > SCREEN_WIDTH) {
			this.ball.active = false;
			(this.score[PLAYER_1])++;
			this.switchService();
		}
		/* If it's out of bounds on the left hand side, player 2 takes
		 * a point. */
		else if (this.ball.x < 0) {
			this.ball.active = false;
			(this.score[PLAYER_2])++;
			this.switchService();
		}
	}

	controls() {
		/* Read the controller object, updated by event listeners
		 * that the constructor attaches to the window object, and
		 * change game state as appropriate. */
		if (this.scene === this.play) {
			// If we’re in a game...
			if (this.controller[KEY_UP] === true) {
				if (this.batB.y > BAT_HEIGHT) {
					this.batB.y -= BAT_SPEED;
				}
			}
			else if (this.controller[KEY_DOWN] === true) {
				if (this.batB.y < SCREEN_HEIGHT-BAT_HEIGHT) {
					this.batB.y += BAT_SPEED;
				}
			}
			if (this.controller[KEY_W] === true) {
				if (this.batA.y > BAT_HEIGHT) {
					this.batA.y -= BAT_SPEED;
				}
			}
			else if (this.controller[KEY_S] === true) {
				if (this.batA.y < SCREEN_HEIGHT-BAT_HEIGHT) {
					this.batA.y += BAT_SPEED;
				}
			}
			if (this.controller[KEY_SPACE] === true) {
				if (this.ball.active === false) {
					this.serve();
				}
			}
		}
		if (this.scene === this.title || this.scene === this.win) {
			// If we’re on the title or win screen...
			if (this.controller[KEY_ENTER] === true) {
				this.initialize();
				this.scene = this.play;
			}
		}
	}

	drawNet(ctx) {
		ctx.beginPath();
		ctx.moveTo((SCREEN_WIDTH/2), 0);
		ctx.lineTo((SCREEN_WIDTH/2), SCREEN_HEIGHT);
		ctx.closePath();
		ctx.stroke();
	}

	drawBat(ctx, cx, cy) {
		ctx.fillRect(cx-BAT_WIDTH/2, cy-BAT_HEIGHT/2, BAT_WIDTH, BAT_HEIGHT);
	}

	drawBall(ctx, cx, cy) {
		ctx.fillRect(cx-BALL_DIA/2, cy-BALL_DIA/2, BALL_DIA, BALL_DIA);
	}

	drawScoreboard(ctx) {
		ctx.textAlign = 'center';
		ctx.fillText(this.score[PLAYER_1], (SCREEN_WIDTH/2)-20, 20);
		ctx.fillText(this.score[PLAYER_2], (SCREEN_WIDTH/2)+19, 20);
	}

	update() {
		/* This is the core of the game logic, updating the
		 * game's state on each call to play(). Many games are
		 * programmed to separate content and style, so to speak,
		 * and this is one of them. This is the first thing that
		 * happens at the beginning of each refresh frame, before
		 * any drawing goes on. */
		if (this.ball.active) {
			/* If the ball is in play, first check that it hasn't gone out
			 * of bounds (which will end the point in one player's favour). */
			this.umpire();
			/* Is the ball hitting the top or bottom of the screen?
			 * If so, reverse its trajectory. */
			if (this.hittingWalls(game)) {
					this.ball.velY *= -1;
					SFX_BLIP.play(); // Play a sound to mark the hit.
			}
			/* Is the ball is colliding with either bat? */
			else if (this.collision(this.ball, this.batA) || this.collision(this.ball, this.batB)) {
				/* If so, push it back and change its velocity to set
				 * the angle by which it will return, taking into account
				 * where it is intersecting the bat. */
				if (this.collision(this.ball, this.batA)) {
					this.ball.velY = (BALL_SPEED * (this.batA.y-this.ball.y)/10);
					this.ball.x += BAT_WIDTH/2;
				}
				if (this.collision(this.ball, this.batB)) {
					this.ball.velY = (BALL_SPEED * (this.batB.y-this.ball.y))/10;
					this.ball.x -= BAT_WIDTH/2;
				}
				/* Increment the rally count (how many bat and ball hits there
				 * have been in this point). */
				//this.rally++;
				SFX_BLIP.play(); // Play a sound to mark the hit.
				this.ball.velX = -this.ball.velX; // Whatever happens, the ball must go back the other way.
			}
			this.ball.x += this.ball.velX; // Set the centre position of the ball
			this.ball.y += this.ball.velY; // for this frame.
		}
		if (this.score[PLAYER_1] > 9 || this.score[PLAYER_2] > 9) {
			if (this.score[PLAYER_1] > this.score[PLAYER_2]) {
				this.winner = PLAYER_1;
			}
			else {
				this.winner = PLAYER_2;
			}
			// Somebody has won, play the victory fanfare!
			SFX_WIN.play();
			this.scene = this.win;
		}
	}

	collision(a, b) {
		return !(a.x + a.w/2 < b.x - b.w/2 ||
				 a.y + a.h/2 < b.y - b.h/2 ||
				 a.x - a.w/2 > b.x + b.w/2 ||
				 a.y - a.h/2 > b.y + b.h/2);
	}

	hittingWalls() {
		if ((this.ball.y - BALL_DIA/2) < 0 || (this.ball.y + BALL_DIA/2) > SCREEN_HEIGHT) {
			return true;
		}
		else {
			return false;
		}
	}

	serve() {
		this.rally = 0; // Reset the rally count.
		this.ball.velY = 0; // Reset the Y velocity.
		this.ball.active = true; // The ball is now in play.
		switch (this.activePlayer) {
			/* Drop the ball off on the current player's bat. */
			case PLAYER_1:
				this.ball.x = this.batA.x + BALL_DIA*3;
				this.ball.y = this.batA.y;
				this.ball.velX = -BALL_SPEED;
				break;
			case PLAYER_2:
				this.ball.x = this.batB.x - BALL_DIA*3;
				this.ball.y = this.batB.y;
				this.ball.velX = BALL_SPEED;
				break;
		}
	}

	win() {
		let ctx = screen.getContext('2d');
		ctx.fillStyle = 'white';
		ctx.strokeStyle = 'gray';
		ctx.font = '72pt Baumans';
		ctx.textAlign = 'center';
		ctx.fillText('Player ' + (this.winner + 1), SCREEN_WIDTH/2, SCREEN_HEIGHT/4);
		ctx.fillText('wins!', SCREEN_WIDTH/2, SCREEN_HEIGHT/4+90);
		ctx.font = '16pt Baumans';
		ctx.fillText('Are you a bad enough dude to play again? (Press Enter)', SCREEN_WIDTH/2, SCREEN_HEIGHT/4+200);
	}

	switchService() {
		/* Set the active player to whoever it currently isn't. */
		if (this.activePlayer === PLAYER_1) {
			this.activePlayer = PLAYER_2;
		}
		else {
			this.activePlayer = PLAYER_1;
		}
		/* Reset the bat positions. */
		// this.batA.y = this.batB.y = SCREEN_HEIGHT/2;
	}
}

var game = new Ping();
game.run();

const MOVE_DOWN = 'down';
const MOVE_UP = 'up';
const MOVE_LEFT = 'left';
const MOVE_RIGHT = 'right';

const TILE_SIZE = 16;
const HALF_TILE_SIZE = TILE_SIZE / 2;

const WORLD_ROWS = 24;
const WORLD_COLUMNS = 32;

const CANVAS_HEIGHT = WORLD_ROWS * TILE_SIZE;
const CANVAS_WIDTH = WORLD_COLUMNS * TILE_SIZE;

const PLAYER_PX_UPDATES_PER_TICK = 2;

const configuration = {
	'iceServers': [{
		'url': 'stun:stun.l.google.com:19302'
	}]
};

const dataChannelOptions = {
	ordered: false, //no guaranteed delivery, unreliable but faster
	maxRetransmitTime: 1000, //milliseconds
};

class Game {
  constructor(socket) {
    this.startGameLoop = this.startGameLoop.bind(this);

    this.canvas = document.querySelector('canvas');
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    this.context = this.canvas.getContext('2d');
    this.context.imageSmoothingEnabled = false;

    this.player = new Player(this.context, socket);
    this.world = new World(this.context);
  }

  startGameLoop() {

    const gameLoop = () => {
    this.context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      requestAnimationFrame(gameLoop);
      // TODO: Move this to a background layer.
      // this.world.render();

      this.player.update();
      this.player.render();
    }
    gameLoop();
  }
}

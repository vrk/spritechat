class Game {
  constructor() {
    this.startGameLoop = this.startGameLoop.bind(this);


    this.canvas = document.querySelector('canvas');
    this.canvas.width = 500;
    this.canvas.height = 500;
    this.context = this.canvas.getContext('2d');
    this.context.imageSmoothingEnabled = false;

    this.player = new Player(this.context);
  }

  startGameLoop() {
    const gameLoop = () => {
      this.context.clearRect(0, 0, 500, 500);
      requestAnimationFrame(gameLoop);
      this.player.update();
      this.player.render();
    }
    gameLoop();
  }
}

const TILE_IMG = new Image();
TILE_IMG.src = 'images/tile-sheet.png';

class Tile {
  constructor(context, x, y, width, height, image) {
    this.context = context;
    this.width = width;
    this.height = height;
    this.startX = x;
    this.startY = y;
    this.image = image;
  }

  render(x, y) {
    this.context.drawImage(
      this.image,
      this.startX, /* source x */
      this.startY, /* source y */
      this.width,
      this.height,
      x, /* canvas x */
      y, /* canvas y */
      this.width,
      this.height);
  }
}

class GrassPainter {
  constructor(context) {
    this.plain = new Tile(context, 6+(16+1)*3, 64, TILE_SIZE, TILE_SIZE, TILE_IMG);
    this.grassyTiles = [
      new Tile(context, 6, 64, TILE_SIZE, TILE_SIZE, TILE_IMG),
      new Tile(context, 6+1+16, 64, TILE_SIZE, TILE_SIZE, TILE_IMG),
      new Tile(context, 6+2+16*2, 64, TILE_SIZE, TILE_SIZE, TILE_IMG)
    ];

    // lol
    this.grassGrid = [];
  }

  render(rows, columns) {
    for (let row = 0; row < rows; row++) {
      if (!this.grassGrid[row]) {
        this.grassGrid[row] = [];
      }
      for (let col = 0; col < columns; col++) {
        if (!this.grassGrid[row][col]) {
          const roll = Math.random();
          if (roll < 0.3) {
            const index = Math.floor(Math.random() * this.grassyTiles.length);
            this.grassGrid[row][col] = this.grassyTiles[index];
          } else {
            this.grassGrid[row][col] = this.plain;
          }
        }
        const tile = this.grassGrid[row][col];
        tile.render(col * TILE_SIZE, row * TILE_SIZE);
      }
    }
  }
}

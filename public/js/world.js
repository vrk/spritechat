class World {
  constructor(context) {
    this.painter = new GrassPainter(context);

  }

  render() {
    this.painter.render(WORLD_ROWS, WORLD_COLUMNS);
  }
}

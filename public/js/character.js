// Base class
class Character {
  update(direction) {
    switch (direction) {
      case MOVE_DOWN:
        this.sprite = this.downSprite;
      break;
      case MOVE_UP:
        this.sprite = this.upSprite;
      break;
      case MOVE_LEFT:
        this.sprite = this.leftSprite;
      break;
      case MOVE_RIGHT:
        this.sprite = this.rightSprite;
      break;
    }
    this.sprite.update();
  }

  render(x, y) {
    this.sprite.render(x, y);
  }
}

class Bijou extends Character {
  constructor(context) {
    super();
    const bijouImage = new Image();
    bijouImage.src = 'images/bijou-sheet.png';

    this.downSprite = new Sprite(context, 37, 34, 2, 64, 4, bijouImage);
    this.upSprite = new Sprite(context, 37, 34, 2, 64+74, 4, bijouImage);
    this.leftSprite = new Sprite(context, 32, 34, 2+296, 64+37, 4, bijouImage);
    this.rightSprite = new Sprite(context, 32, 34, 2, 64+37, 4, bijouImage);
  }
}
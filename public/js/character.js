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
      case DANCE:
        this.sprite = this.danceSprite || this.downSprite;
      break;
    }
    this.sprite.update();
  }

  render(x, y) {
    this.sprite.render(x, y);
  }
}

class Cappy extends Character {
  constructor(context) {
    super();
    const image = new Image();
    image.src = 'images/cappy-sheet.png';

    this.downSprite = new Sprite(context, 34, 34, 2, 62, 4, image);
    this.upSprite = new Sprite(context, 34, 34, 2, 62+69, 4, image);
    this.leftSprite = new Sprite(context, 33, 34, 2+284, 62+34, 4, image);
    this.rightSprite = new Sprite(context, 33, 34, 2, 62+34, 4, image);
  }
}

class Boss extends Character {
  constructor(context) {
    super();
    const image = new Image();
    image.src = 'images/boss-sheet.png';

    this.downSprite = new Sprite(context, 36, 34, 0, 64, 4, image);
    this.upSprite = new Sprite(context, 36, 34, 148, 64, 4, image);
    this.leftSprite = new Sprite(context, 34, 34, 3+142, 64+34, 4, image);
    this.rightSprite = new Sprite(context, 34, 34, 3, 64+34, 4, image);
    this.danceSprite = new Sprite(context, 36, 34, 2, 244 + 72, 10, image);
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
    this.danceSprite = new Sprite(context, 36, 38, 2, 244+4, 5, bijouImage);
  }
}

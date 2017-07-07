class Menu {
  constructor(onNameEntered) {
    this.onNameEntered = onNameEntered;
    this._onEnter = this._onEnter.bind(this);

    const form = document.querySelector('#name-form');
    form.addEventListener('submit', this._onEnter);
  }

  _onEnter(e) {
    e.preventDefault();
    const input = document.querySelector('#chat-name');
    console.log(input.value);
    this.onNameEntered(input.value);
  }
}

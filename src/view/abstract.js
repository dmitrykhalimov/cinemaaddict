import {createElement} from "../utils.js";

export default class Abstract {
  constructor() {
    if (new.target === Abstract) {
      throw new Error(`You're trying to instantiate an Abstract class, Mario. Princess in the concrete one.`);
    }

    this._element = null;
  }

  getTemplate() {
    throw new Error(`Abstract method is not implemented: getTemplate`);
  }

  getElement() {
    /* if (new.target === Abstract) {
      throw new Error(`You're trying to instantiate an Abstract class, Mario. Princess in the concrete one.`);
    } */

    if (!this._element) {
      this._element = createElement(this.getTemplate());
    }

    return this._element;
  }

  removeElement() {
    this._element = null;
  }
}


import FilmsModel from "../model/films.js";

const createStoreStructure = (items) => {
  return items.reduce((acc, current) => {
    return Object.assign({}, acc, {
      [current.id]: current,
    });
  }, {});
};

export default class Provider {
  constructor(api, store) {
    this._api = api;
    this._store = store;
  }

  getFilms() {
    if (Provider.isOnline()) {
      return this._api.getFilms()
        .then((films) => {
          console.log(films);
          const items = createStoreStructure(films.map(FilmsModel.adaptFilmToServer));
          this._store.setItems(items);
          return films;
        });
    }
    const storeFilms = Object.values(this._store.getItems());
    return Promise.resolve(storeFilms.map(FilmsModel.adaptFilmsToClient));
  }

  getComments(filmId) {
    console.log('Меня вызали');
    if (Provider.isOnline()) {
      return this._api.getComments(filmId)
        .then((comments) => {
          return comments;
        });
    }
    console.log('Меня вызали и я оффлайн');
    return Promise.resolve([]);
  }

  updateFilm(film) {
    if (Provider.isOnline()) {
      return this._api.updateFilm(film)
        .then((filmUpdated) => {
          this._store.setItem(filmUpdated.id, FilmsModel.adaptFilmToServer(filmUpdated));
          return filmUpdated;
        });
    }

    this._store.setItem(film.id, FilmsModel.adaptFilmToServer(film));

    return Promise.resolve(film);
  }

  addComment(comment) {
    if (Provider.isOnline()) {
      return this._api.addComment(comment)
        .then((response) => {
          return response;
        });
    }
    return null;
  }

  deleteComment(commentId) {
    if (Provider.isOnline()) {
      return this._api.deleteComment(commentId)
        .then((response) => response);
    }
    return null;
  }

  sync() {
    if (Provider.isOnline()) {
      const storeFimls = Object.values(this._store.getItems());

      return this._api.sync(storeFimls)
        .then((response) => {
          const items = createStoreStructure(response);
          this._store.setItems(items);
        });
    }

    return Promise.reject(new Error(`Sync data failed`));
  }

  static isOnline() {
    return window.navigator.onLine;
  }
}

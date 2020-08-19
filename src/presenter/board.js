import BoardView from "../view/board.js";
import NoFilmsView from "../view/no-films.js";
import FilmDetailsView from "../view/film-details.js";
import ButtonView from "../view/button.js";
// import ExtraRatedContainerView from "./view/container-rated.js"; // +
// import ExtraCommentedContainerView from "./view/container-connected.js"; // +
import FilmsContainerView from "../view/films-container.js"; // +
import FilmCardView from "../view/film-card.js"; // +
import {render, RenderPosition, remove} from "../utils/render.js";

const FILMS_COUNT_PER_STEP = 5;

export default class Board {
  constructor(boardContainer) {
    this._boardContainer = boardContainer;

    this._boardComponent = new BoardView(); // сама доска <section class =films>
    this._filmsContainerComponent = new FilmsContainerView(); // контейнер <section class = filmslist>
    this._filmsListContainer = this._filmsContainerComponent.getElement().querySelector(`.films-list__container`); // контейнер section class = filmlist__container

    this._noFilmsComponent = new NoFilmsView();
  }

  // инициализация
  init(boardFilms) {
    this._boardFilms = boardFilms.slice();

    render(this._boardContainer, this._boardComponent, RenderPosition.BEFOREEND);

    this._renderBoard();
  }

  // отрисовка поля
  _renderBoard() {

    // если фильмов нет - отрисовать плашку NoFilms
    if (this._boardFilms.length === 0) {
      this._renderNoFilms();
      return;
    }

    this._renderFilmsList();
  }

  // отрисовка списка фильмов
  _renderFilmsList() {
    render(this._boardComponent, this._filmsContainerComponent, RenderPosition.BEFOREEND);

    this._renderFilms(0, Math.min(this._boardFilms.length, FILMS_COUNT_PER_STEP));

    if (this._boardFilms.length > FILMS_COUNT_PER_STEP) {
      this._renderLoadMoreButton();
    }
  }

  // отрисовка фильмов
  _renderFilms(from, to) {
    this._boardFilms
      .slice(from, to)
      .forEach((boardFilm) => this._renderFilm(boardFilm));
  }

  // отрисовка отдельного фильма
  _renderFilm(film) {
    const filmComponent = new FilmCardView(film);
    const filmDetailsComponent = new FilmDetailsView(film);

    const siteBody = document.querySelector(`body`);

    const openFilmPopup = () => {
      siteBody.appendChild(filmDetailsComponent.getElement());
      document.addEventListener(`keydown`, onEscKeyDown);
    };

    const closeFilmPopup = () => {
      siteBody.removeChild(filmDetailsComponent.getElement());
      document.removeEventListener(`keydown`, onEscKeyDown);
    };

    const onEscKeyDown = (evt) => {
      if (evt.key === `Escape` || evt.key === `Esc`) {
        evt.preventDefault();
        closeFilmPopup();
      }
    };

    filmComponent.setCardClickHandler(() => {
      openFilmPopup();
    });

    filmDetailsComponent.setPopupClickHandler(() => {
      closeFilmPopup();
    });

    render(this._filmsListContainer, filmComponent, RenderPosition.BEFOREEND);
  }

  _renderLoadMoreButton() {
    let renderedTaskCount = FILMS_COUNT_PER_STEP;

    const loadMoreButton = new ButtonView();

    render(this._filmsContainerComponent, loadMoreButton, RenderPosition.BEFOREEND);

    loadMoreButton.setClickHandler(() => {
      this._boardFilms
      .slice(renderedTaskCount, renderedTaskCount + FILMS_COUNT_PER_STEP)
      .forEach((film) => this._renderFilm(this._filmsContainerComponent, film));

      renderedTaskCount += FILMS_COUNT_PER_STEP;

      if (renderedTaskCount >= this._boardFilms.length) {
        remove(loadMoreButton);
      }
    });
  }

  _renderNoFilms() {
    render(this._boardComponent, this._noFilmsComponent, RenderPosition.BEFOREEND);
  }
}

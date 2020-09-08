import BoardView from "../view/board.js";
import NoFilmsView from "../view/no-films.js";
import ButtonView from "../view/button.js";
import SortView from "../view/sort.js";
import ExtraRatedContainerView from "../view/container-rated.js";
import ExtraCommentedContainerView from "../view/container-connected.js";
import FilmsContainerView from "../view/films-container.js";
import FilmCardView from "../view/film-card.js";
import {render, RenderPosition, remove, replace} from "../utils/render.js";
import {sortDate, sortRating, generateTopRated, generateTopCommented} from "../utils/transform.js";
import {SortType, UpdateType, UserAction} from "../const.js";
import FilmPresenter from "./film.js";
import {makeFilters} from "../utils/filter.js";
// import FilmDetailsView from "../view/film-details.js";

const FILMS_COUNT_PER_STEP = 5;
const EXTRAS_COUNT = 2;

export default class Board {
  constructor(boardContainer, filmsModel, filterModel) {
    this._filmsModel = filmsModel;
    this._filterModel = filterModel;
    this._boardContainer = boardContainer;
    this._renderedFilmsCount = FILMS_COUNT_PER_STEP;

    this._loadMoreButtonComponent = null;
    this._sortComponent = null;

    this._currentSortType = SortType.DEFAULT;
    this._filmPresenter = {};

    this._boardComponent = new BoardView(); // сама доска <section class =films>
    this._filmsContainerComponent = new FilmsContainerView(); // контейнер <section class = filmslist>
    this._filmsListContainer = this._filmsContainerComponent.getElement().querySelector(`.films-list__container`); // контейнер section class = filmlist__container

    this._noFilmsComponent = new NoFilmsView();

    this._handleViewAction = this._handleViewAction.bind(this);
    this._handleModelEvent = this._handleModelEvent.bind(this);
    this._handleLoadButton = this._handleLoadButton.bind(this);
    this._handleSortTypeChange = this._handleSortTypeChange.bind(this);
    this._handleModeChange = this._handleModeChange.bind(this);

    this._filmsModel.addObserver(this._handleModelEvent);
    this._filterModel.addObserver(this._handleModelEvent);
  }

  // инициализация
  init() {
    render(this._boardContainer, this._boardComponent, RenderPosition.BEFOREEND);

    this._renderBoard();
  }

  _getFilms() {
    const filterType = this._filterModel.getFilter();
    const films = this._filmsModel.getFilms();
    const filteredFilms = makeFilters[filterType](films);

    switch (this._currentSortType) {
      case SortType.DATE:
        return filteredFilms.sort(sortDate);
      case SortType.RATING:
        return filteredFilms.sort(sortRating);
    }

    return filteredFilms;
  }

  // *сортировка*

  // обработчик сортировки
  _handleSortTypeChange(sortType) {
    if (this._currentSortType === sortType) {
      return;
    }

    this._currentSortType = sortType;

    this._clearBoard({resetRenderedTaskCount: true});
    this._renderBoard();
  }

  _handleModeChange() {
    Object
      .values(this._filmPresenter)
      .forEach((presenter) => presenter.resetView());
  }

  // обработчик изменения фильма

  _handleViewAction(actionType, updateType, update) {
    switch (actionType) {
      case UserAction.UPDATE_FILM:
        this._filmsModel.updateFilm(updateType, update);
        break;
    }
  }

  _handleModelEvent(updateType, data) {
    switch (updateType) {
      case UpdateType.MINOR:
        this._filmPresenter[data.id].init(data);
        break;
      case UpdateType.MAJOR:
        this._clearBoard({resetRenderedFilmCount: true, resetSortType: true});
        this._renderBoard();
        break;
    }
  }

  // метод сортировки
  _renderSort() {
    const prevSortComponent = this._sortComponent;
    this._sortComponent = new SortView(this._currentSortType);
    this._sortComponent.setSortTypeChangeHandler(this._handleSortTypeChange);

    if (prevSortComponent === null) {
      render(this._boardContainer, this._sortComponent, RenderPosition.AFTERBEGIN);
      return;
    }

    replace(this._sortComponent, prevSortComponent);
  }

  // отрисовка поля
  _renderBoard() {
    const films = this._getFilms();
    const filmCount = films.length;

    // если фильмов нет - отрисовать плашку NoFilms
    if (filmCount === 0) {
      this._renderNoFilms();
      return;
    }

    this._renderFilms(films.slice(0, Math.min(filmCount, FILMS_COUNT_PER_STEP)));
    this._renderExtras();

    this._renderSort();

    if (filmCount > this._renderedFilmsCount) {
      this._renderLoadMoreButton();
    }
  }

  // отрисовка блока экстра
  _renderExtras() {
    this._extraRated = new ExtraRatedContainerView();
    this._extraCommented = new ExtraCommentedContainerView();

    render(this._boardComponent, this._extraRated, RenderPosition.BEFOREEND);
    render(this._boardComponent, this._extraCommented, RenderPosition.BEFOREEND);

    const topRatedFilms = generateTopRated(this._getFilms().slice());
    const topCommentedFilms = generateTopCommented(this._getFilms().slice());

    for (let i = 0; i < EXTRAS_COUNT; i++) {
      // render(extraRatedContainer.getElement().querySelector(`.films-list__container`), new FilmCardView(topRatedFilms[i]), RenderPosition.BEFOREEND);
      // this._renderFilm(extraRatedContainer.getElement().querySelector(`.films-list__container`), topRatedFilms[i]);
      // TODO надо как-то научить перерисовываться блок TopCommented при добавлении комментария, не переписывая половину проекта.
      // TODO не открываются попапы при клике на элементы блока Extra

      // render(this._extraRated.getElement().querySelector(`.films-list__container`), new FilmCardView(topRatedFilms[i]), RenderPosition.BEFOREEND);
      render(this._extraCommented.getElement().querySelector(`.films-list__container`), new FilmCardView(topCommentedFilms[i]), RenderPosition.BEFOREEND);
    }
  }

  // отрисовка фильмов
  _renderFilms(films) {
    render(this._boardComponent, this._filmsContainerComponent, RenderPosition.AFTERBEGIN);

    films.forEach((film) => this._renderFilm(this._filmsListContainer, film));
  }

  // отрисовка отдельного фильма
  _renderFilm(container, film) {
    const filmPresenter = new FilmPresenter(container, this._handleViewAction, this._handleModeChange);
    filmPresenter.init(film);
    this._filmPresenter[film.id] = filmPresenter;
  }


  // обработчик нажатия кнопки Show More
  _handleLoadButton() {
    const filmCount = this._getFilms().length;
    const newRenderedFilmCount = Math.min(filmCount, this._renderedFilmsCount + FILMS_COUNT_PER_STEP);
    const films = this._getFilms().slice(this._renderedFilmsCount, newRenderedFilmCount);

    this._renderFilms(films);
    this._renderedFilmsCount = newRenderedFilmCount;

    if (this._renderedFilmsCount >= filmCount) {
      remove(this._loadMoreButtonComponent);
    }
  }


  // отрисовка кнопки Show More
  _renderLoadMoreButton() {

    if (this._loadMoreButtonComponent !== null) {
      this._loadMoreButtonComponent = null;
    }

    this._loadMoreButtonComponent = new ButtonView();

    render(this._filmsContainerComponent, this._loadMoreButtonComponent, RenderPosition.BEFOREEND);

    this._loadMoreButtonComponent.setClickHandler(this._handleLoadButton);
  }

  // отрисовка плашки No Films
  _renderNoFilms() {
    render(this._boardComponent, this._noFilmsComponent, RenderPosition.BEFOREEND);
  }

  // метод очистки доски

  _clearBoard({resetRenderedFilmCount = false, resetSortType = false} = {}) {
    const filmCount = this._getFilms().length;

    Object
      .values(this._filmPresenter)
      .forEach((presenter) => presenter.destroy());
    this._filmPresenter = {};

    remove(this._noFilmsComponent);
    remove(this._loadMoreButtonComponent);
    remove(this._extraCommented);
    remove(this._extraRated);

    if (resetRenderedFilmCount) {
      this._renderedFilmsCount = FILMS_COUNT_PER_STEP;
    } else {
      // На случай, если перерисовка доски вызвана
      // уменьшением количества задач (например, удаление или перенос в архив)
      // нужно скорректировать число показанных задач
      this._renderedFilmsCount = Math.min(filmCount, this._renderedFilmsCount);
    }

    if (resetSortType) {
      this._currentSortType = SortType.DEFAULT;
    }
  }
}

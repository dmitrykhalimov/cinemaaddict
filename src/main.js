/* eslint-disable no-trailing-spaces */
/* eslint-disable no-console */
/* eslint-disable quotes */
/* eslint-disable no-var */
/* eslint-disable indent */
import UserProfileView from "./view/user-profile.js";
import FilterPresenter from "./presenter/filter.js";
import StatisticsPresenter from "./presenter/statistics.js";
import FooterStatsView from "./view/footer-stats.js";

import {render, RenderPosition} from "./utils/render.js";
import BoardPresenter from "./presenter/board.js";
import FilmsModel from "./model/films.js";
import FilterModel from "./model/filter.js";

import {ServerParameters, UpdateType} from "./const.js";
import Api from "./api/index.js";
import Store from "./api/store.js";
import Provider from "./api/provider.js";

const STORE_PREFIX = `cinemaaddict-localstorage`;
const STORE_VER = `v1`;
const STORE_COMMENTS_VER = `comments-v1`;
const STORE_NAME = `${STORE_PREFIX}-${STORE_VER}`;
const STORE_COMMENTS_NAME = `${STORE_PREFIX}-${STORE_COMMENTS_VER}`;

const siteHeader = document.querySelector(`.header`);
const siteFooterStats = document.querySelector(`.footer__statistics`);

// отрисовка хэдера

const userProfileComponent = new UserProfileView();
render(siteHeader, userProfileComponent, RenderPosition.BEFOREEND);

const api = new Api(ServerParameters.END_POINT, ServerParameters.AUTHORIZATION);
const store = new Store(STORE_NAME, window.localStorage);
const storeComments = new Store(STORE_COMMENTS_NAME, window.localStorage);
const apiWithProvider = new Provider(api, store, storeComments);
const filmsModel = new FilmsModel();

// модель фильтра
const filterModel = new FilterModel();

const siteMain = document.querySelector(`.main`);

// блок фильтров
const statsPresenter = new StatisticsPresenter(siteMain, filmsModel);
const boardPresenter = new BoardPresenter(siteMain, filmsModel, filterModel, apiWithProvider, userProfileComponent);

const filterPresenter = new FilterPresenter(siteMain, filterModel, filmsModel, statsPresenter, boardPresenter);

// блок фильмов и сортировка

filterPresenter.init();
boardPresenter.init();

// загрузить фильмы
apiWithProvider.getFilms().then((films) => {
  const commentPromises = films.map((film) => {
    return apiWithProvider.getComments(film.id);
  });
  Promise.all(commentPromises)
    .then((commentsAll) => {
      return films.map((film, index) => {
        return Object.assign(
          {},
          film,
          {
            comments: commentsAll[index]
          }
        );
      });
    })
    .then((receivedFilms) => {
      filmsModel.setFilms(UpdateType.INIT, receivedFilms);
      render(siteFooterStats, new FooterStatsView(receivedFilms.length).getElement(), RenderPosition.BEFOREEND);
    });
});

window.addEventListener(`load`, () => {
  navigator.serviceWorker.register(`/sw.js`)
    .then(() => {
      console.log(`ServiceWorker available`); // eslint-disable-line
    }).catch(() => {
      console.error(`ServiceWorker isn't available`); // eslint-disable-line
    });
});

window.addEventListener(`online`, () => {
  document.title = document.title.replace(` [offline]`, `тест`);
  apiWithProvider.sync();
});

window.addEventListener(`offline`, () => {
  document.title += ` [offline]`;
});

'use strict'

const user_id = 1; // start here once ready to add users

function requirements() {
  require('dotenv').config();
  const express = require('express');
  const methodOverride = require('method-override');
  const PORT = process.env.PORT || 3001;
  const superagent = require('superagent');

  const pg = require('pg');
  const client = new pg.Client(process.env.DATABASE_URL);
  client.on('error', err => console.error(err));

  const app = express();
  return { app, express, methodOverride, client, superagent, PORT };
}

function routes() {
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static('./public'));
  app.set('view engine', 'ejs');
  app.use(methodOverride('_method'));

  app.get('/', homeRoute);
  app.get('/about', aboutRoute);
  app.delete('/favorites/:movie_id', deleteFromFavorites);
  app.get('/favorites', gotoFavorites);
  app.post('/favorites', insertIntoFavorites);
  app.get('/search', searchRoute);
  app.get('/search/:title', titleSearchRoute);
  app.post('/search', searchRoute);
  app.put('/update/:movie_id', updateUserRating);
  app.delete('/watchlist/:movie_id', deleteFromWatchlist);
  app.get('/watchlist', gotoWatchlist);
  app.post('/watchlist', insertIntoWatchlist);
  app.all('*', errorRoute);
}

const { app, client, express, methodOverride, PORT, superagent } = requirements();

routes();

function homeRoute(request, response) {
  let sql = 'SELECT TITLE FROM movies;';
  client.query(sql)
    .then(sqlResults => {
      if (sqlResults.rowCount === 0) {
        return response.status(200).redirect('/search/detective pikachu');
      } else {
        let movies = sqlResults.rows;
        shuffle(movies);
        response.status(200).redirect(`/search/${movies[0].title}`);
      }
    }).catch(error => console.error(error))
}

function aboutRoute(request, response) {
  response.status(200).render('./aboutus.ejs')
}

function searchRoute(request, response) {
  let searchString = request.body.search;
  if (searchString === undefined || searchString === '') {
    response.status(200).redirect('/');
    return;
  }
  let url = 'https://api.themoviedb.org/3/search/movie';
  const movieKey = process.env.MOVIE_API_KEY;
  console.log('This is the search:', searchString);
  const searchParams = {
    api_key: movieKey,
    query: searchString,
    limit: 1
  }
  superagent.get(url)
    .query(searchParams)
    .then(searchData => {
      let movieId = searchData.body.results[0].id;
      let movieGenres = searchData.body.results[0].genre_ids;
      let movieVotes = searchData.body.results[0].vote_average;
      let searchedMovie = new Movie(searchData.body.results[0]);
      let idURL = `https://api.themoviedb.org/3/movie/${movieId}/recommendations`;
      let idParams = {
        api_key: movieKey,
        page: 1
      }
      superagent.get(idURL)
        .query(idParams)
        .then(similarData => {
          let similarMovieArray = [];
          shuffle(similarData.body.results);
          for (let i = 0; i < similarData.body.results.length; i++) {
            similarMovieArray.push(new Movie(similarData.body.results[i]))
            if (i >= 2) {
              break;
            }
          }
          let discoverUrl = 'https://api.themoviedb.org/3/discover/movie?';
          let genreParams = {
            api_key: movieKey,
            with_genres: movieGenres
          }
          superagent.get(discoverUrl)
            .query(genreParams)
            .then(genreData => {
              let genreMovieArray = [];
              shuffle(genreData.body.results);
              for (let i = 0; i < genreData.body.results.length; i++) {
                genreMovieArray.push(new Movie(genreData.body.results[i]))
                if (i >= 2) {
                  break;
                }
              }
              let votesParams = {
                api_key: movieKey,
                vote_average: movieVotes
              }
              superagent.get(discoverUrl)
                .query(votesParams)
                .then(votesData => {
                  let votesMovieArray = [];
                  shuffle(votesData.body.results);
                  for (let i = 0; i < votesData.body.results.length; i++) {
                    votesMovieArray.push(new Movie(votesData.body.results[i]))
                    if (i >= 2) {
                      break;
                    }
                  }

                  let finalFrontendArray = [similarMovieArray, genreMovieArray, votesMovieArray, searchedMovie];
                  response.status(200).render('index.ejs', { searchResults: finalFrontendArray });

                }).catch(errorCatch);
            }).catch(errorCatch);
        }).catch(errorCatch);
    }).catch(errorCatch);
}

function titleSearchRoute(request, response) {
  let searchString = request.params.title;
  if (searchString === undefined || searchString === '') {
    response.status(200).redirect('/');
    return;
  }
  let url = 'https://api.themoviedb.org/3/search/movie';
  const movieKey = process.env.MOVIE_API_KEY;
  const searchParams = {
    api_key: movieKey,
    query: searchString,
    limit: 1
  }
  superagent.get(url)
    .query(searchParams)
    .then(searchData => {
      let movieId = searchData.body.results[0].id;
      let movieGenres = searchData.body.results[0].genre_ids;
      let movieVotes = searchData.body.results[0].vote_average;
      let searchedMovie = new Movie(searchData.body.results[0]);
      let idURL = `https://api.themoviedb.org/3/movie/${movieId}/recommendations`;
      let idParams = {
        api_key: movieKey,
        page: 1 // possibly add a random element to the page
      }
      superagent.get(idURL)
        .query(idParams)
        .then(similarData => {
          let similarMovieArray = [];
          for (let i = 0; i < similarData.body.results.length; i++) {
            similarMovieArray.push(new Movie(similarData.body.results[i]))
            if (i >= 2) {
              break;
            }
          }
          let discoverUrl = 'https://api.themoviedb.org/3/discover/movie?';
          let genreParams = {
            api_key: movieKey,
            with_genres: movieGenres
          }
          superagent.get(discoverUrl)
            .query(genreParams)
            .then(genreData => {
              let genreMovieArray = [];
              shuffle(genreData.body.results);
              for (let i = 0; i < genreData.body.results.length; i++) {
                genreMovieArray.push(new Movie(genreData.body.results[i]))
                if (i >= 2) {
                  break;
                }
              }
              let votesParams = {
                api_key: movieKey,
                vote_average: movieVotes
              }
              superagent.get(discoverUrl)
                .query(votesParams)
                .then(votesData => {
                  let votesMovieArray = [];
                  shuffle(votesData.body.results);
                  for (let i = 0; i < votesData.body.results.length; i++) {
                    votesMovieArray.push(new Movie(votesData.body.results[i]))
                    if (i >= 2) {
                      break;
                    }
                  }

                  let finalFrontendArray = [similarMovieArray, genreMovieArray, votesMovieArray, searchedMovie];
                  response.status(200).render('index.ejs', { searchResults: finalFrontendArray });

                }).catch(errorCatch);
            }).catch(errorCatch);
        }).catch(errorCatch);
    }).catch(errorCatch);
}

function gotoFavorites(request, response) {
  let sql = 'SELECT * FROM movies WHERE user_id = ($1) ORDER BY id DESC;';
  let safeValues = [user_id];

  client.query(sql, safeValues)
    .then(sqlResults => {
      let finalFrontendArray = [];
      sqlResults.rows.forEach(value => {
        finalFrontendArray.push(value);
      })
      response.status(200).render('./favorites.ejs', { searchResults: finalFrontendArray });
    }).catch(errorCatch);
}

function gotoWatchlist(request, response) {
  let sql = 'SELECT * FROM watchlist WHERE user_id = ($1) ORDER BY id DESC;';
  let safeValues = [user_id];

  client.query(sql, safeValues)
    .then(sqlResults => {
      let finalFrontendArray = [];
      sqlResults.rows.forEach(value => {
        finalFrontendArray.push(value);
      })
      response.status(200).render('./watchlist.ejs', { searchResults: finalFrontendArray });
    }).catch(errorCatch);
}

function updateUserRating(request, response) {
  let sql = 'UPDATE movies SET user_rating = $1 WHERE movie_id = $2 AND user_id = $3;';
  let safeValues = [request.body.user_rating, request.params.movie_id, user_id];

  client.query(sql, safeValues)
    .then(sqlResults => {
      response.status(200).redirect('back');
    }).catch(errorCatch);
}

function insertIntoFavorites(request, response) {
  //TODO: we still have the id vs movie_id conflict here
  let { popularity, poster_path, id, backdrop_path, title, vote_average, overview, release_date } = request.body;
  let sql = `SELECT title FROM movies WHERE movie_id = ($1);`;
  let safeValues = [id];

  client.query(sql, safeValues)
    .then(sqlResults => {
      if (sqlResults.rowCount > 0) {
        response.status(200).redirect('back');
      } else {
        let sql = `INSERT INTO movies ( popularity, poster_path, movie_id, backdrop_path, title, vote_average, overview, release_date, user_id ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`;
        let safeValues = [popularity, poster_path, id, backdrop_path, title, vote_average, overview, release_date, user_id];

        client.query(sql, safeValues)
          .then(sqlResults => {
            response.status(200).redirect('back');
          }).catch(errorCatch);
      }
    }).catch(errorCatch);
}

function insertIntoWatchlist(request, response) {
  let { popularity, poster_path, id, backdrop_path, title, vote_average, overview, release_date } = request.body;
  let sql = `INSERT INTO watchlist ( popularity, poster_path, movie_id, backdrop_path, title, vote_average, overview, release_date, user_id ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`;
  let safeValues = [popularity, poster_path, id, backdrop_path, title, vote_average, overview, release_date, user_id];

  client.query(sql, safeValues)
    .then(sqlResults => {
      response.status(200).redirect('back');
    }).catch(errorCatch);
}

function deleteFromFavorites(request, response) {
  const sql = 'DELETE FROM movies WHERE movie_id = ($1);';
  const safeValues = [request.params.movie_id]

  client.query(sql, safeValues)
    .then(sqlResults => {
      response.status(200).redirect('/favorites');
    }).catch(errorCatch);

}

function deleteFromWatchlist(request, response) {
  const sql = 'DELETE FROM watchlist WHERE movie_id = ($1);';
  const safeValues = [request.params.movie_id]

  client.query(sql, safeValues)
    .then(sqlResults => {
      response.status(200).redirect('/watchlist');
    }).catch(errorCatch);
}

function Movie(obj) {
  this.popularity = obj.popularity;
  this.vote_count = obj.vote_count;
  this.poster_path = `https://image.tmdb.org/t/p/w500${obj.poster_path}`;
  this.video = obj.video;
  this.id = obj.id; // TODO chance the property into movie_id
  this.movie_id = obj.id;
  this.backdrop_path = `https://image.tmdb.org/t/p/w500${obj.backdrop_path}`;
  this.original_language = obj.original_language;
  this.original_title = obj.original_title;
  this.genre_ids = obj.genre_ids;
  this.title = obj.title;
  this.vote_average = obj.vote_average;
  this.overview = obj.overview;
  if (this.overview.length > 7999) this.overview = this.overview.slice(0, 7999) + '...';
  this.release_date = obj.release_date.slice(0, 4);
  this.user_rating = obj.user_rating;
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
}

function errorCatch(err) {
  console.error(err);
}

function errorRoute(request, response) {
  console.log('Console error message');
  response.status(404).send('Browser error message, you have been 404d!')
}

client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`listening on ${PORT}`);
    })
  }).catch(errorCatch);

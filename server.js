'use strict'

const express = require('express');
const app = express();
const superagent = require('superagent');
require('dotenv').config();

const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => console.error(err));

const PORT = process.env.PORT || 3001;

app.use(express.urlencoded({ extended:true }));
app.use(express.static('./public'));
app.set('view engine', 'ejs');
const methodOverride = require('method-override');
app.use(methodOverride('_method'));

app.get('/', homeRoute);
app.get('/search', searchRoute);
app.get('/search/:title', titleSearchRoute);
app.post('/search', searchRoute);
app.post('/favorites', insertIntoMovies);
app.get('/favorites', gotoFavorites);
app.delete('/favorites/:movie_id', deleteFromFavorites);
app.post('/watchlist', insertIntoWatchlist);
app.get('/watchlist', gotoWatchlist);
app.put('/update/:movie_id', updateUserRating)
app.delete('/watchlist/:movie_id', deleteFromWatchlist);
app.all('*', errorRoute);

function homeRoute(request, response){
  let sql = `SELECT TITLE FROM movies;`;
  client.query(sql)
    .then(sqlResults => {
      let movies = sqlResults.rows;
      shuffle(movies);
      response.status(200).redirect(`/search/${movies[0].title}`);
    }).catch(error => console.error(error))
}

function searchRoute(request, response){
  let searchString = request.body.search;
  let url = 'https://api.themoviedb.org/3/search/movie';
  const movieKey = process.env.MOVIE_API_KEY;
  const searchParams = {
    api_key : movieKey,
    query : searchString,
    limit : 1
  }
  superagent.get(url)
    .query(searchParams)
    .then(searchData => {
      let movieId = searchData.body.results[0].id;
      let movieGenres = searchData.body.results[0].genre_ids;
      let movieVotes = searchData.body.results[0].vote_average;
      let idURL = `https://api.themoviedb.org/3/movie/${movieId}/recommendations`;
      let idParams = {
        api_key : movieKey,
        page : 1
      }
      superagent.get(idURL)
        .query(idParams)
        .then(similarData => {
          let similarMovieArray = [];
          shuffle(similarData.body.results);
          for(let i=0; i<similarData.body.results.length; i++){
            similarMovieArray.push(new Movie(similarData.body.results[i]))
            if(i >= 2) {
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
              for (let i=0; i<genreData.body.results.length; i++){
                genreMovieArray.push(new Movie(genreData.body.results[i]))
                if(i >= 2) {
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
                  for (let i=0; i<votesData.body.results.length; i++){
                    votesMovieArray.push(new Movie(votesData.body.results[i]))
                    if(i >= 2) {
                      break;
                    }
                  }
                  let finalFrontendArray = [similarMovieArray, genreMovieArray, votesMovieArray];
                  response.status(200).render('index.ejs', {searchResults: finalFrontendArray});
                }).catch(errorCatch);
            }).catch(errorCatch);
        }).catch(errorCatch);
    }).catch(errorCatch);
}

function titleSearchRoute(request, response){
  let searchString = request.params.title;
  let url = 'https://api.themoviedb.org/3/search/movie';
  const movieKey = process.env.MOVIE_API_KEY;
  const searchParams = {
    api_key : movieKey,
    query : searchString,
    limit : 1
  }
  superagent.get(url)
    .query(searchParams)
    .then(searchData => {
      let movieId = searchData.body.results[0].id;
      let movieGenres = searchData.body.results[0].genre_ids;
      let movieVotes = searchData.body.results[0].vote_average;
      let idURL = `https://api.themoviedb.org/3/movie/${movieId}/recommendations`;
      let idParams = {
        api_key : movieKey,
        page : 1 // possibly add a random element to the page
      }
      superagent.get(idURL)
        .query(idParams)
        .then(similarData => {
          let similarMovieArray = [];
          for(let i=0; i<similarData.body.results.length; i++){
            similarMovieArray.push(new Movie(similarData.body.results[i]))
            if(i >= 2) {
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
              for ( let i = 0; i < genreData.body.results.length; i++){
                genreMovieArray.push(new Movie(genreData.body.results[i]))
                if( i >= 2 ) {
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
                  for ( let i = 0; i < votesData.body.results.length; i++) {
                    votesMovieArray.push(new Movie(votesData.body.results[i]))
                    if( i >= 2 ) {
                      break;
                    }
                  }
                  let finalFrontendArray = [similarMovieArray, genreMovieArray, votesMovieArray];
                  response.status(200).render('index.ejs', {searchResults: finalFrontendArray});
                }).catch(errorCatch);
            }).catch(errorCatch);
        }).catch(errorCatch);
    }).catch(errorCatch);
}

function gotoFavorites(request, response){
  let userId = 1;
  let sql = 'SELECT * FROM movies WHERE user_id = ($1);';
  let safeValues = [userId];

  client.query(sql, safeValues)
    .then(sqlResults => {
      let finalFrontendArray = [];
      sqlResults.rows.forEach(value => {
        finalFrontendArray.push(value);
      })
      response.status(200).render('./favorites.ejs', {searchResults: finalFrontendArray});
    }).catch(errorCatch);
}

function gotoWatchlist(request, response){
  let userId = 1;
  let sql = 'SELECT * FROM watchlist WHERE user_id = ($1);';
  let safeValues = [userId];

  client.query(sql, safeValues)
    .then(sqlResults => {
      let finalFrontendArray = [];
      sqlResults.rows.forEach(value => {
        finalFrontendArray.push(value);
      })
      response.status(200).render('./watchlist.ejs', {searchResults: finalFrontendArray});
    }).catch(errorCatch);
}


function updateUserRating(request, response) {
  let user_rating = request.body.user_rating;
  let movie_id = request.params.movie_id;
  // console.log("here" + request.body.user_rating);
  // console.log('there' + request.params.movie_id);
  let user_id = 1;
  let sql = 'UPDATE movies SET user_rating = $1 WHERE movie_id = $2 AND user_id = $3;';
  let safeValues = [ user_rating, movie_id, user_id ];
  
  client.query(sql, safeValues)
    .then(sqlResults => {
      response.status(200).redirect('back');
    }).catch(errorCatch);
}

function insertIntoMovies(request, response) {
  let user_id = 1;
  let {popularity, poster_path, id, backdrop_path, title, vote_average, overview, release_date} = request.body;
  let sql = `INSERT INTO movies ( popularity, poster_path, movie_id, backdrop_path, title, vote_average, overview, release_date, user_id ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`;
  let safeValues = [popularity, poster_path, id, backdrop_path, title, vote_average, overview, release_date, user_id];

  client.query(sql, safeValues)
    .then(sqlResults => {
      response.status(200).redirect('back');
    }).catch(errorCatch);
}

function insertIntoWatchlist(request, response) {
  let user_id = 1;
  let { popularity, poster_path, id, backdrop_path, title, vote_average, overview, release_date } = request.body;
  let sql = `INSERT INTO watchlist ( popularity, poster_path, movie_id, backdrop_path, title, vote_average, overview, release_date, user_id ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`;
  let safeValues = [ popularity, poster_path, id, backdrop_path, title, vote_average, overview, release_date, user_id ];

  client.query(sql, safeValues)
    .then(sqlResults => {
      response.status(200).redirect('back');
    }).catch(errorCatch);
}

function deleteFromFavorites(request, response){
  const sql = 'DELETE FROM movies WHERE movie_id = ($1);';
  const safeValues = [request.params.movie_id]

  client.query(sql, safeValues)
    .then(sqlResults => {
      let user_id = 1;
      let sql = 'SELECT * FROM movies WHERE user_id = ($1);';
      let safeValues = [user_id];

      client.query(sql, safeValues)
        .then(sqlResults2 => {
          let finalFrontendArray = [];
          sqlResults2.rows.forEach(value => {
            finalFrontendArray.push(value);
          })
          response.status(200).render('./favorites.ejs', {searchResults: finalFrontendArray});
        }).catch(errorCatch);
    }).catch(errorCatch);
}

function deleteFromWatchlist(request, response){
  const sql = 'DELETE FROM watchlist WHERE movie_id = ($1);';
  const safeValues = [request.params.movie_id]

  client.query(sql, safeValues)
    .then(sqlResults => {
      let userId = 1;
      let sql = 'SELECT * FROM watchlist WHERE user_id = ($1);';
      let safeValues = [userId];

      client.query(sql, safeValues)
        .then(sqlResults2 => {
          let finalFrontendArray = [];
          sqlResults2.rows.forEach(value => {
            finalFrontendArray.push(value);
          })
          response.status(200).render('./watchlist.ejs', {searchResults: finalFrontendArray});
        }).catch(errorCatch);
    }).catch(errorCatch);
}

function Movie(obj) {
  this.popularity = obj.popularity;
  this.vote_count = obj.vote_count;
  this.poster_path = `https://image.tmdb.org/t/p/w200${obj.poster_path}`;
  this.video = obj.video;
  this.id = obj.id; // TODO chance the property into movie_id
  this.backdrop_path = `https://image.tmdb.org/t/p/w200${obj.backdrop_path}`;
  this.original_language = obj.original_language;
  this.original_title = obj.original_title;
  this.genre_ids = obj.genre_ids;
  this.title = obj.title;
  this.vote_average = obj.vote_average;
  this.overview = obj.overview;
  if(this.overview.length > 254) this.overview = this.overview.slice(0, 250)+'...';
  this.release_date = obj.release_date;
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

function errorCatch(err){
  console.error(err);
}

function errorRoute(request, response){
  console.log('Console error message');
  response.status(404).send('Browser error message, you have been 404d!')
}

client.connect()
.then(() => {
  app.listen(PORT, () => {
    console.log(`listening on ${PORT}`);
  })
}).catch(errorCatch);

'use strict'

// Import Express
const express = require('express');
const app = express();

// Import Superagent
const superagent = require('superagent');

// Import Dotenv
require('dotenv').config();

// Import PG
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => console.error(err));

// On this port
const PORT = process.env.PORT || 3001;

// Use Middleware
app.use(express.urlencoded({extended:true}));
app.use(express.static('./public'));
app.set('view engine', 'ejs');
const methodOverride = require('method-override');
app.use(methodOverride('_method'));

// Routes
app.get('/', homeRoute);
app.get('/search', searchRoute);
app.get('/search/:title', titleSearchRoute);
app.post('/search', searchRoute);
app.post('/favorites', insertIntoMovies); // here we'll incorporate the insertIntoMovies function
app.get('/favorites', gotoFavorites);
app.post('/watchlist', insertIntoWatchlist);
app.get('/watchlist', gotoWatchlist);
app.all('*', errorRoute);

// Home Route Function
function homeRoute(request, response){
  let sql = `SELECT TITLE FROM movies;`;
  client.query(sql)
    .then(sqlResults => {
      let movies = sqlResults.rows;
      shuffle(movies);
      // console.log(movies[0].title);
      response.status(200).redirect(`/search/${movies[0].title}`);
    }).catch(error => console.error(error))
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

// Initial search function
function searchRoute(request, response){
  let searchString = request.body.search;
  let url = 'https://api.themoviedb.org/3/search/movie';
  const movieKey = process.env.MOVIE_API_KEY;
  const searchParams = {
    api_key : movieKey,
    query : searchString,
    limit : 1
  }

  // 1st superagent call - Initial call to get the ID, Genres, and votes
  superagent.get(url)
    .query(searchParams)
    .then(searchData => {
      // console.log(searchData.body.results[0]);
      let movieId = searchData.body.results[0].id;
      let movieGenres = searchData.body.results[0].genre_ids;
      let movieVotes = searchData.body.results[0].vote_average;
      let idURL = `https://api.themoviedb.org/3/movie/${movieId}/recommendations`;
      let idParams = {
        api_key : movieKey,
        page : 1 // possibly add a random element to the page
      }

      // 2nd super agent call - Get the similar movies and put them into an array
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
          // console.log('this is the output', similarMovieArray);
          let discoverUrl = 'https://api.themoviedb.org/3/discover/movie?';
          let genreParams = {
            api_key: movieKey,
            with_genres: movieGenres
          }

          // 3rd super agent call - Get the same genre movies and put them into an array
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
              // console.log('this is genre output', genreMovieArray)
              let votesParams = {
                api_key: movieKey,
                vote_average: movieVotes
              }

              // 4th super agent call - Get the similar voted movies and put them into an array
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
                  // console.log('this is votes output', votesMovieArray)
                  let finalFrontendArray = [similarMovieArray, genreMovieArray, votesMovieArray];
                  // console.log('this is final frontend array', finalFrontendArray);
                  response.status(200).render('index.ejs', {searchResults: finalFrontendArray});
                }).catch(errorCatch);
            }).catch(errorCatch);
        }).catch(errorCatch);
    }).catch(errorCatch);

}

// Search route based off of user's click
function titleSearchRoute(request, response){
  let searchString = request.params.title;
  console.log('here', searchString);
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
      // console.log(searchData.body.results[0]);
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
          // console.log('this is the output', similarMovieArray);
          let discoverUrl = 'https://api.themoviedb.org/3/discover/movie?';
          let genreParams = {
            api_key: movieKey,
            with_genres: movieGenres
          }
          superagent.get(discoverUrl)
            .query(genreParams)
            .then(genreData => {
              let genreMovieArray = [];
              for (let i=0; i<genreData.body.results.length; i++){
                genreMovieArray.push(new Movie(genreData.body.results[i]))
                if(i >= 2) {
                  break;
                }
              }
              // console.log('this is genre output', genreMovieArray)
              let votesParams = {
                api_key: movieKey,
                vote_average: movieVotes
              }
              superagent.get(discoverUrl)
                .query(votesParams)
                .then(votesData => {
                  let votesMovieArray = [];
                  for (let i=0; i<votesData.body.results.length; i++){
                    votesMovieArray.push(new Movie(votesData.body.results[i]))
                    if(i >= 2) {
                      break;
                    }
                  }
                  // console.log('this is votes output', votesMovieArray)
                  let finalFrontendArray = [similarMovieArray, genreMovieArray, votesMovieArray];
                  // console.log('this is final frontend array', finalFrontendArray);
                  response.status(200).render('index.ejs', {searchResults: finalFrontendArray});
                }).catch(errorCatch);
            }).catch(errorCatch);
        }).catch(errorCatch);
    }).catch(errorCatch);
}

function gotoFavorites(request, response){
  console.log('Going to Favorites');

  let userId = 1;

  let sql = 'SELECT * FROM movies WHERE user_id = ($1);';

  let safeValues = [userId];

  client.query(sql, safeValues)
    .then(sqlResults => {
      let finalFrontendArray = [];
      sqlResults.rows.forEach(value => {
        finalFrontendArray.push(value);
      })
      console.log(finalFrontendArray);
      response.status(200).render('./favorites.ejs', {searchResults: finalFrontendArray});
    }).catch(errorCatch);

}

function gotoWatchlist(request, response){
  console.log('Going to watchlist');

  let userId = 1;

  let sql = 'SELECT * FROM watchlist WHERE user_id = ($1);';

  let safeValues = [userId];

  client.query(sql, safeValues)
    .then(sqlResults => {
      let finalFrontendArray = [];
      sqlResults.rows.forEach(value => {
        finalFrontendArray.push(value);
      })
      console.log(finalFrontendArray);
      response.status(200).render('./watchlist.ejs', {searchResults: finalFrontendArray});
    }).catch(errorCatch);
}

// 404 route
function errorRoute(request, response){
  console.log('Console error message');
  response.status(404).send('Browser error message, you have been 404d!')
}

// Message for catches
function errorCatch(err){
  console.error(err);
}

// Constructor function
function Movie(obj) {
  this.popularity = obj.popularity;
  this.vote_count = obj.vote_count;
  this.poster_path = `https://image.tmdb.org/t/p/w200${obj.poster_path}`;
  this.video = obj.video;
  this.id = obj.id;
  this.backdrop_path = `https://image.tmdb.org/t/p/w200${obj.backdrop_path}`;
  this.original_language = obj.original_language;
  this.original_title = obj.original_title;
  this.genre_ids = obj.genre_ids;
  this.title = obj.title;
  this.vote_average = obj.vote_average;
  this.overview = obj.overview;
  if(this.overview.length > 254) this.overview = this.overview.slice(0, 250)+'...';
  this.release_date = obj.release_date;
}


function insertIntoMovies(request, response) {
  // this function will insert a movie into the database and assign it to a user as a favorite
  // this user id will later be updated with the real id
  let user_id = 1;
  console.log('1:', request.body);
  let {popularity, poster_path, id, backdrop_path, title, vote_average, overview, release_date} = request.body;
  console.log('this is the object from insert into Movies function', request.body);
  let sql = `INSERT INTO movies ( popularity, poster_path, movie_id, backdrop_path, title, vote_average, overview, release_date, user_id ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`;
  let safeValues = [popularity, poster_path, id, backdrop_path, title, vote_average, overview, release_date, user_id];

  console.log('here: ', safeValues);

  client.query(sql, safeValues)
    .then(sqlResults => {
      response.status(200);
    });
}

function insertIntoWatchlist(request, response) {
  // this function will insert a movie into the database and assign it to a user as a favorite
  // this user id will later be updated with the real id
  let user_id = 1;
  let {popularity, poster_path, id, backdrop_path, title, vote_average, overview, release_date} = request.body;
  console.log('this is the object from insert into Movies function', request.body);
  let sql = `INSERT INTO watchlist ( popularity, poster_path, movie_id, backdrop_path, title, vote_average, overview, release_date, user_id ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`;
  let safeValues = [popularity, poster_path, id, backdrop_path, title, vote_average, overview, release_date, user_id];

  client.query(sql, safeValues)
    .then(sqlResults => {
      response.status(200);
    });
}


// Start pg and start server
client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`listening on ${PORT}`);
    })
  }).catch(errorCatch);


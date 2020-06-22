'use strict'

const express = require('express');
const app = express();
const superagent = require('superagent');
require('dotenv').config();
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => console.error(err));
const PORT = process.env.PORT || 3001;
app.use(express.urlencoded({extended:true}));
app.use(express.static('public'));
app.set('view engine', 'ejs');
const methodOverride = require('method-override');
app.use(methodOverride('_method'));

app.get('/', homeRoute);
app.get('/search', searchRoute);
app.all('*', errorRoute);

function homeRoute(request, response){
  console.log('I am on the console');
  response.status(200).send('I am on the browser');
}

function searchRoute(request, response){
  let searchString = 'detective pikachu';
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
                  console.log('this is final frontend array', finalFrontendArray);
                  response.status(200).render('index.ejs', {searchResults: finalFrontendArray});
                }).catch(errorCatch);
            }).catch(errorCatch);
        }).catch(errorCatch);
    }).catch(errorCatch);

}

function errorRoute(request, response){
  console.log('Console error message');
  response.status(404).send('Browser error message, you have been 404d!')
}

function errorCatch(err){
  console.error(err);
}

function Movie(obj) {
  this.popularity = obj.popularity;
  this.vote_count = obj.vote_count;
  this.poster_path = `https://image.tmdb.org/t/p/w500/${obj.poster_path}`;
  this.video = obj.video;
  this.id = obj.id;
  this.backdrop_path = `https://image.tmdb.org/t/p/w500/${obj.backdrop_path}`;
  this.original_language = obj.original_language;
  this.original_title = obj.original_title;
  this.genre_ids = obj.genre_ids;
  this.title = obj.title;
  this.vote_average = obj.vote_average;
  this.overview = obj.overview;
  if(this.overview.length > 254) this.overview = this.overview.slice(0, 250)+'...';
  this.release_date = obj.release_date;

}

client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`listening on ${PORT}`);
    })
  }).catch(errorCatch);


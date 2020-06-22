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

  superagent(url)
    .query(searchParams)
    .then(searchData => {
      console.log(searchData.body.results[0]);
      let movieId = searchData.body.results[0].id;
      let movieGenres = searchData.body.results[0].genre_ids;
      let movieVotes = searchData.body.results[0].vote_average;
      let idURL = `https://api.themoviedb.org/3/movie/${movieId}/recommendations`;
      let idParams = {
        api_key : movieKey,
        page : 1 // possibly add a random element to the page
      }
      superagent.get(idURL)
    })``
}

function errorRoute(request, response){
  console.log('Console error message');
  response.status(404).send('Browser error message, you have been 404d!')
}

function errorCatch(err){
  console.error(err);
}

client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`listening on ${PORT}`);
    })
  }).catch(errorCatch);


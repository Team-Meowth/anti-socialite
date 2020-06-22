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
app.all('*', errorRoute);

function homeRoute(request, response){
  console.log('I am on the console');
  response.status(200).send('I am on the browser');
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


DROP TABLE IF EXISTS users CASCADE;
-- DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS movies CASCADE;
DROP TABLE IF EXISTS cache_of_movies CASCADE;

CREATE TABLE users ( 
  id SERIAL PRIMARY KEY, 
  created_at TIMESTAMP, 
  username VARCHAR(255)
);

CREATE TABLE movies (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP, 
  url_to_favorite_item VARCHAR(255),
  popularity real,
  vote_count int,
  video boolean,
  poster_path VARCHAR(255),
  movie_id INT UNIQUE,
  adult boolean,
  backdrop_path VARCHAR(255),
  original_language VARCHAR(255),
  original_title VARCHAR(255),
  genre_ids integer,
  title VARCHAR(255),
  vote_average REAL,
  overview VARCHAR(8000),
  release_date DATE,
  user_id INT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- CREATE TABLE favorites (
--   id SERIAL PRIMARY KEY,
--   url_to_favorite_item int,
--   user_id INT NOT NULL,
--   FOREIGN KEY (user_id) REFERENCES users(id)
-- );

CREATE TABLE cache_of_movies (
  id SERIAL PRIMARY KEY,
  movie_url VARCHAR(255),
  movie_id INT,
  FOREIGN KEY (movie_id) REFERENCES movies(movie_id),
  url_to_favorite_item int
);

-- SELECT * FROM favorites JOIN users ON favorites.user_id = users.id;

SELECT * FROM movies JOIN users ON movies.user_id = users.id;

SELECT * FROM movies JOIN cache_of_movies ON movies.movie_id = cache_of_movies.movie_id;


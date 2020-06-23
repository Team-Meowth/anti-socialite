DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS movies;

CREATE TABLE users ( 
  user_id SERIAL PRIMARY KEY, 
  created_at TIMESTAMP, 
  username VARCHAR(255)
);

CREATE TABLE favorites (
  user_id int references users(user_id),
  url_to_favorite_item int
)

CREATE TABLE movies (
  url_to_favorite_item int references favorites(url_to_favorite_item),
  created_at TIMESTAMP, 
  url_to_favorite_item VARCHAR(255),
  popularity real,
  vote_count int,
  video boolean,
  poster_path VARCHAR(255),
  id int,
  adult boolean,
  backdrop_path VARCHAR(255),
  original_language VARCHAR(255),
  original_title VARCHAR(255),
  genre_ids integer,
  title VARCHAR(255),
  vote_average REAL,
  overview VARCHAR(8000),
  release_date DATE
);

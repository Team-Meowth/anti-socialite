DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS movies CASCADE;
DROP TABLE IF EXISTS watchlist CASCADE;


CREATE TABLE users ( 
  id SERIAL PRIMARY KEY,  
  username VARCHAR(255)
);

CREATE TABLE movies (
  id SERIAL PRIMARY KEY,
  popularity real,
  poster_path VARCHAR(255),
    backdrop_path VARCHAR(255),
  movie_id INT,
  title VARCHAR(255),
  vote_average REAL,
  overview VARCHAR(8000),
  release_date DATE,
  user_rating INT,
  user_id INT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE watchlist (
  id SERIAL PRIMARY KEY,
  popularity real,
  poster_path VARCHAR(255),
  movie_id INT,
  backdrop_path VARCHAR(255),
  title VARCHAR(255),
  vote_average REAL,
  overview VARCHAR(8000),
  release_date DATE,
  user_id INT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

SELECT * FROM movies JOIN users ON movies.user_id = users.id;
SELECT * FROM watchlist JOIN users ON watchlist.user_id = users.id;

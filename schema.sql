DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS movies CASCADE;


CREATE TABLE users ( 
  id SERIAL PRIMARY KEY,  
  username VARCHAR(255)
);

CREATE TABLE movies (
  id SERIAL PRIMARY KEY,
  popularity real,
  -- vote_count int,
  -- video boolean,
  poster_path VARCHAR(255),
  movie_id INT,
  -- adult boolean,
  backdrop_path VARCHAR(255),
  -- original_language VARCHAR(255),
  -- original_title VARCHAR(255),
  -- genre_ids integer,
  title VARCHAR(255),
  vote_average REAL,
  overview VARCHAR(8000),
  release_date DATE,
  user_id INT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

SELECT * FROM movies JOIN users ON movies.user_id = users.id;

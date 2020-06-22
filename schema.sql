DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS favorites;

CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  created_at TIMESTAMP, 
  username VARCHAR(255)
)

CREATE TABLE favorites (
  favorite_id int references users.favorite_id,
  created_at TIMESTAMP, 
  url_id VARCHAR(255)
);

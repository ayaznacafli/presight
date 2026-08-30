-- ---------------------------------------------------------------------------
-- Presight People Directory — relational schema
--
-- `hobbies` is normalised into its own table (rather than a JSON/CSV column on
-- `users`) because every hard requirement leans on it:
--   * "match users who have ALL selected hobbies" -> GROUP BY / HAVING COUNT
--   * "top 20 hobbies with counts for the current result set" -> GROUP BY
--   * both need an index-backed join, which a serialised column cannot give.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  id          INTEGER PRIMARY KEY,
  avatar      TEXT    NOT NULL,
  first_name  TEXT    NOT NULL,
  last_name   TEXT    NOT NULL,
  age         INTEGER NOT NULL CHECK (age >= 0 AND age < 200),
  nationality TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS hobbies (
  id   INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Join table. 0..10 rows per user, enforced at seed time.
CREATE TABLE IF NOT EXISTS user_hobbies (
  user_id  INTEGER NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  hobby_id INTEGER NOT NULL REFERENCES hobbies(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, hobby_id)
) WITHOUT ROWID;

-- Sort columns carry `id` as a trailing key so the deterministic
-- "ORDER BY <col>, id" tie-break can be served straight from the index.
CREATE INDEX IF NOT EXISTS idx_users_first_name  ON users (first_name, id);
CREATE INDEX IF NOT EXISTS idx_users_last_name   ON users (last_name, id);
CREATE INDEX IF NOT EXISTS idx_users_age         ON users (age, id);
CREATE INDEX IF NOT EXISTS idx_users_nationality ON users (nationality, id);

-- Reverse direction of the PK, for "which users have hobby X" lookups.
CREATE INDEX IF NOT EXISTS idx_user_hobbies_hobby ON user_hobbies (hobby_id, user_id);

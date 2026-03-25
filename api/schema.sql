-- PomoGrove Database Schema

-- Users Table
CREATE TABLE users (
    uid            VARCHAR(255) PRIMARY KEY,
    display_name   VARCHAR(100) NOT NULL,
    photo_url      TEXT,
    bio            TEXT DEFAULT 'A student in the grove',
    level          INTEGER DEFAULT 1,
    streak         INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    xp_pomodoro    INTEGER DEFAULT 0,
    xp_note        INTEGER DEFAULT 0,
    xp_recall      INTEGER DEFAULT 0,
    xp_total       INTEGER DEFAULT 0,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quizzes Table
CREATE TABLE quizzes (
    id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_uid VARCHAR(255) REFERENCES users(uid) ON DELETE CASCADE,
    title    VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Flashcards Table
CREATE TABLE flashcards (
    id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id  UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer   TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notes Table
CREATE TABLE notes (
    id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_uid VARCHAR(255) REFERENCES users(uid) ON DELETE CASCADE,
    title    VARCHAR(255) NOT NULL,
    content  TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily Stats for Streak Chart
CREATE TABLE daily_stats (
    id           SERIAL PRIMARY KEY,
    user_uid     VARCHAR(255) REFERENCES users(uid) ON DELETE CASCADE,
    stat_date    DATE DEFAULT CURRENT_DATE,
    session_count INTEGER DEFAULT 0,
    UNIQUE(user_uid, stat_date)
);

-- Playlists
CREATE TABLE IF NOT EXISTS playlists (
    id         SERIAL PRIMARY KEY,
    user_uid   TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Playlist Items (YouTube links)
CREATE TABLE IF NOT EXISTS playlist_items (
    id          SERIAL PRIMARY KEY,
    playlist_id INT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    youtube_id  TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
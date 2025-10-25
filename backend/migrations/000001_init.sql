-- +goose Up
-- +goose StatementBegin

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS meetings (
                                        id             TEXT PRIMARY KEY,                   -- короткий slug/base36 id
                                        title          TEXT,
                                        category       TEXT NOT NULL,
                                        status         TEXT NOT NULL DEFAULT 'collecting',
                                        transport      TEXT NOT NULL DEFAULT 'pedestrian',
                                        created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
    );

CREATE TABLE IF NOT EXISTS participants (
                                            id             TEXT PRIMARY KEY,                   -- clientId (uuid)
                                            meeting_id     TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    nickname       TEXT NOT NULL,
    address        TEXT NOT NULL,
    coords_lon     DOUBLE PRECISION NOT NULL,
    coords_lat     DOUBLE PRECISION NOT NULL,
    depart_at      TIME NOT NULL,
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
    );
CREATE INDEX IF NOT EXISTS idx_participants_meeting ON participants(meeting_id);

CREATE TABLE IF NOT EXISTS zones (
                                     meeting_id     TEXT PRIMARY KEY REFERENCES meetings(id) ON DELETE CASCADE,
    center_lon     DOUBLE PRECISION NOT NULL,
    center_lat     DOUBLE PRECISION NOT NULL,
    polygon        JSONB NOT NULL,
    max_wait_min   INTEGER NOT NULL,
    mean_wait_min  INTEGER NOT NULL,
    meeting_eta    INTEGER NOT NULL,
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
    );

CREATE TABLE IF NOT EXISTS candidates (
                                          id             TEXT PRIMARY KEY,                   -- <meeting_id>:<poi_id>
                                          meeting_id     TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    poi_id         TEXT NOT NULL,
    name           TEXT NOT NULL,
    address        TEXT,
    coords_lon     DOUBLE PRECISION NOT NULL,
    coords_lat     DOUBLE PRECISION NOT NULL,
    score          DOUBLE PRECISION NOT NULL,
    eta_by_user    JSONB NOT NULL,
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
    );
CREATE INDEX IF NOT EXISTS idx_candidates_meeting ON candidates(meeting_id);

-- +goose StatementEnd


-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS candidates;
DROP TABLE IF EXISTS zones;
DROP TABLE IF EXISTS participants;
DROP TABLE IF EXISTS meetings;
-- +goose StatementEnd

-- +goose Up
-- +goose StatementBegin
CREATE OR REPLACE FUNCTION touch_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_meetings_updated
    BEFORE UPDATE ON meetings
    FOR EACH ROW EXECUTE PROCEDURE touch_updated_at_column();

CREATE TRIGGER trg_participants_updated
    BEFORE UPDATE ON participants
    FOR EACH ROW EXECUTE PROCEDURE touch_updated_at_column();

CREATE TRIGGER trg_zones_updated
    BEFORE UPDATE ON zones
    FOR EACH ROW EXECUTE PROCEDURE touch_updated_at_column();

CREATE TRIGGER trg_candidates_updated
    BEFORE UPDATE ON candidates
    FOR EACH ROW EXECUTE PROCEDURE touch_updated_at_column();
-- +goose StatementEnd


-- +goose Down
-- +goose StatementBegin
DROP TRIGGER IF EXISTS trg_meetings_updated ON meetings;
DROP TRIGGER IF EXISTS trg_participants_updated ON participants;
DROP TRIGGER IF EXISTS trg_zones_updated ON zones;
DROP TRIGGER IF EXISTS trg_candidates_updated ON candidates;
DROP FUNCTION IF EXISTS touch_updated_at_column;
-- +goose StatementEnd

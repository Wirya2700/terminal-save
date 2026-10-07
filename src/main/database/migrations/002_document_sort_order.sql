ALTER TABLE documents ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
UPDATE documents SET sort_order = id;

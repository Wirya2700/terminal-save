-- Ensure unique constraint on notes(document_id) for UPSERT ON CONFLICT support
DELETE FROM notes
WHERE id NOT IN (
    SELECT MAX(id)
    FROM notes
    GROUP BY document_id
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_notes_document_id
ON notes(document_id);

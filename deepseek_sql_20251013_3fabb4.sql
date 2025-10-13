-- Tabella principale giornate di lavoro
CREATE TABLE giornate_lavoro (
    id SERIAL PRIMARY KEY,
    operaio_id INTEGER REFERENCES operai(id),
    cantiere_id INTEGER REFERENCES cantieri(id),
    data DATE NOT NULL,
    ora_inizio TIME NOT NULL,
    ora_fine TIME NOT NULL,
    ore_lavorate DECIMAL(4,2),
    stato VARCHAR(20) DEFAULT 'pianificato', -- pianificato/completato/assente
    note TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(operaio_id, data) -- Un operaio può lavorare solo in un cantiere per giorno
);

-- Indici per performance
CREATE INDEX idx_giornate_data ON giornate_lavoro(data);
CREATE INDEX idx_giornate_operaio ON giornate_lavoro(operaio_id);
CREATE INDEX idx_giornate_cantiere ON giornate_lavoro(cantiere_id);
CREATE INDEX idx_giornate_operaio_data ON giornate_lavoro(operaio_id, data);
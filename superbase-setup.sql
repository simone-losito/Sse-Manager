-- Script di setup per Supabase - Sse Manager 1.6.4

-- Tabella operai
CREATE TABLE IF NOT EXISTS operai (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    telefono TEXT NOT NULL,
    specializzazione TEXT NOT NULL,
    livello INTEGER NOT NULL,
    cantiere_id BIGINT,
    avatar TEXT,
    preposto BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabella cantieri
CREATE TABLE IF NOT EXISTS cantieri (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    indirizzo TEXT NOT NULL,
    tipo TEXT NOT NULL,
    coordinate_x INTEGER DEFAULT 100,
    coordinate_y INTEGER DEFAULT 100,
    time_slot_start TIME DEFAULT '08:00',
    time_slot_end TIME DEFAULT '17:00',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabella assegnazioni operai-cantieri
CREATE TABLE IF NOT EXISTS assegnazioni_operai (
    id BIGSERIAL PRIMARY KEY,
    operaio_id BIGINT REFERENCES operai(id) ON DELETE CASCADE,
    cantiere_id BIGINT REFERENCES cantieri(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(operaio_id, cantiere_id)
);

-- Inserimento dati iniziali operai
INSERT INTO operai (nome, email, telefono, specializzazione, livello, cantiere_id, avatar, preposto) VALUES
('Marco Rossi', 'marco.rossi@standardse.it', '333-1234567', 'Elettricista', 5, 1, '⚡', true),
('Giuseppe Bianchi', 'giuseppe.bianchi@standardse.it', '335-2345678', 'Meccanico', 4, 1, '🔧', false),
('Antonio Verde', 'antonio.verde@standardse.it', '338-3456789', 'Elettricista', 3, 2, '⚡', false),
('Francesco Neri', 'francesco.neri@standardse.it', '339-4567890', 'Meccanico', 5, 2, '🔧', true),
('Luigi Viola', 'luigi.viola@standardse.it', '340-5678901', 'Elettricista', 2, NULL, '⚡', false),
('Salvatore Blu', 'salvatore.blu@standardse.it', '346-6789012', 'Meccanico', 3, NULL, '🔧', false)
ON CONFLICT DO NOTHING;

-- Inserimento dati iniziali cantieri
INSERT INTO cantieri (nome, indirizzo, tipo, coordinate_x, coordinate_y, time_slot_start, time_slot_end) VALUES
('Palazzo Roma Centro', 'Via Roma 123, Roma', 'Civile', 150, 200, '08:00', '17:00'),
('Impianto Industriale Ostia', 'Via del Mare 45, Ostia', 'Industriale', 400, 300, '07:00', '16:00'),
('Ristrutturazione Trastevere', 'Viale Trastevere 78, Roma', 'Residenziale', 300, 150, '08:30', '17:30')
ON CONFLICT DO NOTHING;

-- Abilita RLS (Row Level Security) per sicurezza
ALTER TABLE operai ENABLE ROW LEVEL SECURITY;
ALTER TABLE cantieri ENABLE ROW LEVEL SECURITY;
ALTER TABLE assegnazioni_operai ENABLE ROW LEVEL SECURITY;

-- Politiche di sicurezza (modifica secondo le tue esigenze)
CREATE POLICY "Allow all operations for authenticated users" ON operai FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON cantieri FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON assegnazioni_operai FOR ALL USING (true);
# 🏗️ Sse Manager - Versione 1.6.4

## 🆕 Novità della Versione 1.6.4 - Database Integration + Custom Time Slots

### ✅ NUOVE FUNZIONALITÀ PRINCIPALI

#### 🗄️ **Integrazione Database Supabase**
- **Connessione bidirezionale** con database cloud Supabase
- **Sincronizzazione automatica** dei dati in tempo reale
- **Configurazione database** direttamente dall'interfaccia manager
- **Fallback locale** in caso di disconnessione

#### ⏰ **Fasce Orarie Personalizzate per Dipendente**
- **Orari individuali** per ogni operaio su ogni giorno selezionato
- **Tasto "Stesso orario per tutti"** per applicare orario standard a tutti i dipendenti
- **Pianificazione avanzata** con calendario interattivo
- **Conservazione turni** nel database per almeno un anno

#### 📊 **Menu Database nell'Interfaccia Manager**
- **Tab dedicato** nelle impostazioni per la configurazione Supabase
- **Test connessione** in tempo reale
- **Stato connessione** visibile nell'interfaccia
- **Sincronizzazione manuale** su richiesta

#### 💾 **Gestione Dati Migliorata**
- **Conservazione dati** per almeno un anno (configurabile fino a 2 anni)
- **Database prioritario** per operai, cantieri e turni di lavoro
- **Backup automatico** locale come fallback
- **Pulizia automatica** dei dati obsoleti

---

## 📋 Struttura Database Supabase Richiesta

### Tabelle Necessarie:

#### 🧑‍🔧 **Tabella `operai`**
```sql
CREATE TABLE operai (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefono VARCHAR(50),
    specializzazione VARCHAR(100) NOT NULL,
    livello INTEGER CHECK (livello >= 1 AND livello <= 5),
    cantiere INTEGER REFERENCES cantieri(id),
    avatar VARCHAR(10) DEFAULT '👷',
    preposto BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 🏗️ **Tabella `cantieri`**
```sql
CREATE TABLE cantieri (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    indirizzo TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    x FLOAT DEFAULT 0,
    y FLOAT DEFAULT 0,
    operai INTEGER[] DEFAULT '{}',
    calendar_selections JSONB DEFAULT '{}',
    time_slot JSONB DEFAULT '{"start": "08:00", "end": "17:00"}',
    operai_time_slots JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### ⏰ **Tabella `turni_lavoro`**
```sql
CREATE TABLE turni_lavoro (
    id VARCHAR(255) PRIMARY KEY,
    cantiere_id INTEGER REFERENCES cantieri(id),
    operaio_id INTEGER REFERENCES operai(id),
    data DATE NOT NULL,
    ora_inizio TIME NOT NULL,
    ora_fine TIME NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 👥 **Tabella `users`**
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('master', 'manager', 'operaio')),
    operaio_id INTEGER REFERENCES operai(id),
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🚀 Come Configurare il Database

### 1. **Crea un Progetto Supabase**
- Vai su [supabase.com](https://supabase.com)
- Crea un nuovo progetto
- Annota l'URL del progetto e la chiave anon/public

### 2. **Crea le Tabelle**
- Usa l'SQL Editor di Supabase
- Esegui gli script SQL sopra indicati
- Verifica che tutte le tabelle siano create correttamente

### 3. **Configura l'Applicazione**
- Accedi come Master (`master` / `Sse19731973!`)
- Vai in **Menu → Impostazioni → Database**
- Inserisci l'**URL Supabase** del tuo progetto
- Inserisci la **Anon Key** del tuo progetto
- Clicca **"Test Connessione"** per verificare
- Salva la configurazione

### 4. **Sincronizzazione Automatica**
- Una volta configurato, l'app sincronizzerà automaticamente:
  - ✅ Operai creati, modificati, eliminati
  - ✅ Cantieri creati, modificati, spostati
  - ✅ Turni di lavoro pianificati
  - ✅ Utenti del sistema
- I dati vengono conservati per **365 giorni** (configurabile)

---

## 🎯 COME USARE LE NUOVE FUNZIONALITÀ

### ⏰ **Fasce Orarie Personalizzate**

1. **Apri un Cantiere**
   - Clicca su un cantiere nella mappa
   - Si aprirà il modal dei dettagli

2. **Seleziona i Giorni**
   - Usa il calendario per selezionare i giorni di lavoro
   - Ogni giorno selezionato diventa verde

3. **Imposta Orari Personalizzati**
   - Per ogni giorno selezionato, apparirà la sezione orari
   - **"Applica Stesso Orario a Tutti"**: usa lo stesso orario per tutti gli operai
   - **Orari Individuali**: imposta orari diversi per ogni operaio

4. **Salvataggio Automatico**
   - Gli orari si salvano automaticamente nel database
   - Ogni modifica viene sincronizzata in tempo reale

### 📊 **Gestione Database**

1. **Accesso alle Impostazioni**
   - Solo gli utenti **Master** possono configurare il database
   - Menu → Impostazioni → Tab "Database"

2. **Configurazione**
   - Inserisci URL e chiave del tuo progetto Supabase
   - Test della connessione in tempo reale
   - Salvataggio sicuro delle credenziali

3. **Monitoraggio**
   - Stato connessione sempre visibile
   - Sincronizzazione automatica ogni 30 secondi
   - Notifiche di errore in caso di problemi

---

## 🔧 FUNZIONALITÀ ESISTENTI (Mantenute dalla v1.6.3)

- ✅ **Drag & Drop** completamente funzionante
- ✅ **Gestione operai** con specializzazioni e livelli
- ✅ **Gestione cantieri** con posizionamento sulla mappa
- ✅ **Sistema di autenticazione** multi-utente
- ✅ **Calendario interattivo** per pianificazione
- ✅ **Sistema email** integrato
- ✅ **Export/Import** dati in CSV e JSON
- ✅ **Design responsive** per mobile e desktop
- ✅ **Filtri avanzati** per operai e cantieri

---

## 👥 CREDENZIALI DI ACCESSO

- **Master Administrator**: `master` / `Sse19731973!`
- **Operaio Marco Rossi**: `marco.rossi` / `password123`
- **Operaio Giuseppe Bianchi**: `giuseppe.bianchi` / `password123`

---

## 🔄 Flusso di Sincronizzazione

```
1. Azione Utente (es: crea operaio)
    ↓
2. Salvataggio nel Database Supabase
    ↓
3. Aggiornamento Cache Locale
    ↓
4. Aggiornamento Interfaccia
    ↓
5. Conferma all'utente
```

**In caso di errore database:**
- Salvataggio automatico in cache locale
- Tentativo di ri-sincronizzazione al ripristino connessione
- Notifica utente dello stato

---

## 📱 Compatibilità

- ✅ **Desktop**: Chrome, Firefox, Safari, Edge (versioni recenti)
- ✅ **Mobile**: iOS Safari, Android Chrome
- ✅ **Tablet**: Interfaccia ottimizzata per schermi touch
- ✅ **Offline**: Funzionalità base disponibili senza connessione database

---

## 🚨 Note di Sicurezza

- Le credenziali database sono crittografate nel localStorage
- La comunicazione con Supabase avviene tramite HTTPS
- Le password utente sono archiviate in chiaro (implementare hashing in produzione)
- Accesso limitato alla configurazione database (solo Master)

---

## 🐛 Risoluzione Problemi

### **Problema: Database non si connette**
- ✅ Verifica URL e chiave Supabase
- ✅ Controlla che le tabelle esistano
- ✅ Verifica connessione internet
- ✅ "Test Connessione" nel tab Database

### **Problema: Dati non si sincronizzano**
- ✅ Verifica status connessione nel tab Database
- ✅ Usa "Sincronizza Ora" per forzare l'aggiornamento
- ✅ Controlla console browser per errori

### **Problema: Orari personalizzati non si salvano**
- ✅ Verifica che il cantiere abbia operai assegnati
- ✅ Controlla che i giorni siano selezionati nel calendario
- ✅ Verifica connessione database attiva

---

**Sviluppato da Simone Losito**  
**Powered by Simoncino**  
**Versione 1.6.4 - Database Integration + Custom Time Slots**  
**Rilascio: Ottobre 2025**
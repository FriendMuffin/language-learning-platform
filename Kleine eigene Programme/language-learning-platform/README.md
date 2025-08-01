# Language Learning Platform

Eine moderne, Duolingo-ähnliche Sprachlernanwendung für Lehrer und Schüler.

## 🎯 Projektübersicht

Diese Web-App ermöglicht es Sprachlehrern, personalisierte Lernkurse zu erstellen und Schülern eine interaktive Lernerfahrung zu bieten.

### Hauptfunktionen
- **Duolingo-ähnliches Lernsystem** mit verschiedenen Aufgabentypen
- **Teacher-Dashboard** für Kurserstellung und Schülerverwaltung  
- **Student-Interface** mit Progress-Tracking und Achievements
- **Admin-Panel** für Course-Management
- **Responsive Design** für alle Geräte

## 🚀 Technologie-Stack

- **Frontend:** Vanilla JavaScript (ES6+), HTML5, CSS3
- **Styling:** Tailwind CSS (CDN)
- **Datenbank:** LocalStorage (später erweiterbar)
- **Hosting:** GitHub Pages
- **Architektur:** Single Page Application (SPA)

## 📁 Projektstruktur

```
language-learning-platform/
├── index.html                 # Haupt-HTML-Datei
├── css/
│   ├── styles.css            # Haupt-Stylesheet
│   └── components/           # Komponenten-spezifische Styles
├── js/
│   ├── app.js               # SPA Router & Main App
│   ├── auth.js              # Authentication mit Token-System
│   ├── data-manager.js      # LocalStorage Management
│   ├── course-engine.js     # Duolingo-ähnliche Lern-Engine
│   ├── task-templates.js    # Aufgaben-Templates (Multiple Choice, etc.)
│   ├── admin-panel.js       # Course Builder für Admins
│   └── utils.js             # Helper Functions
├── data/
│   ├── users.json           # User-Daten Template
│   ├── courses.json         # Kurs-Daten Template
│   └── progress.json        # Progress-Tracking Template
└── assets/
    ├── audio/               # Audio-Dateien für Übungen
    └── images/              # Bilder für Aufgaben
```

## 🎮 Aufgaben-Typen

Das System unterstützt verschiedene Duolingo-ähnliche Aufgabentypen:

1. **Multiple Choice** - Wähle die richtige Antwort
2. **Fill in the Blank** - Lückentext ausfüllen  
3. **Translation** - Übersetze Sätze
4. **Audio Match** - Höre und wähle die richtige Antwort
5. **Image Match** - Bild zu Wort zuordnen
6. **Sentence Building** - Wörter in richtige Reihenfolge bringen
7. **True/False** - Richtig oder Falsch Fragen

## 👥 Benutzer-Rollen

### Schüler (Students)
- Kurse durchlaufen mit Progress-Tracking
- XP-System und Achievements sammeln
- Lehrer über Teacher-Codes finden und folgen
- Persönliche Lernstatistiken einsehen

### Lehrer (Teachers)
- Öffentliche Profile für Schüler-Akquise
- Schüler-Progress überwachen
- Individuelle Notizen und Checklisten für jeden Schüler
- Analytics und Statistiken

### Admin
- Neue Kurse basierend auf Lehrer-Anforderungen erstellen
- Level-Reihenfolge und Module anpassen
- Content-Management und Qualitätskontrolle

## 🔧 Entwicklungsplan

### Phase 1: Foundation ✅
- [x] Projektstruktur erstellen
- [ ] SPA-Router implementieren
- [ ] Authentication-System mit Token

### Phase 2: Core Learning Engine
- [ ] Duolingo-ähnliche Lern-Engine
- [ ] Task-Template-System
- [ ] Progress-Tracking

### Phase 3: User Interfaces  
- [ ] Student Learning Interface
- [ ] Teacher Dashboard
- [ ] Admin Course Builder

### Phase 4: Advanced Features
- [ ] Audio-Integration
- [ ] Achievement-System
- [ ] Analytics Dashboard

## 🚀 Lokale Entwicklung

1. Repository klonen:
```bash
git clone https://github.com/[friendmuffin]/language-learning-platform.git
cd language-learning-platform
```

2. Live Server starten (VS Code Extension oder ähnlich)

3. Browser öffnen: `http://localhost:5500`

## 🌐 Live Demo

Die Anwendung ist live verfügbar unter:
**https://[friendmuffin].github.io/language-learning-platform**

## 📝 Lizenz

Dieses Projekt ist für Bildungszwecke erstellt.

## 🤝 Beitragen

Das Projekt befindet sich in aktiver Entwicklung. Feedback und Vorschläge sind willkommen!

---

**Status:** 🚧 In Entwicklung  
**Letzte Aktualisierung:** Januar 2025
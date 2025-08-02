/**
 * ========================================
 * DATA MANAGEMENT SYSTEM
 * ========================================
 * 
 * Dieses Modul verwaltet alle Daten der Anwendung:
 * - Course-Daten (Kurse, Level, Module, Tasks)
 * - Progress-Tracking für Schüler
 * - Teacher-Student-Beziehungen
 * - Learning-Statistiken und Achievements
 * - Demo-Content für sofortiges Testen
 */

// ========================================
// GLOBALE KONSTANTEN UND KONFIGURATION
// ========================================

/**
 * Konfiguration für das Data-Management-System
 */
const DATA_CONFIG = {
    // LocalStorage Keys
    COURSES_KEY: 'coursesData',
    PROGRESS_KEY: 'userProgress',
    RELATIONSHIPS_KEY: 'teacherStudentRelationships',
    ACHIEVEMENTS_KEY: 'userAchievements',
    SETTINGS_KEY: 'appSettings',
    
    // XP-System
    XP_PER_TASK: 10,                      // XP pro abgeschlossene Aufgabe
    XP_STREAK_BONUS: 5,                   // Bonus-XP für Streak
    XP_PERFECT_LESSON: 25,                // Bonus für 100% richtige Antworten
    
    // Streak-System
    STREAK_RESET_HOURS: 48,               // Streak wird nach 48h ohne Aktivität zurückgesetzt
    
    // Achievement-Schwellen
    ACHIEVEMENTS: {
        FIRST_LESSON: { xp: 0, tasks: 1 },
        DEDICATED_LEARNER: { xp: 100, tasks: 10 },
        LANGUAGE_EXPLORER: { xp: 500, tasks: 50 },
        POLYGLOT: { xp: 1000, tasks: 100 },
        MASTER_STUDENT: { xp: 2500, tasks: 250 }
    }
};

/**
 * Task-Template-Definitionen für das Duolingo-ähnliche System
 */
const TASK_TEMPLATES = {
    MULTIPLE_CHOICE: {
        id: 'multiple_choice',
        name: 'Multiple Choice',
        description: 'Wähle die richtige Antwort aus mehreren Optionen',
        icon: '🔘',
        structure: {
            question: 'string',      // Die Frage
            options: 'array',        // Array von Antwortmöglichkeiten
            correctAnswer: 'number', // Index der richtigen Antwort
            explanation: 'string'    // Erklärung für die richtige Antwort
        }
    },
    
    FILL_BLANK: {
        id: 'fill_blank',
        name: 'Lückentext',
        description: 'Fülle die Lücken im Satz aus',
        icon: '✏️',
        structure: {
            sentence: 'string',      // Satz mit Platzhaltern (__BLANK__)
            blanks: 'array',         // Array der korrekten Antworten für jede Lücke
            hints: 'array'           // Optional: Hinweise für jede Lücke
        }
    },
    
    TRANSLATION: {
        id: 'translation',
        name: 'Übersetzung',
        description: 'Übersetze den gegebenen Satz',
        icon: '🔄',
        structure: {
            sourceText: 'string',        // Zu übersetzender Text
            targetLanguage: 'string',    // Zielsprache
            correctTranslations: 'array', // Array möglicher korrekter Übersetzungen
            difficulty: 'string'         // 'easy', 'medium', 'hard'
        }
    },
    
    AUDIO_MATCH: {
        id: 'audio_match',
        name: 'Audio Zuordnung',
        description: 'Höre die Aufnahme und wähle die richtige Antwort',
        icon: '🎧',
        structure: {
            audioUrl: 'string',      // URL zur Audio-Datei
            options: 'array',        // Antwortmöglichkeiten
            correctAnswer: 'number', // Index der richtigen Antwort
            playbackSpeed: 'number'  // Geschwindigkeit (0.5 - 2.0)
        }
    },
    
    IMAGE_MATCH: {
        id: 'image_match',
        name: 'Bild Zuordnung',
        description: 'Ordne das Bild dem richtigen Wort zu',
        icon: '🖼️',
        structure: {
            imageUrl: 'string',      // URL zum Bild
            options: 'array',        // Wort-Optionen
            correctAnswer: 'number', // Index der richtigen Antwort
            category: 'string'       // Kategorie (Tiere, Essen, etc.)
        }
    },
    
    SENTENCE_BUILDING: {
        id: 'sentence_building',
        name: 'Satz zusammensetzen',
        description: 'Setze die Wörter in die richtige Reihenfolge',
        icon: '🧩',
        structure: {
            correctSentence: 'string',   // Der korrekte Satz
            words: 'array',              // Array der durcheinandergewürfelten Wörter
            translation: 'string',       // Deutsche Übersetzung als Hilfe
            difficulty: 'string'         // Schwierigkeitsgrad
        }
    },
    
    TRUE_FALSE: {
        id: 'true_false',
        name: 'Richtig oder Falsch',
        description: 'Entscheide ob die Aussage richtig oder falsch ist',
        icon: '✅',
        structure: {
            statement: 'string',     // Die zu bewertende Aussage
            isTrue: 'boolean',       // Ob die Aussage wahr ist
            explanation: 'string',   // Erklärung der Antwort
            context: 'string'        // Kontext der Aussage
        }
    }
};

// ========================================
// COURSE DATA MANAGEMENT
// ========================================

/**
 * Klasse für die Verwaltung von Kursdaten
 */
class CourseManager {
    constructor() {
        this.courses = this.loadCourses();
        this.initializeDemoCourses();
    }
    
    /**
     * Lädt alle Kurse aus LocalStorage
     * @returns {Array} Array aller Kurse
     */
    loadCourses() {
        try {
            const coursesData = localStorage.getItem(DATA_CONFIG.COURSES_KEY);
            return coursesData ? JSON.parse(coursesData) : [];
        } catch (error) {
            console.error('❌ Fehler beim Laden der Kurse:', error);
            return [];
        }
    }
    
    /**
     * Speichert alle Kurse in LocalStorage
     */
    saveCourses() {
        try {
            localStorage.setItem(DATA_CONFIG.COURSES_KEY, JSON.stringify(this.courses));
        } catch (error) {
            console.error('❌ Fehler beim Speichern der Kurse:', error);
        }
    }
    
    /**
     * Initialisiert Demo-Kurse falls keine vorhanden sind
     */
    initializeDemoCourses() {
        if (this.courses.length === 0) {
            console.log('📚 Erstelle Demo-Kurse...');
            
            // Demo-Kurs: Deutsch A1
            const germanA1 = this.createDemoGermanCourse();
            this.addCourse(germanA1);
            
            // Demo-Kurs: Englisch B1
            const englishB1 = this.createDemoEnglishCourse();
            this.addCourse(englishB1);
            
            console.log('✅ Demo-Kurse erstellt');
        }
    }
    
    /**
     * Erstellt einen Demo-Kurs für Deutsch A1
     * @returns {Object} Vollständiger Kurs mit Leveln und Tasks
     */
    createDemoGermanCourse() {
        return {
            id: 'german-a1-demo',
            title: 'Deutsch A1 - Grundlagen',
            description: 'Lerne die Grundlagen der deutschen Sprache',
            language: 'Deutsch',
            targetLanguage: 'Englisch',
            level: 'A1',
            teacherId: 'demo-teacher-001',
            teacherName: 'Anna Schmidt',
            isPublic: true,
            enrollmentCode: 'DEDE01',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            
            // Kurs-Statistiken
            stats: {
                totalStudents: 0,
                averageProgress: 0,
                completionRate: 0
            },
            
            // Level-System wie bei Duolingo
            levels: [
                {
                    id: 'level-1',
                    title: 'Begrüßungen',
                    description: 'Lerne wie man sich auf Deutsch begrüßt',
                    order: 1,
                    isUnlocked: true,
                    icon: '👋',
                    color: '#58cc02',
                    
                    modules: [
                        {
                            id: 'module-1-1',
                            title: 'Hallo und Tschüss',
                            description: 'Grundlegende Begrüßungen',
                            order: 1,
                            estimatedMinutes: 10,
                            
                            tasks: [
                                {
                                    id: 'task-1-1-1',
                                    type: 'multiple_choice',
                                    order: 1,
                                    data: {
                                        question: 'Was bedeutet "Guten Tag" auf Englisch?',
                                        options: ['Good morning', 'Good day', 'Good evening', 'Good night'],
                                        correctAnswer: 1,
                                        explanation: '"Guten Tag" ist eine förmliche Begrüßung und bedeutet "Good day".'
                                    }
                                },
                                {
                                    id: 'task-1-1-2',
                                    type: 'fill_blank',
                                    order: 2,
                                    data: {
                                        sentence: 'Guten __BLANK__! Wie geht es Ihnen?',
                                        blanks: ['Tag', 'Morgen'],
                                        hints: ['Eine höfliche Tagesbegrüßung']
                                    }
                                },
                                {
                                    id: 'task-1-1-3',
                                    type: 'translation',
                                    order: 3,
                                    data: {
                                        sourceText: 'Goodbye',
                                        targetLanguage: 'Deutsch',
                                        correctTranslations: ['Auf Wiedersehen', 'Tschüss', 'Bis bald'],
                                        difficulty: 'easy'
                                    }
                                }
                            ]
                        },
                        
                        {
                            id: 'module-1-2',
                            title: 'Sich vorstellen',
                            description: 'Lerne dich auf Deutsch vorzustellen',
                            order: 2,
                            estimatedMinutes: 15,
                            
                            tasks: [
                                {
                                    id: 'task-1-2-1',
                                    type: 'sentence_building',
                                    order: 1,
                                    data: {
                                        correctSentence: 'Ich heiße Max Mustermann',
                                        words: ['heiße', 'Ich', 'Mustermann', 'Max'],
                                        translation: 'My name is Max Mustermann',
                                        difficulty: 'easy'
                                    }
                                },
                                {
                                    id: 'task-1-2-2',
                                    type: 'multiple_choice',
                                    order: 2,
                                    data: {
                                        question: 'Wie fragt man auf Deutsch nach dem Namen?',
                                        options: ['Wie heißt du?', 'Was machst du?', 'Wo wohnst du?', 'Wann kommst du?'],
                                        correctAnswer: 0,
                                        explanation: '"Wie heißt du?" ist die informelle Art nach dem Namen zu fragen.'
                                    }
                                }
                            ]
                        }
                    ]
                },
                
                {
                    id: 'level-2',
                    title: 'Zahlen',
                    description: 'Lerne die Zahlen von 1-20',
                    order: 2,
                    isUnlocked: false,
                    icon: '🔢',
                    color: '#1cb0f6',
                    
                    modules: [
                        {
                            id: 'module-2-1',
                            title: 'Zahlen 1-10',
                            description: 'Die ersten zehn Zahlen',
                            order: 1,
                            estimatedMinutes: 12,
                            
                            tasks: [
                                {
                                    id: 'task-2-1-1',
                                    type: 'image_match',
                                    order: 1,
                                    data: {
                                        imageUrl: '/assets/images/numbers/drei.png',
                                        options: ['eins', 'zwei', 'drei', 'vier'],
                                        correctAnswer: 2,
                                        category: 'Zahlen'
                                    }
                                },
                                {
                                    id: 'task-2-1-2',
                                    type: 'true_false',
                                    order: 2,
                                    data: {
                                        statement: '"Fünf" ist die deutsche Zahl für "five"',
                                        isTrue: true,
                                        explanation: 'Richtig! "Fünf" entspricht der englischen Zahl "five".',
                                        context: 'Deutsche Zahlen 1-10'
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        };
    }
    
    /**
     * Erstellt einen Demo-Kurs für Englisch B1
     * @returns {Object} Vollständiger Englisch-Kurs
     */
    createDemoEnglishCourse() {
        return {
            id: 'english-b1-demo',
            title: 'English B1 - Intermediate',
            description: 'Improve your English to intermediate level',
            language: 'English',
            targetLanguage: 'Deutsch',
            level: 'B1',
            teacherId: 'demo-teacher-001',
            teacherName: 'Anna Schmidt',
            isPublic: true,
            enrollmentCode: 'ENEN01',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            
            stats: {
                totalStudents: 0,
                averageProgress: 0,
                completionRate: 0
            },
            
            levels: [
                {
                    id: 'level-1',
                    title: 'Past Tense',
                    description: 'Learn about past tense in English',
                    order: 1,
                    isUnlocked: true,
                    icon: '⏰',
                    color: '#ff9600',
                    
                    modules: [
                        {
                            id: 'module-1-1',
                            title: 'Regular Past Tense',
                            description: 'Past tense with regular verbs',
                            order: 1,
                            estimatedMinutes: 20,
                            
                            tasks: [
                                {
                                    id: 'task-1-1-1',
                                    type: 'multiple_choice',
                                    order: 1,
                                    data: {
                                        question: 'What is the past tense of "walk"?',
                                        options: ['walk', 'walked', 'walking', 'walks'],
                                        correctAnswer: 1,
                                        explanation: 'Regular verbs add "-ed" to form the past tense.'
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        };
    }
    
    /**
     * Fügt einen neuen Kurs hinzu
     * @param {Object} course - Kurs-Objekt
     * @returns {boolean} Erfolg der Operation
     */
    addCourse(course) {
        try {
            // Eindeutige ID sicherstellen
            if (this.courses.find(c => c.id === course.id)) {
                console.warn('⚠️ Kurs-ID bereits vorhanden:', course.id);
                return false;
            }
            
            this.courses.push(course);
            this.saveCourses();
            console.log('✅ Kurs hinzugefügt:', course.title);
            return true;
        } catch (error) {
            console.error('❌ Fehler beim Hinzufügen des Kurses:', error);
            return false;
        }
    }
    
    /**
     * Holt einen Kurs anhand der ID
     * @param {string} courseId - ID des Kurses
     * @returns {Object|null} Kurs-Objekt oder null
     */
    getCourse(courseId) {
        return this.courses.find(course => course.id === courseId) || null;
    }
    
    /**
     * Holt alle Kurse eines bestimmten Lehrers
     * @param {string} teacherId - ID des Lehrers
     * @returns {Array} Array der Kurse des Lehrers
     */
    getCoursesByTeacher(teacherId) {
        return this.courses.filter(course => course.teacherId === teacherId);
    }
    
    /**
     * Holt alle öffentlichen Kurse
     * @returns {Array} Array aller öffentlichen Kurse
     */
    getPublicCourses() {
        return this.courses.filter(course => course.isPublic === true);
    }
    
    /**
     * Sucht Kurse anhand verschiedener Kriterien
     * @param {Object} searchParams - Suchparameter
     * @returns {Array} Array der gefundenen Kurse
     */
    searchCourses(searchParams) {
        let results = [...this.courses];
        
        // Nach Sprache filtern
        if (searchParams.language) {
            results = results.filter(course => 
                course.language.toLowerCase().includes(searchParams.language.toLowerCase())
            );
        }
        
        // Nach Level filtern
        if (searchParams.level) {
            results = results.filter(course => course.level === searchParams.level);
        }
        
        // Nach Titel/Beschreibung suchen
        if (searchParams.query) {
            const query = searchParams.query.toLowerCase();
            results = results.filter(course => 
                course.title.toLowerCase().includes(query) ||
                course.description.toLowerCase().includes(query)
            );
        }
        
        // Nur öffentliche Kurse wenn nicht Admin/Teacher
        if (searchParams.publicOnly) {
            results = results.filter(course => course.isPublic);
        }
        
        return results;
    }
}

// ========================================
// PROGRESS TRACKING SYSTEM
// ========================================

/**
 * Klasse für die Verfolgung des Lernfortschritts
 */
class ProgressManager {
    constructor() {
        this.userProgress = this.loadProgress();
    }
    
    /**
     * Lädt den Fortschritt aller Benutzer
     * @returns {Object} Progress-Daten nach Benutzer-ID organisiert
     */
    loadProgress() {
        try {
            const progressData = localStorage.getItem(DATA_CONFIG.PROGRESS_KEY);
            return progressData ? JSON.parse(progressData) : {};
        } catch (error) {
            console.error('❌ Fehler beim Laden des Fortschritts:', error);
            return {};
        }
    }
    
    /**
     * Speichert den Fortschritt aller Benutzer
     */
    saveProgress() {
        try {
            localStorage.setItem(DATA_CONFIG.PROGRESS_KEY, JSON.stringify(this.userProgress));
        } catch (error) {
            console.error('❌ Fehler beim Speichern des Fortschritts:', error);
        }
    }
    
    /**
     * Initialisiert den Fortschritt für einen neuen Benutzer
     * @param {string} userId - ID des Benutzers
     * @returns {Object} Initialisierter Progress
     */
    initializeUserProgress(userId) {
        if (!this.userProgress[userId]) {
            this.userProgress[userId] = {
                totalXP: 0,
                currentStreak: 0,
                longestStreak: 0,
                lastActivity: null,
                coursesEnrolled: [],
                coursesCompleted: [],
                
                // Kurs-spezifischer Fortschritt
                courseProgress: {},
                
                // Achievement-System
                achievements: [],
                totalTasksCompleted: 0,
                perfectLessons: 0,
                
                // Statistiken
                stats: {
                    averageAccuracy: 0,
                    totalStudyTime: 0,
                    favoriteTaskType: null,
                    weakestAreas: [],
                    strongestAreas: []
                }
            };
            
            this.saveProgress();
        }
        
        return this.userProgress[userId];
    }
    
    /**
     * Holt den Fortschritt eines bestimmten Benutzers
     * @param {string} userId - ID des Benutzers
     * @returns {Object} Progress-Objekt des Benutzers
     */
    getUserProgress(userId) {
        if (!this.userProgress[userId]) {
            return this.initializeUserProgress(userId);
        }
        return this.userProgress[userId];
    }
    
    /**
     * Schreibt einen Benutzer in einen Kurs ein
     * @param {string} userId - ID des Benutzers
     * @param {string} courseId - ID des Kurses
     * @returns {boolean} Erfolg der Einschreibung
     */
    enrollUserInCourse(userId, courseId) {
        try {
            const userProgress = this.getUserProgress(userId);
            
            // Prüfen ob bereits eingeschrieben
            if (userProgress.coursesEnrolled.includes(courseId)) {
                console.log('ℹ️ Benutzer bereits in Kurs eingeschrieben');
                return true;
            }
            
            // Benutzer einschreiben
            userProgress.coursesEnrolled.push(courseId);
            
            // Kurs-Progress initialisieren
            userProgress.courseProgress[courseId] = {
                enrolledAt: new Date().toISOString(),
                currentLevel: 1,
                currentModule: 1,
                completedLevels: [],
                completedModules: [],
                completedTasks: [],
                accuracy: {},
                timeSpent: 0,
                lastAccessed: new Date().toISOString()
            };
            
            this.saveProgress();
            console.log('✅ Benutzer in Kurs eingeschrieben:', courseId);
            return true;
            
        } catch (error) {
            console.error('❌ Fehler bei Kurs-Einschreibung:', error);
            return false;
        }
    }
    
    /**
     * Markiert eine Aufgabe als abgeschlossen
     * @param {string} userId - ID des Benutzers
     * @param {string} courseId - ID des Kurses
     * @param {string} taskId - ID der Aufgabe
     * @param {Object} result - Ergebnis der Aufgabe (correct, timeSpent, etc.)
     * @returns {Object} Aktualisierter Progress mit neuen Achievements
     */
    completeTask(userId, courseId, taskId, result) {
        try {
            const userProgress = this.getUserProgress(userId);
            
            // Sicherstellen dass Benutzer im Kurs eingeschrieben ist
            if (!userProgress.coursesEnrolled.includes(courseId)) {
                this.enrollUserInCourse(userId, courseId);
            }
            
            const courseProgress = userProgress.courseProgress[courseId];
            
            // Aufgabe als abgeschlossen markieren (falls noch nicht)
            if (!courseProgress.completedTasks.includes(taskId)) {
                courseProgress.completedTasks.push(taskId);
                userProgress.totalTasksCompleted++;
            }
            
            // XP berechnen und vergeben
            let xpGained = DATA_CONFIG.XP_PER_TASK;
            
            // Bonus für korrekte Antwort
            if (result.correct) {
                xpGained += 5;
            }
            
            // Streak-Bonus
            if (userProgress.currentStreak > 0) {
                xpGained += DATA_CONFIG.XP_STREAK_BONUS;
            }
            
            userProgress.totalXP += xpGained;
            
            // Accuracy tracking
            if (!courseProgress.accuracy[taskId]) {
                courseProgress.accuracy[taskId] = [];
            }
            courseProgress.accuracy[taskId].push({
                correct: result.correct,
                timeSpent: result.timeSpent || 0,
                attempts: result.attempts || 1,
                timestamp: new Date().toISOString()
            });
            
            // Zeit tracking
            if (result.timeSpent) {
                courseProgress.timeSpent += result.timeSpent;
                userProgress.stats.totalStudyTime += result.timeSpent;
            }
            
            // Streak aktualisieren
            this.updateStreak(userId);
            
            // Letzte Aktivität aktualisieren
            userProgress.lastActivity = new Date().toISOString();
            courseProgress.lastAccessed = new Date().toISOString();
            
            // Achievements prüfen
            const newAchievements = this.checkAchievements(userId);
            
            this.saveProgress();
            
            return {
                xpGained,
                totalXP: userProgress.totalXP,
                newAchievements,
                currentStreak: userProgress.currentStreak,
                taskProgress: courseProgress.completedTasks.length
            };
            
        } catch (error) {
            console.error('❌ Fehler beim Abschließen der Aufgabe:', error);
            return null;
        }
    }
    
    /**
     * Aktualisiert den Streak eines Benutzers
     * @param {string} userId - ID des Benutzers
     */
    updateStreak(userId) {
        const userProgress = this.getUserProgress(userId);
        const now = new Date();
        const lastActivity = userProgress.lastActivity ? new Date(userProgress.lastActivity) : null;
        
        if (!lastActivity) {
            // Erste Aktivität
            userProgress.currentStreak = 1;
            userProgress.longestStreak = Math.max(userProgress.longestStreak, 1);
        } else {
            const hoursSinceLastActivity = (now - lastActivity) / (1000 * 60 * 60);
            
            if (hoursSinceLastActivity <= 24) {
                // Aktivität innerhalb von 24 Stunden - Streak continues
                const daysSinceLastActivity = Math.floor(hoursSinceLastActivity / 24);
                if (daysSinceLastActivity >= 1) {
                    userProgress.currentStreak++;
                    userProgress.longestStreak = Math.max(userProgress.longestStreak, userProgress.currentStreak);
                }
            } else if (hoursSinceLastActivity > DATA_CONFIG.STREAK_RESET_HOURS) {
                // Streak unterbrochen
                userProgress.currentStreak = 1;
            }
        }
    }
    
    /**
     * Prüft und vergibt neue Achievements
     * @param {string} userId - ID des Benutzers
     * @returns {Array} Array neuer Achievements
     */
    checkAchievements(userId) {
        const userProgress = this.getUserProgress(userId);
        const newAchievements = [];
        
        // Alle möglichen Achievements durchgehen
        for (const [achievementId, requirements] of Object.entries(DATA_CONFIG.ACHIEVEMENTS)) {
            // Prüfen ob Achievement bereits erhalten
            if (userProgress.achievements.includes(achievementId)) {
                continue;
            }
            
            // Requirements prüfen
            const meetsXPRequirement = userProgress.totalXP >= requirements.xp;
            const meetsTaskRequirement = userProgress.totalTasksCompleted >= requirements.tasks;
            
            if (meetsXPRequirement && meetsTaskRequirement) {
                userProgress.achievements.push(achievementId);
                newAchievements.push({
                    id: achievementId,
                    name: this.getAchievementName(achievementId),
                    description: this.getAchievementDescription(achievementId),
                    earnedAt: new Date().toISOString()
                });
            }
        }
        
        return newAchievements;
    }
    
    /**
     * Holt den Namen eines Achievements
     * @param {string} achievementId - ID des Achievements
     * @returns {string} Name des Achievements
     */
    getAchievementName(achievementId) {
        const names = {
            FIRST_LESSON: 'Erste Schritte',
            DEDICATED_LEARNER: 'Fleißiger Lerner',
            LANGUAGE_EXPLORER: 'Sprach-Entdecker',
            POLYGLOT: 'Polyglott',
            MASTER_STUDENT: 'Meister-Schüler'
        };
        return names[achievementId] || 'Unbekanntes Achievement';
    }
    
    /**
     * Holt die Beschreibung eines Achievements
     * @param {string} achievementId - ID des Achievements
     * @returns {string} Beschreibung des Achievements
     */
    getAchievementDescription(achievementId) {
        const descriptions = {
            FIRST_LESSON: 'Du hast deine erste Aufgabe abgeschlossen!',
            DEDICATED_LEARNER: 'Du hast 10 Aufgaben erfolgreich absolviert.',
            LANGUAGE_EXPLORER: 'Wow! 50 Aufgaben geschafft - du bist ein echter Sprachforscher!',
            POLYGLOT: 'Unglaublich! 100 Aufgaben - du beherrschst mehrere Sprachen!',
            MASTER_STUDENT: 'Legendär! 250 Aufgaben - du bist ein wahrer Meister!'
        };
        return descriptions[achievementId] || 'Beschreibung nicht verfügbar';
    }
    
    /**
     * Berechnet den Gesamtfortschritt eines Benutzers in einem Kurs
     * @param {string} userId - ID des Benutzers
     * @param {string} courseId - ID des Kurses
     * @returns {Object} Fortschritts-Statistiken
     */
    calculateCourseProgress(userId, courseId, course) {
        const userProgress = this.getUserProgress(userId);
        const courseProgress = userProgress.courseProgress[courseId];
        
        if (!courseProgress || !course) {
            return { percentage: 0, completedTasks: 0, totalTasks: 0 };
        }
        
        // Alle Tasks im Kurs zählen
        let totalTasks = 0;
        course.levels.forEach(level => {
            level.modules.forEach(module => {
                totalTasks += module.tasks.length;
            });
        });
        
        const completedTasks = courseProgress.completedTasks.length;
        const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        return {
            percentage,
            completedTasks,
            totalTasks,
            currentLevel: courseProgress.currentLevel,
            timeSpent: courseProgress.timeSpent,
            averageAccuracy: this.calculateAverageAccuracy(courseProgress.accuracy)
        };
    }
    
    /**
     * Berechnet die durchschnittliche Genauigkeit basierend auf Accuracy-Daten
     * @param {Object} accuracyData - Accuracy-Daten nach Task-ID
     * @returns {number} Durchschnittliche Genauigkeit in Prozent
     */
    calculateAverageAccuracy(accuracyData) {
        const allAttempts = [];
        
        Object.values(accuracyData).forEach(taskAttempts => {
            allAttempts.push(...taskAttempts);
        });
        
        if (allAttempts.length === 0) return 0;
        
        const correctAttempts = allAttempts.filter(attempt => attempt.correct).length;
        return Math.round((correctAttempts / allAttempts.length) * 100);
    }
}

// ========================================
// TEACHER-STUDENT RELATIONSHIP MANAGEMENT
// ========================================

/**
 * Klasse für die Verwaltung von Lehrer-Schüler-Beziehungen
 */
class RelationshipManager {
    constructor() {
        this.relationships = this.loadRelationships();
    }
    
    /**
     * Lädt alle Lehrer-Schüler-Beziehungen
     * @returns {Array} Array aller Beziehungen
     */
    loadRelationships() {
        try {
            const relationshipData = localStorage.getItem(DATA_CONFIG.RELATIONSHIPS_KEY);
            return relationshipData ? JSON.parse(relationshipData) : [];
        } catch (error) {
            console.error('❌ Fehler beim Laden der Beziehungen:', error);
            return [];
        }
    }
    
    /**
     * Speichert alle Beziehungen
     */
    saveRelationships() {
        try {
            localStorage.setItem(DATA_CONFIG.RELATIONSHIPS_KEY, JSON.stringify(this.relationships));
        } catch (error) {
            console.error('❌ Fehler beim Speichern der Beziehungen:', error);
        }
    }
    
    /**
     * Verbindet einen Schüler mit einem Lehrer über Teacher-Code
     * @param {string} studentId - ID des Schülers
     * @param {string} teacherCode - Teacher-Code
     * @returns {Object} Ergebnis der Verbindung
     */
    connectStudentToTeacher(studentId, teacherCode) {
        try {
            // Teacher anhand Code suchen
            const userDatabase = new UserDatabase();
            const allUsers = userDatabase.getAllUsers();
            const teacher = allUsers.find(user => 
                user.userType === 'teacher' && user.teacherCode === teacherCode
            );
            
            if (!teacher) {
                return { 
                    success: false, 
                    message: 'Teacher-Code nicht gefunden' 
                };
            }
            
            // Prüfen ob Beziehung bereits existiert
            const existingRelationship = this.relationships.find(rel => 
                rel.studentId === studentId && rel.teacherId === teacher.id
            );
            
            if (existingRelationship) {
                return { 
                    success: false, 
                    message: 'Du folgst diesem Lehrer bereits' 
                };
            }
            
            // Neue Beziehung erstellen
            const relationship = {
                id: `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                studentId: studentId,
                teacherId: teacher.id,
                teacherName: `${teacher.name} ${teacher.surname}`,
                connectedAt: new Date().toISOString(),
                isActive: true,
                
                // Lehr-spezifische Daten
                notes: '',
                customGoals: [],
                progressOverrides: {},
                
                // Kommunikation
                lastContact: null,
                messages: []
            };
            
            this.relationships.push(relationship);
            this.saveRelationships();
            
            console.log('✅ Schüler mit Lehrer verbunden:', teacher.username);
            
            return { 
                success: true, 
                message: `Du folgst jetzt ${teacher.name} ${teacher.surname}!`,
                teacher: {
                    id: teacher.id,
                    name: teacher.name,
                    surname: teacher.surname,
                    username: teacher.username
                }
            };
            
        } catch (error) {
            console.error('❌ Fehler beim Verbinden mit Lehrer:', error);
            return { 
                success: false, 
                message: 'Ein Fehler ist aufgetreten' 
            };
        }
    }
    
    /**
     * Holt alle Schüler eines Lehrers
     * @param {string} teacherId - ID des Lehrers
     * @returns {Array} Array der Schüler mit Progress-Daten
     */
    getStudentsOfTeacher(teacherId) {
        const teacherRelationships = this.relationships.filter(rel => 
            rel.teacherId === teacherId && rel.isActive
        );
        
        const progressManager = new ProgressManager();
        const userDatabase = new UserDatabase();
        
        return teacherRelationships.map(rel => {
            const student = userDatabase.getAllUsers().find(user => user.id === rel.studentId);
            const progress = progressManager.getUserProgress(rel.studentId);
            
            return {
                relationshipId: rel.id,
                student: student ? {
                    id: student.id,
                    name: student.name,
                    surname: student.surname,
                    username: student.username,
                    email: student.email
                } : null,
                connectedAt: rel.connectedAt,
                notes: rel.notes,
                progress: {
                    totalXP: progress.totalXP,
                    currentStreak: progress.currentStreak,
                    totalTasksCompleted: progress.totalTasksCompleted,
                    coursesEnrolled: progress.coursesEnrolled.length,
                    lastActivity: progress.lastActivity
                }
            };
        }).filter(item => item.student !== null); // Nur gültige Schüler
    }
    
    /**
     * Holt alle Lehrer eines Schülers
     * @param {string} studentId - ID des Schülers
     * @returns {Array} Array der gefolgten Lehrer
     */
    getTeachersOfStudent(studentId) {
        const studentRelationships = this.relationships.filter(rel => 
            rel.studentId === studentId && rel.isActive
        );
        
        const userDatabase = new UserDatabase();
        
        return studentRelationships.map(rel => {
            const teacher = userDatabase.getAllUsers().find(user => user.id === rel.teacherId);
            
            return {
                relationshipId: rel.id,
                teacher: teacher ? {
                    id: teacher.id,
                    name: teacher.name,
                    surname: teacher.surname,
                    username: teacher.username,
                    teacherCode: teacher.teacherCode
                } : null,
                connectedAt: rel.connectedAt,
                lastContact: rel.lastContact
            };
        }).filter(item => item.teacher !== null);
    }
    
    /**
     * Fügt eine Notiz zu einem Schüler hinzu (für Lehrer)
     * @param {string} relationshipId - ID der Beziehung
     * @param {string} note - Notiz-Text
     * @returns {boolean} Erfolg der Operation
     */
    addStudentNote(relationshipId, note) {
        try {
            const relationship = this.relationships.find(rel => rel.id === relationshipId);
            if (!relationship) return false;
            
            relationship.notes = note;
            relationship.lastContact = new Date().toISOString();
            
            this.saveRelationships();
            return true;
        } catch (error) {
            console.error('❌ Fehler beim Hinzufügen der Notiz:', error);
            return false;
        }
    }
}

// ========================================
// GLOBALE DATA MANAGER INSTANZEN
// ========================================

/**
 * Globale Instanzen für den Zugriff aus der gesamten App
 */
const courseManager = new CourseManager();
const progressManager = new ProgressManager();
const relationshipManager = new RelationshipManager();

// ========================================
// UTILITY FUNCTIONS FÜR EINFACHEN ZUGRIFF
// ========================================

/**
 * Holt alle verfügbaren Kurse für einen Benutzer
 * @param {string} userId - ID des Benutzers
 * @param {string} userType - Typ des Benutzers ('student' oder 'teacher')
 * @returns {Array} Array verfügbarer Kurse
 */
function getAvailableCoursesForUser(userId, userType) {
    if (userType === 'teacher') {
        return courseManager.getCoursesByTeacher(userId);
    } else {
        // Für Schüler: alle öffentlichen Kurse + eingeschriebene private Kurse
        const publicCourses = courseManager.getPublicCourses();
        const userProgress = progressManager.getUserProgress(userId);
        
        // Private Kurse in denen der Schüler eingeschrieben ist
        const enrolledPrivateCourses = courseManager.courses.filter(course => 
            !course.isPublic && userProgress.coursesEnrolled.includes(course.id)
        );
        
        return [...publicCourses, ...enrolledPrivateCourses];
    }
}

/**
 * Holt detaillierte Fortschritts-Informationen für Dashboard
 * @param {string} userId - ID des Benutzers
 * @returns {Object} Detaillierte Progress-Daten
 */
function getDashboardData(userId) {
    const userProgress = progressManager.getUserProgress(userId);
    const availableCourses = getAvailableCoursesForUser(userId, 'student');
    
    // Aktuell aktive Kurse (mit Fortschritt)
    const activeCourses = availableCourses
        .filter(course => userProgress.coursesEnrolled.includes(course.id))
        .map(course => {
            const progress = progressManager.calculateCourseProgress(userId, course.id, course);
            return {
                ...course,
                progress: progress
            };
        });
    
    // Empfohlene Kurse (noch nicht eingeschrieben)
    const recommendedCourses = availableCourses
        .filter(course => !userProgress.coursesEnrolled.includes(course.id))
        .slice(0, 3); // Nur die ersten 3
    
    return {
        user: userProgress,
        activeCourses,
        recommendedCourses,
        recentAchievements: userProgress.achievements.slice(-3), // Letzte 3 Achievements
        streakData: {
            current: userProgress.currentStreak,
            longest: userProgress.longestStreak,
            isActiveToday: this.isActiveToday(userProgress.lastActivity)
        }
    };
}

/**
 * Prüft ob ein Benutzer heute schon aktiv war
 * @param {string} lastActivity - ISO-String der letzten Aktivität
 * @returns {boolean} True wenn heute schon aktiv
 */
function isActiveToday(lastActivity) {
    if (!lastActivity) return false;
    
    const today = new Date();
    const lastActiveDate = new Date(lastActivity);
    
    return today.toDateString() === lastActiveDate.toDateString();
}

/**
 * Simuliert das Abschließen einer Aufgabe für Demo-Zwecke
 * @param {string} userId - ID des Benutzers
 * @param {string} courseId - ID des Kurses
 * @param {string} taskId - ID der Aufgabe
 * @param {boolean} correct - Ob die Aufgabe korrekt gelöst wurde
 * @returns {Object} Ergebnis mit XP und Achievements
 */
function simulateTaskCompletion(userId, courseId, taskId, correct = true) {
    const result = {
        correct: correct,
        timeSpent: Math.floor(Math.random() * 120) + 30, // 30-150 Sekunden
        attempts: correct ? 1 : Math.floor(Math.random() * 3) + 1
    };
    
    return progressManager.completeTask(userId, courseId, taskId, result);
}

// ========================================
// EXPORT FÜR GLOBALE VERFÜGBARKEIT
// ========================================

// Manager-Instanzen global verfügbar machen
window.courseManager = courseManager;
window.progressManager = progressManager;
window.relationshipManager = relationshipManager;

// Task-Templates global verfügbar machen
window.TASK_TEMPLATES = TASK_TEMPLATES;

// Utility-Funktionen global verfügbar machen
window.getAvailableCoursesForUser = getAvailableCoursesForUser;
window.getDashboardData = getDashboardData;
window.simulateTaskCompletion = simulateTaskCompletion;
window.isActiveToday = isActiveToday;

console.log('📊 Data-Management-System geladen und bereit');
console.log('📚 Demo-Kurse verfügbar:', courseManager.courses.length);
console.log('🎯 Task-Templates verfügbar:', Object.keys(TASK_TEMPLATES).length);
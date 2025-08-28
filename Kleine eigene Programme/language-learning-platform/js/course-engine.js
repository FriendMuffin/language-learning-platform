/**
 * ========================================
 * DUOLINGO-ÄHNLICHE LEARNING ENGINE
 * ========================================
 * 
 * Dieses Modul implementiert das komplette Lernsystem:
 * - Interactive Task-Interfaces für alle Task-Types
 * - Progress-Tracking und XP-System
 * - Lesson-Flow wie bei Duolingo
 * - Adaptive Schwierigkeit
 * - Achievement-System
 * - Hearts/Lives System
 */

// ========================================
// GLOBALE LEARNING-ENGINE KONFIGURATION
// ========================================

/**
 * Konfiguration für das Learning-System
 */
const LEARNING_CONFIG = {
    // Hearts/Lives System
    MAX_HEARTS: 5,                    // Maximale Anzahl Herzen
    HEART_REGEN_TIME: 30 * 60 * 1000, // Herz regeneriert alle 30 Minuten
    
    // XP-System
    XP_CORRECT_ANSWER: 10,            // XP für richtige Antwort
    XP_PERFECT_LESSON: 25,            // Bonus für perfekte Lektion
    XP_STREAK_MULTIPLIER: 1.2,        // Streak-Multiplier
    
    // Timing
    TASK_TIMEOUT: 30,                 // Sekunden pro Aufgabe
    CELEBRATION_DURATION: 2000,       // Feier-Animation Dauer
    
    // Audio
    SOUND_ENABLED: true,              // Sound-Effekte
    
    // UI
    ANIMATION_SPEED: 300,             // Animation-Geschwindigkeit
    SHAKE_DURATION: 500               // Shake-Animation bei Fehlern
};

/**
 * Session-Persistence-Konfiguration für TC020-Fix
 */
const SESSION_PERSISTENCE = {
    STORAGE_KEY: 'activeLearningSession',
    MAX_SESSION_AGE: 2 * 60 * 60 * 1000,  // 2 Stunden
};

/**
 * Sound-Effekte für verschiedene Events
 */
const LEARNING_SOUNDS = {
    correct: '🔊 Korrekt!',
    incorrect: '❌ Falsch!',
    xp_gain: '⭐ XP erhalten!',
    achievement: '🏆 Achievement!',
    heart_lost: '💔 Herz verloren!',
    lesson_complete: '🎉 Lektion abgeschlossen!'
};

// ========================================
// LEARNING ENGINE MAIN CLASS
// ========================================

/**
 * Hauptklasse für das Learning-System
 */
class LearningEngine {
    constructor() {
        this.currentCourse = null;
        this.currentLevel = null;
        this.currentModule = null;
        this.currentTask = null;
        this.taskIndex = 0;
        this.hearts = LEARNING_CONFIG.MAX_HEARTS;
        this.sessionXP = 0;
        this.sessionCorrect = 0;
        this.sessionTotal = 0;
        this.startTime = null;
        this.taskStartTime = null;
        
        // UI-Referenzen
        this.container = null;
        this.initialized = false;
        
        // Event-Callbacks
        this.onLessonComplete = null;
        this.onTaskComplete = null;
        this.onXPGain = null;
    }
    
    /**
     * Initialisiert das Learning-Interface
     * @param {string} containerId - ID des Container-Elements
     */
    initialize(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('❌ Learning-Container nicht gefunden:', containerId);
            return false;
        }
        
        this.setupUI();
        this.initialized = true;
        console.log('🎓 Learning-Engine initialisiert');
        return true;
    }
    
    /**
     * Startet eine Lektion
     * @param {string} courseId - ID des Kurses
     * @param {string} levelId - ID des Levels
     * @param {string} moduleId - ID des Moduls
     */
    async startLesson(courseId, levelId, moduleId) {
        console.log('🚀 Starte Lektion:', { courseId, levelId, moduleId });

        // Kurs-Daten laden
        this.currentCourse = courseManager.getCourse(courseId);
        if (!this.currentCourse) {
            this.showError('Kurs nicht gefunden');
            return;
        }

        // Level finden
        this.currentLevel = this.currentCourse.levels.find(l => l.id === levelId);
        if (!this.currentLevel) {
            this.showError('Level nicht gefunden');
            return;
        }

        // Modul finden
        this.currentModule = this.currentLevel.modules.find(m => m.id === moduleId);
        if (!this.currentModule) {
            this.showError('Modul nicht gefunden');
            return;
        }

        // Session initialisieren
        this.taskIndex = 0;
        this.sessionXP = 0;
        this.sessionCorrect = 0;
        this.sessionTotal = this.currentModule.tasks.length;
        this.startTime = Date.now();
        this.hearts = LEARNING_CONFIG.MAX_HEARTS;

        // Fullscreen-Modus aktivieren
        this.enterFullscreenMode();

        // Fullscreen UI aufbauen
        this.buildFullscreenLessonUI();

        // Erste Aufgabe laden
        this.loadNextTask();

        // Session speichern
        this.saveLearningSession();
    }
    
    /**
     * Baut das Lesson-UI auf
     */
    buildLessonUI() {
        this.container.innerHTML = `
            <!-- Lesson Header -->
            <div class="bg-white shadow-sm border-b border-gray-200 p-4 mt-16">
                <div class="max-w-4xl mx-auto flex items-center justify-between">
                    <!-- Progress Bar -->
                    <div class="flex-1 mr-6">
                        <div class="flex items-center mb-2">
                            <button onclick="learningEngine.exitLesson()" class="text-gray-500 hover:text-gray-700 mr-4">
                                ← Zurück
                            </button>
                            <h2 class="text-lg font-semibold text-gray-900">${this.currentModule.title}</h2>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-3">
                            <div id="lesson-progress" class="bg-success h-3 rounded-full transition-all duration-300" style="width: 0%"></div>
                        </div>
                        <p class="text-sm text-gray-600 mt-1">Aufgabe <span id="task-counter">0</span> von ${this.sessionTotal}</p>
                    </div>
                    
                    <!-- Hearts -->
                    <div class="flex items-center space-x-1">
                        <div id="hearts-container" class="flex space-x-1">
                            ${Array(LEARNING_CONFIG.MAX_HEARTS).fill(0).map((_, i) => 
                                `<div class="heart text-red-500 text-xl" data-heart="${i}">❤️</div>`
                            ).join('')}
                        </div>
                        <span class="ml-2 text-sm text-gray-600 font-medium" id="hearts-count">${this.hearts}</span>
                    </div>
                </div>
            </div>
            
            <!-- Task Container -->
            <div class="bg-gray-50 py-8">
                <div class="max-w-2xl mx-auto px-4">
                    <div id="task-content" class="bg-white rounded-lg shadow-lg p-8 min-h-96">
                        <!-- Task wird hier geladen -->
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="mt-6 flex justify-between">
                        <button id="skip-btn" onclick="learningEngine.skipTask()" 
                                class="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-3 rounded-lg font-medium">
                            Überspringen
                        </button>
                        <button id="check-btn" onclick="learningEngine.checkAnswer()" 
                                class="bg-primary hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-medium"
                                disabled>
                            Prüfen
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Result Overlay -->
            <div id="result-overlay" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden z-50">
                <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
                    <div id="result-icon" class="text-6xl mb-4"></div>
                    <h3 id="result-title" class="text-2xl font-bold mb-2"></h3>
                    <p id="result-message" class="text-gray-600 mb-4"></p>
                    <div id="result-xp" class="text-primary font-bold text-lg mb-4 hidden">
                        +<span id="xp-amount">0</span> XP
                    </div>
                    <button id="continue-btn" onclick="learningEngine.continueLesson()" 
                            class="bg-primary hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium w-full">
                        Weiter
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Lädt die nächste Aufgabe
     */
    loadNextTask() {
        if (this.taskIndex >= this.currentModule.tasks.length) {
            this.completeLesson();
            return;
        }
        
        this.currentTask = this.currentModule.tasks[this.taskIndex];
        this.taskStartTime = Date.now();
        
        // Progress aktualisieren
        const progress = (this.taskIndex / this.sessionTotal) * 100;
        document.getElementById('lesson-progress').style.width = `${progress}%`;
        document.getElementById('task-counter').textContent = this.taskIndex + 1;
        
        // Task-Interface laden
        this.loadTaskInterface(this.currentTask);
        
        console.log('📝 Lade Aufgabe:', this.currentTask.type, `(${this.taskIndex + 1}/${this.sessionTotal})`);

        // Session speichern
        this.saveLearningSession();
    }
    
    /**
     * Lädt das Interface für eine spezifische Aufgabe
     * @param {Object} task - Aufgaben-Objekt
     */
    loadTaskInterface(task) {
        const taskContent = document.getElementById('task-content');
        const checkBtn = document.getElementById('check-btn');
        
        // Button zurücksetzen
        checkBtn.disabled = true;
        checkBtn.classList.remove('bg-success', 'bg-red-500');
        checkBtn.classList.add('bg-primary');
        
        switch (task.type) {
            case 'multiple_choice':
                this.loadMultipleChoiceTask(task, taskContent);
                break;
            case 'fill_blank':
                this.loadFillBlankTask(task, taskContent);
                break;
            case 'translation':
                this.loadTranslationTask(task, taskContent);
                break;
            case 'sentence_building':
                this.loadSentenceBuildingTask(task, taskContent);
                break;
            case 'true_false':
                this.loadTrueFalseTask(task, taskContent);
                break;
            case 'image_match':
                this.loadImageMatchTask(task, taskContent);
                break;
            case 'audio_match':
                this.loadAudioMatchTask(task, taskContent);
                break;
            default:
                this.showError('Unbekannter Aufgabentyp: ' + task.type);
        }
    }
    
    // ========================================
    // TASK-TYPE IMPLEMENTATIONS
    // ========================================
    
    /**
     * Multiple Choice Aufgabe
     */
    loadMultipleChoiceTask(task, container) {
        const data = task.data;
        container.innerHTML = `
            <div class="text-center mb-8">
                <h3 class="text-2xl font-bold text-gray-800 mb-4">${data.question}</h3>
            </div>
            <div class="space-y-3">
                ${data.options.map((option, index) => `
                    <button class="option-btn w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-primary transition-colors" 
                            data-index="${index}" onclick="learningEngine.selectOption(${index})">
                        <span class="font-medium">${option}</span>
                    </button>
                `).join('')}
            </div>
        `;
        
        this.userAnswer = null;
    }
    
    /**
     * Fill in the Blank Aufgabe
     */
    loadFillBlankTask(task, container) {
        const data = task.data;
        const sentence = data.sentence;
        const blanks = sentence.split('__BLANK__');
        
        let html = '<div class="text-center mb-8"><h3 class="text-xl font-semibold text-gray-800 mb-4">Fülle die Lücken aus:</h3></div>';
        html += '<div class="text-center text-lg leading-relaxed">';
        
        for (let i = 0; i < blanks.length; i++) {
            html += `<span>${blanks[i]}</span>`;
            if (i < blanks.length - 1) {
                html += `<input type="text" class="blank-input inline-block w-32 mx-2 px-3 py-1 border-b-2 border-primary text-center font-bold" 
                               data-blank="${i}" oninput="learningEngine.onBlankInput()">`;
            }
        }
        
        html += '</div>';
        
        if (data.hints && data.hints[0]) {
            html += `<div class="mt-6 text-center"><p class="text-gray-600">💡 Tipp: ${data.hints[0]}</p></div>`;
        }
        
        container.innerHTML = html;
        this.userAnswer = [];
    }
    
    /**
     * Translation Aufgabe
     */
    loadTranslationTask(task, container) {
        const data = task.data;
        container.innerHTML = `
            <div class="text-center mb-8">
                <h3 class="text-xl font-semibold text-gray-800 mb-4">Übersetze ins ${data.targetLanguage}:</h3>
                <div class="bg-gray-100 p-4 rounded-lg mb-6">
                    <p class="text-2xl font-bold text-gray-800">"${data.sourceText}"</p>
                </div>
            </div>
            <div class="space-y-4">
                <textarea id="translation-input" 
                          class="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none resize-none"
                          rows="3" 
                          placeholder="Deine Übersetzung..."
                          oninput="learningEngine.onTranslationInput()"></textarea>
                <p class="text-sm text-gray-500">💡 Es gibt mehrere richtige Antworten möglich</p>
            </div>
        `;
        
        this.userAnswer = '';
    }
    
    /**
     * Sentence Building Aufgabe
     */
    loadSentenceBuildingTask(task, container) {
        const data = task.data;
        const shuffledWords = [...data.words].sort(() => Math.random() - 0.5);
        
        container.innerHTML = `
            <div class="text-center mb-8">
                <h3 class="text-xl font-semibold text-gray-800 mb-4">Setze die Wörter in die richtige Reihenfolge:</h3>
                <div class="bg-gray-100 p-4 rounded-lg mb-6">
                    <p class="text-gray-600">${data.translation}</p>
                </div>
            </div>
            
            <!-- Ausgewählte Wörter -->
            <div class="mb-6">
                <h4 class="text-sm font-medium text-gray-700 mb-2">Dein Satz:</h4>
                <div id="sentence-area" class="min-h-16 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <div id="selected-words" class="flex flex-wrap gap-2"></div>
                </div>
            </div>
            
            <!-- Verfügbare Wörter -->
            <div>
                <h4 class="text-sm font-medium text-gray-700 mb-2">Verfügbare Wörter:</h4>
                <div id="word-bank" class="flex flex-wrap gap-2">
                    ${shuffledWords.map((word, index) => `
                        <button class="word-btn bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                                data-word="${word}" onclick="learningEngine.selectWord('${word}', this)">
                            ${word}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        
        this.userAnswer = [];
        this.availableWords = [...shuffledWords];
    }
    
    /**
     * True/False Aufgabe
     */
    loadTrueFalseTask(task, container) {
        const data = task.data;
        container.innerHTML = `
            <div class="text-center mb-8">
                <h3 class="text-xl font-semibold text-gray-800 mb-4">Richtig oder Falsch?</h3>
                <div class="bg-gray-100 p-6 rounded-lg mb-8">
                    <p class="text-lg text-gray-800">${data.statement}</p>
                </div>
            </div>
            <div class="flex space-x-4 justify-center">
                <button class="tf-btn bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg font-bold text-lg"
                        data-answer="true" onclick="learningEngine.selectTrueFalse(true)">
                    ✓ Richtig
                </button>
                <button class="tf-btn bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-lg font-bold text-lg"
                        data-answer="false" onclick="learningEngine.selectTrueFalse(false)">
                    ✗ Falsch
                </button>
            </div>
            ${data.context ? `<div class="mt-6 text-center"><p class="text-gray-600">Kontext: ${data.context}</p></div>` : ''}
        `;
        
        this.userAnswer = null;
    }
    
    /**
     * Image Match Aufgabe
     */
    loadImageMatchTask(task, container) {
        const data = task.data;
        container.innerHTML = `
            <div class="text-center mb-8">
                <h3 class="text-xl font-semibold text-gray-800 mb-4">Was siehst du auf dem Bild?</h3>
                <div class="mb-6">
                    <img src="${data.imageUrl}" alt="Aufgabenbild" 
                         class="mx-auto max-w-xs max-h-48 rounded-lg shadow-md"
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkJpbGQgbmljaHQgdmVyZsO8Z2JhcjwvdGV4dD48L3N2Zz4='">
                </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
                ${data.options.map((option, index) => `
                    <button class="option-btn p-4 border-2 border-gray-200 rounded-lg hover:border-primary transition-colors"
                            data-index="${index}" onclick="learningEngine.selectOption(${index})">
                        <span class="font-medium">${option}</span>
                    </button>
                `).join('')}
            </div>
        `;
        
        this.userAnswer = null;
    }
    
    /**
     * Audio Match Aufgabe
     */
    loadAudioMatchTask(task, container) {
        const data = task.data;
        container.innerHTML = `
            <div class="text-center mb-8">
                <h3 class="text-xl font-semibold text-gray-800 mb-4">Höre die Aufnahme und wähle die richtige Antwort:</h3>
                <div class="mb-6">
                    <button class="bg-primary hover:bg-blue-600 text-white px-6 py-3 rounded-full text-xl"
                            onclick="learningEngine.playAudio('${data.audioUrl}')">
                        🔊 Abspielen
                    </button>
                    <p class="text-sm text-gray-600 mt-2">Du kannst die Aufnahme mehrmals anhören</p>
                </div>
            </div>
            <div class="space-y-3">
                ${data.options.map((option, index) => `
                    <button class="option-btn w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-primary transition-colors"
                            data-index="${index}" onclick="learningEngine.selectOption(${index})">
                        <span class="font-medium">${option}</span>
                    </button>
                `).join('')}
            </div>
        `;
        
        this.userAnswer = null;
    }
    
    // ========================================
    // USER INTERACTION HANDLERS
    // ========================================
    
    /**
     * Behandelt Multiple Choice / Image Match / Audio Match Auswahl
     */
    selectOption(index) {
        // Alle Optionen zurücksetzen
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.classList.remove('border-primary', 'bg-blue-50');
            btn.classList.add('border-gray-200');
        });
        
        // Ausgewählte Option hervorheben
        const selectedBtn = document.querySelector(`[data-index="${index}"]`);
        selectedBtn.classList.add('border-primary', 'bg-blue-50');
        selectedBtn.classList.remove('border-gray-200');
        
        this.userAnswer = index;
        this.enableCheckButton();
    }
    
    /**
     * Behandelt Fill-in-the-Blank Eingabe
     */
    onBlankInput() {
        const inputs = document.querySelectorAll('.blank-input');
        this.userAnswer = Array.from(inputs).map(input => input.value.trim());
        
        // Check-Button aktivieren wenn alle Felder ausgefüllt
        const allFilled = this.userAnswer.every(answer => answer.length > 0);
        if (allFilled) {
            this.enableCheckButton();
        } else {
            this.disableCheckButton();
        }
    }
    
    /**
     * Behandelt Translation Eingabe
     */
    onTranslationInput() {
        const input = document.getElementById('translation-input');
        this.userAnswer = input.value.trim();
        
        if (this.userAnswer.length > 0) {
            this.enableCheckButton();
        } else {
            this.disableCheckButton();
        }
    }
    
    /**
     * Behandelt Wort-Auswahl für Sentence Building
     */
    selectWord(word, button) {
        // Wort zu ausgewählten Wörtern hinzufügen
        this.userAnswer.push(word);
        
        // Button ausblenden
        button.style.display = 'none';
        
        // Wort im Satz-Bereich anzeigen
        const selectedWords = document.getElementById('selected-words');
        const wordElement = document.createElement('span');
        wordElement.className = 'selected-word bg-green-100 text-green-800 px-3 py-1 rounded-lg cursor-pointer';
        wordElement.textContent = word;
        wordElement.onclick = () => this.removeWord(word, wordElement, button);
        selectedWords.appendChild(wordElement);
        
        // Check-Button aktivieren wenn Wörter ausgewählt
        if (this.userAnswer.length > 0) {
            this.enableCheckButton();
        }
    }
    
    /**
     * Entfernt ein Wort aus dem Satz
     */
    removeWord(word, wordElement, originalButton) {
        // Wort aus Antwort entfernen
        const index = this.userAnswer.indexOf(word);
        if (index > -1) {
            this.userAnswer.splice(index, 1);
        }
        
        // Word-Element entfernen
        wordElement.remove();
        
        // Original-Button wieder anzeigen
        originalButton.style.display = 'block';
        
        // Check-Button deaktivieren wenn keine Wörter
        if (this.userAnswer.length === 0) {
            this.disableCheckButton();
        }
    }
    
    /**
     * Behandelt True/False Auswahl
     */
    selectTrueFalse(answer) {
        // Alle Buttons zurücksetzen
        document.querySelectorAll('.tf-btn').forEach(btn => {
            btn.classList.remove('ring-4', 'ring-blue-300');
        });
        
        // Ausgewählten Button hervorheben
        const selectedBtn = document.querySelector(`[data-answer="${answer}"]`);
        selectedBtn.classList.add('ring-4', 'ring-blue-300');
        
        this.userAnswer = answer;
        this.enableCheckButton();
    }
    
    /**
     * Spielt Audio ab (Placeholder)
     */
    playAudio(audioUrl) {
        console.log('🔊 Audio abspielen:', audioUrl);
        // Hier würde echte Audio-Wiedergabe implementiert
        this.showNotification('🔊 Audio wird abgespielt...', 'info');
    }
    
    // ========================================
    // ANSWER CHECKING UND FEEDBACK
    // ========================================
    
    /**
     * Prüft die Antwort des Benutzers
     */
    checkAnswer() {
        const isCorrect = this.evaluateAnswer();
        const timeSpent = (Date.now() - this.taskStartTime) / 1000;
        
        this.sessionTotal++;
        
        if (isCorrect) {
            this.sessionCorrect++;
            this.handleCorrectAnswer(timeSpent);
        } else {
            this.handleIncorrectAnswer(timeSpent);
        }
    }
    
    /**
     * Evaluiert die Benutzer-Antwort
     */
    evaluateAnswer() {
        const task = this.currentTask;
        const data = task.data;
        
        switch (task.type) {
            case 'multiple_choice':
            case 'image_match':
            case 'audio_match':
                return this.userAnswer === data.correctAnswer;
                
            case 'fill_blank':
                // Alle Lücken müssen richtig sein
                return this.userAnswer.every((answer, index) => {
                    const correctAnswers = Array.isArray(data.blanks[index]) ? data.blanks[index] : [data.blanks[index]];
                    return correctAnswers.some(correct => 
                        answer.toLowerCase().trim() === correct.toLowerCase().trim()
                    );
                });
                
            case 'translation':
                // Eine der korrekten Übersetzungen muss passen
                return data.correctTranslations.some(correct => 
                    this.userAnswer.toLowerCase().trim() === correct.toLowerCase().trim()
                );
                
            case 'sentence_building':
                // Wörter müssen in richtiger Reihenfolge sein
                const correctSentence = data.correctSentence.split(' ');
                return JSON.stringify(this.userAnswer) === JSON.stringify(correctSentence);
                
            case 'true_false':
                return this.userAnswer === data.isTrue;
                
            default:
                return false;
        }
    }
    
    /**
     * Behandelt richtige Antworten
     */
    handleCorrectAnswer(timeSpent) {
        // XP berechnen
        let xpGained = LEARNING_CONFIG.XP_CORRECT_ANSWER;
        
        // Schnelligkeits-Bonus
        if (timeSpent < 10) {
            xpGained += 5;
        }
        
        this.sessionXP += xpGained;
        
        // UI-Feedback
        this.showResultOverlay(true, xpGained);
        
        // Sound-Effekt
        this.playSound('correct');
        
        console.log('✅ Richtige Antwort! +' + xpGained + ' XP');

        // Session speichern
        this.saveLearningSession();
    }
    
    /**
     * Behandelt falsche Antworten
     */
    handleIncorrectAnswer(timeSpent) {
        // Herz verlieren
        this.hearts = Math.max(0, this.hearts - 1);
        this.updateHeartsDisplay();
        
        // UI-Feedback
        this.showResultOverlay(false, 0);
        
        // Sound-Effekt
        this.playSound('incorrect');
        
        // Shake-Animation für Feedback
        this.shakeTaskContainer();
        
        console.log('❌ Falsche Antwort! Herz verloren. Verbleibend:', this.hearts);
        
        // Game Over prüfen
        if (this.hearts === 0) {
            setTimeout(() => this.gameOver(), 2000);
        }
    }
    
    /**
     * Zeigt das Ergebnis-Overlay
     */
    showResultOverlay(isCorrect, xpGained = 0) {
        const overlay = document.getElementById('result-overlay');
        const icon = document.getElementById('result-icon');
        const title = document.getElementById('result-title');
        const message = document.getElementById('result-message');
        const xpDisplay = document.getElementById('result-xp');
        const xpAmount = document.getElementById('xp-amount');
        
        if (isCorrect) {
            icon.textContent = '🎉';
            title.textContent = 'Richtig!';
            title.className = 'text-2xl font-bold mb-2 text-green-600';
            
            if (this.currentTask.data.explanation) {
                message.textContent = this.currentTask.data.explanation;
            } else {
                message.textContent = 'Gut gemacht! Du kannst zur nächsten Aufgabe.';
            }
            
            if (xpGained > 0) {
                xpDisplay.classList.remove('hidden');
                xpAmount.textContent = xpGained;
            }
        } else {
            icon.textContent = '😞';
            title.textContent = 'Nicht ganz richtig';
            title.className = 'text-2xl font-bold mb-2 text-red-600';
            
            // Richtige Antwort zeigen
            const correctAnswer = this.getCorrectAnswerText();
            message.textContent = `Die richtige Antwort ist: ${correctAnswer}`;
            
            xpDisplay.classList.add('hidden');
        }
        
        overlay.classList.remove('hidden');
        
        // Overlay mit Animation einblenden
        setTimeout(() => {
            overlay.querySelector('.bg-white').style.transform = 'scale(1)';
        }, 10);
    }
    
    /**
     * Holt den Text der richtigen Antwort für Feedback
     */
    getCorrectAnswerText() {
        const task = this.currentTask;
        const data = task.data;
        
        switch (task.type) {
            case 'multiple_choice':
            case 'image_match':
            case 'audio_match':
                return data.options[data.correctAnswer];
                
            case 'fill_blank':
                return data.blanks.join(', ');
                
            case 'translation':
                return data.correctTranslations[0];
                
            case 'sentence_building':
                return data.correctSentence;
                
            case 'true_false':
                return data.isTrue ? 'Richtig' : 'Falsch';
                
            default:
                return 'Siehe Erklärung';
        }
    }
    
    /**
     * Fährt mit der nächsten Aufgabe fort
     */
    continueLesson() {
        // Overlay ausblenden
        const overlay = document.getElementById('result-overlay');
        overlay.classList.add('hidden');
        
        // Zur nächsten Aufgabe
        this.taskIndex++;
        this.loadNextTask();
    }
    
    /**
     * Überspringt die aktuelle Aufgabe
     */
    skipTask() {
        // Als falsch werten (aber kein Herz verlieren)
        this.sessionTotal++;
        this.showResultOverlay(false, 0);
        
        console.log('⏭️ Aufgabe übersprungen');
    }
    
    /**
     * Schließt die Lektion ab
     */
    completeLesson() {
        const accuracy = Math.round((this.sessionCorrect / this.sessionTotal) * 100);
        const timeSpent = Math.round((Date.now() - this.startTime) / 1000);
        
        // Bonus-XP für hohe Genauigkeit
        if (accuracy === 100) {
            this.sessionXP += LEARNING_CONFIG.XP_PERFECT_LESSON;
        }
        
        // Progress speichern
        const userId = getCurrentUser()?.id;
        if (userId) {
            // Alle Tasks als abgeschlossen markieren
            this.currentModule.tasks.forEach(task => {
                const result = {
                    correct: true, // Vereinfacht für Demo
                    timeSpent: timeSpent / this.sessionTotal,
                    attempts: 1
                };
                progressManager.completeTask(userId, this.currentCourse.id, task.id, result);
            });
        }
        
        // Completion-Overlay zeigen
        this.showLessonComplete(accuracy, timeSpent);
        
        console.log('🎊 Lektion abgeschlossen!', { accuracy, timeSpent, xp: this.sessionXP });
    }
    
    /**
     * Zeigt das Lesson-Complete-Overlay
     */
    showLessonComplete(accuracy, timeSpent) {
        this.container.innerHTML = `
            <div class="min-h-screen bg-gradient-to-br from-success to-green-600 flex items-center justify-center">
                <div class="bg-white rounded-lg p-8 max-w-lg w-full mx-4 text-center shadow-2xl">
                    <div class="text-6xl mb-4">🎉</div>
                    <h2 class="text-3xl font-bold text-gray-800 mb-2">Lektion abgeschlossen!</h2>
                    <p class="text-gray-600 mb-6">${this.currentModule.title}</p>
                    
                    <div class="grid grid-cols-3 gap-4 mb-6">
                        <div class="text-center">
                            <div class="text-2xl font-bold text-primary">${this.sessionXP}</div>
                            <div class="text-sm text-gray-600">XP erhalten</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-green-600">${accuracy}%</div>
                            <div class="text-sm text-gray-600">Genauigkeit</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-purple">${formatDuration(timeSpent)}</div>
                            <div class="text-sm text-gray-600">Zeit</div>
                        </div>
                    </div>
                    
                    <div class="space-y-3">
                        <button onclick="learningEngine.continueToNextModule()" 
                                class="w-full bg-primary hover:bg-blue-600 text-white py-3 rounded-lg font-medium">
                            Nächstes Modul
                        </button>
                        <button onclick="learningEngine.backToCourse()" 
                                class="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 rounded-lg font-medium">
                            Zurück zum Kurs
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Game Over bei 0 Herzen
     */
    gameOver() {
        this.container.innerHTML = `
            <div class="min-h-screen bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center shadow-2xl">
                    <div class="text-6xl mb-4">💔</div>
                    <h2 class="text-2xl font-bold text-gray-800 mb-2">Keine Herzen mehr!</h2>
                    <p class="text-gray-600 mb-6">Du hast alle Herzen verloren. Versuche es später nochmal oder übe mit einfacheren Lektionen.</p>
                    
                    <div class="space-y-3">
                        <button onclick="learningEngine.retryLesson()" 
                                class="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium">
                            Nochmal versuchen
                        </button>
                        <button onclick="learningEngine.backToCourse()" 
                                class="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 rounded-lg font-medium">
                            Zurück zum Kurs
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    // ========================================
    // UI HELPER FUNCTIONS
    // ========================================
    
    /**
     * Aktiviert den Check-Button
     */
    enableCheckButton() {
        const checkBtn = document.getElementById('check-btn');
        checkBtn.disabled = false;
        checkBtn.classList.remove('bg-gray-400');
        checkBtn.classList.add('bg-primary', 'hover:bg-blue-600');
    }
    
    /**
     * Deaktiviert den Check-Button
     */
    disableCheckButton() {
        const checkBtn = document.getElementById('check-btn');
        checkBtn.disabled = true;
        checkBtn.classList.remove('bg-primary', 'hover:bg-blue-600');
        checkBtn.classList.add('bg-gray-400');
    }
    
    /**
     * Aktualisiert die Herzen-Anzeige
     */
    updateHeartsDisplay() {
        const hearts = document.querySelectorAll('.heart');
        hearts.forEach((heart, index) => {
            if (index < this.hearts) {
                heart.textContent = '❤️';
                heart.classList.remove('text-gray-300');
                heart.classList.add('text-red-500');
            } else {
                heart.textContent = '🖤';
                heart.classList.remove('text-red-500');
                heart.classList.add('text-gray-300');
            }
        });
        
        document.getElementById('hearts-count').textContent = this.hearts;
    }
    
    /**
     * Shake-Animation für das Task-Container
     */
    shakeTaskContainer() {
        const taskContent = document.getElementById('task-content');
        if (taskContent) {
            shakeElement(taskContent);
        }
    }
    
    /**
     * Spielt Sound-Effekte ab
     */
    playSound(type) {
        if (!LEARNING_CONFIG.SOUND_ENABLED) return;
        
        const sound = LEARNING_SOUNDS[type];
        if (sound) {
            console.log(sound);
            // Hier würde echte Audio-Wiedergabe implementiert
        }
    }
    
    /**
     * Zeigt eine Benachrichtigung
     */
    showNotification(message, type = 'info') {
        if (window.showNotification) {
            showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
    
    /**
     * Zeigt einen Fehler
     */
    showError(message) {
        this.container.innerHTML = `
            <div class="min-h-screen bg-gray-50 flex items-center justify-center">
                <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center shadow-lg">
                    <div class="text-4xl mb-4">😞</div>
                    <h2 class="text-xl font-bold text-gray-800 mb-2">Fehler</h2>
                    <p class="text-gray-600 mb-6">${message}</p>
                    <button onclick="showPage('learning')" 
                            class="bg-primary hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium">
                        Zurück
                    </button>
                </div>
            </div>
        `;
    }
    
    // ========================================
    // NAVIGATION FUNCTIONS
    // ========================================
    
    /**
     * Verlässt die aktuelle Lektion
     */
    exitLesson() {
        console.log('🚪 Lektion verlassen');
        this.exitLearningMode();
    }
    
    /**
     * Startet die Lektion neu
     */
    retryLesson() {
        if (this.currentCourse && this.currentLevel && this.currentModule) {
            this.startLesson(this.currentCourse.id, this.currentLevel.id, this.currentModule.id);
        }
    }
    
    /**
     * Geht zum nächsten Modul
     */
    continueToNextModule() {
        const currentIndex = this.currentLevel.modules.findIndex(m => m.id === this.currentModule.id);
        const nextModule = this.currentLevel.modules[currentIndex + 1];
        
        if (nextModule) {
            this.startLesson(this.currentCourse.id, this.currentLevel.id, nextModule.id);
        } else {
            // Nächstes Level oder zurück zum Kurs
            this.showNotification('Du hast alle Module in diesem Level abgeschlossen!', 'success');
            setTimeout(() => this.backToCourse(), 2000);
        }
    }
    
    /**
     * Kehrt zur Kurs-Übersicht zurück
     */
    backToCourse() {
        console.log('🔙 Zurück zur Kurs-Übersicht');
        this.exitLearningMode();
    }
    
    // ========================================
    // SETUP METHODS
    // ========================================
    
    /**
     * Richtet das grundlegende UI ein
     */
    setupUI() {
        this.container.className = 'learning-container';
        console.log('🎨 Learning-UI eingerichtet');
    }

    /**
     * Bereinigt die Learning-Session
     */
    cleanupLearningSession() {
        this.taskIndex = 0;
        this.sessionXP = 0;
        this.sessionCorrect = 0;
        this.sessionTotal = 0;
        this.hearts = LEARNING_CONFIG.MAX_HEARTS;
        this.initialized = false;

        const overlay = document.getElementById('result-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }

        console.log('🧹 Learning-Session bereinigt');
    }

    /**
     * Startet den Vollbild-Learning-Modus
     */
    enterFullscreenMode() {
        console.log('🎮 Entering Fullscreen Learning Mode');

        // Navigation ausblenden
        const navbar = document.getElementById('navbar');
        if (navbar) {
            navbar.style.display = 'none';
        }

        // Body-Styling für Fullscreen
        document.body.style.overflow = 'hidden';

        // Learning-Page auf Fullscreen umstellen
        const learningPage = document.getElementById('learning-page');
        if (learningPage) {
            learningPage.style.position = 'fixed';
            learningPage.style.top = '0';
            learningPage.style.left = '0';
            learningPage.style.width = '100vw';
            learningPage.style.height = '100vh';
            learningPage.style.zIndex = '1000';
            learningPage.style.backgroundColor = '#f9fafb';
        }
    }

    /**
     * Verlässt den Vollbild-Learning-Modus
     */
    exitLearningMode() {
        console.log('🚪 Exiting Learning Mode');

        // Session cleanup
        this.cleanupLearningSession();

        // Navigation wieder anzeigen
        const navbar = document.getElementById('navbar');
        if (navbar) {
            navbar.style.display = 'block';
        }

        // Body-Styling zurücksetzen
        document.body.style.overflow = 'auto';

        // Learning-Page styling zurücksetzen
        const learningPage = document.getElementById('learning-page');
        if (learningPage) {
            learningPage.style.position = '';
            learningPage.style.top = '';
            learningPage.style.left = '';
            learningPage.style.width = '';
            learningPage.style.height = '';
            learningPage.style.zIndex = '';
            learningPage.style.backgroundColor = '';

            // ✅ FIX: Learning-Page HTML wiederherstellen
            learningPage.innerHTML = `
                <div class="pt-16 max-w-4xl mx-auto py-6 px-4">
                    <h1 class="text-3xl font-bold text-gray-900 mb-6">Lernen</h1>
                    <div class="bg-white shadow rounded-lg p-6">
                        <div id="learning-content">
                            <p class="text-gray-600">Lade Lern-Inhalte...</p>
                        </div>
                    </div>
                </div>
            `;
        }

        // Zurück zur normalen Learning-Page
        if (window.loadAdvancedLearningInterface) {
            setTimeout(() => window.loadAdvancedLearningInterface(), 100);
        }
    }

    /**
     * Speichert aktuelle Learning-Session
     */
    saveLearningSession() {
        if (!this.currentCourse || !this.currentLevel || !this.currentModule) {
            this.clearLearningSession();
            return;
        }

        const sessionData = {
            timestamp: Date.now(),
            userId: window.currentUser?.id,
            courseId: this.currentCourse.id,
            levelId: this.currentLevel.id,
            moduleId: this.currentModule.id,
            taskIndex: this.taskIndex,
            hearts: this.hearts,
            sessionXP: this.sessionXP,
            sessionCorrect: this.sessionCorrect,
            sessionTotal: this.sessionTotal,
            startTime: this.startTime,
        };

        try {
            localStorage.setItem(SESSION_PERSISTENCE.STORAGE_KEY, JSON.stringify(sessionData));
            console.log('💾 Session gespeichert');
        } catch (error) {
            console.error('❌ Session-Speicher-Fehler:', error);
        }
    }

    /**
     * Lädt gespeicherte Learning-Session
     */
    loadSavedSession() {
        try {
            const data = localStorage.getItem(SESSION_PERSISTENCE.STORAGE_KEY);
            if (!data) return null;

            const session = JSON.parse(data);
            
            // Prüfungen
            if (Date.now() - session.timestamp > SESSION_PERSISTENCE.MAX_SESSION_AGE) {
                this.clearLearningSession();
                return null;
            }
            
            if (session.userId !== window.currentUser?.id) {
                this.clearLearningSession();
                return null;
            }

            return session;
        } catch (error) {
            this.clearLearningSession();
            return null;
        }
    }

    /**
     * Löscht gespeicherte Session
     */
    clearLearningSession() {
        localStorage.removeItem(SESSION_PERSISTENCE.STORAGE_KEY);
    }

    /**
     * Stellt Session wieder her
     */
    async restoreSession(sessionData) {
        console.log('🔄 Stelle Session wieder her...');

        try {
            // Kurs-Daten laden
            this.currentCourse = courseManager.getCourse(sessionData.courseId);
            this.currentLevel = this.currentCourse.levels.find(l => l.id === sessionData.levelId);
            this.currentModule = this.currentLevel.modules.find(m => m.id === sessionData.moduleId);

            // Session-State wiederherstellen
            this.taskIndex = sessionData.taskIndex;
            this.hearts = sessionData.hearts;
            this.sessionXP = sessionData.sessionXP;
            this.sessionCorrect = sessionData.sessionCorrect;
            this.sessionTotal = sessionData.sessionTotal;
            this.startTime = sessionData.startTime;

            // UI aufbauen
            this.enterFullscreenMode();
                    
            // Sicherstellen dass Container existiert
            if (!this.container) {
                const success = this.initialize('learning-page');
                if (!success) {
                    throw new Error('Container-Initialisierung fehlgeschlagen');
                }
            }
            
            this.buildFullscreenLessonUI();

            // Aktuelle Task laden
            this.currentTask = this.currentModule.tasks[this.taskIndex];
            this.loadTaskInterface(this.currentTask);

            // Progress aktualisieren
            const progress = (this.taskIndex / this.sessionTotal) * 100;
            document.getElementById('lesson-progress').style.width = `${progress}%`;
            document.getElementById('task-counter').textContent = this.taskIndex + 1;
            this.updateHeartsDisplay();

            console.log('✅ Session wiederhergestellt');
            this.showNotification('Lektion fortgesetzt!', 'success');

        } catch (error) {
            console.error('❌ Session-Wiederherstellung fehlgeschlagen:', error);
            this.clearLearningSession();
            this.showError('Session konnte nicht wiederhergestellt werden');
        }
    }

    /**
     * Bereinigt die Learning-Session
     */
    cleanupLearningSession() {
        this.taskIndex = 0;
        this.sessionXP = 0;
        this.sessionCorrect = 0;
        this.sessionTotal = 0;
        this.hearts = LEARNING_CONFIG.MAX_HEARTS;
        this.initialized = false;
        this.currentCourse = null;
        this.currentLevel = null;
        this.currentModule = null;

        // UI cleanup
        const overlay = document.getElementById('result-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }

        console.log('🧹 Learning-Session bereinigt');
    }

    /**
     * Neue buildLessonUI für Fullscreen
     */
    buildFullscreenLessonUI() {
        this.container.innerHTML = `
            <!-- Fullscreen Learning Interface -->
            <div class="learning-fullscreen min-h-screen bg-gray-50">

                <!-- Top Header -->
                <div class="bg-white shadow-sm border-b border-gray-200 p-4">
                    <div class="max-w-4xl mx-auto flex items-center justify-between">

                        <!-- Left: Back Button & Progress -->
                        <div class="flex items-center flex-1">
                            <button onclick="learningEngine.exitLesson()" 
                                    class="flex items-center text-gray-600 hover:text-gray-800 mr-6 font-medium">
                                <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                                </svg>
                                Zurück
                            </button>

                            <div class="flex-1 max-w-md">
                                <h2 class="text-lg font-semibold text-gray-900 mb-1">${this.currentModule.title}</h2>
                                <div class="w-full bg-gray-200 rounded-full h-2">
                                    <div id="lesson-progress" class="bg-green-500 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                                </div>
                                <p class="text-xs text-gray-600 mt-1">
                                    Aufgabe <span id="task-counter">0</span> von ${this.sessionTotal}
                                </p>
                            </div>
                        </div>

                        <!-- Right: Hearts -->
                        <div class="flex items-center space-x-1">
                            <div id="hearts-container" class="flex space-x-1">
                                ${Array(LEARNING_CONFIG.MAX_HEARTS).fill(0).map((_, i) => 
                                    `<div class="heart text-red-500 text-2xl" data-heart="${i}">❤️</div>`
                                ).join('')}
                            </div>
                            <span class="ml-2 text-sm text-gray-600 font-medium" id="hearts-count">${this.hearts}</span>
                        </div>
                    </div>
                </div>
                            
                <!-- Task Area -->
                <div class="flex-1 py-8">
                    <div class="max-w-3xl mx-auto px-4">
                        <div id="task-content" class="bg-white rounded-xl shadow-lg p-8 min-h-96">
                            <!-- Task wird hier geladen -->
                        </div>
                            
                        <!-- Action Buttons -->
                        <div class="mt-8 flex justify-between items-center">
                            <button id="skip-btn" onclick="learningEngine.skipTask()" 
                                    class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-xl font-medium transition-colors">
                                Überspringen
                            </button>
                            
                            <button id="check-btn" onclick="learningEngine.checkAnswer()" 
                                    class="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                                    disabled>
                                Prüfen
                            </button>
                        </div>
                    </div>
                </div>
            </div>
                            
            <!-- Result Overlay -->
            <div id="result-overlay" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center hidden z-[1010]">
                <div class="bg-white rounded-xl p-8 max-w-md w-full mx-4 text-center shadow-2xl">
                    <div id="result-icon" class="text-6xl mb-4"></div>
                    <h3 id="result-title" class="text-2xl font-bold mb-2"></h3>
                    <p id="result-message" class="text-gray-600 mb-4"></p>
                    <div id="result-xp" class="text-blue-500 font-bold text-lg mb-4 hidden">
                        +<span id="xp-amount">0</span> XP
                    </div>
                    <button id="continue-btn" onclick="learningEngine.continueLesson()" 
                            class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium w-full transition-colors">
                        Weiter
                    </button>
                </div>
            </div>
        `;
    }
}

// ========================================
// GLOBALE LEARNING ENGINE INSTANZ
// ========================================

/**
 * Globale Learning-Engine-Instanz
 */
const learningEngine = new LearningEngine();

// ========================================
// INTEGRATION MIT DER HAUPTAPP
// ========================================

/**
 * Erweitert die loadLearningInterface Funktion um echte Funktionalität
 */
function loadAdvancedLearningInterface() {
    console.log('📚 Lade erweiterte Lern-Oberfläche...');
    
    const learningContainer = document.querySelector('#learning-page .bg-white');
    if (!learningContainer) return;
    
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const userProgress = progressManager.getUserProgress(currentUser.id);
    const availableCourses = getAvailableCoursesForUser(currentUser.id, currentUser.userType);
    
    // Eingeschriebene Kurse
    const enrolledCourses = availableCourses.filter(course => 
        userProgress.coursesEnrolled.includes(course.id)
    );
    
    if (enrolledCourses.length === 0) {
        learningContainer.innerHTML = `
            <div class="text-center py-8">
                <h3 class="text-xl font-semibold text-gray-900 mb-4">Noch keine Kurse</h3>
                <p class="text-gray-600 mb-6">Du bist noch in keinem Kurs eingeschrieben.</p>
                <button onclick="showPage('teachers')" class="bg-primary hover:bg-blue-600 text-white px-6 py-3 rounded-lg">
                    Lehrer finden
                </button>
            </div>
        `;
        return;
    }
    
    // Kurs-Interface mit Duolingo-Style-Path
    let courseHTML = `
        <div class="space-y-8">
            <h2 class="text-2xl font-bold text-gray-900">Deine Kurse</h2>
    `;
    
    enrolledCourses.forEach(course => {
        const progress = progressManager.calculateCourseProgress(currentUser.id, course.id, course);
        
        courseHTML += `
            <div class="border rounded-lg p-6 bg-gradient-to-r from-white to-gray-50">
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <h3 class="text-xl font-semibold">${course.title}</h3>
                        <p class="text-gray-600">${course.description}</p>
                        <p class="text-sm text-gray-500">von ${course.teacherName}</p>
                    </div>
                    <div class="text-right">
                        <div class="text-3xl font-bold text-primary">${progress.percentage}%</div>
                        <p class="text-sm text-gray-600">${progress.completedTasks}/${progress.totalTasks} Aufgaben</p>
                    </div>
                </div>
                
                <!-- Duolingo-Style Level Path -->
                <div class="course-path space-y-4">
                    ${course.levels.map((level, levelIndex) => `
                        <div class="level-container ${levelIndex === 0 || progress.percentage > (levelIndex * 25) ? '' : 'opacity-50'}">
                            <div class="flex items-center mb-3">
                                <div class="level-icon w-12 h-12 rounded-full ${level.isUnlocked ? 'bg-success' : 'bg-gray-300'} 
                                           flex items-center justify-center text-white text-xl font-bold mr-4">
                                    ${level.icon || (levelIndex + 1)}
                                </div>
                                <div>
                                    <h4 class="font-semibold">${level.title}</h4>
                                    <p class="text-sm text-gray-600">${level.description}</p>
                                </div>
                            </div>
                            
                            <!-- Module in diesem Level -->
                            <div class="ml-16 space-y-2">
                                ${level.modules.map((module, moduleIndex) => {
                                    const moduleCompleted = progress.completedTasks >= ((levelIndex * level.modules.length + moduleIndex + 1) * 3); // Vereinfacht
                                    return `
                                        <div class="module-item flex items-center justify-between p-3 rounded border 
                                                   ${moduleCompleted ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}">
                                            <div>
                                                <span class="font-medium">${module.title}</span>
                                                <span class="text-sm text-gray-500 ml-2">(~${module.estimatedMinutes} Min.)</span>
                                            </div>
                                            <button onclick="startLearningModule('${course.id}', '${level.id}', '${module.id}')"
                                                    class="px-4 py-2 rounded ${moduleCompleted ? 'bg-green-500 hover:bg-green-600' : 'bg-primary hover:bg-blue-600'} 
                                                           text-white text-sm font-medium">
                                                ${moduleCompleted ? 'Wiederholen' : 'Starten'}
                                            </button>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });
    
    courseHTML += '</div>';
    learningContainer.innerHTML = courseHTML;
}

/**
 * Startet ein Lern-Modul
 * @param {string} courseId - Kurs-ID
 * @param {string} levelId - Level-ID  
 * @param {string} moduleId - Modul-ID
 */
function startLearningModule(courseId, levelId, moduleId) {
    console.log('🎯 Starte Lern-Modul:', { courseId, levelId, moduleId });
    
    // Learning-Engine initialisieren falls noch nicht geschehen
    if (!learningEngine.initialized) {
        const success = learningEngine.initialize('learning-page');
        if (!success) {
            showNotification('Fehler beim Laden des Learning-Systems', 'error');
            return;
        }
    }
    
    // Lektion starten
    learningEngine.startLesson(courseId, levelId, moduleId);
}

// ========================================
// GLOBALE EXPORTS
// ========================================

// Learning-Engine global verfügbar machen
window.learningEngine = learningEngine;
window.startLearningModule = startLearningModule;
window.loadAdvancedLearningInterface = loadAdvancedLearningInterface;

console.log('🎓 Course-Engine geladen - Duolingo-System bereit!');
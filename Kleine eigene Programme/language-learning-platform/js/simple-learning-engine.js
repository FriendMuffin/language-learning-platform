/**
 * ========================================
 * SIMPLE LEARNING ENGINE
 * ========================================
 * 
 * Einfaches aber funktionales Duolingo-ähnliches Lernsystem:
 * - Multiple Choice Aufgaben
 * - Fill-in-the-Blank
 * - Translation Tasks
 * - XP-System mit Hearts
 * - Progress Tracking
 * - Lesson Completion
 */

// ========================================
// LEARNING ENGINE CLASS
// ========================================

class SimpleLearningEngine {
    constructor() {
        this.currentCourse = null;
        this.currentLesson = null;
        this.currentTaskIndex = 0;
        this.hearts = 5;
        this.sessionXP = 0;
        this.sessionCorrect = 0;
        this.sessionTotal = 0;
        this.isActive = false;
        
        this.userAnswers = [];
        this.startTime = null;
    }
    
    /**
     * Startet eine Lektion
     */
    startLesson(courseId, lessonId) {
        console.log('🎓 Starte Lektion:', courseId, lessonId);
        
        // Demo-Lektion laden
        this.currentLesson = this.getDemoLesson(courseId, lessonId);
        this.currentCourse = courseManager.getCourse(courseId);
        
        this.currentTaskIndex = 0;
        this.hearts = 5;
        this.sessionXP = 0;
        this.sessionCorrect = 0;
        this.sessionTotal = this.currentLesson.tasks.length;
        this.startTime = Date.now();
        this.isActive = true;
        
        this.buildLearningUI();
        this.loadCurrentTask();
    }
    
    /**
     * Erstellt Demo-Lektionen
     */
    getDemoLesson(courseId, lessonId) {
        const demoLessons = {
            'german-a1-demo': {
                'lesson-1': {
                    id: 'lesson-1',
                    title: 'Grundlegende Begrüßungen',
                    description: 'Lerne wie man sich auf Deutsch begrüßt',
                    tasks: [
                        {
                            id: 'task-1',
                            type: 'multiple_choice',
                            question: 'Was bedeutet "Guten Tag" auf Englisch?',
                            options: ['Good morning', 'Good day', 'Good evening', 'Good night'],
                            correctAnswer: 1,
                            explanation: '"Guten Tag" ist eine höfliche Tagesbegrüßung.'
                        },
                        {
                            id: 'task-2',
                            type: 'fill_blank',
                            sentence: 'Hallo! Wie _____ es dir?',
                            correctAnswers: ['geht', 'gehts'],
                            hint: 'Wie fragt man nach dem Befinden?'
                        },
                        {
                            id: 'task-3',
                            type: 'translation',
                            prompt: 'Übersetze ins Deutsche:',
                            text: 'Hello, how are you?',
                            correctAnswers: ['Hallo, wie geht es dir?', 'Hallo, wie gehts dir?', 'Hallo wie geht es dir'],
                            hint: 'Informelle Begrüßung'
                        },
                        {
                            id: 'task-4',
                            type: 'multiple_choice',
                            question: 'Wie sagt man "Goodbye" auf Deutsch?',
                            options: ['Hallo', 'Danke', 'Auf Wiedersehen', 'Bitte'],
                            correctAnswer: 2,
                            explanation: '"Auf Wiedersehen" ist eine höfliche Verabschiedung.'
                        },
                        {
                            id: 'task-5',
                            type: 'fill_blank',
                            sentence: 'Auf _____! Bis bald!',
                            correctAnswers: ['Wiedersehen', 'wiedersehen'],
                            hint: 'Höfliche Verabschiedung'
                        }
                    ]
                }
            },
            'english-b1-demo': {
                'lesson-1': {
                    id: 'lesson-1',
                    title: 'Past Tense Basics',
                    description: 'Learn basic past tense forms',
                    tasks: [
                        {
                            id: 'task-1',
                            type: 'multiple_choice',
                            question: 'What is the past tense of "walk"?',
                            options: ['walk', 'walked', 'walking', 'walks'],
                            correctAnswer: 1,
                            explanation: 'Regular verbs add "-ed" for past tense.'
                        },
                        {
                            id: 'task-2',
                            type: 'translation',
                            prompt: 'Translate to English:',
                            text: 'Ich ging gestern ins Kino.',
                            correctAnswers: ['I went to the cinema yesterday', 'I went to the movies yesterday'],
                            hint: 'Past tense of "go" is "went"'
                        }
                    ]
                }
            }
        };
        
        return demoLessons[courseId]?.[lessonId] || demoLessons['german-a1-demo']['lesson-1'];
    }
    
    /**
     * Baut das Learning-UI auf
     */
    buildLearningUI() {
        const container = document.getElementById('learning-content');
        
        container.innerHTML = `
            <!-- Lesson Header -->
            <div class="bg-gradient-to-r from-primary to-blue-600 text-white p-6 rounded-lg mb-6">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-2xl font-bold">${this.currentLesson.title}</h2>
                        <p class="text-blue-100">${this.currentLesson.description}</p>
                    </div>
                    <button onclick="learningEngine.exitLesson()" class="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg">
                        ← Zurück
                    </button>
                </div>
            </div>
            
            <!-- Progress & Hearts -->
            <div class="flex items-center justify-between mb-6">
                <div class="flex-1">
                    <div class="flex items-center mb-2">
                        <span class="text-sm text-gray-600">Aufgabe <span id="task-counter">1</span> von ${this.sessionTotal}</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-3">
                        <div id="progress-bar" class="bg-success h-3 rounded-full transition-all duration-300" style="width: 0%"></div>
                    </div>
                </div>
                <div class="ml-6 flex items-center space-x-1">
                    <span class="text-sm text-gray-600 mr-2">❤️</span>
                    <div id="hearts-display" class="flex space-x-1">
                        ${Array(5).fill(0).map((_, i) => `<span class="heart text-xl" data-heart="${i}">❤️</span>`).join('')}
                    </div>
                </div>
            </div>
            
            <!-- Task Container -->
            <div id="task-container" class="bg-white rounded-lg shadow-lg p-8 mb-6 min-h-96">
                <!-- Task wird hier geladen -->
            </div>
            
            <!-- Action Buttons -->
            <div class="flex justify-between">
                <button id="skip-btn" onclick="learningEngine.skipTask()" 
                        class="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-3 rounded-lg">
                    Überspringen
                </button>
                <button id="check-btn" onclick="learningEngine.checkAnswer()" 
                        class="bg-primary hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-medium" disabled>
                    Prüfen
                </button>
            </div>
            
            <!-- Result Modal -->
            <div id="result-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden z-50">
                <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                    <div class="text-center">
                        <div id="result-icon" class="text-6xl mb-4">🎉</div>
                        <h3 id="result-title" class="text-2xl font-bold mb-2">Richtig!</h3>
                        <p id="result-message" class="text-gray-600 mb-4">Gut gemacht!</p>
                        <div id="result-xp" class="text-primary font-bold text-lg mb-4 hidden">
                            +<span id="xp-gained">0</span> XP
                        </div>
                        <button onclick="learningEngine.continueLesson()" 
                                class="bg-primary hover:bg-blue-600 text-white px-6 py-3 rounded-lg w-full">
                            Weiter
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Lädt die aktuelle Aufgabe
     */
    loadCurrentTask() {
        if (this.currentTaskIndex >= this.currentLesson.tasks.length) {
            this.completeLesson();
            return;
        }
        
        const task = this.currentLesson.tasks[this.currentTaskIndex];
        this.currentTask = task;
        
        // Progress aktualisieren
        const progress = (this.currentTaskIndex / this.sessionTotal) * 100;
        document.getElementById('progress-bar').style.width = progress + '%';
        document.getElementById('task-counter').textContent = this.currentTaskIndex + 1;
        
        // Task-Interface laden
        this.loadTaskInterface(task);
        
        // Check-Button zurücksetzen
        const checkBtn = document.getElementById('check-btn');
        checkBtn.disabled = true;
        checkBtn.classList.remove('bg-green-500', 'bg-red-500');
        checkBtn.classList.add('bg-primary');
    }
    
    /**
     * Lädt das Interface für verschiedene Task-Typen
     */
    loadTaskInterface(task) {
        const container = document.getElementById('task-container');
        
        switch (task.type) {
            case 'multiple_choice':
                this.loadMultipleChoice(task, container);
                break;
            case 'fill_blank':
                this.loadFillBlank(task, container);
                break;
            case 'translation':
                this.loadTranslation(task, container);
                break;
            default:
                container.innerHTML = '<p>Unbekannter Aufgabentyp</p>';
        }
        
        this.userAnswer = null;
    }
    
    /**
     * Multiple Choice Aufgabe
     */
    loadMultipleChoice(task, container) {
        container.innerHTML = `
            <div class="text-center mb-8">
                <h3 class="text-2xl font-bold text-gray-800 mb-6">${task.question}</h3>
            </div>
            <div class="space-y-3">
                ${task.options.map((option, index) => `
                    <button class="option-btn w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-primary transition-colors" 
                            data-index="${index}" onclick="learningEngine.selectOption(${index})">
                        <span class="font-medium">${option}</span>
                    </button>
                `).join('')}
            </div>
        `;
    }
    
    /**
     * Fill in the Blank Aufgabe
     */
    loadFillBlank(task, container) {
        const parts = task.sentence.split('_____');
        
        let html = `
            <div class="text-center mb-8">
                <h3 class="text-xl font-semibold text-gray-800 mb-6">Fülle die Lücke aus:</h3>
            </div>
            <div class="text-center text-xl leading-relaxed mb-6">
        `;
        
        for (let i = 0; i < parts.length; i++) {
            html += `<span>${parts[i]}</span>`;
            if (i < parts.length - 1) {
                html += `<input type="text" class="blank-input inline-block w-32 mx-2 px-3 py-2 border-b-2 border-primary text-center font-bold bg-yellow-50" 
                               oninput="learningEngine.onInputChange()">`;
            }
        }
        
        html += `</div>`;
        
        if (task.hint) {
            html += `<div class="text-center text-gray-600 text-sm">💡 ${task.hint}</div>`;
        }
        
        container.innerHTML = html;
    }
    
    /**
     * Translation Aufgabe
     */
    loadTranslation(task, container) {
        container.innerHTML = `
            <div class="text-center mb-8">
                <h3 class="text-xl font-semibold text-gray-800 mb-4">${task.prompt}</h3>
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p class="text-xl font-bold text-blue-800">"${task.text}"</p>
                </div>
            </div>
            <div>
                <textarea id="translation-input" 
                          class="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                          rows="3" 
                          placeholder="Deine Übersetzung..."
                          oninput="learningEngine.onInputChange()"></textarea>
                ${task.hint ? `<p class="text-sm text-gray-500 mt-2">💡 ${task.hint}</p>` : ''}
            </div>
        `;
    }
    
    /**
     * Behandelt Option-Auswahl bei Multiple Choice
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
     * Behandelt Eingabe-Änderungen
     */
    onInputChange() {
        const task = this.currentTask;
        
        if (task.type === 'fill_blank') {
            const input = document.querySelector('.blank-input');
            this.userAnswer = input.value.trim();
        } else if (task.type === 'translation') {
            const input = document.getElementById('translation-input');
            this.userAnswer = input.value.trim();
        }
        
        if (this.userAnswer && this.userAnswer.length > 0) {
            this.enableCheckButton();
        } else {
            this.disableCheckButton();
        }
    }
    
    /**
     * Aktiviert den Check-Button
     */
    enableCheckButton() {
        const checkBtn = document.getElementById('check-btn');
        checkBtn.disabled = false;
        checkBtn.classList.remove('bg-gray-400');
        checkBtn.classList.add('bg-primary');
    }
    
    /**
     * Deaktiviert den Check-Button
     */
    disableCheckButton() {
        const checkBtn = document.getElementById('check-btn');
        checkBtn.disabled = true;
        checkBtn.classList.remove('bg-primary');
        checkBtn.classList.add('bg-gray-400');
    }
    
    /**
     * Prüft die Antwort
     */
    checkAnswer() {
        const task = this.currentTask;
        let isCorrect = false;
        
        switch (task.type) {
            case 'multiple_choice':
                isCorrect = this.userAnswer === task.correctAnswer;
                break;
            case 'fill_blank':
                isCorrect = task.correctAnswers.some(answer => 
                    this.userAnswer.toLowerCase() === answer.toLowerCase()
                );
                break;
            case 'translation':
                isCorrect = task.correctAnswers.some(answer => 
                    this.userAnswer.toLowerCase().trim() === answer.toLowerCase().trim()
                );
                break;
        }
        
        this.sessionTotal++;
        
        if (isCorrect) {
            this.sessionCorrect++;
            this.handleCorrectAnswer();
        } else {
            this.handleIncorrectAnswer();
        }
    }
    
    /**
     * Behandelt richtige Antworten
     */
    handleCorrectAnswer() {
        const xpGained = 10;
        this.sessionXP += xpGained;
        
        this.showResult(true, xpGained, this.currentTask.explanation || 'Richtig! Gut gemacht!');
        
        console.log('✅ Richtige Antwort! +' + xpGained + ' XP');
    }
    
    /**
     * Behandelt falsche Antworten
     */
    handleIncorrectAnswer() {
        this.hearts = Math.max(0, this.hearts - 1);
        this.updateHeartsDisplay();
        
        let correctAnswer = '';
        const task = this.currentTask;
        
        switch (task.type) {
            case 'multiple_choice':
                correctAnswer = task.options[task.correctAnswer];
                break;
            case 'fill_blank':
            case 'translation':
                correctAnswer = task.correctAnswers[0];
                break;
        }
        
        this.showResult(false, 0, `Die richtige Antwort ist: "${correctAnswer}"`);
        
        if (this.hearts === 0) {
            setTimeout(() => this.gameOver(), 2000);
        }
        
        console.log('❌ Falsche Antwort! Herzen übrig:', this.hearts);
    }
    
    /**
     * Zeigt Ergebnis-Modal
     */
    showResult(isCorrect, xpGained, message) {
        const modal = document.getElementById('result-modal');
        const icon = document.getElementById('result-icon');
        const title = document.getElementById('result-title');
        const messageEl = document.getElementById('result-message');
        const xpEl = document.getElementById('result-xp');
        const xpGainedEl = document.getElementById('xp-gained');
        
        if (isCorrect) {
            icon.textContent = '🎉';
            title.textContent = 'Richtig!';
            title.className = 'text-2xl font-bold mb-2 text-green-600';
            xpEl.classList.remove('hidden');
            xpGainedEl.textContent = xpGained;
        } else {
            icon.textContent = '😞';
            title.textContent = 'Nicht ganz richtig';
            title.className = 'text-2xl font-bold mb-2 text-red-600';
            xpEl.classList.add('hidden');
        }
        
        messageEl.textContent = message;
        modal.classList.remove('hidden');
    }
    
    /**
     * Fährt mit nächster Aufgabe fort
     */
    continueLesson() {
        document.getElementById('result-modal').classList.add('hidden');
        this.currentTaskIndex++;
        this.loadCurrentTask();
    }
    
    /**
     * Überspringt aktuelle Aufgabe
     */
    skipTask() {
        this.sessionTotal++;
        this.showResult(false, 0, 'Aufgabe übersprungen. Versuche es nächstes Mal!');
    }
    
    /**
     * Aktualisiert Herzen-Anzeige
     */
    updateHeartsDisplay() {
        const hearts = document.querySelectorAll('.heart');
        hearts.forEach((heart, index) => {
            if (index < this.hearts) {
                heart.textContent = '❤️';
            } else {
                heart.textContent = '🖤';
            }
        });
    }
    
    /**
     * Schließt Lektion ab
     */
    completeLesson() {
        const accuracy = Math.round((this.sessionCorrect / this.sessionTotal) * 100);
        const timeSpent = Math.round((Date.now() - this.startTime) / 1000);
        
        // XP an Benutzer vergeben
        const currentUser = window.currentUser;
        if (currentUser) {
            // Simuliere Task-Completion für Progress-System
            const courseId = this.currentCourse?.id || 'german-a1-demo';
            this.currentLesson.tasks.forEach(task => {
                const result = {
                    correct: true,
                    timeSpent: timeSpent / this.sessionTotal,
                    attempts: 1
                };
                progressManager.completeTask(currentUser.id, courseId, task.id, result);
            });
        }
        
        this.showLessonComplete(accuracy, timeSpent);
    }
    
    /**
     * Zeigt Lesson-Complete-Screen
     */
    showLessonComplete(accuracy, timeSpent) {
        const container = document.getElementById('learning-content');
        
        container.innerHTML = `
            <div class="text-center py-12">
                <div class="text-8xl mb-6">🎉</div>
                <h2 class="text-4xl font-bold text-gray-800 mb-4">Lektion abgeschlossen!</h2>
                <p class="text-xl text-gray-600 mb-8">${this.currentLesson.title}</p>
                
                <div class="grid grid-cols-3 gap-8 max-w-md mx-auto mb-8">
                    <div class="text-center">
                        <div class="text-3xl font-bold text-primary">${this.sessionXP}</div>
                        <div class="text-sm text-gray-600">XP erhalten</div>
                    </div>
                    <div class="text-center">
                        <div class="text-3xl font-bold text-green-600">${accuracy}%</div>
                        <div class="text-sm text-gray-600">Genauigkeit</div>
                    </div>
                    <div class="text-center">
                        <div class="text-3xl font-bold text-purple">${Math.floor(timeSpent / 60)}:${(timeSpent % 60).toString().padStart(2, '0')}</div>
                        <div class="text-sm text-gray-600">Zeit</div>
                    </div>
                </div>
                
                <div class="space-y-4 max-w-sm mx-auto">
                    <button onclick="learningEngine.startNextLesson()" 
                            class="w-full bg-primary hover:bg-blue-600 text-white py-3 rounded-lg font-medium">
                        Nächste Lektion
                    </button>
                    <button onclick="learningEngine.backToLearning()" 
                            class="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 rounded-lg font-medium">
                        Zurück zu Kursen
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Game Over bei 0 Herzen
     */
    gameOver() {
        const container = document.getElementById('learning-content');
        
        container.innerHTML = `
            <div class="text-center py-12">
                <div class="text-8xl mb-6">💔</div>
                <h2 class="text-3xl font-bold text-gray-800 mb-4">Keine Herzen mehr!</h2>
                <p class="text-gray-600 mb-8">Keine Sorge, du kannst es jederzeit nochmal versuchen!</p>
                
                <div class="space-y-4 max-w-sm mx-auto">
                    <button onclick="learningEngine.retryLesson()" 
                            class="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium">
                        Nochmal versuchen
                    </button>
                    <button onclick="learningEngine.backToLearning()" 
                            class="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 rounded-lg font-medium">
                        Zurück zu Kursen
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Navigation-Funktionen
     */
    exitLesson() {
        if (confirm('Möchtest du die Lektion wirklich verlassen?')) {
            this.backToLearning();
        }
    }
    
    retryLesson() {
        if (this.currentLesson) {
            this.startLesson(this.currentCourse?.id || 'german-a1-demo', this.currentLesson.id);
        }
    }
    
    startNextLesson() {
        this.startLesson('german-a1-demo', 'lesson-1'); // Demo: immer gleiche Lektion
    }
    
    backToLearning() {
        this.isActive = false;
        showPage('learning');
    }
}

// ========================================
// GLOBALE INSTANZ
// ========================================

const learningEngine = new SimpleLearningEngine();

// ========================================
// INTEGRATION MIT HAUPTAPP
// ========================================

/**
 * Erweitert die startCourse Funktion
 */
window.startCourse = function(courseId) {
    console.log('🎯 Starte Kurs:', courseId);
    learningEngine.startLesson(courseId, 'lesson-1');
};

/**
 * Erweitert die loadLearning Funktion
 */
function enhancedLoadLearning() {
    if (!currentUser) return;
    
    const availableCourses = getAvailableCoursesForUser(currentUser.id, currentUser.userType);
    const userProgress = progressManager.getUserProgress(currentUser.id);
    
    let html = '<div class="space-y-6">';
    
    // Duolingo-style Course Cards
    html += '<h2 class="text-2xl font-bold text-gray-900 mb-6">🎓 Deine Lernreise</h2>';
    
    if (availableCourses.length === 0) {
        html += `
            <div class="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-8 rounded-lg text-center">
                <h3 class="text-xl font-bold mb-4">Noch keine Kurse verfügbar</h3>
                <p class="mb-6">Finde einen Lehrer und starte deine Lernreise!</p>
                <button onclick="showPage('teachers')" class="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100">
                    Lehrer finden
                </button>
            </div>
        `;
    } else {
        html += '<div class="grid gap-6">';
        
        availableCourses.forEach(course => {
            const progress = progressManager.calculateCourseProgress(currentUser.id, course.id, course);
            const isStarted = progress.percentage > 0;
            
            html += `
                <div class="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                    <div class="bg-gradient-to-r ${course.id.includes('german') ? 'from-green-500 to-blue-500' : 'from-purple-500 to-pink-500'} text-white p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="text-2xl font-bold">${course.title}</h3>
                                <p class="text-blue-100">${course.description}</p>
                                <p class="text-sm text-blue-200 mt-1">von ${course.teacherName}</p>
                            </div>
                            <div class="text-right">
                                <div class="text-3xl font-bold">${progress.percentage}%</div>
                                <div class="text-sm text-blue-200">${progress.completedTasks}/${progress.totalTasks} Aufgaben</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="p-6">
                        <div class="mb-4">
                            <div class="w-full bg-gray-200 rounded-full h-3">
                                <div class="bg-green-500 h-3 rounded-full transition-all duration-300" style="width: ${progress.percentage}%"></div>
                            </div>
                        </div>
                        
                        <div class="flex items-center justify-between">
                            <div class="text-sm text-gray-600">
                                ${isStarted ? '🔥 Weiter lernen und' : '🚀 Starte jetzt und'} sammle XP!
                            </div>
                            <button onclick="startCourse('${course.id}')" 
                                    class="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                                ${isStarted ? '▶️ Weiterlernen' : '🎯 Starten'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
    }
    
    // Quick Stats
    html += `
        <div class="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-6 rounded-lg">
            <h3 class="text-xl font-bold mb-4">📊 Deine Statistiken</h3>
            <div class="grid grid-cols-3 gap-4">
                <div class="text-center">
                    <div class="text-2xl font-bold">${userProgress.totalXP}</div>
                    <div class="text-sm text-yellow-100">Gesamt XP</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold">${userProgress.currentStreak}</div>
                    <div class="text-sm text-yellow-100">Tage Streak</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold">${userProgress.totalTasksCompleted}</div>
                    <div class="text-sm text-yellow-100">Aufgaben</div>
                </div>
            </div>
        </div>
    `;
    
    html += '</div>';
    
    document.getElementById('learning-content').innerHTML = html;
}

// Erweitert die ursprüngliche loadLearning Funktion
const originalLoadLearning = window.loadLearning;
window.loadLearning = function() {
    if (learningEngine.isActive) {
        // Learning Engine ist aktiv - nicht überschreiben
        return;
    }
    
    enhancedLoadLearning();
};

window.learningEngine = learningEngine;
console.log('🎓 Simple Learning Engine geladen und bereit!');
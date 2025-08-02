/**
 * ========================================
 * ADMIN SYSTEM
 * ========================================
 * 
 * Course Creation & Management System:
 * - Admin Dashboard
 * - Course Builder (Languages → Courses → Levels → Modules → Tasks)
 * - Teacher Request Management
 * - Content Management
 * - System Administration
 */

// ========================================
// ADMIN SYSTEM CLASS
// ========================================

class AdminSystem {
    constructor() {
        this.currentCourse = null;
        this.currentLevel = null;
        this.currentModule = null;
        this.teacherRequests = this.loadTeacherRequests();
        this.isInitialized = false;
    }
    
    /**
     * Initialisiert das Admin-System
     */
    initialize() {
        if (this.isInitialized) return;
        
        console.log('🛠️ Admin-System wird initialisiert...');
        this.createDemoAdminUser();
        this.createDemoTeacherRequests();
        this.isInitialized = true;
        console.log('✅ Admin-System bereit');
    }
    
    /**
     * Erstellt Demo-Admin-User falls nicht vorhanden
     */
    createDemoAdminUser() {
        const adminExists = userDatabase.getAllUsers().some(user => user.userType === 'admin');
        
        if (!adminExists) {
            console.log('👑 Erstelle Demo-Admin...');
            userDatabase.createUser({
                id: 'demo-admin-001',
                name: 'System',
                surname: 'Admin',
                email: 'admin@demo.com',
                username: 'admin',
                password: userDatabase.hashPassword('Admin123!'),
                userType: 'admin',
                createdAt: new Date().toISOString(),
                isDemo: true
            });
            console.log('✅ Demo-Admin erstellt: admin / Admin123!');
        }
    }
    
    /**
     * Erstellt Demo-Teacher-Anfragen
     */
    createDemoTeacherRequests() {
        if (this.teacherRequests.length === 0) {
            this.teacherRequests = [
                {
                    id: 'req-001',
                    teacherId: 'demo-teacher-001',
                    teacherName: 'Anna Schmidt',
                    requestedCourse: {
                        title: 'Deutsch A2 - Aufbaukurs',
                        language: 'Deutsch',
                        targetLanguage: 'Englisch',
                        level: 'A2',
                        description: 'Erweiterte deutsche Grammatik und Konversation'
                    },
                    requestedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                    status: 'pending',
                    notes: 'Möchte Aufbaukurs für fortgeschrittene Anfänger'
                },
                {
                    id: 'req-002',
                    teacherId: 'demo-teacher-001',
                    teacherName: 'Anna Schmidt',
                    requestedCourse: {
                        title: 'Business Englisch',
                        language: 'English',
                        targetLanguage: 'Deutsch',
                        level: 'B2',
                        description: 'Englisch für den Beruf und Business-Kontext'
                    },
                    requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                    status: 'pending',
                    notes: 'Für Berufstätige, Fokus auf E-Mails und Präsentationen'
                }
            ];
            this.saveTeacherRequests();
        }
    }
    
    /**
     * Lädt das Admin-Dashboard
     */
    loadAdminDashboard() {
        const container = document.getElementById('admin-content') || document.querySelector('#admin-page .bg-white');
        
        if (!container) {
            console.error('❌ Admin-Container nicht gefunden');
            return;
        }
        
        const allUsers = userDatabase.getAllUsers();
        const allCourses = courseManager.courses;
        const pendingRequests = this.teacherRequests.filter(req => req.status === 'pending');
        
        container.innerHTML = `
            <div class="space-y-8">
                <!-- Admin Header -->
                <div class="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-lg">
                    <h2 class="text-3xl font-bold mb-2">👑 Admin Dashboard</h2>
                    <p class="text-purple-100">Course & Content Management System</p>
                </div>
                
                <!-- Quick Stats -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div class="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                        <h3 class="text-lg font-semibold text-gray-700">👥 Benutzer</h3>
                        <div class="text-3xl font-bold text-blue-600">${allUsers.length}</div>
                        <div class="text-sm text-gray-500">
                            ${allUsers.filter(u => u.userType === 'student').length} Schüler, 
                            ${allUsers.filter(u => u.userType === 'teacher').length} Lehrer
                        </div>
                    </div>
                    
                    <div class="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                        <h3 class="text-lg font-semibold text-gray-700">📚 Kurse</h3>
                        <div class="text-3xl font-bold text-green-600">${allCourses.length}</div>
                        <div class="text-sm text-gray-500">Aktive Kurse</div>
                    </div>
                    
                    <div class="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
                        <h3 class="text-lg font-semibold text-gray-700">📋 Anfragen</h3>
                        <div class="text-3xl font-bold text-yellow-600">${pendingRequests.length}</div>
                        <div class="text-sm text-gray-500">Ausstehende Teacher-Anfragen</div>
                    </div>
                    
                    <div class="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                        <h3 class="text-lg font-semibold text-gray-700">🎯 Tasks</h3>
                        <div class="text-3xl font-bold text-purple-600">${this.getTotalTaskCount()}</div>
                        <div class="text-sm text-gray-500">Gesamt Aufgaben</div>
                    </div>
                </div>
                
                <!-- Quick Actions -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <button onclick="adminSystem.showCourseBuilder()" 
                            class="bg-blue-500 hover:bg-blue-600 text-white p-6 rounded-lg text-left transition-colors">
                        <div class="text-2xl mb-2">➕</div>
                        <h3 class="text-lg font-bold">Neuen Kurs erstellen</h3>
                        <p class="text-blue-100">Course Builder öffnen</p>
                    </button>
                    
                    <button onclick="adminSystem.showTeacherRequests()" 
                            class="bg-green-500 hover:bg-green-600 text-white p-6 rounded-lg text-left transition-colors">
                        <div class="text-2xl mb-2">📋</div>
                        <h3 class="text-lg font-bold">Teacher-Anfragen</h3>
                        <p class="text-green-100">${pendingRequests.length} ausstehende Anfragen</p>
                    </button>
                    
                    <button onclick="adminSystem.showCourseManagement()" 
                            class="bg-purple-500 hover:bg-purple-600 text-white p-6 rounded-lg text-left transition-colors">
                        <div class="text-2xl mb-2">⚙️</div>
                        <h3 class="text-lg font-bold">Kurse verwalten</h3>
                        <p class="text-purple-100">Bestehende Kurse bearbeiten</p>
                    </button>
                </div>
                
                <!-- Recent Activity -->
                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-lg font-bold mb-4">📈 Letzte Aktivitäten</h3>
                    <div class="space-y-3">
                        ${this.getRecentActivity().map(activity => `
                            <div class="flex items-center space-x-3 text-sm">
                                <span class="text-2xl">${activity.icon}</span>
                                <span class="text-gray-600">${activity.text}</span>
                                <span class="text-gray-400">${activity.time}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Emergency Actions -->
                <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 class="text-lg font-bold text-red-800 mb-2">🚨 System-Aktionen</h3>
                    <div class="space-x-4">
                        <button onclick="adminSystem.resetDemoData()" 
                                class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm">
                            Demo-Daten zurücksetzen
                        </button>
                        <button onclick="adminSystem.exportData()" 
                                class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm">
                            Daten exportieren
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Zeigt den Course Builder
     */
    showCourseBuilder() {
        const container = document.getElementById('admin-content') || document.querySelector('#admin-page .bg-white');
        
        container.innerHTML = `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900">➕ Neuen Kurs erstellen</h2>
                        <p class="text-gray-600">Course Builder - Schritt für Schritt</p>
                    </div>
                    <button onclick="adminSystem.loadAdminDashboard()" 
                            class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">
                        ← Zurück
                    </button>
                </div>
                
                <!-- Course Creation Form -->
                <div class="bg-white rounded-lg shadow p-6">
                    <form id="course-creation-form" onsubmit="adminSystem.createCourse(event)" class="space-y-6">
                        <!-- Basic Info -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Kurs-Titel</label>
                                <input type="text" name="title" required 
                                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                       placeholder="z.B. Deutsch A1 - Grundlagen">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Sprache</label>
                                <select name="language" required 
                                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">Sprache wählen</option>
                                    <option value="Deutsch">Deutsch</option>
                                    <option value="English">English</option>
                                    <option value="Français">Français</option>
                                    <option value="Español">Español</option>
                                    <option value="Italiano">Italiano</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Zielsprache</label>
                                <select name="targetLanguage" required 
                                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">Zielsprache wählen</option>
                                    <option value="Deutsch">Deutsch</option>
                                    <option value="English">English</option>
                                    <option value="Français">Français</option>
                                    <option value="Español">Español</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Sprachniveau</label>
                                <select name="level" required 
                                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">Niveau wählen</option>
                                    <option value="A1">A1 - Anfänger</option>
                                    <option value="A2">A2 - Grundlagen</option>
                                    <option value="B1">B1 - Mittelstufe</option>
                                    <option value="B2">B2 - Gute Mittelstufe</option>
                                    <option value="C1">C1 - Fortgeschritten</option>
                                    <option value="C2">C2 - Sehr fortgeschritten</option>
                                </select>
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Beschreibung</label>
                            <textarea name="description" rows="3" required 
                                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="Kursbeschreibung..."></textarea>
                        </div>
                        
                        <!-- Teacher Assignment -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Zugewiesener Lehrer</label>
                            <select name="teacherId" required 
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">Lehrer wählen</option>
                                ${this.getAvailableTeachers().map(teacher => `
                                    <option value="${teacher.id}">${teacher.name} ${teacher.surname} (@${teacher.username})</option>
                                `).join('')}
                            </select>
                        </div>
                        
                        <!-- Course Settings -->
                        <div class="space-y-4">
                            <h3 class="text-lg font-semibold">Kurs-Einstellungen</h3>
                            
                            <label class="flex items-center">
                                <input type="checkbox" name="isPublic" checked 
                                       class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                                <span class="ml-2 text-sm text-gray-700">Öffentlich verfügbar</span>
                            </label>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Einschreibungs-Code</label>
                                <input type="text" name="enrollmentCode" 
                                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                       placeholder="Automatisch generiert" readonly
                                       value="${this.generateEnrollmentCode()}">
                            </div>
                        </div>
                        
                        <!-- Submit -->
                        <div class="flex justify-end space-x-4">
                            <button type="button" onclick="adminSystem.loadAdminDashboard()" 
                                    class="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-md">
                                Abbrechen
                            </button>
                            <button type="submit" 
                                    class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md">
                                Kurs erstellen
                            </button>
                        </div>
                    </form>
                </div>
                
                <!-- Next Steps Info -->
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 class="text-lg font-semibold text-blue-800 mb-2">📋 Nächste Schritte</h3>
                    <p class="text-blue-700 text-sm">
                        Nach der Kurs-Erstellung können Sie Levels, Module und Aufgaben hinzufügen. 
                        Der Kurs wird automatisch dem ausgewählten Lehrer zugewiesen.
                    </p>
                </div>
            </div>
        `;
    }
    
    /**
     * Erstellt einen neuen Kurs
     */
    createCourse(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const courseData = {
            id: this.generateCourseId(),
            title: formData.get('title'),
            language: formData.get('language'),
            targetLanguage: formData.get('targetLanguage'),
            level: formData.get('level'),
            description: formData.get('description'),
            teacherId: formData.get('teacherId'),
            teacherName: this.getTeacherName(formData.get('teacherId')),
            isPublic: formData.get('isPublic') === 'on',
            enrollmentCode: formData.get('enrollmentCode'),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            
            stats: {
                totalStudents: 0,
                averageProgress: 0,
                completionRate: 0
            },
            
            levels: []
        };
        
        // Kurs zu CourseManager hinzufügen
        const success = courseManager.addCourse(courseData);
        
        if (success) {
            this.showNotification('✅ Kurs erfolgreich erstellt!', 'success');
            this.showCourseStructureBuilder(courseData.id);
        } else {
            this.showNotification('❌ Fehler beim Erstellen des Kurses', 'error');
        }
    }
    
    /**
     * Zeigt Teacher-Anfragen
     */
    showTeacherRequests() {
        const container = document.getElementById('admin-content') || document.querySelector('#admin-page .bg-white');
        
        const pendingRequests = this.teacherRequests.filter(req => req.status === 'pending');
        const processedRequests = this.teacherRequests.filter(req => req.status !== 'pending');
        
        container.innerHTML = `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900">📋 Teacher-Anfragen</h2>
                        <p class="text-gray-600">${pendingRequests.length} ausstehende Anfragen</p>
                    </div>
                    <button onclick="adminSystem.loadAdminDashboard()" 
                            class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">
                        ← Zurück
                    </button>
                </div>
                
                <!-- Pending Requests -->
                <div class="bg-white rounded-lg shadow">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <h3 class="text-lg font-semibold">🔄 Ausstehende Anfragen</h3>
                    </div>
                    <div class="divide-y divide-gray-200">
                        ${pendingRequests.length === 0 ? `
                            <div class="px-6 py-8 text-center text-gray-500">
                                Keine ausstehenden Anfragen
                            </div>
                        ` : pendingRequests.map(request => `
                            <div class="px-6 py-4">
                                <div class="flex items-start justify-between">
                                    <div class="flex-1">
                                        <div class="flex items-center space-x-2 mb-2">
                                            <h4 class="text-lg font-semibold">${request.requestedCourse.title}</h4>
                                            <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                                ${request.requestedCourse.level}
                                            </span>
                                        </div>
                                        <p class="text-gray-600 mb-2">${request.requestedCourse.description}</p>
                                        <div class="text-sm text-gray-500 space-y-1">
                                            <p>👨‍🏫 <strong>Lehrer:</strong> ${request.teacherName}</p>
                                            <p>🌐 <strong>Sprache:</strong> ${request.requestedCourse.language} → ${request.requestedCourse.targetLanguage}</p>
                                            <p>📅 <strong>Angefragt:</strong> ${new Date(request.requestedAt).toLocaleDateString('de-DE')}</p>
                                            ${request.notes ? `<p>📝 <strong>Notizen:</strong> ${request.notes}</p>` : ''}
                                        </div>
                                    </div>
                                    <div class="flex space-x-2 ml-4">
                                        <button onclick="adminSystem.approveRequest('${request.id}')" 
                                                class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm">
                                            ✅ Genehmigen
                                        </button>
                                        <button onclick="adminSystem.rejectRequest('${request.id}')" 
                                                class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
                                            ❌ Ablehnen
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Processed Requests -->
                ${processedRequests.length > 0 ? `
                <div class="bg-white rounded-lg shadow">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <h3 class="text-lg font-semibold">📋 Bearbeitete Anfragen</h3>
                    </div>
                    <div class="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                        ${processedRequests.map(request => `
                            <div class="px-6 py-3 ${request.status === 'approved' ? 'bg-green-50' : 'bg-red-50'}">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <h4 class="font-medium">${request.requestedCourse.title}</h4>
                                        <p class="text-sm text-gray-600">${request.teacherName}</p>
                                    </div>
                                    <span class="px-2 py-1 rounded text-xs font-medium ${
                                        request.status === 'approved' 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                    }">
                                        ${request.status === 'approved' ? '✅ Genehmigt' : '❌ Abgelehnt'}
                                    </span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }
    
    /**
     * Genehmigt eine Teacher-Anfrage
     */
    approveRequest(requestId) {
        const request = this.teacherRequests.find(req => req.id === requestId);
        if (!request) return;
        
        // Kurs automatisch erstellen
        const courseData = {
            id: this.generateCourseId(),
            title: request.requestedCourse.title,
            language: request.requestedCourse.language,
            targetLanguage: request.requestedCourse.targetLanguage,
            level: request.requestedCourse.level,
            description: request.requestedCourse.description,
            teacherId: request.teacherId,
            teacherName: request.teacherName,
            isPublic: true,
            enrollmentCode: this.generateEnrollmentCode(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            
            stats: {
                totalStudents: 0,
                averageProgress: 0,
                completionRate: 0
            },
            
            levels: []
        };
        
        // Kurs erstellen
        const success = courseManager.addCourse(courseData);
        
        if (success) {
            // Request als approved markieren
            request.status = 'approved';
            request.processedAt = new Date().toISOString();
            request.createdCourseId = courseData.id;
            
            this.saveTeacherRequests();
            this.showNotification(`✅ Anfrage genehmigt! Kurs "${courseData.title}" erstellt.`, 'success');
            this.showTeacherRequests(); // Refresh
        } else {
            this.showNotification('❌ Fehler beim Erstellen des Kurses', 'error');
        }
    }
    
    /**
     * Lehnt eine Teacher-Anfrage ab
     */
    rejectRequest(requestId) {
        const request = this.teacherRequests.find(req => req.id === requestId);
        if (!request) return;
        
        if (confirm('Möchten Sie diese Anfrage wirklich ablehnen?')) {
            request.status = 'rejected';
            request.processedAt = new Date().toISOString();
            
            this.saveTeacherRequests();
            this.showNotification('❌ Anfrage abgelehnt', 'warning');
            this.showTeacherRequests(); // Refresh
        }
    }
    
    // ========================================
    // UTILITY FUNCTIONS
    // ========================================
    
    /**
     * Generiert eine eindeutige Kurs-ID
     */
    generateCourseId() {
        return 'course_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Generiert einen Einschreibungs-Code
     */
    generateEnrollmentCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }
    
    /**
     * Holt verfügbare Lehrer
     */
    getAvailableTeachers() {
        return userDatabase.getAllUsers().filter(user => user.userType === 'teacher');
    }
    
    /**
     * Holt Lehrer-Namen anhand ID
     */
    getTeacherName(teacherId) {
        const teacher = userDatabase.getAllUsers().find(user => user.id === teacherId);
        return teacher ? `${teacher.name} ${teacher.surname}` : 'Unbekannt';
    }
    
    /**
     * Berechnet Gesamt-Task-Anzahl
     */
    getTotalTaskCount() {
        let total = 0;
        courseManager.courses.forEach(course => {
            course.levels.forEach(level => {
                level.modules.forEach(module => {
                    total += module.tasks.length;
                });
            });
        });
        return total;
    }
    
    /**
     * Holt letzte Aktivitäten
     */
    getRecentActivity() {
        return [
            { icon: '👤', text: 'Neuer Benutzer registriert', time: 'vor 2 Stunden' },
            { icon: '📚', text: 'Kurs "Deutsch A1" wurde bearbeitet', time: 'vor 4 Stunden' },
            { icon: '✅', text: 'Teacher-Anfrage genehmigt', time: 'vor 6 Stunden' },
            { icon: '🎯', text: '15 neue Aufgaben abgeschlossen', time: 'vor 8 Stunden' },
            { icon: '👨‍🏫', text: 'Neuer Lehrer registriert', time: 'gestern' }
        ];
    }
    
    /**
     * Zeigt Kurs-Management
     */
    showCourseManagement() {
        const container = document.getElementById('admin-content') || document.querySelector('#admin-page .bg-white');
        const courses = courseManager.courses;
        
        container.innerHTML = `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900">⚙️ Kurse verwalten</h2>
                        <p class="text-gray-600">${courses.length} Kurse verfügbar</p>
                    </div>
                    <button onclick="adminSystem.loadAdminDashboard()" 
                            class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">
                        ← Zurück
                    </button>
                </div>
                
                <!-- Courses List -->
                <div class="bg-white rounded-lg shadow">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <h3 class="text-lg font-semibold">📚 Alle Kurse</h3>
                    </div>
                    <div class="divide-y divide-gray-200">
                        ${courses.length === 0 ? `
                            <div class="px-6 py-8 text-center text-gray-500">
                                Noch keine Kurse erstellt
                            </div>
                        ` : courses.map(course => `
                            <div class="px-6 py-4">
                                <div class="flex items-start justify-between">
                                    <div class="flex-1">
                                        <div class="flex items-center space-x-2 mb-2">
                                            <h4 class="text-lg font-semibold">${course.title}</h4>
                                            <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                                ${course.level}
                                            </span>
                                            ${course.isPublic ? 
                                                '<span class="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">Öffentlich</span>' : 
                                                '<span class="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium">Privat</span>'
                                            }
                                        </div>
                                        <p class="text-gray-600 mb-2">${course.description}</p>
                                        <div class="text-sm text-gray-500 space-y-1">
                                            <p>👨‍🏫 <strong>Lehrer:</strong> ${course.teacherName}</p>
                                            <p>🌐 <strong>Sprache:</strong> ${course.language} → ${course.targetLanguage}</p>
                                            <p>📊 <strong>Statistiken:</strong> ${course.levels.length} Levels, ${this.getCourseTaskCount(course)} Aufgaben</p>
                                            <p>🔑 <strong>Code:</strong> ${course.enrollmentCode}</p>
                                        </div>
                                    </div>
                                    <div class="flex space-x-2 ml-4">
                                        <button onclick="adminSystem.editCourse('${course.id}')" 
                                                class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
                                            ✏️ Bearbeiten
                                        </button>
                                        <button onclick="adminSystem.deleteCourse('${course.id}')" 
                                                class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
                                            🗑️ Löschen
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Bearbeitet einen Kurs
     */
    editCourse(courseId) {
        const course = courseManager.getCourse(courseId);
        if (!course) {
            this.showNotification('❌ Kurs nicht gefunden', 'error');
            return;
        }
        
        this.showNotification('ℹ️ Kurs-Editor wird bald verfügbar sein!', 'info');
        // Hier würde der Course-Structure-Builder geladen werden
    }
    
    /**
     * Löscht einen Kurs
     */
    deleteCourse(courseId) {
        const course = courseManager.getCourse(courseId);
        if (!course) return;
        
        if (confirm(`Möchten Sie den Kurs "${course.title}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
            // Kurs aus Array entfernen
            const index = courseManager.courses.findIndex(c => c.id === courseId);
            if (index > -1) {
                courseManager.courses.splice(index, 1);
                courseManager.saveCourses();
                
                this.showNotification(`✅ Kurs "${course.title}" wurde gelöscht`, 'success');
                this.showCourseManagement(); // Refresh
            }
        }
    }
    
    /**
     * Berechnet Task-Anzahl für einen Kurs
     */
    getCourseTaskCount(course) {
        let count = 0;
        course.levels.forEach(level => {
            level.modules.forEach(module => {
                count += module.tasks.length;
            });
        });
        return count;
    }
    
    /**
     * Setzt Demo-Daten zurück
     */
    resetDemoData() {
        if (confirm('⚠️ Alle Daten werden zurückgesetzt! Diese Aktion kann nicht rückgängig gemacht werden. Fortfahren?')) {
            // LocalStorage komplett leeren
            localStorage.clear();
            
            this.showNotification('🔄 Demo-Daten wurden zurückgesetzt. Seite wird neu geladen...', 'info');
            
            // Seite neu laden
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        }
    }
    
    /**
     * Exportiert Daten
     */
    exportData() {
        const exportData = {
            users: userDatabase.getAllUsers(),
            courses: courseManager.courses,
            teacherRequests: this.teacherRequests,
            timestamp: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `language-platform-export-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        
        this.showNotification('📥 Daten wurden exportiert', 'success');
    }
    
    /**
     * Lädt Teacher-Anfragen
     */
    loadTeacherRequests() {
        try {
            const data = localStorage.getItem('teacherRequests');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('❌ Fehler beim Laden der Teacher-Anfragen:', error);
            return [];
        }
    }
    
    /**
     * Speichert Teacher-Anfragen
     */
    saveTeacherRequests() {
        try {
            localStorage.setItem('teacherRequests', JSON.stringify(this.teacherRequests));
        } catch (error) {
            console.error('❌ Fehler beim Speichern der Teacher-Anfragen:', error);
        }
    }
    
    /**
     * Zeigt Benachrichtigung
     */
    showNotification(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        if (window.showNotification) {
            showNotification(message, type);
        } else {
            // Fallback: einfaches Alert
            if (type === 'error') {
                alert('Fehler: ' + message);
            } else if (type === 'success') {
                alert('Erfolg: ' + message);
            }
        }
    }
}

// ========================================
// GLOBALE INSTANZ UND INTEGRATION
// ========================================

/**
 * Globale Admin-System-Instanz
 */
const adminSystem = new AdminSystem();

/**
 * Erweitert die loadPageContent Funktion für Admin-Seite
 */
const originalLoadPageContent = window.loadPageContent;
window.loadPageContent = function(pageId) {
    if (pageId === 'admin') {
        // Admin-System initialisieren falls noch nicht geschehen
        adminSystem.initialize();
        
        // Prüfen ob Benutzer Admin-Rechte hat
        if (window.currentUser && window.currentUser.userType === 'admin') {
            adminSystem.loadAdminDashboard();
        } else {
            // Kein Admin-Zugriff
            const container = document.getElementById('admin-content') || document.querySelector('#admin-page .bg-white');
            if (container) {
                container.innerHTML = `
                    <div class="text-center py-12">
                        <div class="text-6xl mb-4">🚫</div>
                        <h2 class="text-2xl font-bold text-gray-800 mb-2">Zugriff verweigert</h2>
                        <p class="text-gray-600 mb-6">Sie haben keine Administrator-Berechtigung.</p>
                        <button onclick="showPage('dashboard')" 
                                class="bg-primary hover:bg-blue-600 text-white px-6 py-3 rounded-lg">
                            Zurück zum Dashboard
                        </button>
                    </div>
                `;
            }
        }
    } else if (originalLoadPageContent) {
        originalLoadPageContent(pageId);
    }
};

/**
 * Funktion zum Erstellen einer Teacher-Anfrage (für Teachers)
 */
window.createTeacherRequest = function(requestData) {
    const request = {
        id: 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        teacherId: window.currentUser.id,
        teacherName: `${window.currentUser.name} ${window.currentUser.surname}`,
        requestedCourse: requestData,
        requestedAt: new Date().toISOString(),
        status: 'pending',
        notes: requestData.notes || ''
    };
    
    adminSystem.teacherRequests.push(request);
    adminSystem.saveTeacherRequests();
    
    return request;
};

// Globale Verfügbarkeit
window.adminSystem = adminSystem;

console.log('👑 Admin-System geladen und bereit');
console.log('🔑 Demo-Admin: admin / Admin123!');
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
                                <label class="block text-sm font-medium text-gray-700 mb-2">Fachbereich</label>
                                <input type="text" name="subject" required 
                                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                       placeholder="z.B. Mathematik, Geschichte, Programmierung">
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Schwierigkeitsgrad</label>
                                <select name="level" required 
                                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">Schwierigkeitsgrad wählen</option>
                                    <option value="Anfänger">Anfänger</option>
                                    <option value="Grundlagen">Grundlagen</option>
                                    <option value="Mittelstufe">Mittelstufe</option>
                                    <option value="Fortgeschritten">Fortgeschritten</option>
                                    <option value="Experte">Experte</option>
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
            subject: formData.get('subject'),
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
        
        // Course Structure Builder für bestehenden Kurs öffnen
        this.showCourseStructureBuilder(courseId);
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

/**
 * ========================================
 * UNIVERSAL COURSE STRUCTURE BUILDER
 * ========================================
 * 
 * Vollständig generisches Course-Building-System:
 * - Beliebige Course/Level/Module-Namen
 * - 7 Task-Types als Bausteine
 * - Drag & Drop Reihenfolge
 * - Live-Preview
 * - Für JEDEN Lernbereich (Mathe, Geschichte, Kochen, etc.)
 */

/**
 * Erweitert AdminSystem um Course Structure Builder
 */

/**
 * Zeigt den Course Structure Builder
 * @param {string} courseId - ID des erstellten Kurses
 */
AdminSystem.prototype.showCourseStructureBuilder = function(courseId) {
    this.currentCourse = courseManager.getCourse(courseId);
    if (!this.currentCourse) {
        this.showNotification('❌ Kurs nicht gefunden', 'error');
        return;
    }
    
    const container = document.getElementById('admin-content') || document.querySelector('#admin-page .bg-white');
    
    container.innerHTML = `
        <div class="space-y-6">
            <!-- Header -->
            <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-2xl font-bold mb-2">🏗️ Course Structure Builder</h2>
                        <p class="text-blue-100">Erstelle die Struktur für: "${this.currentCourse.title}"</p>
                    </div>
                    <div class="text-right">
                        <button onclick="adminSystem.saveCourseStructure()" 
                                class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded mr-2">
                            💾 Speichern
                        </button>
                        <button onclick="adminSystem.loadAdminDashboard()" 
                                class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">
                            ← Dashboard
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Course Info -->
            <div class="bg-white rounded-lg shadow p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="text-lg font-semibold">${this.currentCourse.title}</h3>
                        <p class="text-gray-600">${this.currentCourse.description}</p>
                    </div>
                    <div class="text-sm text-gray-500">
                        <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">${this.currentCourse.level}</span>
                        <span>👨‍🏫 ${this.currentCourse.teacherName}</span>
                    </div>
                </div>
            </div>
            
            <!-- Main Builder Interface -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <!-- Level Management -->
                <div class="bg-white rounded-lg shadow">
                    <div class="px-4 py-3 border-b border-gray-200 bg-blue-50">
                        <h3 class="text-lg font-semibold text-blue-800">📚 Level Management</h3>
                    </div>
                    <div class="p-4">
                        <!-- Add Level Form -->
                        <div class="mb-4">
                            <input type="text" id="new-level-title" placeholder="Level-Name (z.B. 'Grundlagen')" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded mb-2">
                            <textarea id="new-level-description" placeholder="Level-Beschreibung (optional)" 
                                      class="w-full px-3 py-2 border border-gray-300 rounded mb-2" rows="2"></textarea>
                            <button onclick="adminSystem.addLevel()" 
                                    class="w-full bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm">
                                ➕ Level hinzufügen
                            </button>
                        </div>
                        
                        <!-- Levels List -->
                        <div id="levels-list" class="space-y-2">
                            ${this.renderLevelsList()}
                        </div>
                    </div>
                </div>
                
                <!-- Module Management -->
                <div class="bg-white rounded-lg shadow">
                    <div class="px-4 py-3 border-b border-gray-200 bg-green-50">
                        <h3 class="text-lg font-semibold text-green-800">📖 Module Management</h3>
                    </div>
                    <div class="p-4">
                        <div id="module-management">
                            ${this.renderModuleManagement()}
                        </div>
                    </div>
                </div>
                
                <!-- Task Builder -->
                <div class="bg-white rounded-lg shadow">
                    <div class="px-4 py-3 border-b border-gray-200 bg-purple-50">
                        <h3 class="text-lg font-semibold text-purple-800">🎯 Task Builder</h3>
                    </div>
                    <div class="p-4">
                        <div id="task-builder">
                            ${this.renderTaskBuilder()}
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Course Structure Preview -->
            <div class="bg-white rounded-lg shadow">
                <div class="px-4 py-3 border-b border-gray-200 bg-yellow-50">
                    <h3 class="text-lg font-semibold text-yellow-800">👁️ Course Structure Preview</h3>
                </div>
                <div class="p-4">
                    <div id="course-preview">
                        ${this.renderCoursePreview()}
                    </div>
                </div>
            </div>
        </div>
    `;
};

/**
 * Rendert die Level-Liste
 */
AdminSystem.prototype.renderLevelsList = function() {
    if (!this.currentCourse.levels || this.currentCourse.levels.length === 0) {
        return '<div class="text-gray-500 text-sm text-center py-4">Noch keine Level erstellt</div>';
    }
    
    return this.currentCourse.levels.map((level, index) => `
        <div class="border border-gray-200 rounded p-3 ${this.currentLevel?.id === level.id ? 'bg-blue-50 border-blue-300' : ''}" 
             onclick="adminSystem.selectLevel('${level.id}')">
            <div class="flex items-center justify-between">
                <div class="flex-1">
                    <h4 class="font-medium">${level.title}</h4>
                    ${level.description ? `<p class="text-sm text-gray-600">${level.description}</p>` : ''}
                    <div class="text-xs text-gray-500 mt-1">
                        ${level.modules?.length || 0} Module, ${this.getLevelTaskCount(level)} Tasks
                    </div>
                </div>
                <div class="flex space-x-1">
                    <button onclick="event.stopPropagation(); adminSystem.moveLevel(${index}, -1)" 
                            class="text-gray-400 hover:text-gray-600 text-sm" ${index === 0 ? 'disabled' : ''}>↑</button>
                    <button onclick="event.stopPropagation(); adminSystem.moveLevel(${index}, 1)" 
                            class="text-gray-400 hover:text-gray-600 text-sm" ${index === this.currentCourse.levels.length - 1 ? 'disabled' : ''}>↓</button>
                    <button onclick="event.stopPropagation(); adminSystem.deleteLevel('${level.id}')" 
                            class="text-red-400 hover:text-red-600 text-sm">🗑️</button>
                </div>
            </div>
        </div>
    `).join('');
};

/**
 * Rendert Module-Management
 */
AdminSystem.prototype.renderModuleManagement = function() {
    if (!this.currentLevel) {
        return '<div class="text-gray-500 text-sm text-center py-4">← Wähle ein Level um Module zu bearbeiten</div>';
    }
    
    return `
        <!-- Add Module Form -->
        <div class="mb-4">
            <h4 class="font-medium mb-2">Module für: "${this.currentLevel.title}"</h4>
            <input type="text" id="new-module-title" placeholder="Modul-Name (z.B. 'Addition & Subtraktion')" 
                   class="w-full px-3 py-2 border border-gray-300 rounded mb-2">
            <textarea id="new-module-description" placeholder="Modul-Beschreibung (optional)" 
                      class="w-full px-3 py-2 border border-gray-300 rounded mb-2" rows="2"></textarea>
            <input type="number" id="new-module-minutes" placeholder="Geschätzte Minuten" 
                   class="w-full px-3 py-2 border border-gray-300 rounded mb-2" min="1" value="15">
            <button onclick="adminSystem.addModule()" 
                    class="w-full bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm">
                ➕ Modul hinzufügen
            </button>
        </div>
        
        <!-- Modules List -->
        <div class="space-y-2">
            ${this.renderModulesList()}
        </div>
    `;
};

/**
 * Rendert Module-Liste
 */
AdminSystem.prototype.renderModulesList = function() {
    if (!this.currentLevel.modules || this.currentLevel.modules.length === 0) {
        return '<div class="text-gray-500 text-sm text-center py-2">Noch keine Module in diesem Level</div>';
    }
    
    return this.currentLevel.modules.map((module, index) => `
        <div class="border border-gray-200 rounded p-3 ${this.currentModule?.id === module.id ? 'bg-green-50 border-green-300' : ''}" 
             onclick="adminSystem.selectModule('${module.id}')">
            <div class="flex items-center justify-between">
                <div class="flex-1">
                    <h5 class="font-medium text-sm">${module.title}</h5>
                    ${module.description ? `<p class="text-xs text-gray-600">${module.description}</p>` : ''}
                    <div class="text-xs text-gray-500 mt-1">
                        ${module.tasks?.length || 0} Tasks, ~${module.estimatedMinutes || 15}min
                    </div>
                </div>
                <div class="flex space-x-1">
                    <button onclick="event.stopPropagation(); adminSystem.moveModule(${index}, -1)" 
                            class="text-gray-400 hover:text-gray-600 text-sm" ${index === 0 ? 'disabled' : ''}>↑</button>
                    <button onclick="event.stopPropagation(); adminSystem.moveModule(${index}, 1)" 
                            class="text-gray-400 hover:text-gray-600 text-sm" ${index === this.currentLevel.modules.length - 1 ? 'disabled' : ''}>↓</button>
                    <button onclick="event.stopPropagation(); adminSystem.deleteModule('${module.id}')" 
                            class="text-red-400 hover:text-red-600 text-sm">🗑️</button>
                </div>
            </div>
        </div>
    `).join('');
};

/**
 * Rendert Task Builder
 */
AdminSystem.prototype.renderTaskBuilder = function() {
    if (!this.currentModule) {
        return '<div class="text-gray-500 text-sm text-center py-4">← Wähle ein Modul um Tasks zu erstellen</div>';
    }
    
    return `
        <!-- Task Type Selection -->
        <div class="mb-4">
            <h4 class="font-medium mb-2">Tasks für: "${this.currentModule.title}"</h4>
            <select id="task-type-select" onchange="adminSystem.showTaskForm(this.value)" 
                    class="w-full px-3 py-2 border border-gray-300 rounded mb-3">
                <option value="">Task-Type wählen</option>
                <option value="multiple_choice">Multiple Choice</option>
                <option value="fill_blank">Fill in the Blank</option>
                <option value="translation">Translation</option>
                <option value="true_false">True/False</option>
                <option value="sentence_building">Sentence Building</option>
                <option value="image_match">Image Match</option>
                <option value="audio_match">Audio Match</option>
            </select>
        </div>
        
        <!-- Dynamic Task Form -->
        <div id="task-form-container">
            <div class="text-gray-500 text-sm text-center py-2">↑ Wähle einen Task-Type</div>
        </div>
        
        <!-- Current Tasks List -->
        <div class="mt-4">
            <h5 class="font-medium mb-2">Aktuelle Tasks:</h5>
            <div class="space-y-2 max-h-48 overflow-y-auto">
                ${this.renderTasksList()}
            </div>
        </div>
    `;
};

/**
 * Rendert Tasks-Liste
 */
AdminSystem.prototype.renderTasksList = function() {
    if (!this.currentModule.tasks || this.currentModule.tasks.length === 0) {
        return '<div class="text-gray-500 text-sm text-center py-2">Noch keine Tasks in diesem Modul</div>';
    }
    
    return this.currentModule.tasks.map((task, index) => `
        <div class="bg-gray-50 border border-gray-200 rounded p-2">
            <div class="flex items-center justify-between">
                <div class="flex-1">
                    <div class="flex items-center space-x-2">
                        <span class="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
                            ${this.getTaskTypeLabel(task.type)}
                        </span>
                        <span class="text-sm font-medium">${this.getTaskPreview(task)}</span>
                    </div>
                </div>
                <div class="flex space-x-1">
                    <button onclick="adminSystem.moveTask(${index}, -1)" 
                            class="text-gray-400 hover:text-gray-600 text-sm" ${index === 0 ? 'disabled' : ''}>↑</button>
                    <button onclick="adminSystem.moveTask(${index}, 1)" 
                            class="text-gray-400 hover:text-gray-600 text-sm" ${index === this.currentModule.tasks.length - 1 ? 'disabled' : ''}>↓</button>
                    <button onclick="adminSystem.deleteTask(${index})" 
                            class="text-red-400 hover:text-red-600 text-sm">🗑️</button>
                </div>
            </div>
        </div>
    `).join('');
};

/**
 * Rendert Course Preview
 */
AdminSystem.prototype.renderCoursePreview = function() {
    if (!this.currentCourse.levels || this.currentCourse.levels.length === 0) {
        return '<div class="text-gray-500 text-center py-8">Noch keine Struktur erstellt</div>';
    }
    
    let totalTasks = 0;
    let totalMinutes = 0;
    
    const previewHTML = this.currentCourse.levels.map((level, levelIndex) => {
        const levelTasks = this.getLevelTaskCount(level);
        const levelMinutes = this.getLevelMinutes(level);
        totalTasks += levelTasks;
        totalMinutes += levelMinutes;
        
        return `
            <div class="border border-gray-200 rounded p-4 mb-4">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="text-lg font-semibold">📚 Level ${levelIndex + 1}: ${level.title}</h3>
                    <div class="text-sm text-gray-600">
                        ${levelTasks} Tasks, ~${levelMinutes}min
                    </div>
                </div>
                
                ${level.modules?.length > 0 ? `
                    <div class="ml-4 space-y-2">
                        ${level.modules.map((module, moduleIndex) => `
                            <div class="bg-gray-50 rounded p-3">
                                <div class="flex items-center justify-between">
                                    <h4 class="font-medium">📖 Modul ${moduleIndex + 1}: ${module.title}</h4>
                                    <div class="text-sm text-gray-600">
                                        ${module.tasks?.length || 0} Tasks
                                    </div>
                                </div>
                                ${module.tasks?.length > 0 ? `
                                    <div class="ml-4 mt-2">
                                        ${module.tasks.map((task, taskIndex) => `
                                            <div class="text-sm text-gray-600 mb-1">
                                                🎯 Task ${taskIndex + 1}: ${this.getTaskTypeLabel(task.type)} - "${this.getTaskPreview(task)}"
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : '<div class="text-sm text-gray-500 ml-4 mt-1">Noch keine Tasks</div>'}
                            </div>
                        `).join('')}
                    </div>
                ` : '<div class="text-sm text-gray-500 ml-4">Noch keine Module</div>'}
            </div>
        `;
    }).join('');
    
    return `
        <div class="mb-4 p-4 bg-blue-50 rounded-lg">
            <h3 class="font-semibold mb-2">📊 Kurs-Statistiken</h3>
            <div class="grid grid-cols-3 gap-4 text-sm">
                <div class="text-center">
                    <span class="block text-2xl font-bold text-blue-600">${this.currentCourse.levels.length}</span>
                    <span class="text-gray-600">Levels</span>
                </div>
                <div class="text-center">
                    <span class="block text-2xl font-bold text-green-600">${totalTasks}</span>
                    <span class="text-gray-600">Tasks</span>
                </div>
                <div class="text-center">
                    <span class="block text-2xl font-bold text-purple-600">~${Math.round(totalMinutes)}min</span>
                    <span class="text-gray-600">Geschätzte Zeit</span>
                </div>
            </div>
        </div>
        
        <div class="space-y-4">
            ${previewHTML}
        </div>
    `;
};

/**
 * Fügt ein neues Level hinzu
 */
AdminSystem.prototype.addLevel = function() {
    const title = document.getElementById('new-level-title').value.trim();
    const description = document.getElementById('new-level-description').value.trim();
    
    if (!title) {
        this.showNotification('❌ Level-Name ist erforderlich', 'error');
        return;
    }
    
    const newLevel = {
        id: 'level_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        title: title,
        description: description,
        icon: this.currentCourse.levels.length + 1,
        modules: []
    };
    
    this.currentCourse.levels.push(newLevel);
    
    // UI aktualisieren
    document.getElementById('new-level-title').value = '';
    document.getElementById('new-level-description').value = '';
    
    this.refreshBuilder();
    this.showNotification(`✅ Level "${title}" hinzugefügt`, 'success');
};

/**
 * Wählt ein Level aus
 */
AdminSystem.prototype.selectLevel = function(levelId) {
    this.currentLevel = this.currentCourse.levels.find(l => l.id === levelId);
    this.currentModule = null; // Reset module selection
    this.refreshBuilder();
};

/**
 * Fügt ein neues Modul hinzu
 */
AdminSystem.prototype.addModule = function() {
    if (!this.currentLevel) {
        this.showNotification('❌ Bitte wähle zuerst ein Level', 'error');
        return;
    }
    
    const title = document.getElementById('new-module-title').value.trim();
    const description = document.getElementById('new-module-description').value.trim();
    const minutes = parseInt(document.getElementById('new-module-minutes').value) || 15;
    
    if (!title) {
        this.showNotification('❌ Modul-Name ist erforderlich', 'error');
        return;
    }
    
    const newModule = {
        id: 'module_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        title: title,
        description: description,
        estimatedMinutes: minutes,
        tasks: []
    };
    
    if (!this.currentLevel.modules) {
        this.currentLevel.modules = [];
    }
    
    this.currentLevel.modules.push(newModule);
    
    // UI aktualisieren
    document.getElementById('new-module-title').value = '';
    document.getElementById('new-module-description').value = '';
    document.getElementById('new-module-minutes').value = '15';
    
    this.refreshBuilder();
    this.showNotification(`✅ Modul "${title}" hinzugefügt`, 'success');
};

/**
 * Wählt ein Modul aus
 */
AdminSystem.prototype.selectModule = function(moduleId) {
    if (!this.currentLevel) return;
    
    this.currentModule = this.currentLevel.modules.find(m => m.id === moduleId);
    this.refreshBuilder();
};

/**
 * Zeigt Task-Form basierend auf Type
 */
AdminSystem.prototype.showTaskForm = function(taskType) {
    const container = document.getElementById('task-form-container');
    if (!taskType) {
        container.innerHTML = '<div class="text-gray-500 text-sm text-center py-2">↑ Wähle einen Task-Type</div>';
        return;
    }
    
    const forms = {
        'multiple_choice': this.getMultipleChoiceForm(),
        'fill_blank': this.getFillBlankForm(),
        'translation': this.getTranslationForm(),
        'true_false': this.getTrueFalseForm(),
        'sentence_building': this.getSentenceBuildingForm(),
        'image_match': this.getImageMatchForm(),
        'audio_match': this.getAudioMatchForm()
    };
    
    container.innerHTML = forms[taskType] || '<div class="text-red-500">Task-Type nicht gefunden</div>';
};

/**
 * Task-Form Templates
 */
AdminSystem.prototype.getMultipleChoiceForm = function() {
    return `
        <div class="space-y-3">
            <input type="text" id="mc-question" placeholder="Frage eingeben" 
                   class="w-full px-3 py-2 border border-gray-300 rounded text-sm">
            <div class="space-y-2">
                <input type="text" id="mc-option-0" placeholder="Option 1" 
                       class="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                <input type="text" id="mc-option-1" placeholder="Option 2" 
                       class="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                <input type="text" id="mc-option-2" placeholder="Option 3" 
                       class="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                <input type="text" id="mc-option-3" placeholder="Option 4" 
                       class="w-full px-3 py-2 border border-gray-300 rounded text-sm">
            </div>
            <select id="mc-correct" class="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                <option value="">Richtige Antwort wählen</option>                   
                <option value="0">Option 1</option>
                <option value="1">Option 2</option>
                <option value="2">Option 3</option>
                <option value="3">Option 4</option>
            </select>
            <textarea id="mc-explanation" placeholder="Erklärung (optional)" 
                      class="w-full px-3 py-2 border border-gray-300 rounded text-sm" rows="2"></textarea>
            <button onclick="adminSystem.addTask('multiple_choice')" 
                    class="w-full bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded text-sm">
                ➕ Multiple Choice Task hinzufügen
            </button>
        </div>
    `;
};

AdminSystem.prototype.getFillBlankForm = function() {
    return `
        <div class="space-y-3">
            <input type="text" id="fb-sentence" placeholder="Satz mit __BLANK__ für Lücken" 
                   class="w-full px-3 py-2 border border-gray-300 rounded text-sm">
            <input type="text" id="fb-answers" placeholder="Richtige Antworten (komma-getrennt)" 
                   class="w-full px-3 py-2 border border-gray-300 rounded text-sm">
            <input type="text" id="fb-hint" placeholder="Hinweis (optional)" 
                   class="w-full px-3 py-2 border border-gray-300 rounded text-sm">
            <button onclick="adminSystem.addTask('fill_blank')" 
                    class="w-full bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded text-sm">
                ➕ Fill Blank Task hinzufügen
            </button>
        </div>
    `;
};

AdminSystem.prototype.getTranslationForm = function() {
    return `
        <div class="space-y-3">
            <input type="text" id="tr-source" placeholder="Quelltext" 
                   class="w-full px-3 py-2 border border-gray-300 rounded text-sm">
            <input type="text" id="tr-target" placeholder="Zielsprache" 
                   class="w-full px-3 py-2 border border-gray-300 rounded text-sm">
            <textarea id="tr-correct" placeholder="Richtige Übersetzungen (eine pro Zeile)" 
                      class="w-full px-3 py-2 border border-gray-300 rounded text-sm" rows="3"></textarea>
            <input type="text" id="tr-hint" placeholder="Hinweis (optional)" 
                   class="w-full px-3 py-2 border border-gray-300 rounded text-sm">
            <button onclick="adminSystem.addTask('translation')" 
                    class="w-full bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded text-sm">
                ➕ Translation Task hinzufügen
            </button>
        </div>
    `;
};

AdminSystem.prototype.getTrueFalseForm = function() {
    return `
        <div class="space-y-3">
            <textarea id="tf-statement" placeholder="Aussage eingeben" 
                      class="w-full px-3 py-2 border border-gray-300 rounded text-sm" rows="3"></textarea>
            <select id="tf-correct" class="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                <option value="">Richtige Antwort wählen</option>
                <option value="true">Richtig</option>
                <option value="false">Falsch</option>
            </select>
            <input type="text" id="tf-context" placeholder="Kontext (optional)" 
                   class="w-full px-3 py-2 border border-gray-300 rounded text-sm">
            <button onclick="adminSystem.addTask('true_false')" 
                    class="w-full bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded text-sm">
                ➕ True/False Task hinzufügen
            </button>
        </div>
    `;
};

AdminSystem.prototype.getSentenceBuildingForm = function() {
    return `
        <div class="space-y-3">
            <input type="text" id="sb-sentence" placeholder="Richtiger Satz" 
                   class="w-full px-3 py-2 border border-gray-300 rounded text-sm">
            <input type="text" id="sb-translation" placeholder="Übersetzung/Bedeutung" 
                   class="w-full px-3 py-2 border border-gray-300 rounded text-sm">
            <button onclick="adminSystem.addTask('sentence_building')" 
                    class="w-full bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded text-sm">
                ➕ Sentence Building Task hinzufügen
            </button>
        </div>
    `;
};

AdminSystem.prototype.getImageMatchForm = function() {
    return `
        <div class="space-y-3">
            <input type="url" id="im-image" placeholder="Bild-URL" 
                   class="w-full px-3 py-2 border border-gray-300 rounded text-sm">
            <div class="space-y-2">
                <input type="text" id="im-option-0" placeholder="Option 1" 
                       class="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                <input type="text" id="im-option-1" placeholder="Option 2" 
                       class="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                <input type="text" id="im-option-2" placeholder="Option 3" 
                       class="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                <input type="text" id="im-option-3" placeholder="Option 4" 
                       class="w-full px-3 py-2 border border-gray-300 rounded text-sm">
            </div>
            <select id="im-correct" class="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                <option value="">Richtige Antwort wählen</option>
                <option value="0">Option 1</option>
                <option value="1">Option 2</option>
                <option value="2">Option 3</option>
                <option value="3">Option 4</option>
            </select>
            <button onclick="adminSystem.addTask('image_match')" 
                    class="w-full bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded text-sm">
                ➕ Image Match Task hinzufügen
            </button>
        </div>
    `;
};

AdminSystem.prototype.getAudioMatchForm = function() {
    return `
        <div class="space-y-3">
            <input type="url" id="am-audio" placeholder="Audio-URL" 
                   class="w-full px-3 py-2 border border-gray-300 rounded text-sm">
            <div class="space-y-2">
                <input type="text" id="am-option-0" placeholder="Option 1" 
                       class="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                <input type="text" id="am-option-1" placeholder="Option 2" 
                       class="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                <input type="text" id="am-option-2" placeholder="Option 3" 
                       class="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                <input type="text" id="am-option-3" placeholder="Option 4" 
                       class="w-full px-3 py-2 border border-gray-300 rounded text-sm">
            </div>
            <select id="am-correct" class="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                <option value="">Richtige Antwort wählen</option>
                <option value="0">Option 1</option>
                <option value="1">Option 2</option>
                <option value="2">Option 3</option>
                <option value="3">Option 4</option>
            </select>
            <button onclick="adminSystem.addTask('audio_match')" 
                    class="w-full bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded text-sm">
                ➕ Audio Match Task hinzufügen
            </button>
        </div>
    `;
};

/**
 * Fügt einen Task hinzu
 */
AdminSystem.prototype.addTask = function(taskType) {
    if (!this.currentModule) {
        this.showNotification('❌ Bitte wähle zuerst ein Modul', 'error');
        return;
    }
    
    const taskData = this.collectTaskData(taskType);
    if (!taskData) return;
    
    const newTask = {
        id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        type: taskType,
        data: taskData
    };
    
    if (!this.currentModule.tasks) {
        this.currentModule.tasks = [];
    }
    
    this.currentModule.tasks.push(newTask);
    
    // Form zurücksetzen
    this.showTaskForm(taskType);
    
    this.refreshBuilder();
    this.showNotification(`✅ ${this.getTaskTypeLabel(taskType)} Task hinzugefügt`, 'success');
};

/**
 * Sammelt Task-Daten basierend auf Type
 */
AdminSystem.prototype.collectTaskData = function(taskType) {
    switch (taskType) {
        case 'multiple_choice':
            const question = document.getElementById('mc-question').value.trim();
            const options = [
                document.getElementById('mc-option-0').value.trim(),
                document.getElementById('mc-option-1').value.trim(),
                document.getElementById('mc-option-2').value.trim(),
                document.getElementById('mc-option-3').value.trim()
            ].filter(opt => opt);
            const correct = parseInt(document.getElementById('mc-correct').value);
            const explanation = document.getElementById('mc-explanation').value.trim();
            
            if (!question || options.length < 2 || isNaN(correct)) {
                this.showNotification('❌ Bitte fülle alle Felder aus', 'error');
                return null;
            }
            
            return { question, options, correctAnswer: correct, explanation };
            
        case 'fill_blank':
            const sentence = document.getElementById('fb-sentence').value.trim();
            const answers = document.getElementById('fb-answers').value.trim().split(',').map(a => a.trim());
            const hint = document.getElementById('fb-hint').value.trim();
            
            if (!sentence || !answers[0]) {
                this.showNotification('❌ Satz und Antworten sind erforderlich', 'error');
                return null;
            }
            
            return { sentence, blanks: answers, hints: hint ? [hint] : [] };
            
        case 'translation':
            const sourceText = document.getElementById('tr-source').value.trim();
            const targetLanguage = document.getElementById('tr-target').value.trim();
            const correctTranslations = document.getElementById('tr-correct').value.trim().split('\n').map(t => t.trim()).filter(t => t);
            const trHint = document.getElementById('tr-hint').value.trim();
            
            if (!sourceText || !targetLanguage || !correctTranslations[0]) {
                this.showNotification('❌ Quelltext, Zielsprache und Übersetzungen sind erforderlich', 'error');
                return null;
            }
            
            return { sourceText, targetLanguage, correctTranslations, hint: trHint };
            
        case 'true_false':
            const statement = document.getElementById('tf-statement').value.trim();
            const isTrue = document.getElementById('tf-correct').value === 'true';
            const context = document.getElementById('tf-context').value.trim();
            
            if (!statement || document.getElementById('tf-correct').value === '') {
                this.showNotification('❌ Aussage und Antwort sind erforderlich', 'error');
                return null;
            }
            
            return { statement, isTrue, context };
            
        case 'sentence_building':
            const correctSentence = document.getElementById('sb-sentence').value.trim();
            const translation = document.getElementById('sb-translation').value.trim();
            
            if (!correctSentence || !translation) {
                this.showNotification('❌ Satz und Übersetzung sind erforderlich', 'error');
                return null;
            }
            
            return { correctSentence, words: correctSentence.split(' '), translation };
            
        case 'image_match':
            const imageUrl = document.getElementById('im-image').value.trim();
            const imOptions = [
                document.getElementById('im-option-0').value.trim(),
                document.getElementById('im-option-1').value.trim(),
                document.getElementById('im-option-2').value.trim(),
                document.getElementById('im-option-3').value.trim()
            ].filter(opt => opt);
            const imCorrect = parseInt(document.getElementById('im-correct').value);
            
            if (!imageUrl || imOptions.length < 2 || isNaN(imCorrect)) {
                this.showNotification('❌ Bild-URL, Optionen und richtige Antwort sind erforderlich', 'error');
                return null;
            }
            
            return { imageUrl, options: imOptions, correctAnswer: imCorrect };
            
        case 'audio_match':
            const audioUrl = document.getElementById('am-audio').value.trim();
            const amOptions = [
                document.getElementById('am-option-0').value.trim(),
                document.getElementById('am-option-1').value.trim(),
                document.getElementById('am-option-2').value.trim(),
                document.getElementById('am-option-3').value.trim()
            ].filter(opt => opt);
            const amCorrect = parseInt(document.getElementById('am-correct').value);
            
            if (!audioUrl || amOptions.length < 2 || isNaN(amCorrect)) {
                this.showNotification('❌ Audio-URL, Optionen und richtige Antwort sind erforderlich', 'error');
                return null;
            }
            
            return { audioUrl, options: amOptions, correctAnswer: amCorrect };
            
        default:
            return null;
    }
};

/**
 * Hilfsfunktionen
 */
AdminSystem.prototype.getTaskTypeLabel = function(type) {
    const labels = {
        'multiple_choice': 'Multiple Choice',
        'fill_blank': 'Fill Blank',
        'translation': 'Translation',
        'true_false': 'True/False',
        'sentence_building': 'Sentence Building', 
        'image_match': 'Image Match',
        'audio_match': 'Audio Match'
    };
    return labels[type] || type;
};

AdminSystem.prototype.getTaskPreview = function(task) {
    switch (task.type) {
        case 'multiple_choice':
            return task.data.question;
        case 'fill_blank':
            return task.data.sentence;
        case 'translation':
            return task.data.sourceText;
        case 'true_false':
            return task.data.statement.substring(0, 50) + '...';
        case 'sentence_building':
            return task.data.correctSentence;
        case 'image_match':
            return 'Image: ' + task.data.imageUrl.split('/').pop();
        case 'audio_match':
            return 'Audio: ' + task.data.audioUrl.split('/').pop();
        default:
            return 'Unknown task';
    }
};

AdminSystem.prototype.getLevelTaskCount = function(level) {
    if (!level.modules) return 0;
    return level.modules.reduce((total, module) => total + (module.tasks?.length || 0), 0);
};

AdminSystem.prototype.getLevelMinutes = function(level) {
    if (!level.modules) return 0;
    return level.modules.reduce((total, module) => total + (module.estimatedMinutes || 15), 0);
};

/**
 * Move-Funktionen für Drag & Drop Simulation
 */
AdminSystem.prototype.moveLevel = function(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= this.currentCourse.levels.length) return;
    
    const levels = this.currentCourse.levels;
    [levels[index], levels[newIndex]] = [levels[newIndex], levels[index]];
    
    this.refreshBuilder();
};

AdminSystem.prototype.moveModule = function(index, direction) {
    if (!this.currentLevel) return;
    
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= this.currentLevel.modules.length) return;
    
    const modules = this.currentLevel.modules;
    [modules[index], modules[newIndex]] = [modules[newIndex], modules[index]];
    
    this.refreshBuilder();
};

AdminSystem.prototype.moveTask = function(index, direction) {
    if (!this.currentModule) return;
    
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= this.currentModule.tasks.length) return;
    
    const tasks = this.currentModule.tasks;
    [tasks[index], tasks[newIndex]] = [tasks[newIndex], tasks[index]];
    
    this.refreshBuilder();
};

/**
 * Delete-Funktionen
 */
AdminSystem.prototype.deleteLevel = function(levelId) {
    if (confirm('Level wirklich löschen? Alle Module und Tasks gehen verloren.')) {
        const index = this.currentCourse.levels.findIndex(l => l.id === levelId);
        if (index > -1) {
            this.currentCourse.levels.splice(index, 1);
            if (this.currentLevel?.id === levelId) {
                this.currentLevel = null;
                this.currentModule = null;
            }
            this.refreshBuilder();
            this.showNotification('✅ Level gelöscht', 'success');
        }
    }
};

AdminSystem.prototype.deleteModule = function(moduleId) {
    if (!this.currentLevel) return;
    
    if (confirm('Modul wirklich löschen? Alle Tasks gehen verloren.')) {
        const index = this.currentLevel.modules.findIndex(m => m.id === moduleId);
        if (index > -1) {
            this.currentLevel.modules.splice(index, 1);
            if (this.currentModule?.id === moduleId) {
                this.currentModule = null;
            }
            this.refreshBuilder();
            this.showNotification('✅ Modul gelöscht', 'success');
        }
    }
};

AdminSystem.prototype.deleteTask = function(taskIndex) {
    if (!this.currentModule) return;
    
    if (confirm('Task wirklich löschen?')) {
        this.currentModule.tasks.splice(taskIndex, 1);
        this.refreshBuilder();
        this.showNotification('✅ Task gelöscht', 'success');
    }
};

/**
 * Speichert die Course-Struktur
 */
AdminSystem.prototype.saveCourseStructure = function() {
    if (!this.currentCourse) return;
    
    // Validation
    if (this.currentCourse.levels.length === 0) {
        this.showNotification('❌ Mindestens ein Level ist erforderlich', 'error');
        return;
    }
    
    const hasModules = this.currentCourse.levels.some(level => level.modules?.length > 0);
    if (!hasModules) {
        this.showNotification('❌ Mindestens ein Modul ist erforderlich', 'error');
        return;
    }
    
    const hasTasks = this.currentCourse.levels.some(level => 
        level.modules?.some(module => module.tasks?.length > 0)
    );
    if (!hasTasks) {
        this.showNotification('❌ Mindestens eine Aufgabe ist erforderlich', 'error');
        return;
    }
    
    // Course direkt im Array aktualisieren
    const courseIndex = courseManager.courses.findIndex(c => c.id === this.currentCourse.id);
    let success = false;
    
    if (courseIndex > -1) {
        // Existierenden Kurs aktualisieren
        courseManager.courses[courseIndex] = this.currentCourse;
        courseManager.saveCourses(); // Courses persistieren
        success = true;
    } else {
        console.error('❌ Kurs nicht im CourseManager gefunden:', this.currentCourse.id);
    }
    
    if (success) {
        this.showNotification('✅ Kurs-Struktur erfolgreich gespeichert!', 'success');
        setTimeout(() => this.loadAdminDashboard(), 1500);
    } else {
        this.showNotification('❌ Fehler beim Speichern', 'error');
    }
};

/**
 * Aktualisiert den Builder
 */
AdminSystem.prototype.refreshBuilder = function() {
    if (!this.currentCourse) return;
    
    // Update levels list
    const levelsList = document.getElementById('levels-list');
    if (levelsList) {
        levelsList.innerHTML = this.renderLevelsList();
    }
    
    // Update module management
    const moduleManagement = document.getElementById('module-management');
    if (moduleManagement) {
        moduleManagement.innerHTML = this.renderModuleManagement();
    }
    
    // Update task builder
    const taskBuilder = document.getElementById('task-builder');
    if (taskBuilder) {
        taskBuilder.innerHTML = this.renderTaskBuilder();
    }
    
    // Update course preview
    const coursePreview = document.getElementById('course-preview');
    if (coursePreview) {
        coursePreview.innerHTML = this.renderCoursePreview();
    }
};

console.log('🏗️ Universal Course Structure Builder implementiert!');
console.log('🎯 Features: Beliebige Kurse, 7 Task-Types, Drag&Drop, Live-Preview');

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
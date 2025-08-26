/**
 * ========================================
 * TEACHER-STUDENT MANAGEMENT SYSTEM
 * ========================================
 * 
 * Komplettes System für Teacher-Student Beziehungen:
 * - Teacher-Code System (verbessert)
 * - Student-Progress für Teacher
 * - Teacher-Profile für Students
 * - Student-Notizen und Checklisten
 * - Following-Listen
 * - Communication-System
 */

// ========================================
// TEACHER-STUDENT MANAGEMENT CLASS
// ========================================

class TeacherStudentManager {
    constructor() {
        this.relationships = this.loadRelationships();
        this.studentNotes = this.loadStudentNotes();
        this.teacherProfiles = this.loadTeacherProfiles();
        this.isInitialized = false;
    }
    
    /**
     * Initialisiert das Teacher-Student-System
     */
    initialize() {
        if (this.isInitialized) return;
        
        console.log('👥 Teacher-Student-System wird initialisiert...');
        this.createDemoRelationships();
        this.isInitialized = true;
        console.log('✅ Teacher-Student-System bereit');
    }
    
    /**
     * Erstellt Demo-Beziehungen für Testing
     */
    createDemoRelationships() {
        // Demo-Student mit Demo-Teacher verbinden falls nicht vorhanden
        const studentId = 'demo-student-001';
        const teacherId = 'demo-teacher-001';
        
        const existingRelation = this.relationships.find(rel => 
            rel.studentId === studentId && rel.teacherId === teacherId
        );
        
        if (!existingRelation) {
            this.createRelationship(studentId, teacherId, 'TCHDMO');
        }
    }
    
    // ========================================
    // STUDENT INTERFACE (erweitert)
    // ========================================
    
    /**
     * Erweiterte Teacher-Suche für Students
     */
    loadEnhancedTeacherSearch() {
        if (!window.currentUser || window.currentUser.userType !== 'student') return;
        
        const container = document.getElementById('teachers-page') ? 
                         document.querySelector('#teachers-page .bg-white') : null;
        
        if (!container) return;
        
        const followedTeachers = this.getTeachersOfStudent(window.currentUser.id);
        const availableTeachers = this.getAvailableTeachers();
        
        container.innerHTML = `
            <div class="space-y-8">
                <!-- Teacher-Code-Eingabe -->
                <div class="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg">
                    <h2 class="text-2xl font-bold mb-4">🔍 Lehrer finden</h2>
                    <div class="space-y-4">
                        <div class="flex space-x-4">
                            <input type="text" id="teacher-code-input" placeholder="Teacher-Code (z.B. TCHDMO)" 
                                   class="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white">
                            <button onclick="teacherStudentManager.connectToTeacher()" 
                                    class="bg-white bg-opacity-20 hover:bg-opacity-30 px-6 py-3 rounded-lg font-medium transition-colors">
                                Verbinden
                            </button>
                        </div>
                        <div class="flex space-x-2 text-sm">
                            <span class="bg-white bg-opacity-20 px-3 py-1 rounded">Demo: TCHDMO</span>
                            <span class="text-blue-100">Frage deinen Lehrer nach seinem Code</span>
                        </div>
                    </div>
                </div>
                
                <!-- Gefolgete Lehrer -->
                ${followedTeachers.length > 0 ? `
                <div class="bg-white rounded-lg shadow-lg">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <h3 class="text-xl font-bold text-gray-900">👨‍🏫 Deine Lehrer (${followedTeachers.length})</h3>
                    </div>
                    <div class="divide-y divide-gray-200">
                        ${followedTeachers.map(relationship => {
                            const teacher = relationship.teacher;
                            const stats = this.getStudentStatsForTeacher(window.currentUser.id, teacher.id);
                            
                            return `
                                <div class="px-6 py-6">
                                    <div class="flex items-start space-x-4">
                                        <!-- Teacher Avatar -->
                                        <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                                            ${teacher.name.charAt(0)}${teacher.surname.charAt(0)}
                                        </div>
                                        
                                        <!-- Teacher Info -->
                                        <div class="flex-1">
                                            <div class="flex items-center space-x-2 mb-2">
                                                <h4 class="text-lg font-bold text-gray-900">${teacher.name} ${teacher.surname}</h4>
                                                <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                                    @${teacher.username}
                                                </span>
                                            </div>
                                            
                                            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <span class="font-medium text-gray-700">Teacher-Code:</span>
                                                    <div class="font-mono text-primary">${teacher.teacherCode}</div>
                                                </div>
                                                <div>
                                                    <span class="font-medium text-gray-700">Verbunden seit:</span>
                                                    <div class="text-gray-600">${new Date(relationship.connectedAt).toLocaleDateString('de-DE')}</div>
                                                </div>
                                                <div>
                                                    <span class="font-medium text-gray-700">Dein Fortschritt:</span>
                                                    <div class="text-success font-bold">${stats.totalXP} XP</div>
                                                </div>
                                                <div>
                                                    <span class="font-medium text-gray-700">Streak:</span>
                                                    <div class="text-warning font-bold">${stats.currentStreak} Tage</div>
                                                </div>
                                            </div>
                                            
                                            <!-- Actions -->
                                            <div class="mt-4 flex space-x-3">
                                                <button onclick="teacherStudentManager.viewTeacherProfile('${teacher.id}')" 
                                                        class="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded text-sm">
                                                    📋 Profil ansehen
                                                </button>
                                                <button onclick="teacherStudentManager.viewTeacherCourses('${teacher.id}')" 
                                                        class="bg-success hover:bg-green-600 text-white px-4 py-2 rounded text-sm">
                                                    📚 Kurse ansehen
                                                </button>
                                                <button onclick="teacherStudentManager.unfollowTeacher('${teacher.id}')" 
                                                        class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm">
                                                    ❌ Entfolgen
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                ` : ''}
                
                <!-- Verfügbare Lehrer entdecken -->
                ${availableTeachers.length > 0 ? `
                <div class="bg-white rounded-lg shadow-lg">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <h3 class="text-xl font-bold text-gray-900">🌟 Lehrer entdecken</h3>
                        <p class="text-gray-600">Öffentliche Lehrer-Profile</p>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                        ${availableTeachers.slice(0, 4).map(teacher => `
                            <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div class="flex items-start space-x-3">
                                    <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                                        ${teacher.name.charAt(0)}${teacher.surname.charAt(0)}
                                    </div>
                                    <div class="flex-1">
                                        <h5 class="font-bold">${teacher.name} ${teacher.surname}</h5>
                                        <p class="text-sm text-gray-600">Code: ${teacher.teacherCode}</p>
                                        <p class="text-xs text-gray-500">${this.getTeacherCourseCount(teacher.id)} Kurse verfügbar</p>
                                        <button onclick="teacherStudentManager.quickConnect('${teacher.teacherCode}')" 
                                                class="mt-2 bg-primary hover:bg-blue-600 text-white px-3 py-1 rounded text-xs">
                                            Schnell verbinden
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }
    
    // ========================================
    // TEACHER INTERFACE (erweitert)
    // ========================================
    
    /**
     * Erweiterte Schüler-Verwaltung für Teachers
     */
    loadEnhancedStudentManagement() {
        if (!window.currentUser || window.currentUser.userType !== 'teacher') return;
        
        const container = document.getElementById('students-page') ? 
                         document.querySelector('#students-page .bg-white') : null;
        
        if (!container) return;
        
        const students = this.getStudentsOfTeacher(window.currentUser.id);
        const teacherStats = this.getTeacherOverallStats(window.currentUser.id);
        
        container.innerHTML = `
            <div class="space-y-8">
                <!-- Teacher Stats Header -->
                <div class="bg-gradient-to-r from-green-500 to-blue-600 text-white p-6 rounded-lg">
                    <div class="flex items-center justify-between">
                        <div>
                            <h2 class="text-3xl font-bold mb-2">👨‍🏫 Meine Schüler</h2>
                            <p class="text-green-100">Gesamt: ${students.length} aktive Schüler</p>
                        </div>
                        <div class="text-right">
                            <div class="text-2xl font-bold">Code: ${window.currentUser.teacherCode}</div>
                            <div class="text-green-100 text-sm">Dein Teacher-Code</div>
                        </div>
                    </div>
                </div>
                
                <!-- Overview Stats -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div class="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                        <h3 class="text-lg font-semibold text-gray-700">👥 Aktive Schüler</h3>
                        <div class="text-3xl font-bold text-blue-600">${students.length}</div>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                        <h3 class="text-lg font-semibold text-gray-700">📊 Durchschnitts-XP</h3>
                        <div class="text-3xl font-bold text-green-600">${teacherStats.averageXP}</div>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
                        <h3 class="text-lg font-semibold text-gray-700">🔥 Aktive Streaks</h3>
                        <div class="text-3xl font-bold text-yellow-600">${teacherStats.activeStreaks}</div>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                        <h3 class="text-lg font-semibold text-gray-700">✅ Aufgaben/Woche</h3>
                        <div class="text-3xl font-bold text-purple-600">${teacherStats.weeklyTasks}</div>
                    </div>
                </div>
                
                <!-- Student List -->
                ${students.length === 0 ? `
                <div class="bg-white rounded-lg shadow-lg p-12 text-center">
                    <div class="text-6xl mb-4">👨‍🎓</div>
                    <h3 class="text-2xl font-bold text-gray-800 mb-4">Noch keine Schüler</h3>
                    <p class="text-gray-600 mb-6">Teile deinen Teacher-Code mit Schülern:</p>
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
                        <div class="text-3xl font-mono font-bold text-primary mb-2">${window.currentUser.teacherCode}</div>
                        <button onclick="teacherStudentManager.copyTeacherCode('${window.currentUser.teacherCode}')" 
                                class="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded text-sm">
                            📋 Code kopieren
                        </button>
                    </div>
                </div>
                ` : `
                <div class="bg-white rounded-lg shadow-lg">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <div class="flex items-center justify-between">
                            <h3 class="text-xl font-bold">📚 Schüler-Details</h3>
                            <div class="flex space-x-2">
                                <select onchange="teacherStudentManager.filterStudents(this.value)" 
                                        class="px-3 py-1 border border-gray-300 rounded text-sm">
                                    <option value="all">Alle Schüler</option>
                                    <option value="active">Aktive (7 Tage)</option>
                                    <option value="inactive">Inaktive</option>
                                    <option value="high-progress">Top Performer</option>
                                </select>
                                <button onclick="teacherStudentManager.exportStudentData()" 
                                        class="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm">
                                    📥 Export
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="divide-y divide-gray-200" id="students-list">
                        ${students.map(studentData => {
                            const student = studentData.student;
                            const progress = studentData.progress;
                            const notes = this.getStudentNotes(window.currentUser.id, student.id);
                            const isActive = this.isStudentActive(progress.lastActivity);
                            
                            return `
                                <div class="px-6 py-6 student-item" data-status="${isActive ? 'active' : 'inactive'}">
                                    <div class="flex items-start space-x-4">
                                        <!-- Student Avatar -->
                                        <div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                                            ${student.name.charAt(0)}${student.surname.charAt(0)}
                                        </div>
                                        
                                        <!-- Student Info -->
                                        <div class="flex-1">
                                            <div class="flex items-center space-x-2 mb-2">
                                                <h4 class="text-lg font-bold text-gray-900">${student.name} ${student.surname}</h4>
                                                <span class="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium">
                                                    @${student.username}
                                                </span>
                                                ${isActive ? 
                                                    '<span class="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">🟢 Aktiv</span>' :
                                                    '<span class="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">🔴 Inaktiv</span>'
                                                }
                                            </div>
                                            
                                            <!-- Progress Grid -->
                                            <div class="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm mb-4">
                                                <div>
                                                    <span class="font-medium text-gray-700">Gesamt XP:</span>
                                                    <div class="text-primary font-bold">${progress.totalXP}</div>
                                                </div>
                                                <div>
                                                    <span class="font-medium text-gray-700">Streak:</span>
                                                    <div class="text-warning font-bold">${progress.currentStreak} Tage</div>
                                                </div>
                                                <div>
                                                    <span class="font-medium text-gray-700">Aufgaben:</span>
                                                    <div class="text-success font-bold">${progress.totalTasksCompleted}</div>
                                                </div>
                                                <div>
                                                    <span class="font-medium text-gray-700">Kurse:</span>
                                                    <div class="text-purple font-bold">${progress.coursesEnrolled.length}</div>
                                                </div>
                                                <div>
                                                    <span class="font-medium text-gray-700">Letzte Aktivität:</span>
                                                    <div class="text-gray-600">${this.formatLastActivity(progress.lastActivity)}</div>
                                                </div>
                                            </div>
                                            
                                            <!-- Notes Section -->
                                            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                                                <div class="flex items-center justify-between mb-2">
                                                    <span class="font-medium text-yellow-800">📝 Notizen:</span>
                                                    <button onclick="teacherStudentManager.editStudentNotes('${student.id}')" 
                                                            class="text-yellow-600 hover:text-yellow-800 text-sm">
                                                        ✏️ Bearbeiten
                                                    </button>
                                                </div>
                                                <div class="text-sm text-yellow-700">
                                                    ${notes.text || 'Keine Notizen vorhanden'}
                                                </div>
                                            </div>
                                            
                                            <!-- Actions -->
                                            <div class="flex flex-wrap gap-2">
                                                <button onclick="teacherStudentManager.viewStudentProgress('${student.id}')" 
                                                        class="bg-primary hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
                                                    📊 Detaillierter Fortschritt
                                                </button>
                                                <button onclick="teacherStudentManager.messageStudent('${student.id}')" 
                                                        class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm">
                                                    💬 Nachricht senden
                                                </button>
                                                <button onclick="teacherStudentManager.assignTask('${student.id}')" 
                                                        class="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm">
                                                    🎯 Aufgabe zuweisen
                                                </button>
                                                <button onclick="teacherStudentManager.generateReport('${student.id}')" 
                                                        class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm">
                                                    📋 Report erstellen
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                `}
            </div>
        `;
    }
    
    // ========================================
    // CORE FUNCTIONALITY
    // ========================================
    
    /**
     * Verbindet Student mit Teacher über Code
     */
    connectToTeacher() {
        const codeInput = document.getElementById('teacher-code-input');
        const teacherCode = codeInput.value.trim().toUpperCase();
        
        if (!teacherCode) {
            this.showNotification('Bitte gib einen Teacher-Code ein', 'warning');
            return;
        }
        
        if (!window.currentUser) {
            this.showNotification('Du musst angemeldet sein', 'error');
            return;
        }
        
        // Teacher anhand Code suchen
        const allUsers = userDatabase.getAllUsers();
        const teacher = allUsers.find(user => 
            user.userType === 'teacher' && user.teacherCode === teacherCode
        );
        
        if (!teacher) {
            this.showNotification('Teacher-Code nicht gefunden', 'error');
            this.shakeElement(codeInput);
            return;
        }
        
        // Prüfen auf AKTIVE Relationship + Reaktivierung
        const existingRelation = this.relationships.find(rel => 
            rel.studentId === window.currentUser.id && rel.teacherId === teacher.id
        );

        if (existingRelation && existingRelation.isActive) {
            this.showNotification('Du folgst diesem Lehrer bereits', 'warning');
            return;
        } else if (existingRelation && !existingRelation.isActive) {
            // REAKTIVIERUNG: Inaktive Relationship wieder aktivieren
            existingRelation.isActive = true;
            existingRelation.connectedAt = new Date().toISOString();
            this.saveRelationships();

            this.showNotification(`✅ Du folgst wieder ${teacher.name} ${teacher.surname}!`, 'success');
            codeInput.value = '';

            setTimeout(() => {
                this.loadEnhancedTeacherSearch();
            }, 1000);
            return;
        }

        // Neue Beziehung erstellen
        const relationshipId = this.createRelationship(window.currentUser.id, teacher.id, teacherCode);
        
        if (relationshipId) {
            this.showNotification(`✅ Du folgst jetzt ${teacher.name} ${teacher.surname}!`, 'success');
            codeInput.value = '';
            
            // Teacher-Seite neu laden
            setTimeout(() => {
                this.loadEnhancedTeacherSearch();
            }, 1000);
        }
    }
    
    /**
     * Erstellt eine neue Teacher-Student-Beziehung
     */
    createRelationship(studentId, teacherId, teacherCode) {
        try {
            const teacher = userDatabase.getAllUsers().find(u => u.id === teacherId);
            if (!teacher) return null;
            
            const relationship = {
                id: `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                studentId: studentId,
                teacherId: teacherId,
                teacherCode: teacherCode,
                connectedAt: new Date().toISOString(),
                isActive: true,
                
                // Teacher-specific data
                notes: '',
                customGoals: [],
                progressOverrides: {},
                
                // Communication
                lastContact: null,
                messages: []
            };
            
            this.relationships.push(relationship);
            this.saveRelationships();
            
            // Student-Notizen initialisieren
            this.initializeStudentNotes(teacherId, studentId);
            
            console.log('✅ Beziehung erstellt:', relationship.id);
            return relationship.id;
            
        } catch (error) {
            console.error('❌ Fehler beim Erstellen der Beziehung:', error);
            return null;
        }
    }
    
    /**
     * Holt alle Schüler eines Lehrers mit Details
     */
    getStudentsOfTeacher(teacherId) {
        const teacherRelationships = this.relationships.filter(rel => 
            rel.teacherId === teacherId && rel.isActive
        );
        
        return teacherRelationships.map(rel => {
            const student = userDatabase.getAllUsers().find(user => user.id === rel.studentId);
            const progress = progressManager.getUserProgress(rel.studentId);
            
            return {
                relationshipId: rel.id,
                student: student,
                relationship: rel,
                progress: progress,
                connectedAt: rel.connectedAt,
                notes: this.getStudentNotes(teacherId, rel.studentId)
            };
        }).filter(item => item.student !== null);
    }
    
    /**
     * Holt alle Lehrer eines Schülers mit Details
     */
    getTeachersOfStudent(studentId) {
        const studentRelationships = this.relationships.filter(rel => 
            rel.studentId === studentId && rel.isActive
        );
        
        return studentRelationships.map(rel => {
            const teacher = userDatabase.getAllUsers().find(user => user.id === rel.teacherId);
            
            return {
                relationshipId: rel.id,
                teacher: teacher,
                relationship: rel,
                connectedAt: rel.connectedAt
            };
        }).filter(item => item.teacher !== null);
    }
    
    // ========================================
    // UTILITY FUNCTIONS
    // ========================================
    
    /**
     * Holt verfügbare Lehrer (öffentliche Profile)
     */
    getAvailableTeachers() {
        return userDatabase.getAllUsers()
            .filter(user => user.userType === 'teacher')
            .slice(0, 10); // Limit für Performance
    }
    
    /**
     * Berechnet Teacher-Statistiken
     */
    getTeacherOverallStats(teacherId) {
        const students = this.getStudentsOfTeacher(teacherId);
        
        if (students.length === 0) {
            return { averageXP: 0, activeStreaks: 0, weeklyTasks: 0 };
        }
        
        const totalXP = students.reduce((sum, s) => sum + s.progress.totalXP, 0);
        const activeStreaks = students.filter(s => s.progress.currentStreak > 0).length;
        const weeklyTasks = students.reduce((sum, s) => sum + (s.progress.totalTasksCompleted || 0), 0);
        
        return {
            averageXP: Math.round(totalXP / students.length),
            activeStreaks: activeStreaks,
            weeklyTasks: Math.round(weeklyTasks / 7) // Approximation
        };
    }
    
    /**
     * Prüft ob Student aktiv ist
     */
    isStudentActive(lastActivity) {
        if (!lastActivity) return false;
        
        const now = Date.now();
        const lastActiveTime = new Date(lastActivity).getTime();
        const daysSinceActivity = (now - lastActiveTime) / (1000 * 60 * 60 * 24);
        
        return daysSinceActivity <= 7; // Aktiv wenn in letzten 7 Tagen
    }
    
    /**
     * Formatiert letzte Aktivität
     */
    formatLastActivity(lastActivity) {
        if (!lastActivity) return 'Nie';
        
        const now = new Date();
        const lastActive = new Date(lastActivity);
        const diffDays = Math.floor((now - lastActive) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Heute';
        if (diffDays === 1) return 'Gestern';
        if (diffDays < 7) return `vor ${diffDays} Tagen`;
        if (diffDays < 30) return `vor ${Math.floor(diffDays / 7)} Wochen`;
        
        return lastActive.toLocaleDateString('de-DE');
    }
    
    /**
     * Holt Anzahl Kurse eines Teachers
     */
    getTeacherCourseCount(teacherId) {
        return courseManager.getCoursesByTeacher(teacherId).length;
    }
    
    /**
     * Shake-Animation für Fehler-Feedback
     */
    shakeElement(element) {
        if (window.shakeElement) {
            shakeElement(element);
        } else {
            element.style.animation = 'shake 0.5s';
            setTimeout(() => element.style.animation = '', 500);
        }
    }
    
    // ========================================
    // STUDENT NOTES SYSTEM
    // ========================================
    
    /**
     * Initialisiert Student-Notizen
     */
    initializeStudentNotes(teacherId, studentId) {
        const key = `${teacherId}_${studentId}`;
        
        if (!this.studentNotes[key]) {
            this.studentNotes[key] = {
                teacherId: teacherId,
                studentId: studentId,
                text: '',
                goals: [],
                checklist: [],
                lastUpdated: new Date().toISOString(),
                createdAt: new Date().toISOString()
            };
            this.saveStudentNotes();
        }
    }
    
    /**
     * Holt Student-Notizen
     */
    getStudentNotes(teacherId, studentId) {
        const key = `${teacherId}_${studentId}`;
        return this.studentNotes[key] || { text: '', goals: [], checklist: [] };
    }
    
    /**
     * Speichert Student-Notizen
     */
    saveStudentNote(teacherId, studentId, noteData) {
        const key = `${teacherId}_${studentId}`;
        
        this.studentNotes[key] = {
            ...this.studentNotes[key],
            ...noteData,
            lastUpdated: new Date().toISOString()
        };
        
        this.saveStudentNotes();
    }
    
    // ========================================
    // INTERACTIVE FUNCTIONS
    // ========================================
    
    /**
     * Schnelle Verbindung mit Teacher-Code
     */
    quickConnect(teacherCode) {
        const input = document.getElementById('teacher-code-input');
        if (input) {
            input.value = teacherCode;
            this.connectToTeacher();
        }
    }
    
    /**
     * Reparierte unfollowTeacher() Methode für teacher-student-system.js
     * Ersetzt die bestehende unfollowTeacher() Methode
     */
    unfollowTeacher(teacherId) {
        if (!window.currentUser) return;

        const relationship = this.relationships.find(rel => 
            rel.studentId === window.currentUser.id && rel.teacherId === teacherId
        );

        if (!relationship) {
            console.log('Keine Relationship zum Entfolgen gefunden');
            return;
        }

        const teacher = userDatabase.getAllUsers().find(u => u.id === teacherId);
        const teacherName = teacher ? `${teacher.name} ${teacher.surname}` : 'diesem Lehrer';

        console.log('Entfolgen-Bestätigung für:', { teacherId, teacherName, relationId: relationship.id });

        if (confirm(`Möchtest du wirklich ${teacherName} entfolgen?\n\nDu verlierst auch Zugang zu den Kursen von ${teacherName}.`)) {
            console.log('Verarbeite Entfolgen...');

            // 1. Deaktiviere Relationship
            relationship.isActive = false;
            relationship.unfollowedAt = new Date().toISOString();
            this.saveRelationships();

            // Verify save
            const savedRelation = this.relationships.find(rel => rel.id === relationship.id);
            console.log('Relationship nach Entfolgen:', { 
                isActive: savedRelation?.isActive, 
                unfollowedAt: savedRelation?.unfollowedAt 
            });

            // 2. Entferne Teacher-Kurse aus Student-Enrollments
            this.removeTeacherCoursesFromStudent(window.currentUser.id, teacherId);

            // 3. FIXED: Korrekte Permission-Bereinigung
            this.clearAllTeacherPermissions(window.currentUser.id, teacherId);

            this.showNotification(`Du folgst ${teacherName} nicht mehr`, 'info');

            // 4. Refresh UI
            this.loadEnhancedTeacherSearch();

            // 5. Refresh learning page
            if (window.loadAdvancedLearningInterface) {
                setTimeout(() => window.loadAdvancedLearningInterface(), 100);
            }
        }
    }

    /**
     * NEUE METHODE: Vollständige Permission-Bereinigung
     */
    clearAllTeacherPermissions(studentId, teacherId) {
        try {
            console.log('Bereinige Permissions für Teacher:', teacherId);

            // Hole alle Kurse des Teachers
            const teacherCourses = courseManager.getCoursesByTeacher ? 
                courseManager.getCoursesByTeacher(teacherId) : 
                courseManager.courses.filter(course => course.teacherId === teacherId);

            console.log('Teacher-Kurse gefunden:', teacherCourses.length);

            // Für jeden Kurs: Permissions und Settings löschen
            teacherCourses.forEach(course => {
                console.log(`Bereinige Permissions für Kurs: ${course.title}`);

                // Lösche Permissions
                const permissionKey = coursePermissionManager.getPermissionKey(studentId, course.id);
                if (coursePermissionManager.permissions[permissionKey]) {
                    console.log(`Lösche Permission: ${permissionKey}`);
                    delete coursePermissionManager.permissions[permissionKey];
                }

                // Lösche Settings  
                const settingKey = coursePermissionManager.getSettingKey(studentId, course.id);
                if (coursePermissionManager.settings[settingKey]) {
                    console.log(`Lösche Setting: ${settingKey}`);
                    delete coursePermissionManager.settings[settingKey];
                }
            });

            // Speichere Änderungen
            coursePermissionManager.savePermissions();
            coursePermissionManager.saveSettings();

            console.log('Permission-Bereinigung abgeschlossen für', teacherCourses.length, 'Kurse');

        } catch (error) {
            console.error('Fehler bei Permission-Bereinigung:', error);
        }
    }

    /**
     * ERWEITERTE removeTeacherCoursesFromStudent mit Logging
     */
    removeTeacherCoursesFromStudent(studentId, teacherId) {
        try {
            console.log('Entferne Teacher-Kurse für Student:', studentId, 'Teacher:', teacherId);
            
            // Hole alle Kurse des Teachers
            const teacherCourses = courseManager.getCoursesByTeacher ? 
                courseManager.getCoursesByTeacher(teacherId) : 
                courseManager.courses.filter(course => course.teacherId === teacherId);
        
            const teacherCourseIds = teacherCourses.map(course => course.id);
            console.log('Zu entfernende Kurs-IDs:', teacherCourseIds);
        
            // Hole Student-Progress
            const userProgress = progressManager.getUserProgress(studentId);
            
            // Vor der Änderung
            console.log('Enrollments vor Entfernung:', userProgress.coursesEnrolled);
        
            // Entferne Teacher-Kurse aus Enrollments
            userProgress.coursesEnrolled = userProgress.coursesEnrolled.filter(courseId => 
                !teacherCourseIds.includes(courseId)
            );
        
            // Entferne auch Course-Progress
            teacherCourseIds.forEach(courseId => {
                if (userProgress.courseProgress && userProgress.courseProgress[courseId]) {
                    console.log(`Lösche Course-Progress für: ${courseId}`);
                    delete userProgress.courseProgress[courseId];
                }
            });
        
            // Speichere Progress
            progressManager.saveProgress();
        
            // Nach der Änderung
            console.log('Enrollments nach Entfernung:', userProgress.coursesEnrolled);
            console.log(`Entfernte ${teacherCourseIds.length} Teacher-Kurse von Student ${studentId}`);
        
        } catch (error) {
            console.error('Fehler beim Entfernen der Teacher-Kurse:', error);
        }
    }
    
    /**
     * Teacher-Code kopieren
     */
    async copyTeacherCode(code) {
        try {
            if (window.copyToClipboard) {
                const success = await copyToClipboard(code);
                if (success) {
                    this.showNotification('✅ Teacher-Code kopiert!', 'success');
                } else {
                    this.fallbackCopy(code);
                }
            } else {
                this.fallbackCopy(code);
            }
        } catch (error) {
            this.fallbackCopy(code);
        }
    }
    
    /**
     * Fallback für Code-Kopieren
     */
    fallbackCopy(code) {
        prompt('Teacher-Code (Strg+C zum Kopieren):', code);
    }
    
    /**
     * Bearbeitet Student-Notizen
     */
    editStudentNotes(studentId) {
        if (!window.currentUser) return;
        
        const notes = this.getStudentNotes(window.currentUser.id, studentId);
        const student = userDatabase.getAllUsers().find(u => u.id === studentId);
        
        if (!student) return;
        
        const newText = prompt(`Notizen für ${student.name} ${student.surname}:`, notes.text || '');
        
        if (newText !== null) {
            this.saveStudentNote(window.currentUser.id, studentId, { text: newText });
            this.showNotification('✅ Notizen gespeichert', 'success');
            this.loadEnhancedStudentManagement();
        }
    }
    
    /**
     * Zeigt detaillierten Student-Progress
     */
    viewStudentProgress(studentId) {
        const student = userDatabase.getAllUsers().find(u => u.id === studentId);
        const progress = progressManager.getUserProgress(studentId);
        
        if (!student) return;
        
        // Erstelle Popup mit detailliertem Progress
        const popup = document.createElement('div');
        popup.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        popup.innerHTML = `
            <div class="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-2xl font-bold">📊 ${student.name} ${student.surname} - Detaillierter Fortschritt</h3>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                            class="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                </div>
                
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-primary">${progress.totalXP}</div>
                        <div class="text-sm text-gray-600">Gesamt XP</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-warning">${progress.currentStreak}</div>
                        <div class="text-sm text-gray-600">Aktueller Streak</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-success">${progress.totalTasksCompleted}</div>
                        <div class="text-sm text-gray-600">Aufgaben</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-purple">${progress.coursesEnrolled.length}</div>
                        <div class="text-sm text-gray-600">Kurse</div>
                    </div>
                </div>
                
                <div class="space-y-4">
                    <h4 class="font-bold">📚 Kurs-Fortschritt:</h4>
                    ${progress.coursesEnrolled.map(courseId => {
                        const course = courseManager.getCourse(courseId);
                        if (!course) return '';
                        
                        const courseProgress = progressManager.calculateCourseProgress(studentId, courseId, course);
                        return `
                            <div class="border rounded p-3">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="font-medium">${course.title}</span>
                                    <span class="text-primary font-bold">${courseProgress.percentage}%</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-2">
                                    <div class="bg-primary h-2 rounded-full" style="width: ${courseProgress.percentage}%"></div>
                                </div>
                                <div class="text-xs text-gray-500 mt-1">
                                    ${courseProgress.completedTasks}/${courseProgress.totalTasks} Aufgaben
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <div class="mt-6 flex justify-end">
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                            class="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded">
                        Schließen
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(popup);
    }
    
    /**
     * Placeholder-Funktionen für zukünftige Features
     */
    messageStudent(studentId) {
        this.showNotification('💬 Nachrichten-System kommt bald!', 'info');
    }
    
    assignTask(studentId) {
        this.showNotification('🎯 Aufgaben-Zuweisung kommt bald!', 'info');
    }
    
    generateReport(studentId) {
        this.showNotification('📋 Report-Generator kommt bald!', 'info');
    }
    
    viewTeacherProfile(teacherId) {
        this.showNotification('👨‍🏫 Teacher-Profile kommen bald!', 'info');
    }
    
    viewTeacherCourses(teacherId) {
        const courses = courseManager.getCoursesByTeacher(teacherId);
        this.showNotification(`📚 ${courses.length} Kurse verfügbar - Detailansicht kommt bald!`, 'info');
    }
    
    filterStudents(filter) {
        const students = document.querySelectorAll('.student-item');
        
        students.forEach(student => {
            const status = student.getAttribute('data-status');
            const progress = parseInt(student.querySelector('.text-primary').textContent) || 0;
            
            let show = true;
            
            switch (filter) {
                case 'active':
                    show = status === 'active';
                    break;
                case 'inactive':
                    show = status === 'inactive';
                    break;
                case 'high-progress':
                    show = progress > 100;
                    break;
                default:
                    show = true;
            }
            
            student.style.display = show ? 'block' : 'none';
        });
    }
    
    exportStudentData() {
        this.showNotification('📥 Export-Funktion kommt bald!', 'info');
    }
    
    /**
     * Holt Student-Statistiken für bestimmten Teacher
     */
    getStudentStatsForTeacher(studentId, teacherId) {
        const progress = progressManager.getUserProgress(studentId);
        
        // Könnte erweitert werden um teacher-spezifische Stats
        return {
            totalXP: progress.totalXP,
            currentStreak: progress.currentStreak,
            totalTasksCompleted: progress.totalTasksCompleted
        };
    }
    
    // ========================================
    // DATA MANAGEMENT
    // ========================================
    
    /**
     * Lädt Beziehungen aus LocalStorage
     */
    loadRelationships() {
        try {
            const data = localStorage.getItem('teacherStudentRelationships');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('❌ Fehler beim Laden der Beziehungen:', error);
            return [];
        }
    }
    
    /**
     * Speichert Beziehungen in LocalStorage
     */
    saveRelationships() {
        try {
            localStorage.setItem('teacherStudentRelationships', JSON.stringify(this.relationships));
        } catch (error) {
            console.error('❌ Fehler beim Speichern der Beziehungen:', error);
        }
    }
    
    /**
     * Lädt Student-Notizen aus LocalStorage
     */
    loadStudentNotes() {
        try {
            const data = localStorage.getItem('studentNotes');
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('❌ Fehler beim Laden der Student-Notizen:', error);
            return {};
        }
    }
    
    /**
     * Speichert Student-Notizen in LocalStorage
     */
    saveStudentNotes() {
        try {
            localStorage.setItem('studentNotes', JSON.stringify(this.studentNotes));
        } catch (error) {
            console.error('❌ Fehler beim Speichern der Student-Notizen:', error);
        }
    }
    
    /**
     * Lädt Teacher-Profile aus LocalStorage
     */
    loadTeacherProfiles() {
        try {
            const data = localStorage.getItem('teacherProfiles');
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('❌ Fehler beim Laden der Teacher-Profile:', error);
            return {};
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
            // Fallback
            if (type === 'error') {
                alert('❌ ' + message);
            } else if (type === 'success') {
                alert('✅ ' + message);
            } else if (type === 'warning') {
                alert('⚠️ ' + message);
            }
        }
    }
}

// ========================================
// GLOBALE INSTANZ UND INTEGRATION
// ========================================

/**
 * Globale Teacher-Student-Manager-Instanz
 */
const teacherStudentManager = new TeacherStudentManager();

/**
 * Erweitert die bestehenden Load-Funktionen
 */
const originalLoadTeachers = window.loadTeachers;
window.loadTeachers = function() {
    teacherStudentManager.initialize();
    teacherStudentManager.loadEnhancedTeacherSearch();
};

/**
 * Erweitert die connectToTeacher Funktion
 */
window.connectToTeacher = function() {
    teacherStudentManager.connectToTeacher();
};

// Globale Verfügbarkeit
window.teacherStudentManager = teacherStudentManager;

console.log('👥 Teacher-Student-Management-System geladen und bereit');
console.log('🔗 Demo-Verbindung: Student → Teacher mit Code TCHDMO');
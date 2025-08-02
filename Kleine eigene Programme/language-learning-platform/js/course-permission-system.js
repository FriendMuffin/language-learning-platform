/**
 * ========================================
 * COURSE PERMISSION SYSTEM
 * ========================================
 * 
 * Komplettes Freischaltungs-System für Kurse, Level und Module:
 * - Teacher kann Inhalte für einzelne Students freischalten
 * - Dual-Requirement: Teacher-Permission + Student-Progress
 * - Auto-Progression Settings pro Student
 * - Duolingo-ähnliche UI mit Sperren
 * - Integration in bestehende Teacher-Student-Relationships
 */

// ========================================
// COURSE PERMISSION MANAGER
// ========================================

/**
 * Hauptklasse für Course-Permissions
 */
class CoursePermissionManager {
    constructor() {
        this.permissions = this.loadPermissions();
        this.settings = this.loadSettings();
        this.initialized = false;
    }
    
    /**
     * Initialisiert das Permission-System
     */
    initialize() {
        if (this.initialized) return;
        
        console.log('🔐 Course-Permission-System wird initialisiert...');
        this.createDemoPermissions();
        this.initialized = true;
        console.log('✅ Course-Permission-System bereit');
    }
    
    /**
     * Erstellt Demo-Permissions für Testing
     */
    createDemoPermissions() {
        const demoStudentId = 'demo-student-001';
        const demoTeacherId = 'demo-teacher-001';
        const germanCourseId = 'german-a1-demo';
        
        // Demo-Permissions für ersten Level freischalten
        if (!this.hasPermission(demoStudentId, germanCourseId, 'level-1')) {
            this.grantLevelAccess(demoTeacherId, demoStudentId, germanCourseId, 'level-1');
        }
        
        // Auto-Progression für Demo-Student aktivieren
        this.setAutoProgression(demoTeacherId, demoStudentId, germanCourseId, true);
    }
    
    /**
     * Gewährt Zugang zu einem Level
     * @param {string} teacherId - ID des Lehrers
     * @param {string} studentId - ID des Schülers
     * @param {string} courseId - ID des Kurses
     * @param {string} levelId - ID des Levels
     * @returns {boolean} Erfolg der Operation
     */
    grantLevelAccess(teacherId, studentId, courseId, levelId) {
        try {
            const permissionKey = this.getPermissionKey(studentId, courseId);
            
            if (!this.permissions[permissionKey]) {
                this.permissions[permissionKey] = {
                    studentId,
                    courseId,
                    grantedLevels: [],
                    grantedModules: [],
                    grantedBy: teacherId,
                    lastUpdated: new Date().toISOString(),
                    createdAt: new Date().toISOString()
                };
            }
            
            const permission = this.permissions[permissionKey];
            
            // Level hinzufügen falls noch nicht vorhanden
            if (!permission.grantedLevels.includes(levelId)) {
                permission.grantedLevels.push(levelId);
                permission.lastUpdated = new Date().toISOString();
                
                // Alle Module in diesem Level auch freischalten
                const course = courseManager.getCourse(courseId);
                if (course) {
                    const level = course.levels.find(l => l.id === levelId);
                    if (level) {
                        level.modules.forEach(module => {
                            if (!permission.grantedModules.includes(module.id)) {
                                permission.grantedModules.push(module.id);
                            }
                        });
                    }
                }
                
                this.savePermissions();
                console.log(`✅ Level ${levelId} für Student ${studentId} freigeschaltet`);
                return true;
            }
            
            return true; // Bereits freigeschaltet
            
        } catch (error) {
            console.error('❌ Fehler beim Freischalten des Levels:', error);
            return false;
        }
    }
    
    /**
     * Gewährt Zugang zu einem spezifischen Modul
     * @param {string} teacherId - ID des Lehrers
     * @param {string} studentId - ID des Schülers
     * @param {string} courseId - ID des Kurses
     * @param {string} moduleId - ID des Moduls
     * @returns {boolean} Erfolg der Operation
     */
    grantModuleAccess(teacherId, studentId, courseId, moduleId) {
        try {
            const permissionKey = this.getPermissionKey(studentId, courseId);
            
            if (!this.permissions[permissionKey]) {
                this.permissions[permissionKey] = {
                    studentId,
                    courseId,
                    grantedLevels: [],
                    grantedModules: [],
                    grantedBy: teacherId,
                    lastUpdated: new Date().toISOString(),
                    createdAt: new Date().toISOString()
                };
            }
            
            const permission = this.permissions[permissionKey];
            
            if (!permission.grantedModules.includes(moduleId)) {
                permission.grantedModules.push(moduleId);
                permission.lastUpdated = new Date().toISOString();
                
                this.savePermissions();
                console.log(`✅ Modul ${moduleId} für Student ${studentId} freigeschaltet`);
                return true;
            }
            
            return true; // Bereits freigeschaltet
            
        } catch (error) {
            console.error('❌ Fehler beim Freischalten des Moduls:', error);
            return false;
        }
    }
    
    /**
     * Prüft ob Student Zugang zu Level/Modul hat
     * @param {string} studentId - ID des Schülers
     * @param {string} courseId - ID des Kurses
     * @param {string} levelId - ID des Levels (optional)
     * @param {string} moduleId - ID des Moduls (optional)
     * @returns {boolean} Zugang gewährt
     */
    hasPermission(studentId, courseId, levelId = null, moduleId = null) {
        const permissionKey = this.getPermissionKey(studentId, courseId);
        const permission = this.permissions[permissionKey];
        
        if (!permission) return false;
        
        // Modul-spezifische Prüfung
        if (moduleId) {
            return permission.grantedModules.includes(moduleId);
        }
        
        // Level-spezifische Prüfung
        if (levelId) {
            return permission.grantedLevels.includes(levelId);
        }
        
        // Kurs-Zugang (mindestens ein Level freigeschaltet)
        return permission.grantedLevels.length > 0;
    }
    
    /**
     * Prüft Dual-Requirement: Teacher-Permission + Student-Progress
     * @param {string} studentId - ID des Schülers
     * @param {string} courseId - ID des Kurses
     * @param {string} levelId - ID des Levels
     * @param {string} moduleId - ID des Moduls
     * @returns {Object} Zugang-Informationen
     */
    checkAccess(studentId, courseId, levelId, moduleId) {
        // 1. Teacher-Permission prüfen
        const hasTeacherPermission = this.hasPermission(studentId, courseId, levelId, moduleId);
        
        // 2. Student-Progress prüfen
        const userProgress = progressManager.getUserProgress(studentId);
        const courseProgress = userProgress.courseProgress[courseId];
        
        let hasProgress = false;
        let progressReason = '';
        
        if (courseProgress) {
            const completedModules = courseProgress.completedModules || [];
            const completedTasks = courseProgress.completedTasks || [];
            
            // Für erste Level/Module: immer verfügbar wenn Teacher-Permission da ist
            const course = courseManager.getCourse(courseId);
            if (course) {
                const level = course.levels.find(l => l.id === levelId);
                if (level) {
                    const module = level.modules.find(m => m.id === moduleId);
                    if (module) {
                        const moduleIndex = level.modules.findIndex(m => m.id === moduleId);
                        const levelIndex = course.levels.findIndex(l => l.id === levelId);
                        
                        // Erstes Modul im ersten Level: immer verfügbar
                        if (levelIndex === 0 && moduleIndex === 0) {
                            hasProgress = true;
                            progressReason = 'Startmodul';
                        }
                        // Prüfe ob vorheriges Modul abgeschlossen
                        else if (moduleIndex > 0) {
                            const previousModule = level.modules[moduleIndex - 1];
                            const previousModuleTasks = previousModule.tasks.map(t => t.id);
                            const completedPreviousTasks = previousModuleTasks.filter(taskId => 
                                completedTasks.includes(taskId)
                            );
                            
                            if (completedPreviousTasks.length >= previousModuleTasks.length * 0.7) { // 70% Completion
                                hasProgress = true;
                                progressReason = 'Vorheriges Modul zu 70% abgeschlossen';
                            } else {
                                progressReason = `Vorheriges Modul nur zu ${Math.round((completedPreviousTasks.length / previousModuleTasks.length) * 100)}% abgeschlossen`;
                            }
                        }
                        // Prüfe ob vorheriges Level abgeschlossen
                        else if (levelIndex > 0) {
                            const previousLevel = course.levels[levelIndex - 1];
                            const previousLevelTasks = [];
                            previousLevel.modules.forEach(mod => {
                                mod.tasks.forEach(task => previousLevelTasks.push(task.id));
                            });
                            
                            const completedPreviousLevelTasks = previousLevelTasks.filter(taskId => 
                                completedTasks.includes(taskId)
                            );
                            
                            if (completedPreviousLevelTasks.length >= previousLevelTasks.length * 0.8) { // 80% Completion für Level
                                hasProgress = true;
                                progressReason = 'Vorheriges Level zu 80% abgeschlossen';
                            } else {
                                progressReason = `Vorheriges Level nur zu ${Math.round((completedPreviousLevelTasks.length / previousLevelTasks.length) * 100)}% abgeschlossen`;
                            }
                        }
                    }
                }
            }
        }
        
        // 3. Auto-Progression prüfen
        const autoProgression = this.getAutoProgression(studentId, courseId);
        
        return {
            hasAccess: hasTeacherPermission && hasProgress,
            hasTeacherPermission,
            hasProgress,
            progressReason,
            autoProgression,
            unlockReason: hasTeacherPermission && hasProgress ? 
                'Zugang gewährt von Lehrer und Fortschritt erreicht' :
                !hasTeacherPermission ? 'Noch nicht vom Lehrer freigeschaltet' :
                !hasProgress ? `Fortschritt erforderlich: ${progressReason}` :
                'Unbekannter Grund'
        };
    }
    
    /**
     * Auto-Progression Settings
     */
    setAutoProgression(teacherId, studentId, courseId, enabled) {
        const settingKey = this.getSettingKey(studentId, courseId);
        
        if (!this.settings[settingKey]) {
            this.settings[settingKey] = {};
        }
        
        this.settings[settingKey].autoProgression = enabled;
        this.settings[settingKey].setBy = teacherId;
        this.settings[settingKey].lastUpdated = new Date().toISOString();
        
        this.saveSettings();
        console.log(`✅ Auto-Progression für Student ${studentId} in Kurs ${courseId}: ${enabled ? 'aktiviert' : 'deaktiviert'}`);
    }
    
    /**
     * Holt Auto-Progression Setting
     */
    getAutoProgression(studentId, courseId) {
        const settingKey = this.getSettingKey(studentId, courseId);
        return this.settings[settingKey]?.autoProgression || false;
    }
    
    /**
     * Prüft und führt Auto-Progression durch
     */
    checkAutoProgression(studentId, courseId) {
        if (!this.getAutoProgression(studentId, courseId)) return;
        
        const userProgress = progressManager.getUserProgress(studentId);
        const courseProgress = userProgress.courseProgress[courseId];
        
        if (!courseProgress) return;
        
        const course = courseManager.getCourse(courseId);
        if (!course) return;
        
        // Prüfe jeden Level und jedes Modul
        course.levels.forEach((level, levelIndex) => {
            level.modules.forEach((module, moduleIndex) => {
                // Prüfe ob Modul freigeschaltet werden sollte
                const access = this.checkAccess(studentId, courseId, level.id, module.id);
                
                if (!access.hasTeacherPermission && access.hasProgress) {
                    // Auto-freischalten da Progress erreicht
                    this.grantModuleAccess('system-auto', studentId, courseId, module.id);
                    console.log(`🤖 Auto-freigeschaltet: ${module.title} für Student ${studentId}`);
                }
            });
        });
    }
    
    /**
     * Entzieht Zugang (für Lehrer)
     */
    revokeAccess(teacherId, studentId, courseId, levelId = null, moduleId = null) {
        const permissionKey = this.getPermissionKey(studentId, courseId);
        const permission = this.permissions[permissionKey];
        
        if (!permission) return false;
        
        if (moduleId) {
            const index = permission.grantedModules.indexOf(moduleId);
            if (index > -1) {
                permission.grantedModules.splice(index, 1);
            }
        }
        
        if (levelId) {
            const index = permission.grantedLevels.indexOf(levelId);
            if (index > -1) {
                permission.grantedLevels.splice(index, 1);
            }
            
            // Auch alle Module in diesem Level entfernen
            const course = courseManager.getCourse(courseId);
            if (course) {
                const level = course.levels.find(l => l.id === levelId);
                if (level) {
                    level.modules.forEach(module => {
                        const moduleIndex = permission.grantedModules.indexOf(module.id);
                        if (moduleIndex > -1) {
                            permission.grantedModules.splice(moduleIndex, 1);
                        }
                    });
                }
            }
        }
        
        permission.lastUpdated = new Date().toISOString();
        this.savePermissions();
        
        console.log(`❌ Zugang entzogen: ${levelId || moduleId} für Student ${studentId}`);
        return true;
    }
    
    /**
     * Holt alle Permissions eines Students
     */
    getStudentPermissions(studentId, courseId) {
        const permissionKey = this.getPermissionKey(studentId, courseId);
        return this.permissions[permissionKey] || {
            grantedLevels: [],
            grantedModules: [],
            studentId,
            courseId
        };
    }
    
    /**
     * Holt detaillierte Zugangs-Informationen für Teacher-Interface
     */
    getDetailedAccessInfo(studentId, courseId) {
        const course = courseManager.getCourse(courseId);
        if (!course) return null;
        
        const result = {
            courseId,
            courseName: course.title,
            studentId,
            levels: []
        };
        
        course.levels.forEach(level => {
            const levelInfo = {
                id: level.id,
                title: level.title,
                hasAccess: this.hasPermission(studentId, courseId, level.id),
                modules: []
            };
            
            level.modules.forEach(module => {
                const access = this.checkAccess(studentId, courseId, level.id, module.id);
                
                levelInfo.modules.push({
                    id: module.id,
                    title: module.title,
                    hasTeacherPermission: access.hasTeacherPermission,
                    hasProgress: access.hasProgress,
                    hasAccess: access.hasAccess,
                    unlockReason: access.unlockReason,
                    progressReason: access.progressReason
                });
            });
            
            result.levels.push(levelInfo);
        });
        
        result.autoProgression = this.getAutoProgression(studentId, courseId);
        
        return result;
    }
    
    // ========================================
    // UTILITY METHODS
    // ========================================
    
    getPermissionKey(studentId, courseId) {
        return `${studentId}_${courseId}`;
    }
    
    getSettingKey(studentId, courseId) {
        return `${studentId}_${courseId}`;
    }
    
    /**
     * Lädt Permissions aus LocalStorage
     */
    loadPermissions() {
        try {
            const data = localStorage.getItem('coursePermissions');
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('❌ Fehler beim Laden der Permissions:', error);
            return {};
        }
    }
    
    /**
     * Speichert Permissions in LocalStorage
     */
    savePermissions() {
        try {
            localStorage.setItem('coursePermissions', JSON.stringify(this.permissions));
        } catch (error) {
            console.error('❌ Fehler beim Speichern der Permissions:', error);
        }
    }
    
    /**
     * Lädt Settings aus LocalStorage
     */
    loadSettings() {
        try {
            const data = localStorage.getItem('coursePermissionSettings');
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('❌ Fehler beim Laden der Settings:', error);
            return {};
        }
    }
    
    /**
     * Speichert Settings in LocalStorage
     */
    saveSettings() {
        try {
            localStorage.setItem('coursePermissionSettings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('❌ Fehler beim Speichern der Settings:', error);
        }
    }
}

// ========================================
// TEACHER INTERFACE EXTENSIONS
// ========================================

/**
 * Erweitert das Teacher-Interface um Permission-Management
 */
class TeacherPermissionInterface {
    constructor() {
        this.permissionManager = null;
    }
    
    /**
     * Initialisiert das Interface
     */
    initialize(permissionManager) {
        this.permissionManager = permissionManager;
    }
    
    /**
     * Zeigt Permission-Management für einen Schüler
     */
    showStudentPermissionModal(studentId) {
        if (!window.currentUser || window.currentUser.userType !== 'teacher') return;
        
        const teacherId = window.currentUser.id;
        const student = userDatabase.getAllUsers().find(u => u.id === studentId);
        
        if (!student) {
            showNotification('Schüler nicht gefunden', 'error');
            return;
        }
        
        // Alle Kurse des Teachers holen
        const teacherCourses = courseManager.getCoursesByTeacher(teacherId);
        
        if (teacherCourses.length === 0) {
            showNotification('Du hast noch keine Kurse erstellt', 'info');
            return;
        }
        
        // Modal erstellen
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-96 overflow-y-auto">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-2xl font-bold text-gray-900">
                        🔐 Freischaltungen für ${student.name} ${student.surname}
                    </h3>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                            class="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                </div>
                
                <div class="space-y-6">
                    ${teacherCourses.map(course => this.renderCoursePermissions(studentId, course)).join('')}
                </div>
                
                <div class="mt-6 flex justify-end space-x-3">
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                            class="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded">
                        Schließen
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    /**
     * Rendert Permission-Interface für einen Kurs
     */
    renderCoursePermissions(studentId, course) {
        const accessInfo = this.permissionManager.getDetailedAccessInfo(studentId, course.id);
        
        return `
            <div class="border border-gray-200 rounded-lg p-4">
                <div class="flex items-center justify-between mb-4">
                    <h4 class="text-lg font-semibold text-gray-900">${course.title}</h4>
                    <div class="flex items-center space-x-4">
                        <label class="flex items-center">
                            <input type="checkbox" 
                                   ${accessInfo.autoProgression ? 'checked' : ''} 
                                   onchange="teacherPermissionInterface.toggleAutoProgression('${studentId}', '${course.id}')"
                                   class="mr-2">
                            <span class="text-sm text-gray-600">Auto-Progression</span>
                        </label>
                    </div>
                </div>
                
                <!-- Level und Module -->
                <div class="space-y-4">
                    ${accessInfo.levels.map(level => `
                        <div class="bg-gray-50 rounded-lg p-3">
                            <div class="flex items-center justify-between mb-3">
                                <h5 class="font-medium text-gray-800">${level.title}</h5>
                                <button onclick="teacherPermissionInterface.toggleLevelAccess('${studentId}', '${course.id}', '${level.id}')"
                                        class="px-3 py-1 rounded text-sm ${level.hasAccess ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'}">
                                    ${level.hasAccess ? '✅ Freigeschaltet' : '🔒 Gesperrt'}
                                </button>
                            </div>
                            
                            <!-- Module in diesem Level -->
                            <div class="space-y-2 ml-4">
                                ${level.modules.map(module => `
                                    <div class="flex items-center justify-between py-2 px-3 bg-white rounded border">
                                        <div class="flex-1">
                                            <span class="font-medium">${module.title}</span>
                                            <div class="text-xs text-gray-500 mt-1">
                                                Teacher: ${module.hasTeacherPermission ? '✅' : '❌'} | 
                                                Progress: ${module.hasProgress ? '✅' : '❌'} | 
                                                ${module.progressReason}
                                            </div>
                                        </div>
                                        <button onclick="teacherPermissionInterface.toggleModuleAccess('${studentId}', '${course.id}', '${module.id}')"
                                                class="px-2 py-1 rounded text-xs ${module.hasTeacherPermission ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'}">
                                            ${module.hasTeacherPermission ? 'Freigegeben' : 'Sperren'}
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Schaltet Level-Zugang um
     */
    toggleLevelAccess(studentId, courseId, levelId) {
        if (!window.currentUser) return;
        
        const teacherId = window.currentUser.id;
        const hasAccess = this.permissionManager.hasPermission(studentId, courseId, levelId);
        
        if (hasAccess) {
            this.permissionManager.revokeAccess(teacherId, studentId, courseId, levelId);
            showNotification('Level-Zugang entzogen', 'info');
        } else {
            this.permissionManager.grantLevelAccess(teacherId, studentId, courseId, levelId);
            showNotification('Level freigeschaltet', 'success');
        }
        
        // Modal aktualisieren
        const modal = document.querySelector('.fixed.inset-0');
        if (modal) {
            modal.remove();
            this.showStudentPermissionModal(studentId);
        }
    }
    
    /**
     * Schaltet Modul-Zugang um
     */
    toggleModuleAccess(studentId, courseId, moduleId) {
        if (!window.currentUser) return;
        
        const teacherId = window.currentUser.id;
        const hasAccess = this.permissionManager.hasPermission(studentId, courseId, null, moduleId);
        
        if (hasAccess) {
            this.permissionManager.revokeAccess(teacherId, studentId, courseId, null, moduleId);
            showNotification('Modul-Zugang entzogen', 'info');
        } else {
            this.permissionManager.grantModuleAccess(teacherId, studentId, courseId, moduleId);
            showNotification('Modul freigeschaltet', 'success');
        }
        
        // Modal aktualisieren
        const modal = document.querySelector('.fixed.inset-0');
        if (modal) {
            modal.remove();
            this.showStudentPermissionModal(studentId);
        }
    }
    
    /**
     * Schaltet Auto-Progression um
     */
    toggleAutoProgression(studentId, courseId) {
        if (!window.currentUser) return;
        
        const teacherId = window.currentUser.id;
        const currentSetting = this.permissionManager.getAutoProgression(studentId, courseId);
        
        this.permissionManager.setAutoProgression(teacherId, studentId, courseId, !currentSetting);
        
        showNotification(
            `Auto-Progression ${!currentSetting ? 'aktiviert' : 'deaktiviert'}`, 
            'success'
        );
    }
}

// ========================================
// STUDENT INTERFACE EXTENSIONS
// ========================================

/**
 * Erweitert das Student-Interface um Permission-Checks
 */
class StudentPermissionInterface {
    constructor() {
        this.permissionManager = null;
    }
    
    /**
     * Initialisiert das Interface
     */
    initialize(permissionManager) {
        this.permissionManager = permissionManager;
    }
    
    /**
     * Rendert Course-Interface mit Permissions
     */
    renderCourseWithPermissions(course, studentId) {
        const progress = progressManager.calculateCourseProgress(studentId, course.id, course);
        
        return `
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
                
                <!-- Duolingo-Style Level Path mit Permissions -->
                <div class="course-path space-y-6">
                    ${course.levels.map((level, levelIndex) => 
                        this.renderLevelWithPermissions(level, course.id, studentId, levelIndex)
                    ).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Rendert Level mit Permission-Checks
     */
    renderLevelWithPermissions(level, courseId, studentId, levelIndex) {
        const hasLevelAccess = this.permissionManager.hasPermission(studentId, courseId, level.id);
        
        return `
            <div class="level-container ${hasLevelAccess ? '' : 'opacity-50'}">
                <div class="flex items-center mb-4">
                    <div class="level-icon w-16 h-16 rounded-full ${hasLevelAccess ? 'bg-success' : 'bg-gray-400'} 
                               flex items-center justify-center text-white text-2xl font-bold mr-4">
                        ${hasLevelAccess ? (level.icon || (levelIndex + 1)) : '🔒'}
                    </div>
                    <div class="flex-1">
                        <h4 class="text-lg font-semibold">${level.title}</h4>
                        <p class="text-sm text-gray-600">${level.description}</p>
                        ${!hasLevelAccess ? '<p class="text-xs text-red-500 mt-1">🔒 Noch nicht freigeschaltet</p>' : ''}
                    </div>
                </div>
                
                <!-- Module in diesem Level -->
                <div class="ml-20 space-y-3">
                    ${level.modules.map((module, moduleIndex) => 
                        this.renderModuleWithPermissions(module, level.id, courseId, studentId, moduleIndex)
                    ).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Rendert Modul mit Permission-Checks
     */
    renderModuleWithPermissions(module, levelId, courseId, studentId, moduleIndex) {
        const access = this.permissionManager.checkAccess(studentId, courseId, levelId, module.id);
        
        // Fortschritt für dieses Modul berechnen
        const userProgress = progressManager.getUserProgress(studentId);
        const courseProgress = userProgress.courseProgress[courseId];
        const completedTasks = courseProgress?.completedTasks || [];
        const moduleTasks = module.tasks.map(t => t.id);
        const moduleTasksCompleted = moduleTasks.filter(taskId => completedTasks.includes(taskId));
        const moduleCompleted = moduleTasksCompleted.length === moduleTasks.length;
        const moduleProgress = moduleTasks.length > 0 ? Math.round((moduleTasksCompleted.length / moduleTasks.length) * 100) : 0;
        
        return `
            <div class="module-item flex items-center justify-between p-4 rounded-lg border transition-all duration-200
                       ${access.hasAccess ? 
                         (moduleCompleted ? 'bg-green-50 border-green-200 hover:bg-green-100' : 'bg-blue-50 border-blue-200 hover:bg-blue-100') : 
                         'bg-gray-50 border-gray-200 cursor-not-allowed'}">
                
                <div class="flex items-center space-x-4 flex-1">
                    <!-- Module Icon -->
                    <div class="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold
                               ${access.hasAccess ? 
                                 (moduleCompleted ? 'bg-green-500' : 'bg-blue-500') : 
                                 'bg-gray-400'}">
                        ${access.hasAccess ? 
                          (moduleCompleted ? '✅' : (moduleIndex + 1)) : 
                          '🔒'}
                    </div>
                    
                    <!-- Module Info -->
                    <div class="flex-1">
                        <div class="flex items-center space-x-2">
                            <span class="font-semibold ${access.hasAccess ? 'text-gray-900' : 'text-gray-500'}">${module.title}</span>
                            <span class="text-sm text-gray-500">(~${module.estimatedMinutes} Min.)</span>
                        </div>
                        
                        ${access.hasAccess ? `
                            <div class="flex items-center space-x-2 mt-1">
                                <div class="w-24 h-2 bg-gray-200 rounded-full">
                                    <div class="h-2 ${moduleCompleted ? 'bg-green-500' : 'bg-blue-500'} rounded-full transition-all duration-300" 
                                         style="width: ${moduleProgress}%"></div>
                                </div>
                                <span class="text-xs text-gray-600">${moduleProgress}%</span>
                            </div>
                        ` : `
                            <div class="text-xs text-red-500 mt-1">
                                🔒 ${access.unlockReason}
                            </div>
                        `}
                    </div>
                </div>
                
                <!-- Action Button -->
                <div>
                    ${access.hasAccess ? `
                        <button onclick="startLearningModule('${courseId}', '${levelId}', '${module.id}')"
                                class="px-4 py-2 rounded-lg font-medium transition-colors
                                       ${moduleCompleted ? 
                                         'bg-green-500 hover:bg-green-600 text-white' : 
                                         'bg-blue-500 hover:bg-blue-600 text-white'}">
                            ${moduleCompleted ? '🔄 Wiederholen' : '▶️ Starten'}
                        </button>
                    ` : `
                        <button disabled class="px-4 py-2 rounded-lg font-medium bg-gray-300 text-gray-500 cursor-not-allowed">
                            🔒 Gesperrt
                        </button>
                    `}
                </div>
            </div>
        `;
    }
}

// ========================================
// GLOBALE INTEGRATION
// ========================================

// Globale Instanzen erstellen
const coursePermissionManager = new CoursePermissionManager();
const teacherPermissionInterface = new TeacherPermissionInterface();
const studentPermissionInterface = new StudentPermissionInterface();

// Initialisierung
coursePermissionManager.initialize();
teacherPermissionInterface.initialize(coursePermissionManager);
studentPermissionInterface.initialize(coursePermissionManager);

// ========================================
// INTEGRATION IN BESTEHENDE SYSTEME
// ========================================

/**
 * Erweitert das Teacher-Student-Management um Permission-Buttons
 */
function enhanceTeacherStudentInterface() {
    // Füge Permission-Button zu Student-Liste hinzu
    const originalLoadEnhancedStudentManagement = teacherStudentManager.loadEnhancedStudentManagement;
    
    teacherStudentManager.loadEnhancedStudentManagement = function() {
        originalLoadEnhancedStudentManagement.call(this);
        
        // Füge Permission-Buttons zu jeder Student-Zeile hinzu
        const studentItems = document.querySelectorAll('.student-item');
        studentItems.forEach(item => {
            const studentId = this.extractStudentIdFromItem(item);
            if (studentId) {
                const actionsDiv = item.querySelector('.flex.flex-wrap.gap-2');
                if (actionsDiv) {
                    const permissionButton = document.createElement('button');
                    permissionButton.onclick = () => teacherPermissionInterface.showStudentPermissionModal(studentId);
                    permissionButton.className = 'bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded text-sm';
                    permissionButton.innerHTML = '🔐 Freischaltungen';
                    actionsDiv.appendChild(permissionButton);
                }
            }
        });
    };
}

/**
 * Erweitert die Learning-Interface um Permission-Checks
 */
function enhanceLearningInterface() {
    const originalLoadAdvancedLearningInterface = window.loadAdvancedLearningInterface;
    
    window.loadAdvancedLearningInterface = function() {
        console.log('📚 Lade erweiterte Lern-Oberfläche mit Permissions...');
        
        const learningContainer = document.querySelector('#learning-page .bg-white');
        if (!learningContainer) return;
        
        const currentUser = getCurrentUser();
        if (!currentUser) return;
        
        const userProgress = progressManager.getUserProgress(currentUser.id);
        const availableCourses = getAvailableCoursesForUser(currentUser.id, currentUser.userType);
        
        // Eingeschriebene Kurse mit Permission-Checks
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
        
        // Auto-Progression für alle Kurse prüfen
        enrolledCourses.forEach(course => {
            coursePermissionManager.checkAutoProgression(currentUser.id, course.id);
        });
        
        // Kurs-Interface mit Permission-System
        let courseHTML = `
            <div class="space-y-8">
                <h2 class="text-2xl font-bold text-gray-900">🎓 Deine Lernreise</h2>
        `;
        
        enrolledCourses.forEach(course => {
            courseHTML += studentPermissionInterface.renderCourseWithPermissions(course, currentUser.id);
        });
        
        courseHTML += '</div>';
        learningContainer.innerHTML = courseHTML;
    };
}

/**
 * Erweitert startLearningModule um Permission-Check
 */
function enhanceStartLearningModule() {
    window.startLearningModule = function(courseId, levelId, moduleId) {
        console.log('🎯 Starte Lern-Modul mit Permission-Check:', { courseId, levelId, moduleId });
        
        const currentUser = getCurrentUser();
        if (!currentUser) {
            showNotification('Du musst angemeldet sein', 'error');
            return;
        }
        
        // Permission-Check
        const access = coursePermissionManager.checkAccess(currentUser.id, courseId, levelId, moduleId);
        
        if (!access.hasAccess) {
            showNotification(`🔒 Zugang verweigert: ${access.unlockReason}`, 'warning');
            return;
        }
        
        // Simple Learning Engine direkt starten
        if (window.learningEngine && window.learningEngine.startLesson) {
            learningEngine.startLesson(courseId, 'lesson-1');
        } else {
            showNotification('🎓 Modul wird gestartet...', 'success');
            console.log('✅ Zugang gewährt für:', moduleId);
        }
    };
}

// Helper-Funktion für Student-ID-Extraktion (vereinfacht)
teacherStudentManager.extractStudentIdFromItem = function(item) {
    // Extrahiere Student-ID aus dem DOM-Element
    // Dies ist eine vereinfachte Version - in der echten Implementierung 
    // würde man data-Attribute oder ähnliches verwenden
    const buttons = item.querySelectorAll('button[onclick*="viewStudentProgress"]');
    if (buttons.length > 0) {
        const onclick = buttons[0].getAttribute('onclick');
        const match = onclick.match(/viewStudentProgress\('([^']+)'\)/);
        return match ? match[1] : null;
    }
    return null;
};

// ========================================
// AKTIVIERUNG DER ERWEITERUNGEN
// ========================================

// System beim Laden aktivieren
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (window.teacherStudentManager) {
            enhanceTeacherStudentInterface();
        }
        enhanceLearningInterface();
        enhanceStartLearningModule();
        
        console.log('🔐 Course-Permission-System vollständig integriert');
    }, 2000); // 2 Sekunden warten
});

// Quick Fix für showNotification
if (!window.showNotification) {
    window.showNotification = function(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // Einfacher Alert als Fallback
        if (type === 'error') {
            alert('❌ ' + message);
        } else if (type === 'success') {
            alert('✅ ' + message);
        } else if (type === 'warning') {
            alert('⚠️ ' + message);
        } else {
            alert('ℹ️ ' + message);
        }
    };
}

// Globale Verfügbarkeit
window.coursePermissionManager = coursePermissionManager;
window.teacherPermissionInterface = teacherPermissionInterface;
window.studentPermissionInterface = studentPermissionInterface;

console.log('🔐 Course-Permission-System geladen und bereit!');
console.log('📋 Features: Teacher-Freischaltung, Student-Progress-Check, Auto-Progression, Duolingo-UI');
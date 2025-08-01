/**
 * ========================================
 * AUTHENTICATION SYSTEM
 * ========================================
 * 
 * Dieses Modul verwaltet die komplette Benutzer-Authentifizierung:
 * - Registrierung mit Validierung
 * - Login mit Token-System
 * - Passwort-Hashing für Sicherheit
 * - Session-Management
 * - Input-Sanitization
 */

// ========================================
// GLOBALE KONSTANTEN UND KONFIGURATION
// ========================================

/**
 * Konfiguration für das Authentication-System
 */
const AUTH_CONFIG = {
    // Token-Einstellungen
    TOKEN_EXPIRY_HOURS: 24,                    // Token läuft nach 24 Stunden ab
    SESSION_STORAGE_KEY: 'currentUser',        // LocalStorage Key für Session
    TOKEN_STORAGE_KEY: 'authToken',            // LocalStorage Key für Token
    
    // Passwort-Anforderungen
    MIN_PASSWORD_LENGTH: 8,                    // Mindestlänge Passwort
    REQUIRE_SPECIAL_CHARS: true,               // Sonderzeichen erforderlich
    REQUIRE_NUMBERS: true,                     // Zahlen erforderlich
    REQUIRE_UPPERCASE: true,                   // Großbuchstaben erforderlich
    
    // Teacher-Code-Einstellungen
    TEACHER_CODE_LENGTH: 6,                    // Länge der Teacher-Codes
    TEACHER_CODE_PREFIX: 'TCH',                // Prefix für Teacher-Codes
    
    // Validierung
    MAX_LOGIN_ATTEMPTS: 5,                     // Maximale Login-Versuche
    LOCKOUT_DURATION_MINUTES: 15               // Sperrzeit nach zu vielen Versuchen
};

/**
 * RegEx-Patterns für Validierung
 */
const VALIDATION_PATTERNS = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,                           // E-Mail Format
    username: /^[a-zA-Z0-9_]{3,20}$/,                              // Username: 3-20 Zeichen, nur Buchstaben, Zahlen, Unterstriche
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, // Starkes Passwort
    name: /^[a-zA-ZäöüÄÖÜß\s]{2,30}$/,                           // Name: 2-30 Zeichen, Buchstaben und Leerzeichen
    teacherCode: /^TCH[A-Z0-9]{3}$/                                // Teacher-Code Format
};

// ========================================
// BENUTZER-DATENBANK SIMULATION
// ========================================

/**
 * Simuliert eine Benutzer-Datenbank mit LocalStorage
 * In einer echten App würde das über eine Backend-API laufen
 */
class UserDatabase {
    constructor() {
        this.USERS_KEY = 'registeredUsers';
        this.initializeDatabase();
    }
    
    /**
     * Initialisiert die Datenbank mit Demo-Daten
     */
    initializeDatabase() {
        const existingUsers = this.getAllUsers();
        
        // Falls keine Benutzer existieren, Demo-Accounts erstellen
        if (existingUsers.length === 0) {
            console.log('🔧 Erstelle Demo-Benutzer...');
            
            // Demo Student
            this.createUser({
                id: 'demo-student-001',
                name: 'Max',
                surname: 'Mustermann',
                email: 'student@demo.com',
                username: 'demo_student',
                password: this.hashPassword('Demo123!'),
                userType: 'student',
                createdAt: new Date().toISOString(),
                lastLogin: null,
                isDemo: true
            });
            
            // Demo Teacher
            this.createUser({
                id: 'demo-teacher-001',
                name: 'Anna',
                surname: 'Schmidt',
                email: 'teacher@demo.com',
                username: 'demo_teacher',
                password: this.hashPassword('Demo123!'),
                userType: 'teacher',
                teacherCode: 'TCHDMO',
                createdAt: new Date().toISOString(),
                lastLogin: null,
                isDemo: true
            });
            
            console.log('✅ Demo-Benutzer erstellt');
            console.log('📋 Login-Daten:');
            console.log('   Student: demo_student / Demo123!');
            console.log('   Teacher: demo_teacher / Demo123!');
        }
    }
    
    /**
     * Erstellt einen neuen Benutzer in der Datenbank
     * @param {Object} userData - Benutzerdaten
     * @returns {boolean} Erfolg der Operation
     */
    createUser(userData) {
        try {
            const users = this.getAllUsers();
            users.push(userData);
            localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
            return true;
        } catch (error) {
            console.error('❌ Fehler beim Erstellen des Benutzers:', error);
            return false;
        }
    }
    
    /**
     * Findet einen Benutzer anhand von Username oder E-Mail
     * @param {string} identifier - Username oder E-Mail
     * @returns {Object|null} Benutzer-Objekt oder null
     */
    findUser(identifier) {
        const users = this.getAllUsers();
        return users.find(user => 
            user.username === identifier || 
            user.email === identifier
        ) || null;
    }
    
    /**
     * Überprüft ob ein Username bereits existiert
     * @param {string} username - Zu prüfender Username
     * @returns {boolean} True wenn Username existiert
     */
    usernameExists(username) {
        const users = this.getAllUsers();
        return users.some(user => user.username === username);
    }
    
    /**
     * Überprüft ob eine E-Mail bereits existiert
     * @param {string} email - Zu prüfende E-Mail
     * @returns {boolean} True wenn E-Mail existiert
     */
    emailExists(email) {
        const users = this.getAllUsers();
        return users.some(user => user.email === email);
    }
    
    /**
     * Holt alle Benutzer aus der Datenbank
     * @returns {Array} Array aller Benutzer
     */
    getAllUsers() {
        try {
            const usersData = localStorage.getItem(this.USERS_KEY);
            return usersData ? JSON.parse(usersData) : [];
        } catch (error) {
            console.error('❌ Fehler beim Laden der Benutzer:', error);
            return [];
        }
    }
    
    /**
     * Aktualisiert einen Benutzer in der Datenbank
     * @param {string} userId - ID des Benutzers
     * @param {Object} updates - Zu aktualisierende Felder
     * @returns {boolean} Erfolg der Operation
     */
    updateUser(userId, updates) {
        try {
            const users = this.getAllUsers();
            const userIndex = users.findIndex(user => user.id === userId);
            
            if (userIndex !== -1) {
                users[userIndex] = { ...users[userIndex], ...updates };
                localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Fehler beim Aktualisieren des Benutzers:', error);
            return false;
        }
    }
    
    /**
     * Einfaches Passwort-Hashing (für Demo-Zwecke)
     * In Produktion würde man bcrypt oder ähnliches verwenden
     * @param {string} password - Klartextpasswort
     * @returns {string} Gehashtes Passwort
     */
    hashPassword(password) {
        // Einfaches Hashing mit Base64 und Salz (NUR FÜR DEMO!)
        const salt = 'language_learning_salt_2024';
        const combined = password + salt;
        return btoa(combined);
    }
    
    /**
     * Überprüft ein Passwort gegen den Hash
     * @param {string} password - Klartextpasswort
     * @param {string} hash - Gehashtes Passwort
     * @returns {boolean} True wenn Passwort korrekt
     */
    verifyPassword(password, hash) {
        return this.hashPassword(password) === hash;
    }
}

// ========================================
// TOKEN-MANAGEMENT
// ========================================

/**
 * Klasse für JWT-ähnliche Token-Verwaltung
 */
class TokenManager {
    /**
     * Erstellt einen neuen Auth-Token
     * @param {Object} userData - Benutzer-Daten für Token
     * @returns {string} Generierter Token
     */
    static createToken(userData) {
        const payload = {
            userId: userData.id,
            username: userData.username,
            userType: userData.userType,
            exp: Date.now() + (AUTH_CONFIG.TOKEN_EXPIRY_HOURS * 60 * 60 * 1000), // Ablaufzeit
            iat: Date.now() // Ausgestellt um
        };
        
        // Einfache Token-Erstellung (in Produktion würde man echte JWT verwenden)
        const tokenData = btoa(JSON.stringify(payload));
        const signature = btoa(`${tokenData}_signature_${Date.now()}`);
        
        return `${tokenData}.${signature}`;
    }
    
    /**
     * Validiert einen Token
     * @param {string} token - Zu validierender Token
     * @returns {Object|null} Token-Payload oder null wenn ungültig
     */
    static validateToken(token) {
        try {
            if (!token || !token.includes('.')) {
                return null;
            }
            
            const [payloadPart] = token.split('.');
            const payload = JSON.parse(atob(payloadPart));
            
            // Token-Ablauf prüfen
            if (Date.now() > payload.exp) {
                console.log('🔒 Token ist abgelaufen');
                return null;
            }
            
            return payload;
        } catch (error) {
            console.error('❌ Token-Validierung fehlgeschlagen:', error);
            return null;
        }
    }
    
    /**
     * Speichert Token in LocalStorage
     * @param {string} token - Zu speichernder Token
     */
    static storeToken(token) {
        localStorage.setItem(AUTH_CONFIG.TOKEN_STORAGE_KEY, token);
    }
    
    /**
     * Holt Token aus LocalStorage
     * @returns {string|null} Gespeicherter Token oder null
     */
    static getStoredToken() {
        return localStorage.getItem(AUTH_CONFIG.TOKEN_STORAGE_KEY);
    }
    
    /**
     * Entfernt Token aus LocalStorage
     */
    static clearToken() {
        localStorage.removeItem(AUTH_CONFIG.TOKEN_STORAGE_KEY);
    }
}

// ========================================
// INPUT-VALIDIERUNG
// ========================================

/**
 * Klasse für umfassende Input-Validierung
 */
class InputValidator {
    /**
     * Validiert E-Mail-Adresse
     * @param {string} email - Zu validierende E-Mail
     * @returns {Object} Validierungsergebnis
     */
    static validateEmail(email) {
        if (!email) {
            return { valid: false, message: 'E-Mail ist erforderlich' };
        }
        
        if (!VALIDATION_PATTERNS.email.test(email)) {
            return { valid: false, message: 'Ungültiges E-Mail-Format' };
        }
        
        return { valid: true };
    }
    
    /**
     * Validiert Benutzername
     * @param {string} username - Zu validierender Username
     * @returns {Object} Validierungsergebnis
     */
    static validateUsername(username) {
        if (!username) {
            return { valid: false, message: 'Benutzername ist erforderlich' };
        }
        
        if (username.length < 3) {
            return { valid: false, message: 'Benutzername muss mindestens 3 Zeichen lang sein' };
        }
        
        if (username.length > 20) {
            return { valid: false, message: 'Benutzername darf maximal 20 Zeichen lang sein' };
        }
        
        if (!VALIDATION_PATTERNS.username.test(username)) {
            return { valid: false, message: 'Benutzername darf nur Buchstaben, Zahlen und Unterstriche enthalten' };
        }
        
        return { valid: true };
    }
    
    /**
     * Validiert Passwort-Stärke
     * @param {string} password - Zu validierendes Passwort
     * @returns {Object} Validierungsergebnis mit Stärke-Score
     */
    static validatePassword(password) {
        if (!password) {
            return { valid: false, message: 'Passwort ist erforderlich', strength: 0 };
        }
        
        const errors = [];
        let strength = 0;
        
        // Länge prüfen
        if (password.length < AUTH_CONFIG.MIN_PASSWORD_LENGTH) {
            errors.push(`Passwort muss mindestens ${AUTH_CONFIG.MIN_PASSWORD_LENGTH} Zeichen lang sein`);
        } else {
            strength++;
        }
        
        // Großbuchstaben
        if (AUTH_CONFIG.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
            errors.push('Passwort muss mindestens einen Großbuchstaben enthalten');
        } else {
            strength++;
        }
        
        // Zahlen
        if (AUTH_CONFIG.REQUIRE_NUMBERS && !/[0-9]/.test(password)) {
            errors.push('Passwort muss mindestens eine Zahl enthalten');
        } else {
            strength++;
        }
        
        // Sonderzeichen
        if (AUTH_CONFIG.REQUIRE_SPECIAL_CHARS && !/[^A-Za-z0-9]/.test(password)) {
            errors.push('Passwort muss mindestens ein Sonderzeichen enthalten');
        } else {
            strength++;
        }
        
        // Zusätzliche Stärke-Faktoren
        if (password.length >= 12) strength++;
        if (/[a-z]/.test(password)) strength++;
        
        const valid = errors.length === 0;
        const message = valid ? 'Passwort ist stark genug' : errors.join('. ');
        
        return { 
            valid, 
            message, 
            strength: Math.min(strength, 4),
            errors 
        };
    }
    
    /**
     * Validiert Namen (Vor- und Nachname)
     * @param {string} name - Zu validierender Name
     * @param {string} type - 'firstName' oder 'lastName'
     * @returns {Object} Validierungsergebnis
     */
    static validateName(name, type = 'Name') {
        if (!name) {
            return { valid: false, message: `${type} ist erforderlich` };
        }
        
        if (name.length < 2) {
            return { valid: false, message: `${type} muss mindestens 2 Zeichen lang sein` };
        }
        
        if (name.length > 30) {
            return { valid: false, message: `${type} darf maximal 30 Zeichen lang sein` };
        }
        
        if (!VALIDATION_PATTERNS.name.test(name)) {
            return { valid: false, message: `${type} darf nur Buchstaben und Leerzeichen enthalten` };
        }
        
        return { valid: true };
    }
    
    /**
     * Bereinigt Input-Strings von gefährlichen Zeichen
     * @param {string} input - Zu bereinigender String
     * @returns {string} Bereinigter String
     */
    static sanitizeInput(input) {
        if (typeof input !== 'string') return '';
        
        return input
            .trim()                                    // Leerzeichen entfernen
            .replace(/[<>]/g, '')                     // HTML-Tags entfernen
            .replace(/javascript:/gi, '')              // JavaScript-URLs entfernen
            .replace(/on\w+=/gi, '');                 // Event-Handler entfernen
    }
}

// ========================================
// TEACHER-CODE-GENERATOR
// ========================================

/**
 * Generiert eindeutige Teacher-Codes
 */
class TeacherCodeGenerator {
    /**
     * Generiert einen neuen, eindeutigen Teacher-Code
     * @param {UserDatabase} database - Referenz zur Benutzerdatenbank
     * @returns {string} Eindeutiger Teacher-Code
     */
    static generateUniqueCode(database) {
        const maxAttempts = 100;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            const code = this.generateCode();
            
            // Prüfen ob Code bereits verwendet wird
            const existingUser = database.getAllUsers().find(user => user.teacherCode === code);
            if (!existingUser) {
                return code;
            }
            
            attempts++;
        }
        
        // Fallback wenn keine eindeutige Code gefunden wurde
        return `${AUTH_CONFIG.TEACHER_CODE_PREFIX}${Date.now().toString().slice(-3)}`;
    }
    
    /**
     * Generiert einen zufälligen Teacher-Code
     * @returns {string} Zufälliger Teacher-Code
     */
    static generateCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const codeLength = AUTH_CONFIG.TEACHER_CODE_LENGTH - AUTH_CONFIG.TEACHER_CODE_PREFIX.length;
        let code = AUTH_CONFIG.TEACHER_CODE_PREFIX;
        
        for (let i = 0; i < codeLength; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        return code;
    }
}

// ========================================
// HAUPTFUNKTIONEN FÜR AUTHENTICATION
// ========================================

// Globale Database-Instanz
const userDatabase = new UserDatabase();

/**
 * Versucht einen Benutzer anzumelden
 * @param {Object} loginData - Login-Daten (username, password, rememberMe)
 * @returns {Object} Ergebnis der Anmeldung
 */
function attemptLogin(loginData) {
    try {
        console.log('🔐 Login-Versuch für:', loginData.username);
        
        // Input bereinigen
        const cleanUsername = InputValidator.sanitizeInput(loginData.username);
        const cleanPassword = InputValidator.sanitizeInput(loginData.password);
        
        // Benutzer in Datenbank suchen
        const user = userDatabase.findUser(cleanUsername);
        if (!user) {
            console.log('❌ Benutzer nicht gefunden');
            return { 
                success: false, 
                message: 'Benutzername oder Passwort falsch' 
            };
        }
        
        // Passwort überprüfen
        const passwordValid = userDatabase.verifyPassword(cleanPassword, user.password);
        if (!passwordValid) {
            console.log('❌ Falsches Passwort');
            return { 
                success: false, 
                message: 'Benutzername oder Passwort falsch' 
            };
        }
        
        // Login erfolgreich
        console.log('✅ Login erfolgreich für:', user.username);
        
        // Last Login aktualisieren
        userDatabase.updateUser(user.id, { 
            lastLogin: new Date().toISOString() 
        });
        
        // Token erstellen
        const token = TokenManager.createToken(user);
        TokenManager.storeToken(token);
        
        // Session speichern (ohne Passwort)
        const sessionUser = {
            id: user.id,
            name: user.name,
            surname: user.surname,
            username: user.username,
            email: user.email,
            userType: user.userType,
            teacherCode: user.teacherCode,
            lastLogin: user.lastLogin
        };
        
        localStorage.setItem(AUTH_CONFIG.SESSION_STORAGE_KEY, JSON.stringify(sessionUser));
        
        return { 
            success: true, 
            user: sessionUser,
            token: token,
            message: 'Erfolgreich angemeldet' 
        };
        
    } catch (error) {
        console.error('❌ Login-Fehler:', error);
        return { 
            success: false, 
            message: 'Ein unerwarteter Fehler ist aufgetreten' 
        };
    }
}

/**
 * Registriert einen neuen Benutzer
 * @param {Object} registerData - Registrierungs-Daten
 * @returns {Object} Ergebnis der Registrierung
 */
function attemptRegister(registerData) {
    try {
        console.log('📝 Registrierung für:', registerData.username);
        
        // ========================================
        // INPUT-VALIDIERUNG UND BEREINIGUNG
        // ========================================
        
        // Alle Eingaben bereinigen
        const cleanData = {
            name: InputValidator.sanitizeInput(registerData.name),
            surname: InputValidator.sanitizeInput(registerData.surname),
            email: InputValidator.sanitizeInput(registerData.email).toLowerCase(),
            username: InputValidator.sanitizeInput(registerData.username).toLowerCase(),
            password: registerData.password, // Passwort nicht bereinigen
            confirmPassword: registerData.confirmPassword,
            userType: registerData.userType
        };
        
        // E-Mail validieren
        const emailValidation = InputValidator.validateEmail(cleanData.email);
        if (!emailValidation.valid) {
            return { success: false, message: emailValidation.message };
        }
        
        // Username validieren
        const usernameValidation = InputValidator.validateUsername(cleanData.username);
        if (!usernameValidation.valid) {
            return { success: false, message: usernameValidation.message };
        }
        
        // Namen validieren
        const nameValidation = InputValidator.validateName(cleanData.name, 'Vorname');
        if (!nameValidation.valid) {
            return { success: false, message: nameValidation.message };
        }
        
        const surnameValidation = InputValidator.validateName(cleanData.surname, 'Nachname');
        if (!surnameValidation.valid) {
            return { success: false, message: surnameValidation.message };
        }
        
        // Passwort validieren
        const passwordValidation = InputValidator.validatePassword(cleanData.password);
        if (!passwordValidation.valid) {
            return { success: false, message: passwordValidation.message };
        }
        
        // Passwort-Bestätigung prüfen
        if (cleanData.password !== cleanData.confirmPassword) {
            return { success: false, message: 'Passwörter stimmen nicht überein' };
        }
        
        // Terms & Conditions prüfen
        if (!registerData.acceptTerms) {
            return { success: false, message: 'Nutzungsbedingungen müssen akzeptiert werden' };
        }
        
        // ========================================
        // EINDEUTIGKEIT PRÜFEN
        // ========================================
        
        // E-Mail bereits vorhanden?
        if (userDatabase.emailExists(cleanData.email)) {
            return { success: false, message: 'Diese E-Mail-Adresse ist bereits registriert' };
        }
        
        // Username bereits vorhanden?
        if (userDatabase.usernameExists(cleanData.username)) {
            return { success: false, message: 'Dieser Benutzername ist bereits vergeben' };
        }
        
        // ========================================
        // BENUTZER ERSTELLEN
        // ========================================
        
        // Eindeutige ID generieren
        const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Teacher-Code für Lehrer generieren
        let teacherCode = null;
        if (cleanData.userType === 'teacher') {
            teacherCode = TeacherCodeGenerator.generateUniqueCode(userDatabase);
            console.log('🎓 Teacher-Code generiert:', teacherCode);
        }
        
        // Benutzer-Objekt erstellen
        const newUser = {
            id: userId,
            name: cleanData.name,
            surname: cleanData.surname,
            email: cleanData.email,
            username: cleanData.username,
            password: userDatabase.hashPassword(cleanData.password),
            userType: cleanData.userType,
            teacherCode: teacherCode,
            createdAt: new Date().toISOString(),
            lastLogin: null,
            isDemo: false,
            
            // Zusätzliche Profile-Daten
            profileComplete: false,
            emailVerified: false,
            
            // Lern-/Lehr-Statistiken
            stats: {
                totalXP: 0,
                currentStreak: 0,
                longestStreak: 0,
                lessonsCompleted: 0,
                studentsCount: cleanData.userType === 'teacher' ? 0 : null
            }
        };
        
        // Benutzer in Datenbank speichern
        const created = userDatabase.createUser(newUser);
        if (!created) {
            return { success: false, message: 'Fehler beim Erstellen des Accounts' };
        }
        
        console.log('✅ Benutzer erfolgreich registriert:', cleanData.username);
        
        return { 
            success: true, 
            message: 'Account erfolgreich erstellt!',
            userId: userId,
            userType: cleanData.userType,
            teacherCode: teacherCode
        };
        
    } catch (error) {
        console.error('❌ Registrierungs-Fehler:', error);
        return { 
            success: false, 
            message: 'Ein unerwarteter Fehler ist aufgetreten' 
        };
    }
}

/**
 * Überprüft ob ein Benutzer aktuell angemeldet ist
 * @returns {Object|null} Benutzer-Objekt oder null
 */
function getCurrentUser() {
    try {
        // Token validieren
        const token = TokenManager.getStoredToken();
        if (!token) {
            return null;
        }
        
        const tokenPayload = TokenManager.validateToken(token);
        if (!tokenPayload) {
            // Ungültiger Token - Session beenden
            clearUserSession();
            return null;
        }
        
        // Session-Daten laden
        const sessionData = localStorage.getItem(AUTH_CONFIG.SESSION_STORAGE_KEY);
        if (!sessionData) {
            return null;
        }
        
        return JSON.parse(sessionData);
        
    } catch (error) {
        console.error('❌ Fehler beim Laden der Session:', error);
        clearUserSession();
        return null;
    }
}

/**
 * Beendet die aktuelle Benutzer-Session
 */
function clearUserSession() {
    console.log('🚪 Session wird beendet...');
    
    // Token und Session-Daten löschen
    TokenManager.clearToken();
    localStorage.removeItem(AUTH_CONFIG.SESSION_STORAGE_KEY);
    
    console.log('✅ Session beendet');
}

/**
 * Erneuert einen ablaufenden Token
 * @returns {boolean} Erfolg der Token-Erneuerung
 */
function refreshToken() {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            return false;
        }
        
        // Neuen Token erstellen
        const newToken = TokenManager.createToken(currentUser);
        TokenManager.storeToken(newToken);
        
        console.log('🔄 Token erfolgreich erneuert');
        return true;
        
    } catch (error) {
        console.error('❌ Token-Erneuerung fehlgeschlagen:', error);
        return false;
    }
}

// ========================================
// EXPORT FÜR GLOBALE VERFÜGBARKEIT
// ========================================

// Hauptfunktionen global verfügbar machen
window.attemptLogin = attemptLogin;
window.attemptRegister = attemptRegister;
window.getCurrentUser = getCurrentUser;
window.clearUserSession = clearUserSession;
window.refreshToken = refreshToken;

// Utility-Klassen global verfügbar machen für erweiterte Nutzung
window.InputValidator = InputValidator;
window.TokenManager = TokenManager;
window.TeacherCodeGenerator = TeacherCodeGenerator;

console.log('🔐 Authentication-System geladen und bereit');
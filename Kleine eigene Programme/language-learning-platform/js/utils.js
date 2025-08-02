/**
 * ========================================
 * UTILITY FUNCTIONS
 * ========================================
 * 
 * Sammlung von Hilfsfunktionen für die gesamte Anwendung:
 * - Formatierung (Zeit, Zahlen, Datum)
 * - UI-Animationen und Effekte
 * - LocalStorage-Helpers
 * - Validation-Helpers
 * - String-Utilities
 */

// ========================================
// FORMATIERUNG UND ANZEIGE
// ========================================

/**
 * Formatiert eine Zeitspanne in lesbare Form
 * @param {number} seconds - Sekunden
 * @returns {string} Formatierte Zeitspanne
 */
function formatDuration(seconds) {
    if (seconds < 60) {
        return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.round(seconds % 60);
        return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    } else {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
}

/**
 * Formatiert ein Datum in lesbarer Form
 * @param {string|Date} date - Datum als String oder Date-Objekt
 * @param {string} format - Format ('short', 'long', 'relative')
 * @returns {string} Formatiertes Datum
 */
function formatDate(date, format = 'short') {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
        return 'Ungültiges Datum';
    }
    
    switch (format) {
        case 'short':
            return dateObj.toLocaleDateString('de-DE');
        case 'long':
            return dateObj.toLocaleDateString('de-DE', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        case 'relative':
            return formatRelativeTime(dateObj);
        case 'datetime':
            return dateObj.toLocaleString('de-DE');
        default:
            return dateObj.toLocaleDateString('de-DE');
    }
}

/**
 * Formatiert ein Datum als relative Zeit (vor X Minuten, etc.)
 * @param {Date} date - Datum
 * @returns {string} Relative Zeitangabe
 */
function formatRelativeTime(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) {
        return 'gerade eben';
    } else if (minutes < 60) {
        return `vor ${minutes} Minute${minutes !== 1 ? 'n' : ''}`;
    } else if (hours < 24) {
        return `vor ${hours} Stunde${hours !== 1 ? 'n' : ''}`;
    } else if (days < 7) {
        return `vor ${days} Tag${days !== 1 ? 'en' : ''}`;
    } else {
        return formatDate(date, 'short');
    }
}

/**
 * Formatiert große Zahlen mit K/M Suffixen
 * @param {number} num - Zahl
 * @returns {string} Formatierte Zahl
 */
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    } else {
        return num.toString();
    }
}

/**
 * Formatiert Prozentangaben
 * @param {number} value - Wert zwischen 0 und 1 oder 0 und 100
 * @param {boolean} isDecimal - Ob der Wert als Dezimal (0-1) oder Prozent (0-100) gegeben ist
 * @returns {string} Formatierte Prozentangabe
 */
function formatPercentage(value, isDecimal = false) {
    const percent = isDecimal ? value * 100 : value;
    return Math.round(percent) + '%';
}

// ========================================
// STRING UTILITIES
// ========================================

/**
 * Kapitalisiert den ersten Buchstaben eines Strings
 * @param {string} str - String
 * @returns {string} String mit kapitalisiertem ersten Buchstaben
 */
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Konvertiert einen String in Title Case
 * @param {string} str - String
 * @returns {string} String in Title Case
 */
function toTitleCase(str) {
    if (!str) return '';
    return str.split(' ').map(word => capitalize(word)).join(' ');
}

/**
 * Erstellt einen URL-freundlichen Slug aus einem String
 * @param {string} str - String
 * @returns {string} URL-freundlicher Slug
 */
function createSlug(str) {
    return str
        .toLowerCase()
        .replace(/[äöüß]/g, (match) => {
            const replacements = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' };
            return replacements[match];
        })
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Generiert eine zufällige ID
 * @param {number} length - Länge der ID
 * @returns {string} Zufällige ID
 */
function generateRandomId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// ========================================
// UI ANIMATIONS UND EFFECTS
// ========================================

/**
 * Zeigt ein Element mit Fade-In-Animation
 * @param {HTMLElement|string} element - Element oder Selektor
 * @param {number} duration - Dauer in ms
 */
function fadeIn(element, duration = 300) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return;
    
    el.style.opacity = '0';
    el.style.display = 'block';
    
    let start = null;
    function animate(timestamp) {
        if (!start) start = timestamp;
        const progress = (timestamp - start) / duration;
        
        el.style.opacity = Math.min(progress, 1);
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }
    
    requestAnimationFrame(animate);
}

/**
 * Versteckt ein Element mit Fade-Out-Animation
 * @param {HTMLElement|string} element - Element oder Selektor
 * @param {number} duration - Dauer in ms
 */
function fadeOut(element, duration = 300) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return;
    
    let start = null;
    function animate(timestamp) {
        if (!start) start = timestamp;
        const progress = (timestamp - start) / duration;
        
        el.style.opacity = 1 - Math.min(progress, 1);
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            el.style.display = 'none';
        }
    }
    
    requestAnimationFrame(animate);
}

/**
 * Slide-In-Animation von oben
 * @param {HTMLElement|string} element - Element oder Selektor
 * @param {number} duration - Dauer in ms
 */
function slideInFromTop(element, duration = 400) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return;
    
    el.style.transform = 'translateY(-100%)';
    el.style.opacity = '0';
    el.style.display = 'block';
    
    let start = null;
    function animate(timestamp) {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        el.style.transform = `translateY(${-100 + (100 * easeOut)}%)`;
        el.style.opacity = progress;
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            el.style.transform = '';
        }
    }
    
    requestAnimationFrame(animate);
}

/**
 * Pulsiert ein Element (für Aufmerksamkeit)
 * @param {HTMLElement|string} element - Element oder Selektor
 * @param {number} cycles - Anzahl Pulse
 */
function pulseElement(element, cycles = 3) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return;
    
    const originalTransform = el.style.transform;
    let currentCycle = 0;
    
    function pulse() {
        el.style.transform = 'scale(1.1)';
        el.style.transition = 'transform 0.2s ease-in-out';
        
        setTimeout(() => {
            el.style.transform = originalTransform;
            currentCycle++;
            
            if (currentCycle < cycles) {
                setTimeout(pulse, 200);
            } else {
                el.style.transition = '';
            }
        }, 200);
    }
    
    pulse();
}

/**
 * Shake-Animation für Fehler-Anzeige
 * @param {HTMLElement|string} element - Element oder Selektor
 */
function shakeElement(element) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return;
    
    el.style.animation = 'shake 0.5s ease-in-out';
    
    setTimeout(() => {
        el.style.animation = '';
    }, 500);
}

// CSS für Shake-Animation hinzufügen
if (!document.querySelector('#shake-animation-css')) {
    const style = document.createElement('style');
    style.id = 'shake-animation-css';
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
    `;
    document.head.appendChild(style);
}

// ========================================
// LOCAL STORAGE HELPERS
// ========================================

/**
 * Sichere LocalStorage-Operationen mit Fehlerbehandlung
 */
const StorageHelper = {
    /**
     * Setzt einen Wert in LocalStorage
     * @param {string} key - Schlüssel
     * @param {any} value - Wert (wird automatisch serialisiert)
     * @returns {boolean} Erfolg der Operation
     */
    set(key, value) {
        try {
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(key, serializedValue);
            return true;
        } catch (error) {
            console.error('Fehler beim Setzen von LocalStorage:', error);
            return false;
        }
    },
    
    /**
     * Holt einen Wert aus LocalStorage
     * @param {string} key - Schlüssel
     * @param {any} defaultValue - Standardwert falls nicht gefunden
     * @returns {any} Wert oder Standardwert
     */
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Fehler beim Lesen von LocalStorage:', error);
            return defaultValue;
        }
    },
    
    /**
     * Entfernt einen Wert aus LocalStorage
     * @param {string} key - Schlüssel
     * @returns {boolean} Erfolg der Operation
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Fehler beim Entfernen aus LocalStorage:', error);
            return false;
        }
    },
    
    /**
     * Leert den gesamten LocalStorage
     * @returns {boolean} Erfolg der Operation
     */
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Fehler beim Leeren von LocalStorage:', error);
            return false;
        }
    },
    
    /**
     * Prüft ob LocalStorage verfügbar ist
     * @returns {boolean} Verfügbarkeit
     */
    isAvailable() {
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, 'test');
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }
};

// ========================================
// VALIDATION HELPERS
// ========================================

/**
 * Sammlung von Validierungs-Hilfsfunktionen
 */
const ValidationHelper = {
    /**
     * Prüft ob eine E-Mail-Adresse gültig ist
     * @param {string} email - E-Mail-Adresse
     * @returns {boolean} Gültigkeit
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    /**
     * Prüft ob ein Passwort stark genug ist
     * @param {string} password - Passwort
     * @returns {Object} Validierungsergebnis
     */
    isStrongPassword(password) {
        const checks = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /\d/.test(password),
            special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password)
        };
        
        const score = Object.values(checks).filter(Boolean).length;
        
        return {
            isValid: score >= 4,
            score: score,
            checks: checks,
            strength: score < 2 ? 'weak' : score < 4 ? 'medium' : 'strong'
        };
    },
    
    /**
     * Prüft ob ein Benutzername gültig ist
     * @param {string} username - Benutzername
     * @returns {boolean} Gültigkeit
     */
    isValidUsername(username) {
        return /^[a-zA-Z0-9_]{3,20}$/.test(username);
    },
    
    /**
     * Prüft ob ein String nur Buchstaben enthält
     * @param {string} str - String
     * @returns {boolean} Gültigkeit
     */
    isAlpha(str) {
        return /^[a-zA-ZäöüÄÖÜß\s]+$/.test(str);
    },
    
    /**
     * Prüft ob ein String eine gültige URL ist
     * @param {string} str - String
     * @returns {boolean} Gültigkeit
     */
    isValidUrl(str) {
        try {
            new URL(str);
            return true;
        } catch {
            return false;
        }
    }
};

// ========================================
// ARRAY UND OBJECT UTILITIES
// ========================================

/**
 * Entfernt Duplikate aus einem Array
 * @param {Array} arr - Array
 * @param {string} key - Schlüssel für Objekt-Arrays (optional)
 * @returns {Array} Array ohne Duplikate
 */
function removeDuplicates(arr, key = null) {
    if (!key) {
        return [...new Set(arr)];
    }
    
    const seen = new Set();
    return arr.filter(item => {
        const value = item[key];
        if (seen.has(value)) {
            return false;
        }
        seen.add(value);
        return true;
    });
}

/**
 * Sortiert ein Array von Objekten nach einem Schlüssel
 * @param {Array} arr - Array von Objekten
 * @param {string} key - Schlüssel zum Sortieren
 * @param {string} direction - 'asc' oder 'desc'
 * @returns {Array} Sortiertes Array
 */
function sortByKey(arr, key, direction = 'asc') {
    return arr.sort((a, b) => {
        let valueA = a[key];
        let valueB = b[key];
        
        // String-Vergleich case-insensitive
        if (typeof valueA === 'string') {
            valueA = valueA.toLowerCase();
            valueB = valueB.toLowerCase();
        }
        
        if (direction === 'asc') {
            return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
        } else {
            return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
        }
    });
}

/**
 * Gruppiert ein Array von Objekten nach einem Schlüssel
 * @param {Array} arr - Array von Objekten
 * @param {string} key - Schlüssel zum Gruppieren
 * @returns {Object} Gruppiertes Objekt
 */
function groupBy(arr, key) {
    return arr.reduce((groups, item) => {
        const group = item[key];
        groups[group] = groups[group] || [];
        groups[group].push(item);
        return groups;
    }, {});
}

/**
 * Erstellt eine tiefe Kopie eines Objekts
 * @param {any} obj - Zu kopierendes Objekt
 * @returns {any} Tiefe Kopie
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }
    
    if (obj instanceof Array) {
        return obj.map(item => deepClone(item));
    }
    
    if (typeof obj === 'object') {
        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = deepClone(obj[key]);
            }
        }
        return cloned;
    }
    
    return obj;
}

// ========================================
// PERFORMANCE UTILITIES
// ========================================

/**
 * Debounce-Funktion zur Performance-Optimierung
 * @param {Function} func - Funktion die aufgerufen werden soll
 * @param {number} wait - Wartezeit in ms
 * @returns {Function} Debounced Funktion
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle-Funktion zur Performance-Optimierung
 * @param {Function} func - Funktion die aufgerufen werden soll
 * @param {number} limit - Limit in ms
 * @returns {Function} Throttled Funktion
 */
function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ========================================
// COLOR UTILITIES
// ========================================

/**
 * Generiert eine zufällige Hex-Farbe
 * @returns {string} Hex-Farbcode
 */
function generateRandomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

/**
 * Konvertiert Hex zu RGB
 * @param {string} hex - Hex-Farbcode
 * @returns {Object} RGB-Objekt
 */
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

/**
 * Berechnet Kontrast-Farbe (schwarz oder weiß) für Hintergrund
 * @param {string} backgroundColor - Hintergrund-Farbe (Hex)
 * @returns {string} Kontrast-Farbe
 */
function getContrastColor(backgroundColor) {
    const rgb = hexToRgb(backgroundColor);
    if (!rgb) return '#000000';
    
    // Relative Luminanz berechnen
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    
    return luminance > 0.5 ? '#000000' : '#ffffff';
}

// ========================================
// BROWSER UTILITIES
// ========================================

/**
 * Prüft ob der Browser bestimmte Features unterstützt
 */
const BrowserSupport = {
    localStorage: () => StorageHelper.isAvailable(),
    
    webAudio: () => !!(window.AudioContext || window.webkitAudioContext),
    
    getUserMedia: () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    
    notifications: () => 'Notification' in window,
    
    serviceWorker: () => 'serviceWorker' in navigator,
    
    webGL: () => {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && canvas.getContext('webgl'));
        } catch {
            return false;
        }
    }
};

/**
 * Kopiert Text in die Zwischenablage
 * @param {string} text - Text zum Kopieren
 * @returns {Promise<boolean>} Erfolg der Operation
 */
async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            // Fallback für ältere Browser
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            return successful;
        }
    } catch (error) {
        console.error('Fehler beim Kopieren:', error);
        return false;
    }
}

/**
 * Download einer Datei im Browser
 * @param {string} content - Datei-Inhalt
 * @param {string} filename - Dateiname
 * @param {string} contentType - MIME-Type
 */
function downloadFile(content, filename, contentType = 'text/plain') {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
}

// ========================================
// MATH UTILITIES
// ========================================

/**
 * Klemmt eine Zahl zwischen min und max
 * @param {number} value - Wert
 * @param {number} min - Minimum
 * @param {number} max - Maximum
 * @returns {number} Geklemmter Wert
 */
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Interpoliert zwischen zwei Werten
 * @param {number} start - Startwert
 * @param {number} end - Endwert
 * @param {number} factor - Interpolationsfaktor (0-1)
 * @returns {number} Interpolierter Wert
 */
function lerp(start, end, factor) {
    return start + (end - start) * clamp(factor, 0, 1);
}

/**
 * Generiert eine Zufallszahl zwischen min und max
 * @param {number} min - Minimum (inklusive)
 * @param {number} max - Maximum (exklusive)
 * @returns {number} Zufallszahl
 */
function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Generiert eine Zufalls-Integer zwischen min und max
 * @param {number} min - Minimum (inklusive)
 * @param {number} max - Maximum (inklusive)
 * @returns {number} Zufalls-Integer
 */
function randomIntBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ========================================
// EXPORT FÜR GLOBALE VERFÜGBARKEIT
// ========================================

// Alle Utility-Funktionen global verfügbar machen
window.formatDuration = formatDuration;
window.formatDate = formatDate;
window.formatRelativeTime = formatRelativeTime;
window.formatNumber = formatNumber;
window.formatPercentage = formatPercentage;

window.capitalize = capitalize;
window.toTitleCase = toTitleCase;
window.createSlug = createSlug;
window.generateRandomId = generateRandomId;

window.fadeIn = fadeIn;
window.fadeOut = fadeOut;
window.slideInFromTop = slideInFromTop;
window.pulseElement = pulseElement;
window.shakeElement = shakeElement;

window.StorageHelper = StorageHelper;
window.ValidationHelper = ValidationHelper;
window.BrowserSupport = BrowserSupport;

window.removeDuplicates = removeDuplicates;
window.sortByKey = sortByKey;
window.groupBy = groupBy;
window.deepClone = deepClone;

window.debounce = debounce;
window.throttle = throttle;

window.generateRandomColor = generateRandomColor;
window.hexToRgb = hexToRgb;
window.getContrastColor = getContrastColor;

window.copyToClipboard = copyToClipboard;
window.downloadFile = downloadFile;

window.clamp = clamp;
window.lerp = lerp;
window.randomBetween = randomBetween;
window.randomIntBetween = randomIntBetween;

console.log('🛠️ Utils geladen - Alle Hilfsfunktionen verfügbar');
// Authentication Configuration
// To change the password, update the hash below

const AUTH_CONFIG = {
    // Current password: "hello" 
    // To generate a new hash, run this in browser console:
    // crypto.subtle.digest('SHA-256', new TextEncoder().encode('your_password')).then(hash => console.log(Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')))
    
    passwordHash: '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824', // SHA-256 of 'hello'
    
    // Session settings
    sessionKey: 'bookmark_auth_session',
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    
    // UI customization
    showPasswordHint: true, // Set to false to hide the demo password hint
    customMessage: 'Enter password to access the bookmark preview',
    
    // Common password hashes for easy switching:
    passwords: {
        'hello': '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
        'password': '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
        'admin': '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
        'secret': '2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b',
        'bookmarks': '37d15b9571f56ffbb7494a02efdebc7390f796c20ea0c477229e1711c86a90be'
    }
};

// Helper function to generate password hash
function generatePasswordHash(password) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
        .then(hash => Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join(''));
}

// Example usage in browser console:
// generatePasswordHash('mynewpassword').then(hash => console.log('Hash:', hash));
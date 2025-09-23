// Simple client-side password protection
// Note: This is NOT secure for truly sensitive data, but provides basic access control

class SimpleAuth {
    constructor() {
        console.log('SimpleAuth constructor called');
        console.log('AUTH_CONFIG exists:', typeof AUTH_CONFIG !== 'undefined');
        
        if (typeof AUTH_CONFIG === 'undefined') {
            console.error('AUTH_CONFIG not loaded!');
            document.body.innerHTML = '<h1 style="color: red;">Error: Configuration not loaded</h1>';
            return;
        }
        
        console.log('AUTH_CONFIG.passwordHash:', AUTH_CONFIG.passwordHash);
        
        this.passwordHash = AUTH_CONFIG.passwordHash;
        this.sessionKey = AUTH_CONFIG.sessionKey;
        this.sessionTimeout = AUTH_CONFIG.sessionTimeout;
        this.init();
    }

    init() {
        // Check if already authenticated in this session
        if (this.isAuthenticated()) {
            this.showApp();
        } else {
            this.showLoginForm();
        }
    }

    isAuthenticated() {
        return sessionStorage.getItem(this.sessionKey) === 'authenticated';
    }

    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    async authenticate(password) {
        console.log('Authenticating with password:', password);
        console.log('Expected hash:', this.passwordHash);
        
        const hashedInput = await this.hashPassword(password);
        console.log('Generated hash:', hashedInput);
        console.log('Hashes match:', hashedInput === this.passwordHash);
        
        if (hashedInput === this.passwordHash) {
            sessionStorage.setItem(this.sessionKey, 'authenticated');
            this.showApp();
            return true;
        }
        return false;
    }

    showLoginForm() {
        document.body.innerHTML = `
            <div style="
                display: flex; 
                justify-content: center; 
                align-items: center; 
                min-height: 100vh; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                margin: 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">
                <div style="
                    background: white; 
                    padding: 40px; 
                    border-radius: 12px; 
                    box-shadow: 0 8px 32px rgba(0,0,0,0.1);
                    text-align: center;
                    max-width: 400px;
                    width: 90%;
                ">
                    <h1 style="margin: 0 0 10px 0; color: #1e293b;">🔒 Protected Content</h1>
                    <p style="color: #6b7280; margin: 0 0 30px 0;">${AUTH_CONFIG.customMessage}</p>
                    
                    <form id="loginForm" style="margin-bottom: 20px;">
                        <input 
                            type="password" 
                            id="passwordInput" 
                            placeholder="Enter password"
                            style="
                                width: 100%; 
                                padding: 12px; 
                                border: 2px solid #e5e7eb; 
                                border-radius: 6px; 
                                font-size: 16px;
                                margin-bottom: 20px;
                                box-sizing: border-box;
                            "
                            autocomplete="current-password"
                        >
                        <button 
                            type="submit"
                            style="
                                width: 100%; 
                                background: #4f46e5; 
                                color: white; 
                                border: none; 
                                padding: 12px; 
                                border-radius: 6px; 
                                font-size: 16px; 
                                cursor: pointer;
                                transition: background 0.2s;
                            "
                            onmouseover="this.style.background='#3730a3'"
                            onmouseout="this.style.background='#4f46e5'"
                        >
                            Access Bookmarks
                        </button>
                    </form>
                    
                    <div id="errorMessage" style="
                        color: #ef4444; 
                        font-size: 14px; 
                        margin-top: 10px;
                        display: none;
                    ">
                        Incorrect password. Please try again.
                    </div>
                    
                    ${AUTH_CONFIG.showPasswordHint ? `
                    <div style="
                        margin-top: 30px; 
                        padding-top: 20px; 
                        border-top: 1px solid #e5e7eb;
                        font-size: 12px;
                        color: #9ca3af;
                    ">
                        <p style="margin: 0;">Demo password: <code style="background: #f3f4f6; padding: 2px 4px; border-radius: 3px;">hello</code></p>
                        <p style="margin: 5px 0 0 0;">⚠️ This is client-side protection only</p>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;

        // Add event listeners
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = document.getElementById('passwordInput').value;
            const errorDiv = document.getElementById('errorMessage');
            
            if (await this.authenticate(password)) {
                // Success - app will be shown by authenticate method
            } else {
                errorDiv.style.display = 'block';
                document.getElementById('passwordInput').value = '';
                document.getElementById('passwordInput').focus();
            }
        });

        // Focus on password input
        setTimeout(() => {
            document.getElementById('passwordInput').focus();
        }, 100);
    }

    showApp() {
        // Restore the original page content
        location.reload();
    }

    logout() {
        sessionStorage.removeItem(this.sessionKey);
        this.showLoginForm();
    }
}

// Initialize authentication when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, checking auth...');
    console.log('AUTH_CONFIG:', typeof AUTH_CONFIG !== 'undefined' ? 'loaded' : 'missing');
    console.log('Current session:', sessionStorage.getItem('bookmark_auth_session'));
    
    // Only show auth if not already authenticated
    if (!sessionStorage.getItem('bookmark_auth_session')) {
        console.log('Starting authentication...');
        new SimpleAuth();
    } else {
        console.log('Already authenticated, showing app...');
    }
});

// Add logout functionality to window for easy access
window.logout = () => {
    sessionStorage.removeItem('bookmark_auth_session');
    location.reload();
};
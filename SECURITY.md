# 🔒 Security Configuration

## Firebase Credentials

This application uses Firebase for data storage. The Firebase credentials are stored in a secure location and should never be committed to version control.

### Files Involved

- **`src/config/firebase.js`** - ⚠️ **SECURE** - Contains actual Firebase credentials
- **`src/config/firebase.example.js`** - ✅ **SAFE** - Template for new developers
- **`.gitignore`** - ✅ **PROTECTED** - Prevents credential files from being committed

### Setup Instructions

1. **Copy the template:**
   ```bash
   cp src/config/firebase.example.js src/config/firebase.js
   ```

2. **Fill in your Firebase credentials:**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select your project
   - Go to Project Settings → General → Your apps
   - Copy the Firebase configuration object
   - Replace the placeholder values in `src/config/firebase.js`

3. **Verify .gitignore protection:**
   ```bash
   git status
   # Should NOT show src/config/firebase.js
   ```

### Security Rules

For development, your Firestore rules should be:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // Development only
    }
  }
}
```

For production, implement proper authentication rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### ⚠️ Important Security Notes

- **NEVER** commit `src/config/firebase.js` with real credentials
- **ALWAYS** use environment variables or secure config in production
- **REGULARLY** rotate your Firebase API keys
- **MONITOR** Firebase usage for unauthorized access
- **IMPLEMENT** proper authentication for production deployments

### Environment Variables (Alternative)

For additional security, you can use environment variables:

1. Create `.env.local`:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
   VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
   VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

2. Update `src/config/firebase.js`:
   ```javascript
   export const firebaseConfig = {
     apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
     authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
     // ... other fields
   };
   ```

### Breach Response

If credentials are accidentally committed:

1. **Immediately** go to Firebase Console
2. **Revoke** the compromised API keys
3. **Generate** new API keys
4. **Update** your local configuration
5. **Remove** the committed credentials from Git history:
   ```bash
   git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch src/config/firebase.js' --prune-empty --tag-name-filter cat -- --all
   ```

### 🔐 Best Practices

- Use different Firebase projects for development and production
- Implement proper authentication and authorization
- Regularly audit Firebase security rules
- Monitor Firebase usage and costs
- Keep backup copies of credentials secure (password manager)
- Educate team members about security practices

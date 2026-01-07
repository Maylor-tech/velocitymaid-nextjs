# Generate JWT Secret

## Your Generated Secret

```
cb7bc5c5e988fca71a8e234f7491f285935470747687cef82f1909127a805822
```

## Add to Vercel

1. Go to https://vercel.com/dashboard
2. Select your project: `velocitymaid-nextjs`
3. Click **Settings** → **Environment Variables**
4. Click **Add New**
5. Enter:
   - **Key**: `JWT_SECRET`
   - **Value**: `cb7bc5c5e988fca71a8e234f7491f285935470747687cef82f1909127a805822`
6. Select all environments:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
7. Click **Save**
8. **Redeploy** your application (or wait for next push)

## Alternative Methods to Generate Secrets

### Method 1: Node.js (Recommended)
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Method 2: PowerShell
```powershell
-join ((48..57) + (97..102) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

### Method 3: Online Generator
Visit: https://generate-secret.vercel.app/32

## Important Notes

- ⚠️ **Never commit this secret to git**
- ✅ **Use different secrets for production and development**
- ✅ **Keep this secret secure and private**
- ✅ **Regenerate if accidentally exposed**

## After Adding to Vercel

Once you've added `JWT_SECRET` to Vercel:

1. Push your code:
   ```bash
   git add .
   git commit -m "feat: implement JWT authentication"
   git push origin main
   ```

2. Vercel will automatically deploy

3. Test authentication:
   - Sign up: https://www.velocitymaid.com/saas/signup
   - Login: https://www.velocitymaid.com/saas/login

---

**Secret Generated**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")  
**Length**: 64 characters (32 bytes in hex)  
**Security**: Cryptographically secure random bytes


# 🗄️ Prisma + Supabase Workflow Guide

## 📚 Understanding the Workflow

**Key Principle:** Always use **Prisma** to manage your database schema. Use Supabase SQL Editor only for **viewing data** or **one-time queries**, NOT for creating/modifying tables.

---

## ✅ Your Current Setup Status

✅ **Database is up to date!** All 16 migrations have been applied successfully.  
✅ **Prisma Client** is generated and ready to use.  
✅ **Connection** to Supabase is working.

---

## 🔄 The Correct Workflow

### **Rule #1: Schema Changes = Prisma**
- ✅ **DO:** Edit `prisma/schema.prisma` → Create migration → Apply migration
- ❌ **DON'T:** Manually create tables in Supabase SQL Editor

### **Rule #2: Data Queries = Supabase SQL Editor (Optional)**
- ✅ **OK:** View data, run SELECT queries, check records
- ❌ **DON'T:** Create tables, alter schema, add foreign keys manually

---

## 📋 Step-by-Step Process

### **Scenario 1: You Need to Add a New Table or Field**

#### Step 1: Edit Prisma Schema
```bash
# Open and edit this file:
prisma/schema.prisma
```

Add your model or field:
```prisma
model NewTable {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
}
```

#### Step 2: Create Migration
```bash
# Load DATABASE_URL and create migration
Get-Content .env.local | Where-Object { $_ -match '^DATABASE_URL=' } | ForEach-Object { $env:DATABASE_URL = ($_ -split '=', 2)[1] }; npx prisma migrate dev --name add_new_table
```

This will:
- Generate SQL migration file
- Apply it to your database
- Regenerate Prisma Client

#### Step 3: Verify
```bash
# Check migration status
Get-Content .env.local | Where-Object { $_ -match '^DATABASE_URL=' } | ForEach-Object { $env:DATABASE_URL = ($_ -split '=', 2)[1] }; npx prisma migrate status
```

---

### **Scenario 2: You Need to Reset Database (Fresh Start)**

```bash
# This will:
# 1. Drop all tables
# 2. Reapply all migrations
# 3. Regenerate Prisma Client
Get-Content .env.local | Where-Object { $_ -match '^DATABASE_URL=' } | ForEach-Object { $env:DATABASE_URL = ($_ -split '=', 2)[1] }; npx prisma migrate reset --force
```

⚠️ **Warning:** This deletes ALL data!

---

### **Scenario 3: You Need to View Your Database in Supabase**

1. Go to Supabase Dashboard → **Table Editor**
2. You'll see all your tables (User, Branch, Job, etc.)
3. You can view/edit data here
4. **Don't modify the schema here!**

---

### **Scenario 4: You Need to Check What Tables Exist**

#### Option A: Use Prisma Studio (Recommended)
```bash
Get-Content .env.local | Where-Object { $_ -match '^DATABASE_URL=' } | ForEach-Object { $env:DATABASE_URL = ($_ -split '=', 2)[1] }; npx prisma studio
```

This opens a visual database browser at `http://localhost:5555`

#### Option B: Use Supabase Table Editor
- Go to Supabase Dashboard → Table Editor
- All tables are listed on the left sidebar

#### Option C: SQL Query (Read-Only)
In Supabase SQL Editor, run:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

---

## 🚫 Common Mistakes to Avoid

### ❌ **Mistake 1: Creating Tables Manually in Supabase**
```sql
-- DON'T DO THIS:
CREATE TABLE "SomeTable" (...);
```

**Why it fails:**
- Prisma doesn't know about it
- Next time you run migrations, Prisma will try to create it again
- Foreign keys won't match Prisma's expectations

**✅ Correct way:**
- Edit `prisma/schema.prisma`
- Run `npx prisma migrate dev`

---

### ❌ **Mistake 2: Adding Foreign Keys Manually**
```sql
-- DON'T DO THIS:
ALTER TABLE "SomeTable"
ADD CONSTRAINT some_fk_name
FOREIGN KEY ("branch_id") REFERENCES "Branch" (id);
```

**Why it fails:**
- Prisma already manages relationships
- Table names might be different (Prisma uses exact casing)
- Prisma tracks migrations - manual changes break tracking

**✅ Correct way:**
- Add relation in `prisma/schema.prisma`:
```prisma
model SomeTable {
  id       String @id @default(cuid())
  branchId String
  branch   Branch @relation(fields: [branchId], references: [id])
}
```
- Run `npx prisma migrate dev`

---

### ❌ **Mistake 3: Modifying Column Types Directly**
```sql
-- DON'T DO THIS:
ALTER TABLE "User" ALTER COLUMN "email" TYPE VARCHAR(500);
```

**✅ Correct way:**
- Edit field in `prisma/schema.prisma`
- Run `npx prisma migrate dev`

---

## 🛠️ Useful Commands Reference

### Check Database Status
```powershell
Get-Content .env.local | Where-Object { $_ -match '^DATABASE_URL=' } | ForEach-Object { $env:DATABASE_URL = ($_ -split '=', 2)[1] }; npx prisma migrate status
```

### Create New Migration
```powershell
Get-Content .env.local | Where-Object { $_ -match '^DATABASE_URL=' } | ForEach-Object { $env:DATABASE_URL = ($_ -split '=', 2)[1] }; npx prisma migrate dev --name your_migration_name
```

### Reset Database (Delete all data)
```powershell
Get-Content .env.local | Where-Object { $_ -match '^DATABASE_URL=' } | ForEach-Object { $env:DATABASE_URL = ($_ -split '=', 2)[1] }; npx prisma migrate reset --force
```

### Generate Prisma Client (after schema changes)
```powershell
npx prisma generate
```

### Open Visual Database Browser
```powershell
Get-Content .env.local | Where-Object { $_ -match '^DATABASE_URL=' } | ForEach-Object { $env:DATABASE_URL = ($_ -split '=', 2)[1] }; npx prisma studio
```

### View Database Schema
```powershell
Get-Content .env.local | Where-Object { $_ -match '^DATABASE_URL=' } | ForEach-Object { $env:DATABASE_URL = ($_ -split '=', 2)[1] }; npx prisma db pull
```

---

## 📊 Your Current Database Tables

Based on your migrations, you have these tables:

- ✅ `User` - Users (admins, managers, cleaners)
- ✅ `Branch` - Business branches (NJ, VT, Jamaica, etc.)
- ✅ `Customer` - Customer records
- ✅ `Job` - Booking/job records
- ✅ `CleanerApplication` - Cleaner job applications
- ✅ `TrainingModule`, `TrainingLesson` - Training system
- ✅ `ReferralLink`, `ReferralCredit` - Referral system
- ✅ `NurtureSequence` - Customer nurture campaigns
- ✅ `Promo` - Promotional codes
- ✅ `Lead` - Lead qualification
- ✅ And many more...

**All tables are created and ready to use!**

---

## 🎯 Quick Decision Tree

**"I want to..."**

- **Add a new table/field** → Edit `prisma/schema.prisma` → `npx prisma migrate dev`
- **View my data** → Use Prisma Studio or Supabase Table Editor
- **Query data** → Use Supabase SQL Editor (SELECT only)
- **Reset everything** → `npx prisma migrate reset --force`
- **Check if migrations are applied** → `npx prisma migrate status`
- **See what tables exist** → Prisma Studio or Supabase Table Editor

---

## 🔍 Troubleshooting

### Error: "relation does not exist"
**Cause:** You're trying to reference a table that doesn't exist or has a different name.

**Solution:**
1. Check actual table names in Supabase Table Editor
2. Prisma table names match exactly (case-sensitive)
3. Use Prisma Studio to see exact names

### Error: "migration failed"
**Cause:** Database is out of sync with migrations.

**Solution:**
```powershell
# Check status first
Get-Content .env.local | Where-Object { $_ -match '^DATABASE_URL=' } | ForEach-Object { $env:DATABASE_URL = ($_ -split '=', 2)[1] }; npx prisma migrate status

# If needed, reset and reapply
Get-Content .env.local | Where-Object { $_ -match '^DATABASE_URL=' } | ForEach-Object { $env:DATABASE_URL = ($_ -split '=', 2)[1] }; npx prisma migrate reset --force
```

### Error: "DATABASE_URL not found"
**Cause:** Environment variable not loaded.

**Solution:** Always load from `.env.local` first:
```powershell
Get-Content .env.local | Where-Object { $_ -match '^DATABASE_URL=' } | ForEach-Object { $env:DATABASE_URL = ($_ -split '=', 2)[1] }
```

---

## 📝 Summary

1. **Schema changes** = Always use Prisma (`schema.prisma` + migrations)
2. **Viewing data** = Use Prisma Studio or Supabase Table Editor
3. **Querying data** = Supabase SQL Editor is OK for SELECT queries
4. **Never** manually create/modify tables in Supabase SQL Editor
5. **Always** load `DATABASE_URL` from `.env.local` before running Prisma commands

Your database is properly set up and ready to use! 🎉


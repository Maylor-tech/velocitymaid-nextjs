# 📸 Photo Upload Instructions

## Step 1: Rename Your Photos

Rename all 16 photos using these exact filenames:

1. `velocitymaid-bathroom-before-newark-nj-1.jpg`
2. `velocitymaid-bathroom-after-newark-nj-1.jpg`
3. `velocitymaid-bedroom-cityview-clean-nj.jpg`
4. `velocitymaid-livingroom-before-cluttered-nj.jpg`
5. `velocitymaid-bedroom-brick-after-nj.jpg`
6. `velocitymaid-bedroom-before-messy-nj-1.jpg`
7. `velocitymaid-bedroom-closet-organized-nj.jpg`
8. `velocitymaid-bedroom-before-messy-nj-2.jpg`
9. `velocitymaid-moveout-before-newark-nj.jpg`
10. `velocitymaid-bedroom-before-skylight-nj.jpg`
11. `velocitymaid-bedroom-staged-after-nj.jpg`
12. `velocitymaid-linen-closet-organized-nj.jpg`
13. `velocitymaid-luxury-bathroom-modern-tile-nj.jpg`
14. `velocitymaid-shower-glass-spotless-nj.jpg`
15. `velocitymaid-bathroom-pedestal-sink-nj.jpg`
16. `velocitymaid-kitchen-viking-stove-clean-nj.jpg`

## Step 2: Save Photos to Gallery Folder

**Save all renamed photos to this exact location:**

```
velocitymaid-nextjs/public/images/gallery/
```

**Full Windows Path:**
```
C:\Users\18023\OneDrive\Documents\velocitymaid-nextjs\velocitymaid-nextjs\public\images\gallery\
```

## Step 3: Verify Photos Are in Place

After uploading, you should have **26 total photos** in the gallery folder:
- 10 existing photos (already there)
- 16 new photos (you just added)

## Step 4: Test the Gallery

1. **Restart your dev server** (if running):
   ```bash
   # Press Ctrl+C to stop
   npm run dev
   ```

2. **Visit the homepage:** http://localhost:3000
   - You should see all 26 photos in the gallery section
   - Before/After badges should appear on relevant photos

3. **Visit the full gallery:** http://localhost:3000/gallery
   - All 26 photos should display
   - Category filters should work
   - Click any photo to view full-size

## Troubleshooting

### Photos Not Showing?
- ✅ Check file names match exactly (case-sensitive!)
- ✅ Check photos are in `public/images/gallery/` folder
- ✅ Check file extensions are `.jpg` (not `.JPG` or `.jpeg`)
- ✅ Clear browser cache: Press `Ctrl+Shift+R` (hard refresh)
- ✅ Restart dev server after adding photos

### Hero Image Not Showing?
- ✅ Make sure `velocitymaid-bedroom-staged-after-nj.jpg` is in the gallery folder
- ✅ Check the filename matches exactly
- ✅ Restart dev server

### Badges Not Showing?
- ✅ Badges only appear on photos marked as "Before" or "After" in the code
- ✅ This is already configured - just make sure photos are uploaded

---

**That's it!** Once you upload the 16 photos with the correct names to the gallery folder, everything will work automatically. 🎉


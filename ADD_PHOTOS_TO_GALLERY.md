# 📸 How to Add Photos to Your Gallery

## Step 1: Save Your Photos

1. **Save all your photos** to this folder:
   ```
   velocitymaid-nextjs/public/images/gallery/
   ```

2. **Name your photos** using this format:
   ```
   velocitymaid-[room-type]-[description]-[location].jpg
   ```
   
   Examples:
   - `velocitymaid-bathroom-clean-newark-nj.jpg`
   - `velocitymaid-bedroom-before-cleaning-jersey-city.jpg`
   - `velocitymaid-kitchen-after-deep-clean-nj.jpg`
   - `velocitymaid-living-room-tidy-newark-nj.jpg`
   - `velocitymaid-closet-organized-nj.jpg`

## Step 2: Add Photos to Gallery Code

1. **Open the file:** `velocitymaid-nextjs/app/gallery/page.tsx`

2. **Find the `galleryImages` array** (around line 10)

3. **Add your new photos** following this format:
   ```typescript
   {
     src: '/images/gallery/your-photo-filename.jpg',
     alt: 'Description of what the photo shows',
     category: 'Bathroom', // Choose: 'Kitchen', 'Bathroom', 'Bedroom', 'Living Room', 'Closet'
     location: 'Newark, NJ' // Your location
   },
   ```

4. **Example - Adding a new bathroom photo:**
   ```typescript
   {
     src: '/images/gallery/velocitymaid-bathroom-clean-newark-nj.jpg',
     alt: 'Clean modern bathroom after deep cleaning',
     category: 'Bathroom',
     location: 'Newark, NJ'
   },
   ```

## Step 3: Photo Categories

Use these categories for your photos:
- **Kitchen** - Kitchen cleaning photos
- **Bathroom** - Bathroom cleaning photos
- **Bedroom** - Bedroom cleaning photos
- **Living Room** - Living room cleaning photos
- **Closet** - Closet organization photos

## Step 4: Photo Requirements

### File Format
- ✅ **JPG/JPEG** (recommended)
- ✅ **PNG** (also works)
- ❌ Avoid GIF, WebP, or other formats

### File Size
- **Recommended:** Under 2MB per photo
- **Maximum:** 5MB per photo
- **Tip:** Use online tools like [TinyPNG](https://tinypng.com) to compress large photos

### Photo Dimensions
- **Recommended:** 1200x1200 pixels or larger
- **Aspect Ratio:** Square (1:1) works best, but any ratio is fine
- **Quality:** High quality, clear photos

## Step 5: Test Your Gallery

1. **Save the file** `app/gallery/page.tsx`

2. **Restart your dev server** (if running):
   ```bash
   # Press Ctrl+C to stop
   npm run dev
   ```

3. **Visit:** http://localhost:3000/gallery

4. **Check:**
   - All photos display correctly
   - Photos are clickable (opens lightbox)
   - Category filters work
   - Photos load quickly

## Quick Checklist

- [ ] Photos saved to `public/images/gallery/` folder
- [ ] Photo filenames follow naming convention
- [ ] Photos added to `galleryImages` array in `app/gallery/page.tsx`
- [ ] Each photo has: `src`, `alt`, `category`, `location`
- [ ] Dev server restarted
- [ ] Gallery page tested at `/gallery`

## Troubleshooting

### Photo Not Showing?
1. **Check file path:** Make sure the filename in code matches the actual filename exactly (case-sensitive!)
2. **Check file location:** Photo must be in `public/images/gallery/`
3. **Clear browser cache:** Press `Ctrl+Shift+R` (hard refresh)
4. **Check console:** Open browser DevTools (F12) and check for errors

### Photo Looks Blurry?
- Use higher resolution photos (at least 1200x1200 pixels)
- Make sure original photo is high quality

### Gallery Page Shows 404?
- Make sure file is saved as `app/gallery/page.tsx`
- Restart your dev server

## Example: Adding Multiple Photos

Here's how to add several photos at once:

```typescript
const galleryImages = [
  // ... existing photos ...
  
  // Your new photos:
  {
    src: '/images/gallery/velocitymaid-bathroom-clean-newark-nj.jpg',
    alt: 'Modern bathroom after deep cleaning',
    category: 'Bathroom',
    location: 'Newark, NJ'
  },
  {
    src: '/images/gallery/velocitymaid-bedroom-organized-nj.jpg',
    alt: 'Neatly organized bedroom',
    category: 'Bedroom',
    location: 'New Jersey'
  },
  {
    src: '/images/gallery/velocitymaid-kitchen-spotless-jersey-city.jpg',
    alt: 'Spotless kitchen after cleaning',
    category: 'Kitchen',
    location: 'Jersey City, NJ'
  },
];
```

---

**That's it!** Once you add your photos to the code, they'll automatically appear in the gallery with filtering and lightbox features. 🎉


# Casa Moto → Casa Moto Rebrand System

## Current Status: Casa Moto (Pre-Renovation)

This system lets you switch all branding from "Casa Moto" to "Casa Moto" in one command when renovations are complete (target: May 2026).

---

## 🔄 How It Works

1. **Now**: All files use "Casa Moto" branding
2. **May 2026** (when ready): Run ONE command to rebrand everything
3. **Script handles**: Website, ads, booking config, meta tags, everything

---

## 📋 What Gets Changed

The rebrand script will update:

### Property Name
- `Casa Moto` → `Casa Moto`
- `casa-moto` → `casa-moto`
- `casamoto` → `terraluz`

### URLs & Links
- `airbnb.com/h/casamoto` → `airbnb.com/h/terraluz` (if URL changes)
- File references and internal links

### Meta Descriptions
- Current generic copy → Casa Moto brand story (Cuban sanctuary, etc.)

### Photo References
- Current photo paths → New Casa Moto photography

---

## 🚀 When You're Ready to Rebrand (May 2026)

### Step 1: Upload New Photos
```bash
# Create folder for Casa Moto photos
mkdir -p images/casa-moto/

# Upload your new professional photos here:
# - exterior.jpg
# - pool-day.jpg
# - pool-night.jpg
# - living-room.jpg
# - kitchen.jpg
# - primary-bedroom.jpg
# - courtyard.jpg
```

### Step 2: Run the Rebrand Script
```bash
cd /Users/etuan/Desktop/Airbnb/indigopalm
bash rebrand-to-casa-moto.sh
```

That's it! Script will:
- ✅ Update all HTML files
- ✅ Update booking-config.js
- ✅ Update Google Ads copy
- ✅ Update meta tags & descriptions
- ✅ Create git commit with changes
- ✅ Generate deployment checklist

### Step 3: Verify Changes
```bash
# Preview changes before pushing
git diff

# If looks good, push to production
git push origin main
```

---

## 📝 Manual Checklist (After Script Runs)

Even after the script, you'll need to manually update these external services:

### Airbnb
- [ ] Change listing name: Casa Moto → Casa Moto
- [ ] Update listing URL (if needed)
- [ ] Upload new photos
- [ ] Update description with Casa Moto brand story
- [ ] Update amenities/features

### Google Business Profile
- [ ] Change business name: "Casa Moto" → "Casa Moto - Luxury Vacation Rental"
- [ ] Upload new Casa Moto photos (10-15)
- [ ] Update description (use copy from casa-moto-google-copy.txt)

### Google Ads
- [ ] Pause old Casa Moto campaign
- [ ] Create new Casa Moto campaign with updated headlines
- [ ] Update ad copy with new brand story

### Google Analytics
- [ ] Already named "Indigo Palm Collective" ✅ (no change needed)

### Social Media (if applicable)
- [ ] Instagram location tags
- [ ] Facebook page
- [ ] Any other platforms

---

## 🎨 Casa Moto Brand Assets (Ready to Deploy)

All Casa Moto branded content is saved in:
- `/indigopalm/casa-moto-google-copy.txt` - Google Business Profile copy
- `/indigopalm/casa-moto.html` - Property page (needs photo updates)
- `/indigopalm/REBRAND_SUMMARY.md` - Full brand guidelines

---

## ⏰ Estimated Timeline

**Now (Feb 2026):**
- Shopping for furniture (sleeper sofa, Cuban accents)
- Planning renovations
- Website says "Casa Moto"

**March-April 2026:**
- Renovations in progress
- Block calendar on Airbnb
- Professional photography scheduled

**May 2026 (Target Launch):**
- Renovations complete
- Professional photos done
- Run rebrand script
- Launch Casa Moto brand
- Run Google Ads with new branding

---

## 💡 Pro Tips

1. **Test First**: Run script on a test branch
   ```bash
   git checkout -b casa-moto-rebrand-test
   bash rebrand-to-casa-moto.sh
   # Review changes, then merge if good
   ```

2. **Backup Before Running**:
   ```bash
   git add -A
   git commit -m "Backup before Casa Moto rebrand"
   ```

3. **Coordinate Airbnb Update**: Change Airbnb listing name on the SAME day you deploy website changes for consistency

4. **Grand Reopening Campaign**: Consider running special launch promotion:
   - "Newly Renovated Casa Moto - Grand Opening Special"
   - 15% off first bookings
   - Heavy Google Ads spend for launch week

---

## 📞 Questions Before Running Script?

- Which Airbnb URL will Casa Moto use?
- Do you want to keep casa-moto.html as a redirect?
- Should old Casa Moto bookings still see Casa Moto branding?

---

**Next**: I'll create the actual `rebrand-to-casa-moto.sh` script that does all the find/replace magic.

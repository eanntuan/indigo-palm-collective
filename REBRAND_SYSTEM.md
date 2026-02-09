# Casa Moto → Terra Luz Rebrand System

## Current Status: Casa Moto (Pre-Renovation)

This system lets you switch all branding from "Casa Moto" to "Terra Luz" in one command when renovations are complete (target: May 2026).

---

## 🔄 How It Works

1. **Now**: All files use "Casa Moto" branding
2. **May 2026** (when ready): Run ONE command to rebrand everything
3. **Script handles**: Website, ads, booking config, meta tags, everything

---

## 📋 What Gets Changed

The rebrand script will update:

### Property Name
- `Casa Moto` → `Terra Luz`
- `casa-moto` → `terra-luz`
- `casamoto` → `terraluz`

### URLs & Links
- `airbnb.com/h/casamoto` → `airbnb.com/h/terraluz` (if URL changes)
- File references and internal links

### Meta Descriptions
- Current generic copy → Terra Luz brand story (Cuban sanctuary, etc.)

### Photo References
- Current photo paths → New Terra Luz photography

---

## 🚀 When You're Ready to Rebrand (May 2026)

### Step 1: Upload New Photos
```bash
# Create folder for Terra Luz photos
mkdir -p images/terra-luz/

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
bash rebrand-to-terra-luz.sh
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
- [ ] Change listing name: Casa Moto → Terra Luz
- [ ] Update listing URL (if needed)
- [ ] Upload new photos
- [ ] Update description with Terra Luz brand story
- [ ] Update amenities/features

### Google Business Profile
- [ ] Change business name: "Casa Moto" → "Terra Luz - Luxury Vacation Rental"
- [ ] Upload new Terra Luz photos (10-15)
- [ ] Update description (use copy from terra-luz-google-copy.txt)

### Google Ads
- [ ] Pause old Casa Moto campaign
- [ ] Create new Terra Luz campaign with updated headlines
- [ ] Update ad copy with new brand story

### Google Analytics
- [ ] Already named "Indigo Palm Collective" ✅ (no change needed)

### Social Media (if applicable)
- [ ] Instagram location tags
- [ ] Facebook page
- [ ] Any other platforms

---

## 🎨 Terra Luz Brand Assets (Ready to Deploy)

All Terra Luz branded content is saved in:
- `/indigopalm/terra-luz-google-copy.txt` - Google Business Profile copy
- `/indigopalm/terra-luz.html` - Property page (needs photo updates)
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
- Launch Terra Luz brand
- Run Google Ads with new branding

---

## 💡 Pro Tips

1. **Test First**: Run script on a test branch
   ```bash
   git checkout -b terra-luz-rebrand-test
   bash rebrand-to-terra-luz.sh
   # Review changes, then merge if good
   ```

2. **Backup Before Running**:
   ```bash
   git add -A
   git commit -m "Backup before Terra Luz rebrand"
   ```

3. **Coordinate Airbnb Update**: Change Airbnb listing name on the SAME day you deploy website changes for consistency

4. **Grand Reopening Campaign**: Consider running special launch promotion:
   - "Newly Renovated Terra Luz - Grand Opening Special"
   - 15% off first bookings
   - Heavy Google Ads spend for launch week

---

## 📞 Questions Before Running Script?

- Which Airbnb URL will Terra Luz use?
- Do you want to keep casa-moto.html as a redirect?
- Should old Casa Moto bookings still see Casa Moto branding?

---

**Next**: I'll create the actual `rebrand-to-terra-luz.sh` script that does all the find/replace magic.

#!/bin/bash

echo "🗜️  Starting image compression..."
echo "Target: 80% quality, 60-80% size reduction"
echo ""

count=0
total=$(find . -type f \( -name "*.jpg" -o -name "*.JPG" -o -name "*.jpeg" -o -name "*.png" \) ! -path "./_image_backups/*" | wc -l | tr -d ' ')

find . -type f \( -name "*.jpg" -o -name "*.JPG" -o -name "*.jpeg" \) ! -path "./_image_backups/*" | while read file; do
    count=$((count + 1))
    
    # Get original size
    orig_size=$(stat -f%z "$file")
    
    # Skip if already small
    if [ $orig_size -lt 150000 ]; then
        echo "[$count/$total] ⏭️  Skipping (already small): $file"
        continue
    fi
    
    # Compress using ImageMagick
    /opt/homebrew/bin/convert "$file" -quality 80 -strip "${file}.tmp"
    
    # Get new size
    new_size=$(stat -f%z "${file}.tmp")
    
    # Calculate reduction
    reduction=$(echo "scale=1; (1 - $new_size/$orig_size) * 100" | bc)
    
    # If compression worked, replace original
    if [ -f "${file}.tmp" ]; then
        mv "${file}.tmp" "$file"
        echo "[$count/$total] ✅ $(basename "$file"): $(numfmt --to=iec $orig_size) → $(numfmt --to=iec $new_size) (-${reduction}%)"
    fi
    
    # Show progress every 20 images
    if [ $((count % 20)) -eq 0 ]; then
        echo ""
        echo "Progress: $count/$total images processed..."
        echo ""
    fi
done

echo ""
echo "✨ Compression complete!"

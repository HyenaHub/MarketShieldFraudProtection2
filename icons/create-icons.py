import base64
from PIL import Image, ImageDraw, ImageFont
import io

def create_icon(size):
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw shield background
    center = size // 2
    shield_size = int(size * 0.7)
    
    # Shield path (simplified)
    points = [
        (center, int(size * 0.15)),  # top
        (center + shield_size//3, center//2),  # top right
        (center + shield_size//3, center + shield_size//4),  # right
        (center, int(size * 0.85)),  # bottom
        (center - shield_size//3, center + shield_size//4),  # left
        (center - shield_size//3, center//2),  # top left
    ]
    
    # Draw shield
    draw.polygon(points, fill=(59, 130, 246, 255))  # Blue shield
    
    # Draw checkmark
    check_points = [
        (center - 8, center),
        (center - 2, center + 6),
        (center + 8, center - 6)
    ]
    
    # Simple checkmark lines
    draw.line([(center - 8, center), (center - 2, center + 6)], fill=(16, 185, 129, 255), width=max(1, size//32))
    draw.line([(center - 2, center + 6), (center + 8, center - 6)], fill=(16, 185, 129, 255), width=max(1, size//32))
    
    return img

# Create different sized icons
sizes = [16, 32, 48, 128]
for size in sizes:
    icon = create_icon(size)
    icon.save(f'icon-{size}.png', 'PNG')
    print(f'Created icon-{size}.png')

print('All icons created successfully!')

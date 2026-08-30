import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np

SAMPLES_DIR = Path(__file__).resolve().parent.parent / "storage" / "samples"
SAMPLES_DIR.mkdir(parents=True, exist_ok=True)

def create_factory_safety_image():
    # 800x600 industrial factory floor
    img = Image.new('RGB', (800, 600), color=(45, 50, 55))
    draw = ImageDraw.Draw(img)

    # Floor with perspective yellow walkway lines
    draw.polygon([(0, 350), (800, 350), (800, 600), (0, 600)], fill=(70, 75, 80))
    # Yellow safety walkway boundary
    draw.line([(150, 350), (50, 600)], fill=(235, 180, 20), width=8)
    draw.line([(650, 350), (750, 600)], fill=(235, 180, 20), width=8)
    
    # Machinery on left side
    draw.rectangle([80, 220, 260, 420], fill=(30, 80, 140), outline=(20, 50, 90), width=4)
    draw.rectangle([120, 180, 220, 220], fill=(50, 110, 180))
    # Warning sign on machine
    draw.polygon([(170, 250), (140, 300), (200, 300)], fill=(240, 190, 20), outline=(0, 0, 0), width=2)
    
    # Conveyor on right side
    draw.rectangle([540, 280, 760, 440], fill=(90, 95, 100), outline=(50, 55, 60), width=3)
    for x in range(560, 750, 30):
        draw.line([(x, 280), (x, 440)], fill=(130, 135, 140), width=3)

    # Trip hazard / trailing cable across the aisle
    draw.line([(240, 480), (320, 510), (450, 490), (580, 530)], fill=(30, 30, 30), width=5)

    # Overhead crane girder
    draw.rectangle([0, 40, 800, 100], fill=(210, 160, 20))
    draw.line([(0, 70), (800, 70)], fill=(0, 0, 0), width=4)

    # Label text
    draw.text((320, 60), "FACILITY BAY 4 - INDUSTRIAL ASSEMBLY", fill=(0, 0, 0))
    draw.text((280, 540), "CAUTION: CABLE ACROSS WALKWAY", fill=(240, 200, 50))

    out_path = SAMPLES_DIR / "factory_safety.jpg"
    img.save(out_path, quality=95)
    print(f"Generated {out_path}")

def create_road_defect_image():
    # 800x600 roadway with asphalt and potholes
    img = Image.new('RGB', (800, 600), color=(60, 62, 65))
    draw = ImageDraw.Draw(img)

    # Asphalt noise texture
    arr = np.array(img)
    noise = np.random.randint(-15, 15, arr.shape, dtype=np.int16)
    arr = np.clip(arr + noise, 0, 255).astype(np.uint8)
    img = Image.fromarray(arr)
    draw = ImageDraw.Draw(img)

    # Faded center lane marking
    for y in range(50, 600, 80):
        draw.line([(395, y), (395, y + 45)], fill=(220, 210, 80), width=10)

    # Major Pothole on right lane (approx y: 320..460, x: 460..640)
    draw.ellipse([460, 320, 640, 460], fill=(25, 27, 29), outline=(15, 15, 18), width=4)
    draw.ellipse([490, 350, 610, 430], fill=(12, 14, 15))
    
    # Alligator cracking pattern around pothole
    draw.line([(440, 340), (460, 350), (430, 390), (460, 410)], fill=(35, 37, 40), width=3)
    draw.line([(640, 350), (680, 380), (650, 420), (690, 440)], fill=(35, 37, 40), width=3)
    draw.line([(480, 460), (510, 510), (570, 490), (620, 530)], fill=(35, 37, 40), width=3)

    # Road shoulder on right
    draw.polygon([(730, 0), (800, 0), (800, 600), (750, 600)], fill=(120, 110, 90))

    out_path = SAMPLES_DIR / "road_defect.jpg"
    img.save(out_path, quality=95)
    print(f"Generated {out_path}")

def create_indoor_room_image():
    # 800x600 residential living room (Mismatched Grounding Test Image)
    img = Image.new('RGB', (800, 600), color=(225, 220, 210)) # Warm wall
    draw = ImageDraw.Draw(img)

    # Hardwood floor
    draw.polygon([(0, 380), (800, 380), (800, 600), (0, 600)], fill=(160, 105, 60))
    for y in range(400, 600, 30):
        draw.line([(0, y), (800, y)], fill=(130, 85, 45), width=2)

    # Large comfortable sofa (Navy blue)
    draw.rectangle([180, 300, 620, 450], fill=(40, 65, 100), outline=(30, 50, 80), width=3)
    draw.rectangle([210, 250, 590, 330], fill=(50, 80, 120))
    # Cushions
    draw.rectangle([230, 320, 390, 430], fill=(60, 95, 140))
    draw.rectangle([410, 320, 570, 430], fill=(60, 95, 140))

    # Coffee table in front
    draw.rectangle([260, 460, 540, 520], fill=(210, 195, 175), outline=(150, 135, 115), width=2)
    # Book / mug on coffee table
    draw.rectangle([320, 470, 370, 500], fill=(180, 60, 50))
    draw.ellipse([430, 475, 460, 500], fill=(240, 240, 240))

    # Floor lamp on left
    draw.line([(120, 180), (120, 480)], fill=(180, 160, 120), width=6)
    draw.polygon([(80, 180), (160, 180), (140, 120), (100, 120)], fill=(245, 235, 190))

    # Wall art frame
    draw.rectangle([300, 80, 500, 200], fill=(240, 245, 240), outline=(60, 50, 40), width=6)
    draw.ellipse([340, 110, 460, 170], fill=(100, 180, 190))

    out_path = SAMPLES_DIR / "indoor_room.jpg"
    img.save(out_path, quality=95)
    print(f"Generated {out_path}")

def create_retail_store_image():
    img = Image.new('RGB', (800, 600), color=(235, 235, 240))
    draw = ImageDraw.Draw(img)
    # Shelves
    for y in [120, 240, 360, 480]:
        draw.rectangle([50, y, 750, y + 20], fill=(180, 185, 190))
        # Products
        for x in range(80, 720, 55):
            color = (int(np.sin(x)*100 + 150), int(np.cos(y)*100 + 150), 180)
            if x != 355: # Empty out-of-stock spot at 355
                draw.rectangle([x, y - 80, x + 45, y], fill=color, outline=(50, 50, 50), width=1)
    
    # Highlight out-of-stock shelf gap
    draw.rectangle([345, 280, 410, 360], outline=(230, 50, 50), width=3)
    out_path = SAMPLES_DIR / "retail_store.jpg"
    img.save(out_path, quality=95)
    print(f"Generated {out_path}")

def create_construction_site_image():
    img = Image.new('RGB', (800, 600), color=(140, 180, 220)) # Sky
    draw = ImageDraw.Draw(img)
    # Ground
    draw.rectangle([0, 400, 800, 600], fill=(150, 120, 80))
    # Concrete structural beams
    draw.rectangle([100, 150, 180, 450], fill=(170, 175, 180), outline=(100, 105, 110), width=3)
    draw.rectangle([620, 150, 700, 450], fill=(170, 175, 180), outline=(100, 105, 110), width=3)
    draw.rectangle([80, 180, 720, 240], fill=(180, 185, 190), outline=(100, 105, 110), width=3)
    # Scaffolding yellow tubes
    for x in [250, 350, 450, 550]:
        draw.line([(x, 150), (x, 480)], fill=(230, 190, 30), width=5)
    for y in [240, 320, 400]:
        draw.line([(240, y), (560, y)], fill=(230, 190, 30), width=5)
    out_path = SAMPLES_DIR / "construction_site.jpg"
    img.save(out_path, quality=95)
    print(f"Generated {out_path}")

def create_agriculture_field_image():
    img = Image.new('RGB', (800, 600), color=(130, 190, 240)) # Sky
    draw = ImageDraw.Draw(img)
    # Crop field with green rows
    draw.polygon([(0, 250), (800, 250), (800, 600), (0, 600)], fill=(60, 130, 45))
    # Crop furrow perspective lines
    for x in range(50, 800, 60):
        draw.line([(400, 250), (x, 600)], fill=(35, 90, 25), width=8)
    # Discolored / chlorosis crop patch
    draw.ellipse([260, 380, 390, 470], fill=(185, 175, 40))
    out_path = SAMPLES_DIR / "agriculture_field.jpg"
    img.save(out_path, quality=95)
    print(f"Generated {out_path}")

def create_manufacturing_image():
    img = Image.new('RGB', (800, 600), color=(30, 35, 40))
    draw = ImageDraw.Draw(img)
    # PCB Green Board
    draw.rectangle([150, 100, 650, 500], fill=(20, 95, 45), outline=(10, 60, 30), width=5)
    # Microchip / CPU
    draw.rectangle([330, 230, 470, 370], fill=(20, 20, 25), outline=(180, 180, 190), width=3)
    # Copper traces
    for y in range(140, 480, 40):
        draw.line([(180, y), (320, y)], fill=(210, 150, 40), width=3)
        draw.line([(480, y), (620, y)], fill=(210, 150, 40), width=3)
    # Solder bridge defect
    draw.ellipse([300, 210, 330, 240], fill=(200, 200, 215), outline=(240, 50, 50), width=2)
    out_path = SAMPLES_DIR / "manufacturing_assembly.jpg"
    img.save(out_path, quality=95)
    print(f"Generated {out_path}")

def create_document_image():
    img = Image.new('RGB', (800, 600), color=(200, 205, 210)) # Table background
    draw = ImageDraw.Draw(img)
    # White Invoice Sheet
    draw.rectangle([160, 40, 640, 560], fill=(255, 255, 255), outline=(180, 180, 180), width=2)
    draw.text((200, 70), "INVOICE #INV-2026-089", fill=(20, 20, 20))
    draw.text((200, 100), "Date: August 29, 2026", fill=(80, 80, 80))
    draw.line([(200, 130), (600, 130)], fill=(200, 200, 200), width=2)
    
    # Table header
    draw.rectangle([200, 150, 600, 180], fill=(240, 242, 245))
    draw.text((210, 158), "Description", fill=(40, 40, 40))
    draw.text((420, 158), "Qty", fill=(40, 40, 40))
    draw.text((510, 158), "Total", fill=(40, 40, 40))

    # Items
    items = [
        ("Industrial Optical Sensor 4K", "4", "$1,200.00"),
        ("Thermal Calibration Rig", "1", "$3,450.00"),
        ("Embedded Edge Compute Unit", "2", "$2,100.00")
    ]
    for idx, (desc, qty, total) in enumerate(items):
        y = 200 + idx * 40
        draw.text((210, y), desc, fill=(50, 50, 50))
        draw.text((430, y), qty, fill=(50, 50, 50))
        draw.text((510, y), total, fill=(50, 50, 50))
        draw.line([(200, y + 25), (600, y + 25)], fill=(240, 240, 240), width=1)

    # Total & Signature
    draw.text((450, 380), "TOTAL: $6,750.00", fill=(10, 10, 10))
    draw.text((200, 460), "Authorized Signature: __________________", fill=(100, 100, 100))

    out_path = SAMPLES_DIR / "document_invoice.jpg"
    img.save(out_path, quality=95)
    print(f"Generated {out_path}")

if __name__ == "__main__":
    create_factory_safety_image()
    create_road_defect_image()
    create_indoor_room_image()
    create_retail_store_image()
    create_construction_site_image()
    create_agriculture_field_image()
    create_manufacturing_image()
    create_document_image()
    print("All sample images generated successfully!")

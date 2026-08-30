import subprocess
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np

SAMPLES_DIR = Path(__file__).resolve().parent.parent / "storage" / "samples"
SAMPLES_DIR.mkdir(parents=True, exist_ok=True)

def generate_demo_video():
    """Generates an 8-second MP4 test video with changing conditions across keyframes."""
    temp_dir = SAMPLES_DIR / "_temp_frames"
    temp_dir.mkdir(exist_ok=True)

    total_frames = 24 * 8 # 8 seconds at 24 fps
    for f_idx in range(total_frames):
        sec = f_idx / 24.0
        # Color shifting factory simulation
        img = Image.new('RGB', (640, 480), color=(40, 45, 50))
        draw = ImageDraw.Draw(img)

        # Floor
        draw.rectangle([0, 300, 640, 480], fill=(70, 75, 80))
        # Moving hazard/box
        box_x = int(50 + (sec * 50) % 500)
        draw.rectangle([box_x, 320, box_x + 80, 400], fill=(220, 150, 30), outline=(255, 200, 50), width=3)
        draw.text((box_x + 10, 350), "CARGO", fill=(0, 0, 0))

        # Stationary machinery
        draw.rectangle([60, 160, 220, 300], fill=(30, 70, 120))
        draw.text((20, 30), f"FACTORY CAM 01 | TIME: {sec:.1f}s", fill=(255, 255, 255))
        
        # In second half, simulate spilled liquid on floor
        if sec > 4.0:
            draw.ellipse([340, 360, 480, 420], fill=(30, 120, 150), outline=(50, 180, 220), width=2)
            draw.text((360, 380), "OIL SLICK HAZARD", fill=(255, 255, 255))

        img.save(temp_dir / f"frame_{f_idx:04d}.png")

    output_video = SAMPLES_DIR / "factory_demo.mp4"
    cmd = [
        "ffmpeg", "-y", "-framerate", "24",
        "-i", str(temp_dir / "frame_%04d.png"),
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        str(output_video)
    ]
    print(f"Compiling demo video to {output_video}...")
    subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)

    # Clean up temp frames
    for p in temp_dir.glob("*.png"):
        p.unlink()
    temp_dir.rmdir()
    print("Demo video generated successfully!")

if __name__ == "__main__":
    generate_demo_video()

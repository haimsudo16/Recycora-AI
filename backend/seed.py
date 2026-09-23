"""
Seed script - populates the database with realistic, clearly-labeled demo
data so the product can be explored immediately after setup.

Run with:  python seed.py
"""
import random
from datetime import datetime, timedelta
from pathlib import Path

from PIL import Image, ImageDraw

from app import db
from app.security import hash_password
from app.services.recommendation_service import ensure_achievements_seeded, evaluate_all_achievements, generate_recommendations
from app.services.scoring_service import calculate_sustainability_score

random.seed(42)

CATEGORY_COLORS = {
    "plastic": (56, 189, 148),
    "paper": (194, 158, 96),
    "glass": (120, 200, 210),
    "metal": (170, 175, 180),
    "organic": (101, 130, 60),
    "ewaste": (60, 65, 90),
}


def _make_placeholder_image(path: Path, category: str, label: str):
    color = CATEGORY_COLORS.get(category, (90, 110, 100))
    img = Image.new("RGB", (320, 320), color=color)
    draw = ImageDraw.Draw(img)
    draw.rectangle([20, 20, 300, 300], outline=(20, 24, 22), width=6)
    draw.text((30, 150), label[:24], fill=(15, 18, 16))
    img.save(path, format="JPEG", quality=85)


def seed():
    db.init_db()

    upload_dir = Path("uploads/waste_scans")
    upload_dir.mkdir(parents=True, exist_ok=True)

    if db.get_user_by_email("amara.demo@demo.recycora.ai"):
        print("Seed data already present — skipping.")
        return

    ensure_achievements_seeded()

    # ---- Users ----
    admin = db.create_user("Imran Qureshi", "admin@demo.recycora.ai", hash_password("Admin123!"), role="admin")
    personal = db.create_user("Amara Bennett", "amara.demo@demo.recycora.ai", hash_password("Demo1234!"), role="user")
    business = db.create_user(
        "Daniel Osei", "business.demo@demo.recycora.ai", hash_password("Demo1234!"),
        role="business", organization_name="Northfield Logistics Park",
    )

    # ---- Waste records: personal user, last 45 days ----
    categories_weights = {
        "plastic": 0.32, "paper": 0.24, "glass": 0.14, "metal": 0.10,
        "organic": 0.15, "ewaste": 0.05,
    }
    now = datetime.utcnow()
    for day_offset in range(45, -1, -1):
        date = now - timedelta(days=day_offset)
        if random.random() < 0.72:
            n_entries = random.randint(1, 3)
            for _ in range(n_entries):
                category = random.choices(list(categories_weights), weights=list(categories_weights.values()))[0]
                base_qty = {"plastic": 0.6, "paper": 0.9, "glass": 1.1, "metal": 0.4, "organic": 0.8, "ewaste": 0.3}[category]
                trend_mult = 1.0
                if category == "organic" and day_offset < 15:
                    trend_mult = 1.6
                if category == "plastic" and day_offset < 15:
                    trend_mult = 0.7
                qty = round(max(0.05, random.gauss(base_qty, base_qty * 0.35)) * trend_mult, 2)
                recycled_prob = {"plastic": 0.75, "paper": 0.8, "glass": 0.85, "metal": 0.7, "organic": 0.4, "ewaste": 0.9}[category]
                recycled = random.random() < recycled_prob
                db.create_record(personal["id"], category, qty, "kg", recycled, "manual", None, date.isoformat())

    # ---- Waste records: business user, last 6 months, higher volume ----
    departments = ["Warehouse A", "Warehouse B", "Office HQ", "Loading Dock"]
    for month_offset in range(5, -1, -1):
        month_date = (now.replace(day=1) - timedelta(days=30 * month_offset))
        for _ in range(random.randint(18, 30)):
            day = month_date.replace(day=random.randint(1, 27))
            category = random.choices(list(categories_weights), weights=list(categories_weights.values()))[0]
            qty = round(random.uniform(4, 60), 1)
            recycled = random.random() < {"plastic": 0.65, "paper": 0.7, "glass": 0.8, "metal": 0.75, "organic": 0.3, "ewaste": 0.85}[category]
            db.create_record(business["id"], category, qty, "kg", recycled, "operations", random.choice(departments), day.isoformat())

    # ---- Waste scans for personal user ----
    scan_defs = [
        ("plastic", "Plastic Bottle", "PET Plastic", "recyclable", 96.4),
        ("paper", "Cardboard Box", "Corrugated Cardboard", "recyclable", 91.2),
        ("glass", "Glass Jar", "Soda-lime Glass", "recyclable", 88.7),
        ("metal", "Aluminum Can", "Aluminum", "recyclable", 94.1),
        ("ewaste", "Battery", "Lithium Battery Components", "hazardous", 82.3),
        ("organic", "Food Scraps", "Biodegradable Organic Matter", "conditional", 79.5),
    ]
    for i, (cat, obj, material, recyc, conf) in enumerate(scan_defs):
        img_name = f"seed_{cat}_{i}.jpg"
        img_path = upload_dir / img_name
        _make_placeholder_image(img_path, cat, obj)
        created = (now - timedelta(days=len(scan_defs) - i, hours=random.randint(0, 12))).isoformat()
        db.create_scan(
            personal["id"], str(img_path), obj, cat, material, conf, recyc,
            "Recommended action generated by RECYcORA AI's classification engine.",
            "Estimated environmental insight based on material category.",
            "heuristic-cv-v1", created,
        )
    db.add_eco_points(personal["id"], 1240)

    # ---- Recycling centers (demo Pakistan coordinates) ----
    centers = [
        ("Greenline Materials Recovery", 31.5204, 74.3587, "12-B Ferozepur Road", "Lahore", "plastic,paper,metal", "+92-42-111-222-333", "Mon-Sat 9am-6pm"),
        ("EcoCycle Glass & Metal Depot", 31.4697, 74.2728, "45 Multan Road", "Lahore", "glass,metal", "+92-42-111-444-555", "Mon-Fri 8am-5pm"),
        ("CircuitBack E-Waste Center", 31.5497, 74.3436, "9 Gulberg III", "Lahore", "ewaste,metal", "+92-42-111-666-777", "Tue-Sun 10am-7pm"),
        ("Northfield Paper Mill Collection", 31.4180, 74.2170, "Township Industrial Area", "Lahore", "paper", "+92-42-111-888-999", "Mon-Sat 9am-4pm"),
        ("Urban Sort Community Hub", 31.5820, 74.3294, "DHA Phase 6", "Lahore", "plastic,glass,organic", "+92-42-111-000-111", "Daily 8am-8pm"),
        ("MetroWaste Recycling Yard", 24.8607, 67.0011, "SITE Industrial Area", "Karachi", "plastic,metal,ewaste", "+92-21-111-222-444", "Mon-Sat 9am-6pm"),
        ("Harborline Glass Works", 24.8138, 67.0300, "Clifton Block 5", "Karachi", "glass,metal", "+92-21-111-333-555", "Mon-Fri 9am-5pm"),
        ("Capital Green Depot", 33.6844, 73.0479, "I-9 Industrial Area", "Islamabad", "plastic,paper,glass,metal,ewaste,organic", "+92-51-111-666-888", "Daily 9am-7pm"),
    ]
    for name, lat, lng, addr, city, materials, contact, hours in centers:
        db.create_center(name, lat, lng, addr, city, materials, contact, hours, round(random.uniform(4.1, 4.9), 1))

    # ---- Business scans ----
    for i in range(3):
        cat, obj, material, recyc, conf = scan_defs[i]
        img_name = f"seed_biz_{cat}_{i}.jpg"
        img_path = upload_dir / img_name
        _make_placeholder_image(img_path, cat, obj)
        created = (now - timedelta(days=i * 3)).isoformat()
        db.create_scan(
            business["id"], str(img_path), obj, cat, material, conf, recyc,
            "Recommended action generated by RECYcORA AI's classification engine.",
            "Estimated environmental insight based on material category.",
            "heuristic-cv-v1", created,
        )

    # ---- Compute initial scores / recommendations / achievements ----
    for user_id in (personal["id"], business["id"]):
        calculate_sustainability_score(user_id)
        user = db.get_user_by_id(user_id)
        evaluate_all_achievements(user)
        generate_recommendations(user)

    print("Seed data created successfully:")
    print("  Admin    -> admin@demo.recycora.ai / Admin123!")
    print("  Personal -> amara.demo@demo.recycora.ai / Demo1234!")
    print("  Business -> business.demo@demo.recycora.ai / Demo1234!")


if __name__ == "__main__":
    seed()

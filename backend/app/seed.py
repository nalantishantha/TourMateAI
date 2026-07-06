"""`flask seed-db` CLI command — inserts sample Sri Lankan attractions.

Gives the frontend/recommender real data to work against immediately. Idempotent:
skips if the Attractions table is already populated.

    flask --app run.py seed-db
"""

import click
from flask.cli import with_appcontext

from .extensions import db
from .models import Attraction

# 15 real Sri Lankan attractions (coords are approximate decimal degrees).
SAMPLE_ATTRACTIONS = [
    {
        "name": "Sigiriya Rock Fortress",
        "category": "Heritage",
        "latitude": 7.9570,
        "longitude": 80.7603,
        "description": "5th-century rock fortress and palace ruins with frescoes and water gardens, a UNESCO World Heritage Site.",
    },
    {
        "name": "Temple of the Sacred Tooth Relic",
        "category": "Religious",
        "latitude": 7.2936,
        "longitude": 80.6413,
        "description": "Kandy's revered Buddhist temple housing a relic of the tooth of the Buddha.",
    },
    {
        "name": "Galle Fort",
        "category": "Historical",
        "latitude": 6.0257,
        "longitude": 80.2170,
        "description": "A fortified old town built by the Portuguese and Dutch, ringed by ramparts on the southern coast.",
    },
    {
        "name": "Nine Arch Bridge, Ella",
        "category": "Scenic",
        "latitude": 6.8767,
        "longitude": 81.0603,
        "description": "An iconic colonial-era railway viaduct set amid tea plantations and jungle.",
    },
    {
        "name": "Yala National Park",
        "category": "Wildlife",
        "latitude": 6.3735,
        "longitude": 81.5165,
        "description": "Sri Lanka's most visited national park, famous for its high density of leopards and elephants.",
    },
    {
        "name": "Adam's Peak (Sri Pada)",
        "category": "Hiking",
        "latitude": 6.8096,
        "longitude": 80.4994,
        "description": "A sacred conical mountain with a pilgrimage trail to the footprint shrine at its summit.",
    },
    {
        "name": "Dambulla Cave Temple",
        "category": "Heritage",
        "latitude": 7.8567,
        "longitude": 80.6490,
        "description": "A vast cave monastery of five sanctuaries filled with Buddha statues and murals.",
    },
    {
        "name": "Nuwara Eliya",
        "category": "Hill Country",
        "latitude": 6.9497,
        "longitude": 80.7891,
        "description": "A cool highland town nicknamed 'Little England', surrounded by tea estates and waterfalls.",
    },
    {
        "name": "Mirissa Beach",
        "category": "Beach",
        "latitude": 5.9483,
        "longitude": 80.4589,
        "description": "A palm-fringed southern beach known for surfing and blue-whale watching.",
    },
    {
        "name": "Anuradhapura",
        "category": "Heritage",
        "latitude": 8.3114,
        "longitude": 80.4037,
        "description": "An ancient sacred city with dagobas, monasteries and the Sri Maha Bodhi tree.",
    },
    {
        "name": "Polonnaruwa",
        "category": "Heritage",
        "latitude": 7.9403,
        "longitude": 81.0188,
        "description": "A medieval capital of well-preserved ruins, statues and the Gal Vihara rock carvings.",
    },
    {
        "name": "Horton Plains National Park",
        "category": "Nature",
        "latitude": 6.8022,
        "longitude": 80.8060,
        "description": "A misty highland plateau with cloud forest, grasslands and the World's End escarpment.",
    },
    {
        "name": "Trincomalee",
        "category": "Beach",
        "latitude": 8.5874,
        "longitude": 81.2152,
        "description": "An east-coast port city with natural harbours, Nilaveli beach and Koneswaram temple.",
    },
    {
        "name": "Unawatuna Beach",
        "category": "Beach",
        "latitude": 6.0097,
        "longitude": 80.2497,
        "description": "A sheltered crescent bay near Galle, popular for swimming and snorkelling.",
    },
    {
        "name": "Pinnawala Elephant Orphanage",
        "category": "Wildlife",
        "latitude": 7.3006,
        "longitude": 80.3849,
        "description": "A sanctuary caring for orphaned and injured elephants, known for its river bathing.",
    },
]


@click.command("seed-db")
@with_appcontext
def seed_db_command():
    """Insert sample Sri Lankan attractions (idempotent)."""
    existing = Attraction.query.count()
    if existing:
        click.echo(f"Attractions already present ({existing} rows); skipping seed.")
        return

    db.session.add_all(Attraction(**data) for data in SAMPLE_ATTRACTIONS)
    db.session.commit()
    click.echo(f"Seeded {len(SAMPLE_ATTRACTIONS)} attractions.")


def register_cli(app):
    """Register database CLI commands on the Flask app."""
    app.cli.add_command(seed_db_command)

"""`flask seed-db` CLI command — inserts sample Sri Lankan attractions.

Gives the frontend/recommender real data to work against immediately. Idempotent:
skips if the Attractions table is already populated.

    flask --app run.py seed-db
"""

import click
from flask.cli import with_appcontext

from .extensions import db
from .models import Attraction, User

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
    {
        "name": "Hikkaduwa Beach",
        "category": "Beach",
        "latitude": 6.1395,
        "longitude": 80.1063,
        "description": "A south-coast beach town famed for its coral reef, sea turtles and surf breaks.",
    },
    {
        "name": "Blue Beach Island, Nilwella",
        "category": "Beach",
        "latitude": 5.9700,
        "longitude": 80.6900,
        "description": "A quiet lagoon-side stretch near Nilwella with a small island just offshore, popular for swimming and snorkelling.",
    },
    {
        "name": "Knuckles Mountain Range",
        "category": "Hiking",
        "latitude": 7.4667,
        "longitude": 80.7833,
        "description": "A UNESCO-listed massif of cloud forest and jagged peaks named for its knuckle-like ridgeline, laced with trekking trails.",
    },
    {
        "name": "Ella Rock",
        "category": "Hiking",
        "latitude": 6.8613,
        "longitude": 81.0464,
        "description": "A hill-country summit above Ella reached by a scenic trail through tea estates, with panoramic valley views at the top.",
    },
    {
        "name": "Haritha Kanda (Green Mountain), Bopaththalawa",
        "category": "Hiking",
        "latitude": 7.0333,
        "longitude": 80.6667,
        "description": "A lush highland peak near Bopaththalawa in tea country, known for a steep climb and sweeping views over the plantations.",
    },
    {
        "name": "Wilpaththu National Park",
        "category": "Wildlife",
        "latitude": 8.4630,
        "longitude": 80.0308,
        "description": "Sri Lanka's largest national park, a wilderness of dense scrub and 'willus' (natural lakes) known for leopards and sloth bears.",
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


@click.command("set-admin")
@click.argument("email")
@click.option("--revoke", is_flag=True, help="Remove admin instead of granting it.")
@with_appcontext
def set_admin_command(email, revoke):
    """Grant (or with --revoke, remove) admin rights for the user with EMAIL.

        flask --app run.py set-admin you@example.com
    """
    user = User.query.filter_by(email=email).first()
    if user is None:
        raise click.ClickException(
            f"No user with email {email!r} — they must sign in once first."
        )
    user.is_admin = not revoke
    db.session.commit()
    click.echo(
        f"{user.email} is {'no longer' if revoke else 'now'} an admin."
    )


def register_cli(app):
    """Register database CLI commands on the Flask app."""
    app.cli.add_command(seed_db_command)
    app.cli.add_command(set_admin_command)

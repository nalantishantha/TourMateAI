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
    {
        "name": "Jungle Beach, Unawatuna",
        "category": "Beach",
        "latitude": 6.0175,
        "longitude": 80.2378,
        "description": "A secluded and picturesque crescent-shaped beach near Galle, surrounded by dense jungle.",
    },
    {
        "name": "Japanese Peace Pagoda",
        "category": "Religious",
        "latitude": 6.0163,
        "longitude": 80.2395,
        "description": "A stunning white Buddhist stupa on the Rumassala hill offering panoramic views of the ocean and Galle Fort.",
    },
    {
        "name": "Polhena Beach",
        "category": "Beach",
        "latitude": 5.9328,
        "longitude": 80.5239,
        "description": "A calm, reef-protected beach in Matara popular for swimming and spotting giant sea turtles in shallow waters.",
    },
    {
        "name": "Dondra Head Lighthouse",
        "category": "Historical",
        "latitude": 5.9221,
        "longitude": 80.5901,
        "description": "The tallest lighthouse in Sri Lanka, located at the southernmost tip of the island.",
    },
    {
        "name": "Parrot Rock Bridge",
        "category": "Scenic",
        "latitude": 5.9452,
        "longitude": 80.4578,
        "description": "A small rocky outcrop in Mirissa beach accessible by a narrow sandbar, offering great sunset views.",
    },
    {
        "name": "Little Adam's Peak",
        "category": "Hiking",
        "latitude": 6.8711,
        "longitude": 81.0583,
        "description": "A relatively easy hike in Ella leading to spectacular panoramic views of the surrounding valleys and mountains.",
    },
    {
        "name": "Ravana Falls",
        "category": "Nature",
        "latitude": 6.8407,
        "longitude": 81.0549,
        "description": "A popular, multi-tiered waterfall cascading down a rocky hillside just outside of Ella.",
    },
    {
        "name": "Lipton's Seat",
        "category": "Scenic",
        "latitude": 6.7828,
        "longitude": 81.0229,
        "description": "A breathtaking viewpoint in Haputale amidst lush tea estates, where Sir Thomas Lipton used to survey his empire.",
    },
    {
        "name": "Diyaluma Falls",
        "category": "Nature",
        "latitude": 6.7327,
        "longitude": 81.0305,
        "description": "Sri Lanka's second-highest waterfall, featuring natural rock pools at the top perfect for a refreshing dip.",
    },
    {
        "name": "Royal Botanical Gardens, Peradeniya",
        "category": "Nature",
        "latitude": 7.2713,
        "longitude": 80.5960,
        "description": "Vast, immaculately landscaped gardens near Kandy known for its massive orchid collection and towering palms.",
    },
    {
        "name": "Bahirawakanda Vihara Buddha Statue",
        "category": "Religious",
        "latitude": 7.2941,
        "longitude": 80.6277,
        "description": "A giant white Buddha statue overlooking Kandy, offering sweeping views of the city and lake.",
    },
    {
        "name": "Udawatta Kele Sanctuary",
        "category": "Nature",
        "latitude": 7.3005,
        "longitude": 80.6418,
        "description": "A historic forest reserve located on a hill ridge in Kandy city, famous for its extensive avifauna and monkeys.",
    },
    {
        "name": "Gregory Lake",
        "category": "Scenic",
        "latitude": 6.9535,
        "longitude": 80.7818,
        "description": "A picturesque man-made lake in the heart of Nuwara Eliya, offering boat rides and relaxing walking paths.",
    },
    {
        "name": "Hakgala Botanical Garden",
        "category": "Nature",
        "latitude": 6.9261,
        "longitude": 80.8202,
        "description": "The second largest botanical garden in Sri Lanka, nestled in the cool hills and known for its roses and ferns.",
    },
    {
        "name": "Lover's Leap Waterfall",
        "category": "Nature",
        "latitude": 6.9739,
        "longitude": 80.7842,
        "description": "A beautiful cascading waterfall in Nuwara Eliya tied to a tragic local legend, accessible via a tea plantation trek.",
    },
    {
        "name": "Sri Maha Bodhi",
        "category": "Religious",
        "latitude": 8.3448,
        "longitude": 80.3970,
        "description": "A sacred fig tree in Anuradhapura, grown from a cutting of the original tree under which the Buddha attained enlightenment.",
    },
    {
        "name": "Ruwanwelisaya",
        "category": "Religious",
        "latitude": 8.3503,
        "longitude": 80.3965,
        "description": "A majestic and massive white stupa in Anuradhapura, considered one of the world's tallest ancient monuments.",
    },
    {
        "name": "Mihintale",
        "category": "Religious",
        "latitude": 8.3512,
        "longitude": 80.5173,
        "description": "A mountain peak near Anuradhapura believed to be the site of a meeting that inaugurated the presence of Buddhism in Sri Lanka.",
    },
    {
        "name": "Nallur Kandaswamy Temple",
        "category": "Religious",
        "latitude": 9.6738,
        "longitude": 80.0300,
        "description": "A deeply revered Hindu temple in Jaffna known for its towering golden gopuram and vibrant annual festivals.",
    },
    {
        "name": "Jaffna Fort",
        "category": "Historical",
        "latitude": 9.6615,
        "longitude": 80.0097,
        "description": "A star-shaped fort built by the Portuguese and expanded by the Dutch, overlooking the Jaffna lagoon.",
    },
    {
        "name": "Casuarina Beach",
        "category": "Beach",
        "latitude": 9.7744,
        "longitude": 79.8824,
        "description": "A stunning, pristine beach in Karainagar, Jaffna with crystal clear shallow waters and white sand.",
    },
    {
        "name": "Jaffna Public Library",
        "category": "Historical",
        "latitude": 9.6625,
        "longitude": 80.0133,
        "description": "An iconic architectural landmark of Jaffna, rebuilt after being destroyed, serving as a cultural symbol of the Tamil people.",
    },
    {
        "name": "Arugam Bay",
        "category": "Beach",
        "latitude": 5.8451,
        "longitude": 81.8267,
        "description": "A world-renowned surf spot on the east coast, known for its laid-back vibe and point breaks.",
    },
    {
        "name": "Pasikudah Beach",
        "category": "Beach",
        "latitude": 7.9254,
        "longitude": 81.5621,
        "description": "Famous for its incredibly shallow and calm turquoise waters, allowing you to wade out for hundreds of meters.",
    },
    {
        "name": "Pigeon Island National Park",
        "category": "Nature",
        "latitude": 8.7214,
        "longitude": 81.2014,
        "description": "A marine national park off the coast of Nilaveli, offering some of the best snorkeling with reef sharks and turtles.",
    },
    {
        "name": "Koneswaram Temple",
        "category": "Religious",
        "latitude": 8.5807,
        "longitude": 81.2336,
        "description": "A classical medieval Hindu temple complex in Trincomalee, perched on a scenic cliff dropping into the sea.",
    },
    {
        "name": "Udawalawe National Park",
        "category": "Wildlife",
        "latitude": 6.4717,
        "longitude": 80.8973,
        "description": "One of the best places in the world to guarantee seeing wild elephants in their natural habitat.",
    },
    {
        "name": "Sinharaja Forest Reserve",
        "category": "Nature",
        "latitude": 6.3980,
        "longitude": 80.4571,
        "description": "A UNESCO World Heritage site and the country's last viable area of primary tropical rainforest.",
    },
    {
        "name": "Bambarakanda Falls",
        "category": "Nature",
        "latitude": 6.7725,
        "longitude": 80.8306,
        "description": "The tallest waterfall in Sri Lanka, cascading down a sheer pine-clad cliff face in the central highlands.",
    },
    {
        "name": "St. Clair's Falls",
        "category": "Nature",
        "latitude": 6.9400,
        "longitude": 80.6406,
        "description": "Widely known as the 'Little Niagara of Sri Lanka', this is one of the widest and most majestic waterfalls in the country.",
    },
    {
        "name": "Devon Falls",
        "category": "Nature",
        "latitude": 6.9467,
        "longitude": 80.6273,
        "description": "A striking, slender waterfall plunging down a steep gorge, easily visible from the main Hatton-Nuwara Eliya road.",
    },
    {
        "name": "Kitulgala",
        "category": "Adventure",
        "latitude": 6.9939,
        "longitude": 80.4136,
        "description": "A wet-zone town famous as the filming location for 'The Bridge on the River Kwai' and Sri Lanka's premier white-water rafting hub.",
    },
    {
        "name": "Galle Face Green",
        "category": "Scenic",
        "latitude": 6.9248,
        "longitude": 79.8447,
        "description": "A historic five-hectare ocean-side urban park in Colombo, perfect for evening strolls and street food.",
    },
    {
        "name": "Gangaramaya Temple",
        "category": "Religious",
        "latitude": 6.9158,
        "longitude": 79.8569,
        "description": "One of the most important temples in Colombo, featuring a mix of modern architecture and cultural essence with a massive museum.",
    },
    {
        "name": "Viharamahadevi Park",
        "category": "Nature",
        "latitude": 6.9129,
        "longitude": 79.8601,
        "description": "The oldest and largest park in Colombo, featuring giant trees, a large Buddha statue, and water fountains.",
    },
    {
        "name": "Lotus Tower",
        "category": "Scenic",
        "latitude": 6.9271,
        "longitude": 79.8585,
        "description": "The tallest self-supported structure in South Asia, offering an observation deck with sweeping views over Colombo.",
    },
    {
        "name": "Kelaniya Raja Maha Vihara",
        "category": "Religious",
        "latitude": 6.9482,
        "longitude": 79.9197,
        "description": "A revered Buddhist temple situated near Colombo, believed to have been visited by Buddha himself.",
    },
    {
        "name": "Mount Lavinia Beach",
        "category": "Beach",
        "latitude": 6.8329,
        "longitude": 79.8617,
        "description": "A popular city beach just south of Colombo, famous for its golden sands and the historic Mount Lavinia Hotel.",
    },
    {
        "name": "Negombo Beach",
        "category": "Beach",
        "latitude": 7.2274,
        "longitude": 79.8378,
        "description": "A lively coastal town close to the airport, known for its long sandy beaches, fishing industry, and seafood restaurants.",
    },
    {
        "name": "Muthurajawela Marsh",
        "category": "Nature",
        "latitude": 7.0784,
        "longitude": 79.8631,
        "description": "A vast coastal wetland ecosystem near Negombo, ideal for boat safaris to spot diverse birdlife and crocodiles.",
    },
    {
        "name": "Kalpitiya Peninsula",
        "category": "Nature",
        "latitude": 8.2312,
        "longitude": 79.7561,
        "description": "A scenic sandy peninsula famous for massive pods of spinner dolphins and world-class kitesurfing lagoons.",
    },
    {
        "name": "Minneriya National Park",
        "category": "Wildlife",
        "latitude": 8.0163,
        "longitude": 80.8879,
        "description": "Famed for 'The Gathering', the largest seasonally recurring concentration of wild elephants in the world.",
    },
    {
        "name": "Kaudulla National Park",
        "category": "Wildlife",
        "latitude": 8.1633,
        "longitude": 80.9194,
        "description": "A massive wildlife corridor neighboring Minneriya, offering fantastic elephant safaris around an ancient reservoir.",
    },
    {
        "name": "Pidurangala Rock",
        "category": "Hiking",
        "latitude": 7.9657,
        "longitude": 80.7630,
        "description": "A massive rock formation adjacent to Sigiriya, offering an adventurous climb and the absolute best viewpoint of the Sigiriya rock fortress.",
    },
    {
        "name": "Yapahuwa Rock Fortress",
        "category": "Heritage",
        "latitude": 7.8227,
        "longitude": 80.2974,
        "description": "An ancient rock fortress and short-lived capital, known for its magnificent steep ornamental staircase guarded by stone lions.",
    },
    {
        "name": "Bentota Beach",
        "category": "Beach",
        "latitude": 6.4277,
        "longitude": 79.9965,
        "description": "A prime beach resort destination offering wide golden sands and an estuary perfect for jet skiing and windsurfing.",
    },
    {
        "name": "Kosgoda Sea Turtle Conservation Project",
        "category": "Wildlife",
        "latitude": 6.3214,
        "longitude": 80.0247,
        "description": "A vital hatchery and rescue center dedicated to protecting Sri Lanka's endangered sea turtle species.",
    },
    {
        "name": "Seenigama Vihara",
        "category": "Religious",
        "latitude": 6.1681,
        "longitude": 80.0886,
        "description": "A unique Buddhist temple located on a tiny island just off the coast of Hikkaduwa, accessible only by boat.",
    },
    {
        "name": "Seema Malaka",
        "category": "Religious",
        "latitude": 6.9161,
        "longitude": 79.8561,
        "description": "A serene floating temple designed by Geoffrey Bawa, resting gracefully on the waters of Beira Lake in Colombo.",
    },
]


@click.command("seed-db")
@with_appcontext
def seed_db_command():
    """Insert sample Sri Lankan attractions (idempotent per item)."""
    added_count = 0
    for data in SAMPLE_ATTRACTIONS:
        # Check if an attraction with this name already exists
        if not Attraction.query.filter_by(name=data["name"]).first():
            db.session.add(Attraction(**data))
            added_count += 1
            
    if added_count > 0:
        db.session.commit()
        click.echo(f"Seeded {added_count} new attractions.")
    else:
        click.echo("All attractions are already present; skipping seed.")


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

// Real Sri Lanka photography shipped with the app, mapped to the attractions
// it depicts. One place to answer "which photo shows this attraction?" so
// cards, heroes, and suggestion tiles all agree.
//
// Each entry is { src, position, alt }: `position` is the CSS object-position
// that keeps the photo's subject visible when a portrait shot is cropped into
// a wide card or hero.

import sigiriyaAerialSrc from './sigiriya.jpg'
import sigiriyaGroundSrc from './SIGIRIYA.jpeg'
import templeOfToothSrc from './temple of tooth sri lanka.jpeg'
import galleFortSrc from './galle_fort.jpg'
import galleFortAltSrc from './galle_fort_2.jpg'
import galleLighthouseSrc from './galle_lighthouse.jpg'
import nineArchSrc from './9n arch.jpg'
import leopardSrc from './lepordjpg.jpg'
import elephantSrc from './elephant.jpg'
import adamsPeakSrc from "./Adam's_peak.jpeg"
import dambullaSrc from './Dambulla.jpeg'
import stClairsFallsSrc from "./St_ Clair's Falls in Hatton, Sri Lanka.jpeg"
import coconutTreeHillSrc from './Coconut Tree Hill, Mirissa.jpeg'
import whaleWatchingSrc from './Whale Watching Mirissa, Sri Lanka.jpeg'
import stiltFishingSrc from './Sri Lanka Travel – Stilt Fishing at Sunset on the Coast.jpeg'
import hikkaduwaBeachSrc from './Hikkaduwa_beach.jpg'
import hikkaduwaCoralSrc from './Hikkaduwa_coral.jpg'
import hikkaduwaDivingSrc from './Hikkaduwa_diving.jpg'
import blueBeachIslandSrc from './𝐁𝐥𝐮𝐞 𝐁𝐞𝐚𝐜𝐡 𝐈𝐬𝐥𝐚𝐧𝐝, 𝐍𝐢𝐥𝐰𝐞𝐥𝐥i.jpeg'
import knucklesRangeSrc from './Knuckles Mountain Range.jpeg'
import ellaRockSrc from './Ella Rock - Ella, SriLanka.jpeg'
import harithaKandaSrc from './Haritha kanda or Green Mountain - Bopaththalawa, SriLanka.jpeg'
import hortonPlainsSrc from './horton_pains.webp'
import wilpattuSrc from './Wilpaththu National Park.jpeg'
import polonnaruwaSrc from './Polonnaruwa, Sri Lanka.jpeg'
import anuradhapuraSrc from './Anuradhapura.jpeg'

/** Named, hand-cropped scenes for editorial use (heroes, feature tiles). */
export const scenes = {
  sigiriyaAerial: {
    src: sigiriyaAerialSrc,
    position: '50% 45%',
    alt: 'Sigiriya Rock Fortress rising over the jungle at golden hour',
  },
  sigiriyaGround: {
    src: sigiriyaGroundSrc,
    position: '50% 38%',
    alt: 'Sigiriya Rock Fortress seen from its water gardens',
  },
  templeOfTooth: {
    src: templeOfToothSrc,
    position: '50% 45%',
    alt: 'A tusker elephant before the Temple of the Sacred Tooth Relic, Kandy',
  },
  galleFort: {
    src: galleFortSrc,
    position: '50% 62%',
    alt: 'The clock tower and ramparts of Galle Fort',
  },
  galleFortAlt: {
    src: galleFortAltSrc,
    position: '50% 50%',
    alt: 'Inside the old town of Galle Fort',
  },
  galleLighthouse: {
    src: galleLighthouseSrc,
    position: '50% 45%',
    alt: 'Galle lighthouse among coconut palms at sunset',
  },
  nineArch: {
    src: nineArchSrc,
    position: '50% 45%',
    alt: 'A blue train crossing the Nine Arch Bridge in Ella',
  },
  leopard: {
    src: leopardSrc,
    position: '50% 35%',
    alt: 'A Sri Lankan leopard resting on a branch in Yala',
  },
  elephant: {
    src: elephantSrc,
    position: '50% 55%',
    alt: 'A tusker elephant by the water',
  },
  adamsPeak: {
    src: adamsPeakSrc,
    position: '50% 40%',
    alt: "The stairway descending Adam's Peak above the clouds",
  },
  dambulla: {
    src: dambullaSrc,
    position: '50% 45%',
    alt: 'The white gateway of the Dambulla cave temples beneath the rock overhang',
  },
  stClairsFalls: {
    src: stClairsFallsSrc,
    position: '50% 50%',
    alt: "St. Clair's Falls cascading through tea country",
  },
  coconutTreeHill: {
    src: coconutTreeHillSrc,
    /* Cropped low: the source photo has a location caption near the top edge. */
    position: '50% 68%',
    alt: 'Palm trees over the ocean at Coconut Tree Hill, Mirissa',
  },
  whaleWatching: {
    src: whaleWatchingSrc,
    position: '50% 40%',
    alt: 'A blue whale breaching off Mirissa',
  },
  stiltFishing: {
    src: stiltFishingSrc,
    position: '50% 55%',
    alt: 'Stilt fishermen silhouetted against a sunset on the southern coast',
  },
  hikkaduwaBeach: {
    src: hikkaduwaBeachSrc,
    position: '50% 50%',
    alt: 'Hikkaduwa beach',
  },
  hikkaduwaCoral: {
    src: hikkaduwaCoralSrc,
    position: '50% 50%',
    alt: 'Corals in the shallows at Hikkaduwa',
  },
  hikkaduwaDiving: {
    src: hikkaduwaDivingSrc,
    position: '50% 50%',
    alt: 'Diving over a reef at Hikkaduwa',
  },
  blueBeachIsland: {
    src: blueBeachIslandSrc,
    position: '50% 50%',
    alt: 'Blue Beach Island at Nilwella',
  },
  knucklesRange: {
    src: knucklesRangeSrc,
    position: '50% 45%',
    alt: 'The jagged peaks of the Knuckles Mountain Range',
  },
  ellaRock: {
    src: ellaRockSrc,
    position: '50% 45%',
    alt: 'The view from the summit of Ella Rock',
  },
  harithaKanda: {
    src: harithaKandaSrc,
    position: '50% 45%',
    alt: 'Haritha Kanda (Green Mountain) above Bopaththalawa',
  },
  hortonPlains: {
    src: hortonPlainsSrc,
    position: '50% 50%',
    alt: "Misty grassland at Horton Plains, near World's End",
  },
  wilpattu: {
    src: wilpattuSrc,
    position: '50% 50%',
    alt: 'A watering hole in Wilpattu National Park',
  },
  polonnaruwa: {
    src: polonnaruwaSrc,
    position: '50% 50%',
    alt: 'Ancient ruins of the medieval capital, Polonnaruwa',
  },
  anuradhapura: {
    src: anuradhapuraSrc,
    position: '50% 50%',
    alt: 'The sacred dagobas of Anuradhapura',
  },
}

/* Name → photo rules, first match wins. Substring patterns are deliberately
   loose so admin-added rows ("Sigiriya", "Galle Fort Ramparts") still match.
   Order matters: /elephant/ must run before the bare /\bella\b/ place match. */
const NAME_RULES = [
  [/sigiriya/, scenes.sigiriyaGround],
  [/tooth|dalada/, scenes.templeOfTooth],
  [/lighthouse/, scenes.galleLighthouse],
  [/galle/, scenes.galleFort],
  [/nine arch|9 arch|demodara/, scenes.nineArch],
  [/yala/, scenes.leopard],
  [/adam|sri pada/, scenes.adamsPeak],
  [/dambulla/, scenes.dambulla],
  [/nuwara eliya|clair|devon fall/, scenes.stClairsFalls],
  [/whale/, scenes.whaleWatching],
  [/mirissa|coconut tree/, scenes.coconutTreeHill],
  [/unawatuna|hikkaduwa|bentota|arugam/, scenes.hikkaduwaBeach],
  [/blue beach|nilwella|nilweli/, scenes.blueBeachIsland],
  [/trincomalee|nilaveli|pigeon island/, scenes.hikkaduwaCoral],
  [/pinnawala|elephant|udawalawe|minneriya/, scenes.elephant],
  [/wilpattu|wilpaththu/, scenes.wilpattu],
  [/knuckles/, scenes.knucklesRange],
  [/ella rock/, scenes.ellaRock],
  [/haritha kanda|green mountain|bopath/, scenes.harithaKanda],
  [/\bella\b/, scenes.nineArch],
  [/horton/, scenes.hortonPlains],
  [/polonnaruwa/, scenes.polonnaruwa],
  [/anuradhapura/, scenes.anuradhapura],
  [/stilt|koggala/, scenes.stiltFishing],
]

/* Generic (non-landmark) shots reused for unmatched rows of a category —
   a real beach photo on an unmatched beach beats a drawn placeholder. Only
   categories with genuinely generic imagery get a pool; other heritage
   sites without a bundled photo keep the existing image_url/SVG fallback
   rather than wearing another landmark's photo. */
const CATEGORY_POOLS = {
  beach: [scenes.hikkaduwaBeach, scenes.hikkaduwaCoral, scenes.hikkaduwaDiving],
  wildlife: [scenes.elephant, scenes.leopard],
}

/* One representative scene per category — used for photo-thumbnail filter
   chips and interest tags. */
const CATEGORY_SCENES = {
  heritage: scenes.dambulla,
  religious: scenes.templeOfTooth,
  historical: scenes.galleFort,
  scenic: scenes.nineArch,
  wildlife: scenes.leopard,
  hiking: scenes.adamsPeak,
  'hill country': scenes.stClairsFalls,
  beach: scenes.hikkaduwaBeach,
  nature: scenes.elephant,
  culture: scenes.templeOfTooth,
  adventure: scenes.hikkaduwaDiving,
  food: scenes.galleFortAlt,
  history: scenes.galleFort,
}

/** The representative scene for a category/interest, or null. */
export function categoryScene(category) {
  return CATEGORY_SCENES[(category || '').toLowerCase()] || null
}

/**
 * The bundled photo for an attraction, or null when we don't have one.
 * Resolution: name match → category pool (rotated by id) → null.
 */
export function attractionPhoto(attraction) {
  if (!attraction) return null
  const name = (attraction.name || '').toLowerCase()
  for (const [pattern, photo] of NAME_RULES) {
    if (pattern.test(name)) return photo
  }
  const pool = CATEGORY_POOLS[(attraction.category || '').toLowerCase()]
  if (pool) return pool[(attraction.id || 0) % pool.length]
  return null
}

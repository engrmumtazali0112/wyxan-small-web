import type { VisitVia } from '../visits/visit.schema.js';


/**
 * Everything the seed puts in the database lives in this file, as plain data.
 * No Date.now(), no Math.random(): the same command always gives the same web.
 *
 * Link rules (see sanitize.policy.ts): a link is a bare address, <a href="tidepool.zz">.
 * Four addresses are linked to but never published, on purpose:
 *   nowhere.zz, lost-harbour.zz, the-last-payphone.zz, wind-tables.zz
 */

export interface SeedUser {
  handle: string;
  displayName: string;
}

export interface SeedSite {
  address: string;
  title: string;
  /** handle of the author, must exist in SEED_USERS */
  author: string;
  /** raw html; it goes through the same SanitizeService as a real publish */
  html: string;
}

/** A step is an address, or [address, via] to override how the person got there. */
export type Step = string | readonly [address: string, via: VisitVia];

export interface SeedTrail {
  /** handle of the person browsing */
  user: string;
  /** the trail is spread evenly over this slice of the hour before the anchor */
  fromMinutesAgo: number;
  toMinutesAgo: number;
  steps: Step[];
}

/** Fixed point in time the "last hour" is measured back from (keeps the seed deterministic). */
export const SEED_ANCHOR_ISO = '2026-11-04T12:00:00.000Z';

export const SEED_USERS: SeedUser[] = [
  { handle: 'wren', displayName: 'Wren Alder' },
  { handle: 'marlow', displayName: 'Marlow Quinn' },
  { handle: 'ines', displayName: 'Ines Duarte' },
  { handle: 'tobias', displayName: 'Tobias Reyes' },
  { handle: 'priya', displayName: 'Priya Nair' },
  { handle: 'oskar', displayName: 'Oskar Lindqvist' },
];

export const SEED_SITES: SeedSite[] = [
  {
    address: 'start.zz',
    title: 'Start: a directory of the small web',
    author: 'wren',
    html: `
<h1>Start</h1>
<p>This is a front door for a small web. Nobody runs a search engine here and nobody sells anything; there are only a few dozen people who wanted a page of their own and wrote one. Walk in anywhere and follow whatever looks interesting.</p>
<h2>By the sea</h2>
<ul>
  <li><a href="tidepool.zz">Tidepool</a>, a field guide to the rocks at low tide</li>
  <li><a href="saltmarsh.zz">Saltmarsh</a>, where the land gives up slowly</li>
  <li><a href="lighthouse-keeper.zz">The Lighthouse Keeper's Logbook</a></li>
  <li><a href="stormglass.zz">Stormglass</a>, weather lore and the glass that predicts it</li>
  <li><a href="kite-club.zz">Kite Club</a>, Sundays on the headland</li>
</ul>
<h2>After dark</h2>
<ul>
  <li><a href="heron-hours.zz">Heron Hours</a>, notes from a very slow hobby</li>
  <li><a href="night-bus.zz">The Night Bus</a>, essays from the top deck</li>
  <li><a href="moth-index.zz">Moth Index</a>, a catalogue of small brown things</li>
</ul>
<h2>In the kitchen</h2>
<ul>
  <li><a href="noodle-atlas.zz">Noodle Atlas</a>, a map of bowls</li>
  <li><a href="sourdough-diary.zz">Sourdough Diary</a>, day one to day four hundred</li>
</ul>
<p>There is also a page that promises to explain everything at <a href="nowhere.zz">nowhere.zz</a>. I have followed that link many times and have yet to arrive.</p>`,
  },
  {
    address: 'tidepool.zz',
    title: 'Tidepool: a field guide to the rocks at low tide',
    author: 'marlow',
    html: `
<h1>Tidepool</h1>
<p>Twice a day the sea pulls back and leaves behind a scatter of small, cold, glittering worlds. Each pool in the rock is a sealed experiment: a few litres of seawater, a fringe of anemones, and a hermit crab dragging its borrowed shell across the bottom like a man moving house in the rain.</p>
<h2>How to look</h2>
<p>Go at the bottom of a spring tide, wear shoes you do not love, and step only on bare rock or barnacles. Then crouch and be still for ten minutes. The pool will forget you are there. Limpets resume their slow grazing, a blenny slides out from under a ledge, and the whole thing starts to move.</p>
<ul>
  <li>Anemones close when touched, so look and leave them be.</li>
  <li>Turn stones gently and always put them back the way they were.</li>
  <li>The tide comes in faster than you think. Keep an eye on your exit.</li>
</ul>
<p>The pools drain toward the <a href="saltmarsh.zz">salt marsh</a> further up the coast, and the best place to read the sea's mood is the lamp room of the <a href="lighthouse-keeper.zz">lighthouse</a>. On breezy days the <a href="kite-club.zz">kite club</a> flies from the headland above. Someone once told me there was a map of every pool on this shore at <a href="nowhere.zz">nowhere.zz</a>, but I have never found it.</p>`,
  },
  {
    address: 'saltmarsh.zz',
    title: 'Saltmarsh: where the land gives up slowly',
    author: 'marlow',
    html: `
<h1>Saltmarsh</h1>
<p>A salt marsh is what happens when a river and the sea cannot agree. Twice a day the tide floods the creeks and the flat plain of cordgrass and sea lavender slips under, then it drains again and leaves a glaze of mud that smells of iron and boiled eggs.</p>
<h2>Why it matters</h2>
<p>Marshes soften storm surges, lock carbon away in their peat, and serve as nurseries for fish that will spend their adult lives far offshore. They look empty from the road. Lie on the boardwalk for an hour and you will count a startling amount of life: fiddler crabs, redshank, a water vole crossing a creek with great seriousness.</p>
<blockquote>The marsh does not have edges. It has an argument that is renewed every six hours.</blockquote>
<p>The rock pools of the <a href="tidepool.zz">tidepool shore</a> are a short walk seaward. The long-legged birds stalking the creek margins are logged, patiently, at <a href="heron-hours.zz">Heron Hours</a>, and the marsh has a night shift too, which is catalogued in the <a href="moth-index.zz">Moth Index</a>.</p>`,
  },
  {
    address: 'lighthouse-keeper.zz',
    title: "The Lighthouse Keeper's Logbook",
    author: 'ines',
    html: `
<h1>The Lighthouse Keeper's Logbook</h1>
<p>The light is automatic now, so I am not a keeper in any sense the old books would recognise. I am the person who is paid to climb two hundred and six steps each morning, wipe the salt from the lens and pretend the machinery needs me. It does not. I stay because the view is the best in the county.</p>
<h2>Entries</h2>
<p><strong>Monday.</strong> Fog from dawn. The horn sounded eleven hours and I have a ringing in my left ear that I suspect is permanent. A trawler passed so close I could read its name, which I will not repeat, because the skipper waved and I felt we had an understanding.</p>
<p><strong>Thursday.</strong> Clear and cold. At low tide the rocks below the tower fill up with <a href="tidepool.zz">tide pools</a>, and I watched a child spend two hours with a bucket she was not allowed to fill. Barometer falling again; I consulted the <a href="stormglass.zz">storm glass</a>, which had grown feathers overnight and so, as tradition requires, I expect rain.</p>
<p><strong>Sunday.</strong> A visitor asked about the drowned village. The old harbour at <a href="lost-harbour.zz">lost-harbour.zz</a> went under the sea long before my time, and the only evidence I can offer is a church bell that fishermen swear they hear in storms.</p>`,
  },
  {
    address: 'stormglass.zz',
    title: 'Stormglass: weather lore and the glass that predicts it',
    author: 'ines',
    html: `
<h1>Stormglass</h1>
<p>A storm glass is a sealed tube of camphor, alcohol, water and a little saltpetre, and for roughly two hundred years sailors have believed that the crystals growing inside it forecast the weather. Clear liquid means fair skies. Cloudy liquid with small stars means thunder. Long feathery threads mean wind, and a lot of it.</p>
<h2>Does it work?</h2>
<p>Honestly, no. The crystals respond mostly to temperature, not to the pressure changes that really herald a storm. But it is a beautiful thing to keep on a windowsill, and it makes you look at the sky more than you otherwise would, which is its real function.</p>
<h3>Lore that does hold up</h3>
<ul>
  <li>A ring around the moon often means rain within a day, because high ice cloud is moving in ahead of a front.</li>
  <li>Red sky at night is a decent rule of thumb for settled westerly weather.</li>
  <li>Swallows fly low when insects do, and insects fly low when the air is heavy and damp.</li>
</ul>
<p>I keep mine in the lamp room of the <a href="lighthouse-keeper.zz">lighthouse</a>. The people at the <a href="kite-club.zz">kite club</a> trust their own noses more than any glass, and a baker I know swears her starter climbs the jar faster before rain; she writes about it at <a href="sourdough-diary.zz">Sourdough Diary</a>.</p>`,
  },
  {
    address: 'heron-hours.zz',
    title: 'Heron Hours: notes from a very slow hobby',
    author: 'tobias',
    html: `
<h1>Heron Hours</h1>
<p>Birdwatching, as practised by me, is mostly standing in a cold place and failing to see anything. The herons have taught me patience, because a grey heron will stand motionless in a creek for forty minutes and then, in one eyeblink, produce an eel. I find this encouraging as a model for how to live.</p>
<h2>The log</h2>
<p><em>Dawn, mudflat.</em> Four little egrets, one grey heron, a curlew calling from somewhere I could not see. Frost on the reeds. Two hours, one flask of tea.</p>
<p><em>Dusk, creek edge.</em> The heron again, or possibly his cousin. Redshank went up in a panic that turned out to be a harrier, a dark shape quartering the reeds. A very good evening.</p>
<p>Most of my best sightings come from the <a href="saltmarsh.zz">salt marsh</a>, where the creeks run narrow and the birds have nowhere to be but in front of you. I usually go home on the last <a href="night-bus.zz">night bus</a>, and occasionally a pale moth bumps against the window of the shelter; there is a keen collector who would like to hear about it at the <a href="moth-index.zz">Moth Index</a>.</p>`,
  },
  {
    address: 'night-bus.zz',
    title: 'The Night Bus: essays from the top deck at 2 a.m.',
    author: 'tobias',
    html: `
<h1>The Night Bus</h1>
<p>Nobody on the top deck of a night bus is quite who they are in daylight. The nurse finishing a double shift, the man holding a cake in a box on his knees, the two students reciting a language to each other as if it were a spell: all of us are in transit, which is the one thing everyone aboard has in common.</p>
<h2>Rules of the top deck</h2>
<ol>
  <li>The front seat belongs to whoever gets there first and will be defended in silence.</li>
  <li>Headphones are a polite fiction. Everyone can hear everything.</li>
  <li>If someone falls asleep past their stop, somebody else will wake them. This has never failed.</li>
</ol>
<p>I get off for the early shift of <a href="heron-hours.zz">herons</a> more often than is sensible. The noodle shop that stays open until the last service is catalogued in the <a href="noodle-atlas.zz">Noodle Atlas</a>, and the lit windows of the shelters collect moths in summer, which is one reason I send people to the <a href="moth-index.zz">Moth Index</a>. There used to be a payphone at the terminus; its story, such as it is, was at <a href="the-last-payphone.zz">the-last-payphone.zz</a>.</p>`,
  },
  {
    address: 'noodle-atlas.zz',
    title: 'Noodle Atlas: a map of bowls',
    author: 'priya',
    html: `
<h1>Noodle Atlas</h1>
<p>The world is divided, I have decided, not into countries but into broths. This atlas is my attempt to chart the borders: where wheat gives way to rice, where the soup is clear and where it is cloudy with bone, and where somebody's grandmother added a spoonful of chilli oil and changed the whole region.</p>
<h2>Entries so far</h2>
<dl>
  <dt>Hand-pulled wheat, northern style</dt>
  <dd>Chewy, irregular, served in a thin beef broth with a scatter of coriander. Best eaten fast and in company.</dd>
  <dt>Rice vermicelli, southern style</dt>
  <dd>Light and slippery, usually with grilled pork and a bowl of herbs you tear up yourself.</dd>
  <dt>Buckwheat, cold</dt>
  <dd>Dipped in a salty, sweet sauce with grated radish. The correct meal for a hot afternoon.</dd>
</dl>
<p>My favourite bowl of the whole project was eaten at one in the morning in a shop that stays open for the last <a href="night-bus.zz">night bus</a>. When I get home I make dough, and the dough has its own journal: see the <a href="sourdough-diary.zz">Sourdough Diary</a>. The front door of this whole small web is at <a href="start.zz">start.zz</a>.</p>`,
  },
  {
    address: 'sourdough-diary.zz',
    title: 'Sourdough Diary: day one to day four hundred',
    author: 'priya',
    html: `
<h1>Sourdough Diary</h1>
<p>Day one: flour, water, a jar, great optimism. Day four: a smell like nail varnish and the first bubbles. Day nine: a living thing that has to be fed on a schedule, which is exactly the commitment I was warned about and did not listen to.</p>
<h2>What four hundred days taught me</h2>
<p>A starter is a small ecosystem and it behaves like weather. In summer it races. In winter it sulks on the radiator. On days when a front is coming through it seems to climb the jar faster, and my friend who keeps a <a href="stormglass.zz">storm glass</a> says that is not a coincidence, though neither of us can prove it.</p>
<ul>
  <li>Use a scale, not cups. Flour is a liar by volume.</li>
  <li>The dough is ready when it jiggles, not when the clock says so.</li>
  <li>A burnt loaf is still bread. Eat it with butter and tell nobody.</li>
</ul>
<p>Leftover starter goes into pancakes, crackers, and once, disastrously, a pasta dough that now lives in the <a href="noodle-atlas.zz">Noodle Atlas</a> as a cautionary tale.</p>`,
  },
  {
    address: 'kite-club.zz',
    title: 'Kite Club: Sundays on the headland',
    author: 'oskar',
    html: `
<h1>Kite Club</h1>
<p>We meet on the headland at ten on Sundays, whatever the weather, because there is no such thing as no wind, only wind you have not learned to use. There are eleven regular members, nine kites per person on average and one argument about who owns the red delta that has been going since March.</p>
<h2>Reading the sky</h2>
<p>Good flying wind is steady and smooth, between eight and twenty knots. Gusty wind from behind a building is a bad idea and wind that shifts every few seconds is worse. We watch the grass ripple on the slope below the launch field and the waves breaking on the rocks, where at low tide you can see the <a href="tidepool.zz">tide pools</a> shining.</p>
<p>Some of us consult the <a href="stormglass.zz">storm glass</a> before we leave home, and the rest use a cheap anemometer and the old trick of licking a finger. For the proper wind speed tables we used to rely on <a href="wind-tables.zz">wind-tables.zz</a>, which has since disappeared from the web, so now we guess and mostly guess right.</p>`,
  },
  {
    address: 'moth-index.zz',
    title: 'Moth Index: a catalogue of small brown things',
    author: 'wren',
    html: `
<h1>Moth Index</h1>
<p>There are about two and a half thousand kinds of moth in this country and roughly nine of them are famous. The rest are small, brown, and beautiful if you look through a lens: feathered antennae, wings patterned like bark or old wallpaper, eyes that glow orange in a torch beam.</p>
<h2>How to catch one, politely</h2>
<p>Hang a white sheet, shine a lamp on it after dark, and wait. Moths arrive in waves. Photograph, identify, release; they are slightly dazed and entirely unharmed. Keep a notebook, because the third moth of the night is the one you will forget.</p>
<h3>Recent visitors</h3>
<ul>
  <li><strong>Setaceous Hebrew Character.</strong> Named for a marking on the wing that looks like a letter.</li>
  <li><strong>Old Lady.</strong> Large, brown and rather dignified. Likes ripe fruit.</li>
  <li><strong>Ghost Moth.</strong> White males hover over the grass at dusk like small lanterns.</li>
</ul>
<p>The best hunting ground I know is the edge of the <a href="saltmarsh.zz">salt marsh</a>, though the bus shelters on the <a href="night-bus.zz">night bus</a> route are good too, as the lit windows draw them in. Everything else I run is listed at <a href="start.zz">start.zz</a>.</p>`,
  },
];

/**
 * Where people went in the hour before SEED_ANCHOR_ISO.
 *
 * `via` is worked out for you: a step is a "link" if the page before it contains a link
 * to it, otherwise "typed". Use [address, via] to say "back", "forward", "history",
 * "search" or "publish" explicitly. Dead addresses are recorded as visits too; the
 * outcome ("shown" / "nowhere") is derived from which sites actually exist.
 */
export const SEED_TRAILS: SeedTrail[] = [
  {
    // "Has been nearly everywhere": every site, plus every dead address, with backtracking.
    user: 'wren',
    fromMinutesAgo: 58,
    toMinutesAgo: 1,
    steps: [
      'start.zz',
      'tidepool.zz',
      'saltmarsh.zz',
      'heron-hours.zz',
      'night-bus.zz',
      'noodle-atlas.zz',
      'sourdough-diary.zz',
      'stormglass.zz',
      'lighthouse-keeper.zz',
      'lost-harbour.zz',
      ['lighthouse-keeper.zz', 'back'],
      'tidepool.zz',
      'kite-club.zz',
      'wind-tables.zz',
      ['kite-club.zz', 'back'],
      'stormglass.zz',
      'moth-index.zz',
      'night-bus.zz',
      'the-last-payphone.zz',
      ['night-bus.zz', 'back'],
      'heron-hours.zz',
      'saltmarsh.zz',
      'tidepool.zz',
      'nowhere.zz',
      ['tidepool.zz', 'back'],
      'lighthouse-keeper.zz',
      ['tidepool.zz', 'history'],
    ],
  },
  {
    // A trail four deep, back twice, forward twice, then somewhere dead.
    user: 'marlow',
    fromMinutesAgo: 52,
    toMinutesAgo: 6,
    steps: [
      'tidepool.zz',
      'saltmarsh.zz',
      'heron-hours.zz',
      'night-bus.zz',
      ['heron-hours.zz', 'back'],
      ['saltmarsh.zz', 'back'],
      ['heron-hours.zz', 'forward'],
      ['night-bus.zz', 'forward'],
      'the-last-payphone.zz',
      ['night-bus.zz', 'back'],
      ['tidepool.zz', 'typed'],
      'lighthouse-keeper.zz',
      'stormglass.zz',
      ['lighthouse-keeper.zz', 'back'],
    ],
  },
  {
    // Repeat visits to the same two pages.
    user: 'ines',
    fromMinutesAgo: 47,
    toMinutesAgo: 12,
    steps: [
      'lighthouse-keeper.zz',
      'stormglass.zz',
      'kite-club.zz',
      ['stormglass.zz', 'back'],
      ['lighthouse-keeper.zz', 'back'],
      'tidepool.zz',
      'lighthouse-keeper.zz',
      'stormglass.zz',
      ['lighthouse-keeper.zz', 'history'],
      ['stormglass.zz', 'typed'],
    ],
  },
  {
    // A long, wandering trail with several dead ends.
    user: 'tobias',
    fromMinutesAgo: 55,
    toMinutesAgo: 3,
    steps: [
      'heron-hours.zz',
      'saltmarsh.zz',
      'moth-index.zz',
      'night-bus.zz',
      'the-last-payphone.zz',
      ['night-bus.zz', 'back'],
      'noodle-atlas.zz',
      'sourdough-diary.zz',
      'stormglass.zz',
      'kite-club.zz',
      'wind-tables.zz',
      ['kite-club.zz', 'back'],
      ['stormglass.zz', 'back'],
      ['sourdough-diary.zz', 'back'],
      ['noodle-atlas.zz', 'back'],
      'start.zz',
      'moth-index.zz',
    ],
  },
  {
    // Publishes a page, then lives in two sites.
    user: 'priya',
    fromMinutesAgo: 40,
    toMinutesAgo: 2,
    steps: [
      ['noodle-atlas.zz', 'publish'],
      'sourdough-diary.zz',
      'noodle-atlas.zz',
      'sourdough-diary.zz',
      'stormglass.zz',
      ['sourdough-diary.zz', 'back'],
      'noodle-atlas.zz',
      'night-bus.zz',
      ['noodle-atlas.zz', 'back'],
      ['sourdough-diary.zz', 'typed'],
    ],
  },
  {
    // Finds a page by searching rather than by following links.
    user: 'oskar',
    fromMinutesAgo: 30,
    toMinutesAgo: 8,
    steps: [
      'kite-club.zz',
      'wind-tables.zz',
      ['kite-club.zz', 'back'],
      'stormglass.zz',
      ['lighthouse-keeper.zz', 'search'],
      'tidepool.zz',
      'kite-club.zz',
    ],
  },
];

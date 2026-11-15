import { sources, sourceLabels } from './references.mjs';

export { sources, sourceLabels };
export const mission = sources.mer;
export const apolloSource = sources.lunarRover;

export const paths = {
  home: '', atlas: 'omnecarta/', moon: 'moon/', mars: 'mars/', compare: 'compare/',
  opportunity: 'opportunity/', lunar: 'lunar-rover/', experiment: 'experiment/',
  story: 'odyssey/', collection: 'collection/',
} as const;
export type Page = keyof typeof paths;
export type WorldId = 'moon' | 'mars';
export type HardwareId = 'opportunity' | 'lunar';
export const base = import.meta.env?.BASE_URL ?? '/';
export const link = (page: Page) => base + paths[page];
export const asset = (name: string) => base + 'media/' + name;

export type AtlasSite = {
  id: string;
  name: string;
  mission: string;
  latitude: number;
  longitude: number;
  coordinates: string;
  detail: string;
  exhibit: HardwareId;
};

export const destinations = {
  moon: {
    name: 'Moon', kind: 'Earth’s natural satellite', source: sources.archive,
    intro: 'Basalt plains and impact craters record different chapters of the lunar surface.',
    facts: [['Gravity', '17% of Earth’s'], ['Atmosphere', 'Extremely thin exosphere'], ['Surface', 'Craters and loose regolith'], ['Water ice', 'Permanently shadowed polar regions']],
    gravity: 17,
    textureCredit: 'LRO imagery and relief · NASA Scientific Visualization Studio',
    sites: [{
      id: 'apollo15', name: 'Hadley–Apennine', mission: 'Apollo 15', latitude: 26.13239, longitude: 3.63330,
      coordinates: '26.132° N · 3.633° E',
      detail: 'Apollo 15 landed between Hadley Rille and the Apennine mountains on July 30, 1971. The crew used the Lunar Roving Vehicle to travel beyond the lander and collect samples.',
      exhibit: 'lunar',
    }],
  },
  mars: {
    name: 'Mars', kind: 'Terrestrial planet', source: sources.archive,
    intro: 'Dust, impact basins, and volcanic terrain shape the landscape a rover has to cross.',
    facts: [['Gravity', '38% of Earth’s'], ['Atmosphere', 'Thin, mostly carbon dioxide'], ['Surface', 'Rock and dust storms'], ['Water ice', 'Polar caps and below the surface']],
    gravity: 38,
    textureCredit: 'Viking surface imagery · NASA/JPL-Caltech, processed by USGS',
    sites: [{
      id: 'eagle', name: 'Eagle Crater', mission: 'Opportunity', latitude: -1.946, longitude: -5.473,
      coordinates: '1.95° S · 5.47° W',
      detail: 'Opportunity landed in Eagle Crater in Meridiani Planum in January 2004. Rock outcrops at the site helped show that water persisted on ancient Mars.',
      exhibit: 'opportunity',
    }],
  },
} as const satisfies Record<WorldId, { name: string; kind: string; source: string; intro: string; facts: readonly (readonly [string,string])[]; gravity: number; textureCredit: string; sites: readonly AtlasSite[] }>;

export const evidence = {
  apollo: { image: 'apollo15-surface.jpg', alt: 'Apollo 15’s rover parked on the lunar surface at Hadley–Apennine', title: 'Apollo 15 surface photograph', credit: 'NASA · AS15-88-11901', url: sources.archive, body: 'The photograph shows the rover deployed at Hadley–Apennine, with its open chassis, seats and forward equipment platform.' },
  panorama: { image: 'eagle.jpg', alt: 'Opportunity’s panorama of Eagle Crater and the surrounding plains', title: 'Eagle Crater panorama', credit: 'NASA/JPL/Cornell', url: mission, body: 'The panoramic camera recorded Opportunity’s landing site. The rocks there helped reveal a wetter past.' },
  selfie: { image: 'selfie.jpg', alt: 'Opportunity’s solar panels after wind cleared much of the dust', title: 'When the wind helped', credit: 'NASA/JPL-Caltech/Cornell Univ./Arizona State Univ.', url: mission, body: 'Wind cleared dust off the solar panels in March 2014. During the 2018 storm, airborne dust reduced the light reaching them.' },
};
export const rover = {
  id: 'opportunity', destination: 'mars', source: mission,
  overview: 'Opportunity spent more than 14 years investigating the Martian surface. Its observations helped establish that water persisted on ancient Mars.',
  timeline: [
    ['Jan 2004', 'Landing', 'Opportunity lands inside Eagle Crater at Meridiani Planum.'],
    ['2004', 'Ancient water', 'Rock observations at the landing site show evidence of past liquid water.'],
    ['Jun 10, 2018', 'Last contact', 'A planet-wide dust storm reduces sunlight at the solar powered rover’s location.'],
  ],
  simulation: { initialBattery: 50, dustLoss: .8, maxOutput: 100, demand: 45, unitsPerSecond: .12 },
};

export type Instrument = { id: string; name: string; detail: string };
export const exhibits = {
  opportunity: {
    name: 'Opportunity', designation: 'Mars Exploration Rover', world: 'mars', model: 'opportunity',
    overview: rover.overview, timeline: rover.timeline, source: mission, sourceLabel: sourceLabels.mer,
    modelCredit: 'NASA Visualization Technology Applications and Development (VTAD)',
    instruments: [
      { id: 'camera', name: 'Camera mast', detail: 'Cameras mounted high above the deck helped the team survey the ground, plan drives, and record the terrain in panoramas.' },
      { id: 'solar', name: 'Solar deck', detail: 'Photovoltaic cells converted sunlight to electricity. Dust on the panels or in the air reduced the light available to power the rover.' },
      { id: 'wheel', name: 'Wheel suspension', detail: 'The six wheels and their articulated suspension helped the rover keep contact with uneven ground.' },
      { id: 'arm', name: 'Instrument arm', detail: 'The arm positioned instruments close to the rocks and soil so the rover could investigate them at the surface.' },
    ],
  },
  lunar: {
    name: 'Lunar Roving Vehicle', designation: 'Apollo 15', world: 'moon', model: 'lunar',
    overview: 'The folding, battery-powered rover let two astronauts carry tools and samples farther from the lunar module.',
    timeline: [
      ['Jul 30, 1971', 'Hadley landing', 'The lunar module lands between Hadley Rille and the Apennine mountains.'],
      ['Jul–Aug 1971', 'Surface traverses', 'The crew deploys the rover and uses it to reach sampling sites.'],
      ['Aug 1971', 'Departure', 'The crew leaves the rover on the lunar surface.'],
    ],
    source: apolloSource, sourceLabel: sourceLabels.lunarRover,
    modelCredit: 'Original reconstruction from the NASA archive',
    instruments: [
      { id: 'wheel', name: 'Mesh wheels', detail: 'Woven wire tires and metal chevrons provided traction in loose regolith. Independent suspension let each wheel follow uneven ground.' },
      { id: 'seats', name: 'Crew seats', detail: 'Two folding, side-by-side seats supported the astronauts on traverses. The open frame reduced mass and could fold for stowage.' },
      { id: 'antenna', name: 'Mesh antenna', detail: 'The steerable dish sent signals to Earth, including the television feed when the rover was parked.' },
      { id: 'equipment', name: 'Equipment bay', detail: 'Batteries powered the drive and steering motors. The forward platform carried communications equipment and a television camera.' },
    ],
  },
} as const satisfies Record<HardwareId, { name: string; designation: string; world: WorldId; model: HardwareId; overview: string; timeline: readonly (readonly string[])[]; source: string; sourceLabel: string; modelCredit: string; instruments: readonly Instrument[] }>;

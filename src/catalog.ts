export const nasa = 'https://science.nasa.gov/';
export const mission = nasa + 'mission/mars-exploration-rovers-spirit-and-opportunity/';
export const history = nasa + 'mission/mer-opportunity/';
export const modelSource = nasa + 'resource/spirit-and-opportunity-rover-3d-model/';
export const apolloSource = 'https://www.nasa.gov/image-article/apollo-15-lunar-module-rover/';
export const eyes = 'https://eyes.nasa.gov/apps/solar-system/#/';
export const paths = { home: '', moon: 'moon/', mars: 'mars/', compare: 'compare/', opportunity: 'opportunity/', experiment: 'experiment/' } as const;
export type Page = keyof typeof paths;
export const base = import.meta.env.BASE_URL;
export const link = (page: Page) => base + paths[page];
export const asset = (name: string) => base + 'media/' + name;
export const destinations = {
  moon: {
    name: 'The Moon', number: '01', kind: 'NATURAL SATELLITE', image: 'moon.jpg', alt: 'Earth rising above the Moon’s cratered horizon',
    credit: 'NASA / Apollo 8', source: nasa + 'moon/facts/', eyes: eyes + 'home',
    intro: 'Earth’s only natural satellite is a rocky world marked by impacts. Its surface is blanketed by a fine, abrasive layer of dust and broken rock called regolith.',
    facts: [['Gravity', '17% of Earth’s'], ['Atmosphere', 'Extremely thin exosphere'], ['Surface', 'Craters and dusty regolith'], ['Water ice', 'Permanently shadowed polar regions']],
    places: [{name: 'Hadley–Apennine', tag: 'APOLLO 15 LANDING SITE', body: 'In 1971, Apollo 15 landed between mountains and a winding channel called Hadley Rille. The crew’s lunar rover let them carry instruments and reach more sites, including the edge of the rille.'}],
  },
  mars: {
    name: 'Mars', number: '02', kind: 'TERRESTRIAL PLANET', image: 'mars.jpg', alt: 'A Martian dune photographed by the Curiosity rover',
    credit: 'NASA/JPL-Caltech/MSSS', imageSource: nasa + 'photojournal/curiositys-color-view-of-martian-dune-after-crossing-it/', source: nasa + 'mars/facts/', eyes: eyes + 'mars',
    intro: 'Iron minerals give Mars its rusty color. A thin atmosphere, mostly carbon dioxide, can carry dust across the planet. Polar ice and traces of ancient rivers tell different parts of the planet’s water story.',
    facts: [['Gravity', '38% of Earth’s'], ['Atmosphere', 'Thin, mostly carbon dioxide'], ['Surface', 'Rock, rusty dust and dust storms'], ['Water ice', 'Polar caps and below the surface']],
    places: [
      {name: 'Meridiani Planum', tag: 'OPPORTUNITY LANDING AREA · 2004', body: 'Opportunity touched down inside Eagle Crater on this plain. Rocks and small spheres there held clues to past water.'},
      {name: 'Perseverance Valley', tag: 'OPPORTUNITY FINAL SITE · 2018', body: 'Opportunity sent its last signal from this shallow valley on the western rim of Endeavour Crater.'},
    ],
  },
};
export const parts = [
  {name:'Navigation cameras', text:'Two cameras on the mast viewed the same terrain from slightly different angles. Combining the views helped the team judge distances and plan safer drives.', source:'https://pds-imaging.jpl.nasa.gov/documentation/MER_camsis_v4_9-25-07.pdf'},
  {name:'Solar panels', text:'The wide panels turned sunlight into electricity for the rover and its batteries. Dust on the panels or in the air could cut the power available.', source:mission},
] as const;
export const evidence = {
  panorama: { image:'panorama.jpg', alt:'Opportunity’s last panorama of Perseverance Valley', title:'The last panorama', label:'PERSEVERANCE VALLEY · 2018', credit:'NASA/JPL-Caltech/Cornell/ASU', url:nasa+'resource/opportunity-legacy-pan-true-color/', body:'Opportunity recorded this mosaic from its final site at Endeavour Crater. The unfinished sections mark images it couldn’t complete before the storm.' },
  berries: { image:'berries.jpg', alt:'Hematite spheres photographed in Eagle Crater', title:'Water written in stone', label:'EAGLE CRATER · 2004', credit:'NASA/JPL-Caltech/Cornell', url:nasa+'resource/discovery-served-up-in-a-bowl/', body:'These round grains, nicknamed blueberries, contain hematite. Their chemistry and the surrounding rocks gave scientists evidence that liquid water once altered the site.' },
  selfie: { image:'selfie.jpg', alt:'Opportunity looking down on its solar panels after wind removed much of the dust', title:'When the wind helped', label:'MARCH 2014 · PANCAM', credit:'NASA/JPL-Caltech/Cornell Univ./Arizona State Univ.', url:nasa+'resource/self-portrait-by-freshly-cleaned-opportunity-mars-rover-in-march-2014/', body:'In 2014, wind cleared dust off Opportunity’s panels and helped it collect more light. In 2018, dust suspended in the atmosphere blocked sunlight before it could reach the panels.' },
};
export const rover = {
  id:'opportunity', destination:'mars', image:'model.jpg', model:'mer.glb', status:'Mission complete', source:mission,
  overview:'Opportunity was sent to look for signs of past water on Mars. Built for 90 Martian days, the rover worked for almost 15 Earth years before a planet-wide dust storm cut off its last contact.',
  timeline:[
    ['JAN 2004','Touchdown','Opportunity lands in Eagle Crater at Meridiani Planum.'],
    ['MAR 2004','Clues to ancient water','Hematite spheres and altered rocks reveal a wetter past.'],
    ['JUN 10, 2018','Last contact','A planet-wide dust storm darkens the sky over Perseverance Valley.'],
    ['FEB 2019','Mission ends','NASA ends recovery efforts after the rover does not respond.'],
  ],
  parts, evidence, simulation:{initialBattery:50, dustLoss:0.8, maxOutput:100, demand:45, unitsPerSecond:0.12},
};
export const remarks: Record<Page,string> = {
  home:'I’m Solaris, your archive companion. Pick a world, and I’ll meet you there.',
  moon:'Apollo 15’s crew brought a rover. Even with low gravity, there was a lot of ground to cover.',
  mars:'Opportunity landed at Meridiani Planum. Its final signal came from a different place: Perseverance Valley.',
  compare:'Try imagining the same jump on both worlds. You’d stay in the air longer on the Moon.',
  opportunity:'Opportunity was built for 90 Martian days. The archive has almost 15 years to account for.',
  experiment:'Try turning up the dust. Watch what happens to the sunlight reaching the panels.',
};
type Answer = { question:string; answer:string; source:string; label:string };
const water: Answer = {question:'What did Opportunity find?', answer:'At Eagle Crater, Opportunity found hematite-rich spheres and rocks that had been changed by water. Together, those clues helped show that Mars was once wetter.',source:evidence.berries.url,label:'NASA: Eagle Crater evidence'};
const storm: Answer = {question:'Why did Opportunity go quiet?', answer:'A planet-wide dust storm blocked much of the sunlight Opportunity needed to make electricity. NASA received the last signal on June 10, 2018.',source:history,label:'NASA: Opportunity mission history'};
export const questions:Record<Page,Answer[]> = {
  home:[water,{question:'Where should I start?',answer:'Start with the Mars guide, then follow Opportunity from its landing site to its final valley. The Moon guide is a good next stop if you want to compare the two worlds.',source:link('mars'),label:'Open the Mars guide'}],
  moon:[{question:'Where is the Moon’s ice?',answer:'Some craters near the poles have floors that never see sunlight. In those cold shadows, water ice can survive.',source:destinations.moon.source,label:'NASA Moon Facts'},{question:'Why bring a lunar rover?',answer:'It let the Apollo 15 crew carry tools and samples and travel much farther from the lander.',source:apolloSource,label:'NASA: Apollo 15 rover'}],
  mars:[water,storm],
  compare:[{question:'How does gravity affect a rover?',answer:'A rover has the same mass on either world, but it weighs less on the Moon. That changes how firmly the wheels press against the ground and how much grip they can get.',source:destinations.moon.source,label:'NASA Moon Facts'},{question:'Which world has weather?',answer:'Mars has enough atmosphere for winds to carry dust and sometimes make storms. The Moon’s exosphere is too thin to produce weather like that.',source:destinations.mars.source,label:'NASA Mars Facts'}],
  opportunity:[water,storm,{question:'How could Opportunity judge distance?',answer:parts[0].text,source:parts[0].source,label:'NASA/JPL: Camera specifications'}],
  experiment:[{question:'Why is the battery draining?',answer:'The panels are still making some power, but the rover is using more than they supply. In this model, that happens above 68.75% dust.',source:mission,label:'NASA: Rover power and mission'},storm],
};

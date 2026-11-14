const nasa = 'https://science.nasa.gov/mission/';
const nssdc = 'https://nssdc.gsfc.nasa.gov/';
const record = (id:string) => nssdc+'nmc/spacecraft/display.action?id='+id;

export const sources = {
  archive: nssdc,
  apollo: record('1969-059C'),
  lunarRover: record('1971-063C'),
  alsep: record('1969-099C'),
  surveyor: nasa+'surveyor-3/',
  sojourner: nasa+'mars-pathfinder/',
  mer: nasa+'mars-exploration-rovers-spirit-and-opportunity/',
  viking: nasa+'viking-1/',
  insight: nasa+'insight/',
  ingenuity: nasa+'mars-2020-perseverance/ingenuity-mars-helicopter/',
  dawn: nasa+'dawn/',
  near: nasa+'near-shoemaker/',
  pioneer: nasa+'pioneer-10/',
  kepler: nasa+'kepler/',
} as const;
export const mission = sources.mer;
export const apolloSource = sources.lunarRover;
export const paths = {
  home:'', moon:'moon/', mars:'mars/', compare:'compare/', opportunity:'opportunity/',
  lunar:'lunar-rover/', experiment:'experiment/', story:'story/', collection:'collection/',
} as const;
export type Page = keyof typeof paths;
export const base = import.meta.env.BASE_URL;
export const link = (page:Page) => base+paths[page];
export const asset = (name:string) => base+'media/'+name;

export const destinations = {
  moon: {
    name:'The Moon', kind:'Natural satellite', source:sources.archive,
    intro:'Impact craters, loose surface material, and very low gravity shape how crews travel across the Moon.',
    facts:[['Gravity','17% of Earth’s'],['Atmosphere','Extremely thin exosphere'],['Surface','Craters and loose regolith'],['Water ice','Cold, permanently shadowed regions']],
    places:[{name:'Hadley–Apennine',tag:'Apollo 15',body:'Apollo 15 landed near a winding channel called Hadley Rille. The Lunar Roving Vehicle carried the crew and their equipment beyond the landing site.'}],
  },
  mars: {
    name:'Mars',kind:'Rocky planet',source:sources.archive,
    intro:'Mars has a thin atmosphere that can carry dust. A storm can reduce the sunlight available to solar powered equipment.',
    facts:[['Gravity','38% of Earth’s'],['Atmosphere','Thin, mostly carbon dioxide'],['Surface','Rock and dust storms'],['Water ice','Polar caps and below the surface']],
    places:[
      {name:'Meridiani Planum',tag:'Opportunity landing area',body:'NASA chose this plain because its mineral deposits suggested a wet history. Opportunity explored the rocks at Eagle Crater.'},
      {name:'Endeavour Crater',tag:'Later exploration',body:'Opportunity reached Endeavour Crater after years of driving. It last communicated on June 10, 2018 during a planet-wide dust storm.'},
    ],
  },
};
export const parts = [
  {name:'Navigation cameras',text:'The mast carries cameras for surveying the terrain around the rover.',source:mission},
  {name:'Solar panels',text:'The wide panels turned sunlight into electricity for the rover and its batteries. Dust can cut the power available.',source:mission},
] as const;
export const lunarParts = [
  {name:'Mesh wheels',text:'Four wheels carried the rover and its load across the loose lunar surface.',source:apolloSource},
  {name:'Crew seats',text:'Two astronauts could travel together and carry equipment away from the lander.',source:apolloSource},
] as const;
export const evidence = {
  panorama:{image:'eagle.jpg',alt:'Opportunity’s panorama of Eagle Crater and the surrounding plains',title:'Eagle Crater panorama',credit:'NASA/JPL/Cornell',url:mission,body:'Opportunity’s panoramic camera recorded its landing site and the surrounding plains. The mission studied the rock record and confirmed that water persisted on ancient Mars.'},
  selfie:{image:'selfie.jpg',alt:'Opportunity’s solar panels after wind cleared much of the dust',title:'When the wind helped',credit:'NASA/JPL-Caltech/Cornell Univ./Arizona State Univ.',url:mission,body:'In March 2014, wind removed much of the dust from Opportunity’s solar panels. During the 2018 storm, airborne dust reduced the light reaching them.'},
};
export const rover = {
  id:'opportunity', destination:'mars', image:'opportunity-illustration.jpg', source:mission,
  overview:'NASA sent Opportunity to look for evidence of past water on Mars. The rover explored for more than 14 years and drove about 45 kilometers.',
  timeline:[
    ['Jan 2004','Landing','Opportunity lands at Meridiani Planum.'],
    ['2004','Ancient water','Rock observations help show that liquid water persisted on Mars.'],
    ['Jun 10, 2018','Last contact','A planet-wide dust storm passes over the solar powered rover.'],
  ],
  parts,evidence,simulation:{initialBattery:50,dustLoss:0.8,maxOutput:100,demand:45,unitsPerSecond:0.12},
};
export const remarks:Partial<Record<Page,string>> = {
  home:'I’m Solaris. Open the archive to explore the records, or join Astra in Play Story.',
  moon:'Apollo 15’s crew brought a rover to reach sites beyond the lander.',
  mars:'Opportunity landed at Meridiani Planum. Explore the rover’s mission to see what it found there.',
  compare:'The same object weighs less on the Moon than on Mars.',
  opportunity:'Opportunity helped scientists learn that liquid water persisted on ancient Mars.',
  lunar:'The Lunar Roving Vehicle gave the Apollo 15 crew more room to carry equipment.',
  experiment:'Turn up the dust and watch how much light reaches the panels.',
};
type Answer={question:string;answer:string;source:string;label:string};
const water:Answer={question:'What did Opportunity find?',answer:'The rocks Opportunity studied helped confirm that liquid water persisted on ancient Mars.',source:mission,label:'NASA Spirit & Opportunity'};
const storm:Answer={question:'Why did Opportunity go quiet?',answer:'Opportunity last communicated on June 10, 2018 as a planet-wide dust storm covered its location. The rover relied on solar power.',source:mission,label:'NASA Spirit & Opportunity'};
const moonRover:Answer={question:'Why bring a lunar rover?',answer:'The Lunar Roving Vehicle carried two astronauts and their equipment, allowing them to reach more sites beyond the lander.',source:apolloSource,label:'NASA Lunar Roving Vehicles'};
export const questions:Partial<Record<Page,Answer[]>> = {
  home:[water,moonRover],
  moon:[{question:'Where can ice survive on the Moon?',answer:'Some areas near the poles stay in shadow and remain cold enough for water ice.',source:sources.archive,label:'NASA Space Science Data Coordinated Archive'},moonRover],
  mars:[water,storm],
  compare:[{question:'How does gravity change weight?',answer:'The same object has the same mass in both places. Its weight is lower on the Moon because the Moon’s gravity is weaker.',source:sources.archive,label:'NASA Space Science Data Coordinated Archive'},storm],
  opportunity:[water,storm],
  lunar:[moonRover],
  experiment:[{question:'Why is the battery draining?',answer:'The panels are still making power, but the simulated rover uses more than they supply. This happens above 68.75% dust in the teaching model.',source:mission,label:'NASA rover power and mission'},storm],
};

const nasa = 'https://science.nasa.gov/mission/';
const nssdc = 'https://nssdc.gsfc.nasa.gov/';
const record = id => nssdc + 'nmc/spacecraft/display.action?id=' + id;

export const sources = {
  archive: nssdc,
  apollo: record('1969-059C'),
  lunarRover: record('1971-063C'),
  alsep: record('1969-099C'),
  surveyor: nasa + 'surveyor-3/',
  sojourner: nasa + 'mars-pathfinder/',
  mer: nasa + 'mars-exploration-rovers-spirit-and-opportunity/',
  viking: nasa + 'viking-1/',
  insight: nasa + 'insight/',
  ingenuity: nasa + 'mars-2020-perseverance/ingenuity-mars-helicopter/',
  dawn: nasa + 'dawn/',
  near: nasa + 'near-shoemaker/',
  pioneer: nasa + 'pioneer-10/',
  kepler: nasa + 'kepler/',
};

export const sourceLabels = {
  archive: 'NASA Space Science Data Coordinated Archive',
  apollo: 'NASA Apollo Lunar Modules',
  lunarRover: 'NASA Lunar Roving Vehicles',
  alsep: 'NASA ALSEP Scientific Packages',
  surveyor: 'NASA Surveyor Landers',
  sojourner: 'NASA Sojourner Rover',
  mer: 'NASA Spirit & Opportunity',
  viking: 'NASA Viking 1 & 2 Landers',
  insight: 'NASA Phoenix & InSight Landers',
  ingenuity: 'NASA Ingenuity Helicopter',
  dawn: 'NASA Dawn Spacecraft',
  near: 'NASA NEAR Shoemaker',
  pioneer: 'NASA Pioneer 10 & 11',
  kepler: 'NASA Kepler Space Telescope',
};

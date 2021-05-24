import seedRandom from 'seed-random';

export type AvatarMetadataType = {
  name: string;
  color: string;
};

export const AvatarMetadata: { [name: string]: AvatarMetadataType[] } = {
  brandedPatterns: [
    { name: 'brand_pattern_01', color: '#FFF0DF' },
    { name: 'brand_pattern_02', color: '#FFF0DF' },
    { name: 'brand_pattern_03', color: '#FFF0DF' },
    { name: 'brand_pattern_04', color: '#FFF0DF' },
    { name: 'brand_pattern_05', color: '#FFF0DF' },
    { name: 'brand_pattern_06', color: '#FFF0DF' },
    { name: 'brand_pattern_07', color: '#FFF0DF' },
    { name: 'brand_pattern_08', color: '#FFF0DF' },
    { name: 'brand_pattern_09', color: '#FFF0DF' },
    { name: 'brand_pattern_10', color: '#FFF0DF' },
    { name: 'brand_pattern_11', color: '#FFF0DF' },
    { name: 'brand_pattern_12', color: '#FFF0DF' },
    { name: 'brand_pattern_13', color: '#FFF0DF' },
    { name: 'brand_pattern_14', color: '#FFF0DF' },
    { name: 'brand_pattern_15', color: '#FFF0DF' },
    { name: 'brand_pattern_16', color: '#FFF0DF' },
    { name: 'brand_pattern_17', color: '#FFF0DF' },
    { name: 'brand_pattern_18', color: '#FFF0DF' },
    { name: 'brand_pattern_19', color: '#FFF0DF' },
    { name: 'brand_pattern_20', color: '#FFF0DF' },
  ],
  pets: [
    { name: 'orangecat', color: '#FFE2A1' },
    { name: 'corgi', color: '#D7EBB7' },
    { name: 'neko', color: '#EA4600' },
    { name: 'felix', color: '#B0EAE3' },
    { name: 'ruby', color: '#FFD6CD' },
    { name: 'retriever', color: '#FFDECC' },
    { name: 'bunny', color: '#771c18' },
    { name: 'blackcat', color: '#f0af66' },
    { name: 'puppydog', color: '#96beca' },
  ],
  animals: [
    { name: 'bear', color: '#FFCD96' },
    { name: 'panda', color: '#77C6FF' },
    { name: 'penguin', color: '#FFE2A1' },
    { name: 'greenparrot', color: '#FFE2A1' },
    { name: 'unicorn', color: '#9AAAFF' },
    { name: 'trex', color: '#FFDFB9' },
    { name: 'triceratops', color: '#CFEFA6' },
    { name: 'clownfish', color: '#FDE3C5' },
  ],
  abstractAnimals: [
    { name: 'abstract_turtle', color: '#EBEED7' },
    { name: 'abstract_dog', color: '#F9E6D5' },
    { name: 'abstract_bunny', color: '#EFF6CA' },
    { name: 'abstract_bear', color: '#E1F4FE' },
    { name: 'abstract_dolphin', color: '#E9FEFB' },
    { name: 'abstract_cat', color: '#FFDBCC' },
    { name: 'abstract_horse', color: '#FFEBCC' },
    { name: 'abstract_bird', color: '#E6F4F4' },
    { name: 'abstract_fish', color: '#FFE4CC' },
    { name: 'abstract_frog', color: '#E8F4E3' },
    { name: 'abstract_pig', color: '#FFF0EA' },
    { name: 'abstract_lion', color: '#FFE8CA' },
  ],
  yum: [
    { name: 'pepperoni', color: '#D7EBB7' },
    { name: 'burger', color: '#D7EBB7' },
    { name: 'taco', color: '#FFECD6' },
    { name: 'bakedpotato', color: '#FFD7C0' },
    { name: 'onigiri', color: '#FF835B' },
    { name: 'sandwich', color: '#B6EDFF' },
    { name: 'hotdog', color: '#B6EDFF' },
    { name: 'croissant', color: '#FFEDAE' },
    { name: 'icecream', color: '#FFE2A1' },
    { name: 'donut', color: '#fff5ea' },
    { name: 'cake', color: '#D7EBB7' },
    { name: 'loaf', color: '#FFE6D4' },
    { name: 'croissant_alt', color: '#D7EBB7' },
  ],
  fruitsVeggies: [
    { name: 'tomato', color: '#FFDFD4' },
    { name: 'greenapple', color: '#F9DBC0' },
    { name: 'redapple', color: '#F9DBC0' },
    { name: 'pear', color: '#FFECD0' },
    { name: 'pineapple', color: '#CFF393' },
    { name: 'banana', color: '#e9b9aa' },
    { name: 'broccoli', color: '#FFE2B7' },
    { name: 'avocado', color: '#E6F48B' },
    { name: 'onion', color: '#FFEFD8' },
    { name: 'radish', color: '#FFD9D7' },
  ],
  cosmos: [
    { name: 'cosmos_sun', color: '#DEF7F6' },
    { name: 'cosmos_comet', color: '#7583CC' },
    { name: 'cosmos_moon', color: '#52656A' },
    { name: 'cosmos_mercury', color: '#FA8FA9' },
    { name: 'cosmos_venus', color: '#F4B871' },
    { name: 'cosmos_earth', color: '#BADEFF' },
    { name: 'cosmos_mars', color: '#FFDCD1' },
    { name: 'cosmos_jupiter', color: '#EEC16B' },
    { name: 'cosmos_saturn', color: '#FFF2D1' },
    { name: 'cosmos_uranus', color: '#E0F4FE' },
    { name: 'cosmos_neptune', color: '#5796F5' },
    { name: 'cosmos_pluto', color: '#937669' },
  ],
  misc: [
    { name: 'gingerbread', color: '#BDE4B7' },
    { name: 'snowman', color: '#AFEBDC' },
    { name: 'knight', color: '#C0EEDE' },
    { name: 'poop', color: '#ffd3d3' },
    { name: 'redrobot', color: '#8BE0CC' },
    { name: 'bluerobot', color: '#FFD8C1' },
    { name: 'football', color: '#B4E8E1' },
    { name: 'cup', color: '#fff5ea' },
    { name: 'kettle', color: '#D2FBE7' },
    { name: 'beermug', color: '#77C6FF' },
    // ],
    // nature: [
    { name: 'leaf', color: '#E1F6A5' },
    { name: 'cloud', color: '#C5F4FF' },
    { name: 'cactus', color: '#FFEFC6' },
  ],

  zodiac: [
    { name: 'leo', color: '#b5a559' },
    { name: 'sag', color: '#898346' },
    { name: 'virgo', color: '#f8d0cb' },
    { name: 'ram', color: '#813c31' },
    { name: 'libra', color: '#daceb4' },
    { name: 'gemini', color: '#c2e5b6' },
    { name: 'cancer', color: '#7583CC' },
    { name: 'scorpio', color: '#fead80' },
    { name: 'taurus', color: '#7a8d9b' },
    { name: 'aquarius', color: '#cae0e3' },
    { name: 'pisces', color: '#c2e5b6' },
    { name: 'aries', color: '#582e29' },
  ],
  withCharacters: [
    { name: 'funky', color: '#FFE2A1' },
    { name: 'blobby', color: '#FFE2A1' },
    { name: 'molly', color: '#8785FF' },
    { name: 'tilly', color: '#8785FF' },
    { name: 'sally', color: '#FFE2A1' },
    { name: 'polly', color: '#FFE2A1' },
    { name: 'rolly', color: '#FFE2A1' },
  ],
  // david: [
  //   { name: 'bluebird', color: '#e1f3fe' },
  //   { name: 'bluepup', color: '#e1f3fe' },
  //   { name: 'fox', color: '#fffae0' },
  //   { name: 'jackal', color: '#fbeee4' },
  //   { name: 'kitty', color: '#f9fae5' },
  //   { name: 'orc', color: '#eaecf5' },
  //   { name: 'redpup', color: '#e8f8f6' },
  //   { name: 'ruff', color: '#fbeee4' },
  //   { name: 'shaggydog', color: '#f7eae8' },
  //   { name: 'puppy', color: '#fef3e1' },
  // ]
};

export const randomSectionAvatar = (sectionName: string, seed?: string) => {
  const sectionAvatars = AvatarMetadata[sectionName];
  let pos = 0;
  // calling seedRandom with undefined seed will return the
  // same thing every time, so we need to check
  // if we have a seed passed in so if we dont we can
  // have the default random behavior take over.
  if (seed) {
    pos = seedRandom(seed)();
  } else {
    pos = seedRandom()();
  }
  const randomAvatar = sectionAvatars[Math.floor(pos * sectionAvatars.length)];

  return randomAvatar.name;
};

// Takes in the avatar section to select from
// and the user id and returns an avatar
export const getAvatarFromUserId = (sectionName: string, userId: string) => {
  // user id should be a parsable string, but if not, just default to 0
  let parsedSeed = parseInt(userId, 10);
  if (isNaN(parsedSeed)) {
    parsedSeed = 0;
  }

  const sectionAvatars = AvatarMetadata[sectionName];
  const randomAvatar = sectionAvatars[parsedSeed % sectionAvatars.length];
  return randomAvatar.name;
};

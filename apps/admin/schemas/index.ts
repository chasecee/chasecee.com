import project from './project-schema'
import page from './page-schema'
import skills from './skills-schema';
import {
  embedSchema as embed,
  spotifySchema as spotify,
  columnsSchema as columns,
  withIncomingReferences,
} from '@chasecee/sanity-kit/studio';
import siteMini from './site-mini-schema';
import music from "./music-schema";

const incomingTypes = [
  { type: "page" },
  { type: "project" },
  { type: "music" },
];

const schemas = [
  withIncomingReferences(project, { types: incomingTypes }),
  withIncomingReferences(page, { types: incomingTypes }),
  skills,
  embed,
  spotify,
  siteMini,
  withIncomingReferences(music, { types: incomingTypes }),
  columns,
];

export default schemas;

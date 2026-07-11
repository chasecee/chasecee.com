import project from './project-schema'
import page from './page-schema'
import skills from './skills-schema';
import { embedSchema as embed, spotifySchema as spotify, columnsSchema as columns } from '@chasecee/sanity-kit/studio';
import siteMini from './site-mini-schema';
import music from "./music-schema";

const schemas = [project, page, skills, embed, spotify, siteMini, music, columns];

export default schemas;
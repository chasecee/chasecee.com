export const keyColorLevels = {
  4: [
    "HSLA(357,60%,32%,1)", 
    "HSLA(35,91%,22%,1)", 
    "HSLA(135,70%,23%,1)", 
    "HSLA(172,85%,20%,1)", 
    "HSLA(211,86%,27%,1)", 
    "HSLA(274,49%,35%,1)", 
    "HSLA(335,57%,27%,1)", 
  ],
  8: [
    "HSLA(358,100%,69%,1)", 
    "HSLA(39,90%,50%,1)", 
    "HSLA(131,43%,57%,1)", 
    "HSLA(174,90%,41%,1)", 
    "HSLA(210,100%,66%,1)", 
    "HSLA(275,80%,71%,1)", 
    "HSLA(341,90%,67%,1)", 
  ],
} as const;

export type PaletteLevel = keyof typeof keyColorLevels;

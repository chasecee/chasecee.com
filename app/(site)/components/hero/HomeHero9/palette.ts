export const keyColorLevels = {
  4: [
    "HSLA(357,60%,32%,1)", // red
    "HSLA(35,91%,22%,1)", // amber
    "HSLA(135,70%,23%,1)", // green
    "HSLA(172,85%,20%,1)", // teal
    "HSLA(211,86%,27%,1)", // blue
    "HSLA(274,49%,35%,1)", // purple
    "HSLA(335,57%,27%,1)", // pink
  ],
  8: [
    "HSLA(358,100%,69%,1)", // red
    "HSLA(39,90%,50%,1)", // amber
    "HSLA(131,43%,57%,1)", // green
    "HSLA(174,90%,41%,1)", // teal
    "HSLA(210,100%,66%,1)", // blue
    "HSLA(275,80%,71%,1)", // purple
    "HSLA(341,90%,67%,1)", // pink
  ],
} as const;

export type PaletteLevel = keyof typeof keyColorLevels;

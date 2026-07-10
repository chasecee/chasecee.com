import type { DetailedHTMLProps, HTMLAttributes } from "react";

type DotLottiePlayerProps = DetailedHTMLProps<
  HTMLAttributes<HTMLElement> & {
    src?: string;
    autoplay?: boolean;
    loop?: boolean;
    mode?: "normal" | "bounce";
    speed?: number;
    background?: string;
    direction?: 1 | -1;
    hover?: boolean;
    intermission?: number;
    renderer?: "svg" | "canvas";
  },
  HTMLElement
>;

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "dotlottie-player": DotLottiePlayerProps;
    }
  }
}

declare module "idiomorph" {
  type MorphCallback = (oldNode: Node, newNode: Node) => boolean | void;

  export const Idiomorph: {
    morph: (
      oldNode: Element,
      newContent: Element | string,
      config?: {
        morphStyle?: "outerHTML" | "innerHTML";
        callbacks?: {
          beforeNodeMorphed?: MorphCallback;
        };
      },
    ) => Node[];
  };
}

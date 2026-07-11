import sanityClient from "./sanityClient";
import {
  createImageUrlBuilder,
  type SanityImageSource,
} from "@sanity/image-url";

const builder = createImageUrlBuilder(sanityClient);

export default function urlFor(source: SanityImageSource) {
  return builder.image(source).auto("format");
}

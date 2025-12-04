import React from 'react'
import sanityClient from './sanityClient'
import { createImageUrlBuilder } from '@sanity/image-url'

const builder = createImageUrlBuilder(sanityClient)

export default function urlFor(source: string) {
  return builder.image(source).auto('format')
}
import React from 'react'
import sanityClient from './sanityClient'
import imageUrlBuilder from '@sanity/image-url'

const builder = imageUrlBuilder(sanityClient)

export default function urlFor(source: string) {
  return builder.image(source).auto('format')
}
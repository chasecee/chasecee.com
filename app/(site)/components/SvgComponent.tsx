"use client"
import React from 'react'
import { createClient } from "next-sanity";

const client = createClient({
    projectId: "lgevplo8",
    dataset: "production",
    apiVersion: "2023-07-12",
    useCdn: true,   
})

export default function SvgComponent() {
  const [svgCode, setSvgCode] = React.useState('')

  React.useEffect(() => {
    client
      .fetch('*[_type == "project"]{svgcode}')
      .then((data) => setSvgCode(data[0].svgcode.code))
      .catch((error) => console.error(error))
  }, [])

  return <div dangerouslySetInnerHTML={{ __html: svgCode }} />
}
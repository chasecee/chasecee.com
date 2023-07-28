import { getPage } from "@/sanity/sanity-utils"
import Container from "../components/Container"
import { PortableText } from "@portabletext/react"
import CirclePacking from "../components/CirclePacking" // Import your component

type PageProps = {
  title: string,
  subtitle?: string,
  content: any
}

type Props = {
  params: { slug: string }
}

export const runtime = 'edge'; 

export default async function Page({ params }: Props) {
  const page: PageProps = await getPage(params.slug)
  
  return (
    <div>
      <Container>
        <div className="prose dark:prose-invert mx-auto">
          <header>
            <h1>{page.subtitle ? page.subtitle : page.title}</h1>
          </header>
          <div>
            <PortableText value={page.content} />
          </div>
          {params.slug === 'about' && <CirclePacking />}
        </div>
      </Container>
    </div>
  )
}

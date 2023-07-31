import { getPage } from "@/sanity/sanity-utils"
import Container from "../components/Container"
import { PortableText } from "@portabletext/react"
import Skills from "../components/Skills"

type Block = {
  _type: string,
  // add any other properties that exist on your blocks
}

type PageProps = {
  title: string,
  subtitle?: string,
  content: Block[]
}

type Props = {
  params: { slug: string }
}

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
            {page.content.map((block: Block, index: number) => {
              if (block._type === 'skills') {
                return <Skills key={index} /* pass any props you need here */ />
              }

              return (
                <PortableText 
                  key={index} 
                  value={[block]}
                  components={{
                    // Define other custom types if needed
                  }}
                />
              )
            })}
          </div>
        </div>
      </Container>
    </div>
  )
}


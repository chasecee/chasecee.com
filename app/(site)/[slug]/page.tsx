import { getPage } from "@/sanity/sanity-utils"
import Container from "../components/Container"
import { PortableText } from "@portabletext/react"

type Props = {
    params: { slug: string }
}
export default async function Page({ params }: Props) {
    const page = await getPage(params.slug)
    
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
                </div>
            </Container>
        </div>
        )
}
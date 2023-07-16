import Container from "@/app/(site)/components/Container";
import { getProject } from "@/sanity/sanity-utils";
import { PortableText } from "@portabletext/react";

type Props = {
    params: { project: string };
}
export default async function Project( { params }: Props ) {
    const slug = params.project;
    const project = await getProject(slug);
    return (
    <div>
        <Container>
            <div className="prose dark:prose-invert mx-auto">
                <header><h1>{project.name}</h1></header>
                <div>
                    <PortableText value={project.content} />
                </div>
            </div>
        </Container>
    </div>
    )
}
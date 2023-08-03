import Container from "@/app/(site)/components/Container";
import { getProject } from "@/sanity/sanity-utils";
import Image from "next/image";
import { PortableText } from "@portabletext/react";
import urlFor from "@/sanity/sanity.image";

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
                {project.image && (
                    <Image
                      src={urlFor(project.image).width(622).height(622).dpr(1.5).url()}
                      alt={project.name}
                      width={622}
                      height={622}
                      className="object-cover rounded-xl"
                    />
                  )}
                <div>
                    <PortableText value={project.content} />
                </div>
            </div>
        </Container>
    </div>
    )
}
const project = {
    name: 'project',
    title: 'Projects',
    type: 'document',
    fields: [
        {
            name: 'name',
            title: 'Name',
            type: 'string'
        },
        {
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: { source: 'name' }
        },
        {
            name: 'subtitle',
            title: 'Subtitle',
            type: 'string'
        },
        {
            name: 'image',
            title: 'Image',
            type: 'image',
            options: { hotspot: true },
            fields: [
                {
                    name: 'alt',
                    title: 'Alt',
                    type: 'string'
                }
            ]
        },
        {
            type: 'code',
            name: 'svgcode',
            title: 'SVG Code for Logo',
            options: {
              language: 'xml', // SVG is XML-based
            },
        },
        {
            name: 'color',
            title: 'Color',
            type: 'color',
        },
        {
            name: 'logo',
            title: 'Logo',
            type: 'image',
            options: { hotspot: true },
            fields: [
                {
                    name: 'alt',
                    title: 'Alt',
                    type: 'string'
                }
            ]
        },
        {
            name: 'url',
            title: 'URL',
            type: 'url'
        },
        {
            name: 'content',
            title: 'Content',
            type: 'array',
            of: [{ type: 'block' }],
        },

    ]
}
export default project;
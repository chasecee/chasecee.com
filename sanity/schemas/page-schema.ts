const page = {
    name: 'page',
    title: 'Pages',
    type: 'document',
    fields: [
        {
            name: "title",
            title: 'Title',
            type: 'string'
        },
        {
            name: "subtitle",
            title: 'Subtitle',
            type: 'string'
        },
        {
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: {
                source: 'title',
                maxLength: 96
            }
        },
        {
            name: 'content',
            title: "Content",
            type: "array",
            of: [
                { type: "block" },
                { type: 'skills' },
            ],
        }
    ]
}
export default page;
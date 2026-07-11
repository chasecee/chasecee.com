export const PROJECT_QUERY = `*[_type == "project" && slug.current == $slug][0]{
  _id,
  _type,
  "isDraft": _id in path("drafts.**") || _originalId in path("drafts.**"),
  _createdAt,
  name,
  "slug": slug.current,
  "image": image.asset->url,
  subtitle,
  svgcode,
  url,
  archived,
  siteMini,
  orderRank,
  "content": content[]{
    ...,
    markDefs[]{
      ...,
      _type == "internalLink" => {
        "slug": @.reference->slug.current,
        "refType": @.reference->_type
      },
      _type == "link" => {
        ...,
      }
    }
  }
}`;

# Cleanup Orphaned useCustomComponent Field

## 1. Find documents with orphaned field

```groq
*[_type == "project" && defined(useCustomComponent)]
```

## 2. Update documents to remove field

```groq
*[_type == "project" && defined(useCustomComponent)] {
  _id,
  name,
  useCustomComponent
}
```

## 3. After cleaning data, remove this from project-schema.ts:

```js
{
  title: "Use Custom Component (Legacy)",
  name: "useCustomComponent",
  type: "boolean",
  description: "Legacy field - will be removed",
  hidden: true,
},
```

## Current Custom Component Logic

Projects use slug-based custom components:

- `"loop-player"` → LoopPlayerCard
- `"custom-dashboard"` → CustomDashboardCard
- Everything else → Standard card with color/SVG

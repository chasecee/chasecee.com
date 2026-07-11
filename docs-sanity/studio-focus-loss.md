# Studio input focus loss while typing

## Cause

`DocumentLayout` called `useEditState(..., "low")` in the same component that wraps `props.renderDefault()`. Low-priority edit state updates re-rendered the form tree periodically and stole focus.

## Fix

1. Keep layout styles / `renderDefault` in `DocumentLayout`.
2. Move `useEditState` + `setActiveDocument` into a sibling that returns `null` (`ActiveDocumentTracker`).
3. Optionally stabilize custom navbar `__internal_actions` so the Preview action is not recreated every render (`StudioNavbar` + `useMemo` on action names).

## Files

- `studio/plugins/preview-navbar/DocumentLayout.tsx`
- `studio/plugins/preview-navbar/StudioNavbar.tsx`
- `studio/lib/activeDocument.ts`

## Rule

Do not subscribe to document edit state in any Studio component that wraps `renderDefault` for the form.

## 2024-03-01 - Search Input UX
**Learning:** Search inputs that can be cleared via a button should retain focus after clearing to support uninterrupted keyboard navigation, and should natively support the Escape key for clearing.
**Action:** Always add a ref to search inputs to restore focus when a clear button is clicked, and implement an `onKeyDown` handler for the Escape key.

## 2024-03-03 - Search Results Empty State UX
**Learning:** When search returns no results, a completely blank container or page without feedback creates confusion and a dead-end experience.
**Action:** Always implement a helpful empty state displaying a clear message ("No results found") and possibly repeating the search term to provide continuous context and feedback.

## 2024-05-15 - Async Action Loading Feedback
**Learning:** Adding a small visual indicator (like a loading spinner) combined with an `aria-busy` attribute significantly improves user understanding of background processes and increases accessibility for screen readers.
**Action:** Always add a loading icon and the `aria-busy={isLoading}` attribute to buttons that trigger asynchronous server actions.
## 2024-05-20 - Clear Visual Interaction States
**Learning:** For large clickable areas (like recipe cards), users expect visual feedback upon hovering or focusing. Relying only on pointer cursor changes is often insufficient and lacks a "delightful" feel. Furthermore, screen reader and keyboard users need explicit focus outlines when entire blocks act as links.
**Action:** Always add interactive styles like subtle shadows and lift (`hover:-translate-y-1 hover:shadow-lg`) for large clickable cards. Ensure keyboard accessibility by wrapping the card content in an element with `focus-visible:ring-2` to clearly display focus state without breaking standard mouse interaction styling.

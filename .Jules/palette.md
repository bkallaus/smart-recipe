## 2024-03-01 - Search Input UX
**Learning:** Search inputs that can be cleared via a button should retain focus after clearing to support uninterrupted keyboard navigation, and should natively support the Escape key for clearing.
**Action:** Always add a ref to search inputs to restore focus when a clear button is clicked, and implement an `onKeyDown` handler for the Escape key.

## 2024-03-03 - Search Results Empty State UX
**Learning:** When search returns no results, a completely blank container or page without feedback creates confusion and a dead-end experience.
**Action:** Always implement a helpful empty state displaying a clear message ("No results found") and possibly repeating the search term to provide continuous context and feedback.

## 2024-05-15 - Async Action Loading Feedback
**Learning:** Adding a small visual indicator (like a loading spinner) combined with an `aria-busy` attribute significantly improves user understanding of background processes and increases accessibility for screen readers.
**Action:** Always add a loading icon and the `aria-busy={isLoading}` attribute to buttons that trigger asynchronous server actions.
## 2024-05-20 - Interactive Card Elements UX
**Learning:** Large clickable areas, such as recipe cards, lack clear interactive cues without explicit visual feedback, making keyboard navigation and general interaction less accessible.
**Action:** Always implement explicit visual feedback for interactive card elements, including hover states (e.g., `hover:shadow-lg hover:-translate-y-1`) and clear keyboard focus outlines (e.g., `focus-visible:ring-2`) to ensure accessibility and better UX.

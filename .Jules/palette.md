## 2024-03-01 - Search Input UX
**Learning:** Search inputs that can be cleared via a button should retain focus after clearing to support uninterrupted keyboard navigation, and should natively support the Escape key for clearing.
**Action:** Always add a ref to search inputs to restore focus when a clear button is clicked, and implement an `onKeyDown` handler for the Escape key.

## 2024-03-03 - Search Results Empty State UX
**Learning:** When search returns no results, a completely blank container or page without feedback creates confusion and a dead-end experience.
**Action:** Always implement a helpful empty state displaying a clear message ("No results found") and possibly repeating the search term to provide continuous context and feedback.

## 2024-03-05 - Async Mutation Feedback UX
**Learning:** Async mutations missing visual feedback (spinners) and accessibility attributes (`aria-busy`) lead to poor user experience, as users are unsure if an action is processing.
**Action:** Always add `aria-busy={isLoading}` and a visual loading indicator (e.g., `<Loader2 className="animate-spin" />`) to buttons triggering async actions to ensure users and screen readers are informed of the loading state.

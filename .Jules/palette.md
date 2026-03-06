## 2024-03-01 - Search Input UX
**Learning:** Search inputs that can be cleared via a button should retain focus after clearing to support uninterrupted keyboard navigation, and should natively support the Escape key for clearing.
**Action:** Always add a ref to search inputs to restore focus when a clear button is clicked, and implement an `onKeyDown` handler for the Escape key.

## 2024-03-03 - Search Results Empty State UX
**Learning:** When search returns no results, a completely blank container or page without feedback creates confusion and a dead-end experience.
**Action:** Always implement a helpful empty state displaying a clear message ("No results found") and possibly repeating the search term to provide continuous context and feedback.

## 2024-05-18 - Form Accessibility with React Hook Form
**Learning:** When using reusable input components (like `InputWithLabel`) inside `react-hook-form` arrays or regular form sections without explicit `id` values, screen readers fail to associate labels with their corresponding inputs, and clicking labels won't focus the inputs.
**Action:** Always generate a unique accessible id for forms using `React.useId()` as a fallback when `props.id` or `props.name` is missing to ensure proper label association.

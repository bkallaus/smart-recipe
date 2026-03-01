## 2024-03-01 - Search Input UX
**Learning:** Search inputs that can be cleared via a button should retain focus after clearing to support uninterrupted keyboard navigation, and should natively support the Escape key for clearing.
**Action:** Always add a ref to search inputs to restore focus when a clear button is clicked, and implement an `onKeyDown` handler for the Escape key.

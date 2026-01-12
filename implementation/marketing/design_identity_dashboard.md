# Dashboard & Chat Design Identity

This document defines the interface design and user experience of the MedBax Dashboard, specifically the AI healthcare companion chat.

## Functional Identity
**"The Empathetic Clinical Interface"**
While the landing page focus on "Superhuman" capability, the dashboard transitions into a functional workspace that balances advanced RAG (Retrieval-Augmented Generation) with ease of use for patient health management.

## Visual Language

### 1. Continuity of Marketing Aesthetic
- **Fonts:** Retains `Kalice Regular` for greetings ("Hi there, User") and `Inter` for all technical messaging.
- **Glassmorphism:** The input area and sidebar components use `backdrop-blur-xl` and semi-transparent backgrounds (`white/5` in dark mode) to maintain a consistent depth.
- **Micro-interactions:** Animated slide-ins for messages (`animate-slide-in-left/right`) and typing indicators provide immediate feedback.

### 2. Information Architecture
The dashboard is designed for high-density information retrieval without clutter.

- **The Chat Canvas:** Centered, max-width (3xl) to maintain focus.
- **Dual-Panel System:**
  - **Left Sidebar:** Collapsible chat history.
  - **Right Sidebar (Dynamic):** PDF Viewer/Source display, allowing side-by-side reading of AI answers and medical documents.

### 3. RAG-Specific Design Elements
- **Citations:** Inline links (e.g., `[Source: X, Page: Y]`) are styled with indigo backgrounds and external link icons, making them feel like interactive "evidence."
- **Source Badges:** Deduplicated sources are shown at the bottom of messages with snippets, providing transparency into the AI's reasoning.
- **Knowledge Base (KB) Selector:** A prominent, database-themed selector in the chat input to define the context of the medical query.

### 4. Interactive Components
- **The Modern Input:** A floating "pod" with blurred backgrounds, integrated file uploads, and a "Usage Badge" (Zap icon) to track query limits.
- **Markdown Support:** Full support for structured medical data (lists, bold text, headers) to make complex diagnoses readable.
- **Empty State Prompts:** Grid of "Common Prompts" using cards that mirror the landing page's aesthetic (rounded corners, subtle borders).

---
*Derived from: [ChatInterface.tsx](file:///c:/personalData/devProjects/saas-medical/src/components/chat/ChatInterface.tsx) and [chat/page.tsx](file:///c:/personalData/devProjects/saas-medical/src/app/(dashboard)/dashboard/chat/page.tsx)*

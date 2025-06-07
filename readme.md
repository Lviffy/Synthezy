<h1 align="center">
	<a href="">
		Synthezy
	</a>
</h1>

<h4 align="center">
  Synthezy is a collaborative drawing tool built with React and Vite, Express, and Socket.IO, designed for creating diagrams, sketches, and illustrations in real-time.
</h4>

<p align="center">
	<a href="">Live demo</a>
	•
	<a href="">Download</a>
</p>

<div align="center">
	<img src="" />
</div>

**Feature Documentation: Team Whiteboard with AI-Boosted Ideation**

---

### 1. Canvas Tools
**Description**: Provides users with basic but essential drawing and layout tools for creative ideation.

- **Freehand Drawing**: Smooth pen tool for sketching ideas freely.
- **Shapes**: Add rectangles, circles, triangles, and custom shapes.
- **Arrows & Connectors**: Draw directional flow with ease.
- **Sticky Notes**: Add color-coded notes with rich text formatting.
- **Text Tool**: Type anywhere on the canvas with various font options.
- **Navigation**: Zoom in/out, pan using mouse/touchpad or keyboard shortcuts.

---

### 2. Real-Time Collaboration
**Description**: Enables live collaboration for teams with visibility on each user's activity.

- **Multi-User Editing**: Multiple users can draw/edit simultaneously.
- **User Cursors**: Distinct cursors with usernames for live presence.
- **Comments & Reactions**: Add threaded comments and emoji reactions.
- **Live Sync**: Instant board updates using WebSockets.

---

### 3. AI-Powered Enhancements (Pro)
**Description**: AI tools to boost creativity, reduce clutter, and provide smart assistance.

- **Summarize Board**: Generate concise summaries of the board contents.
- **Text to Diagram**: Turn text instructions into structured visuals like flowcharts and trees.
- **Brainstorm Helper**: Generate idea bubbles or suggestions based on a prompt.
- **Auto-Layout**: Organize scattered elements into clean structures.
- **Explain Canvas**: Ask contextual questions (e.g., "What is this process about?") and get intelligent answers.

---

### 4. Board Management
**Description**: Tools to organize, duplicate, and track changes to whiteboards.

- **Create/Clone Boards**: Start fresh or duplicate existing boards.
- **Folder Organization**: Sort boards into folders and add custom tags.
- **Version History**: Track changes and roll back to previous states.

---

### 5. Access Control
**Description**: Control who can see, edit, or share the boards.

- **Public/Private Boards**: Toggle visibility per board.
- **Role-Based Permissions**: Assign roles (viewer/editor/admin).
- **Team Invites**: Invite collaborators via email.

---

### 6. Export & Sharing
**Description**: Save or share work outside the platform.

- **Export Formats**: Download boards as PDF, PNG, or SVG.
- **Share Links**: Generate public or private links.
- **Embed Code**: Embed boards into other platforms/documents.

---

### 7. Growth & Extensibility (Planned)
**Description**: Future-facing features to enhance user engagement and extend the platform.

- **Prebuilt Templates**: Ready-made boards for common use-cases (e.g., sprint planning, user flows).
- **Marketplace**: Community-created shapes/templates.
- **Integrations**: Slack, Notion, Zoom, Google Meet support.
- **Analytics**: Engagement heatmaps, time spent, idea contribution scores.
- **Session Replay**: Timeline of all board interactions for review.

---

### 8. Tech Stack
**Frontend**: React.js with JSX, Tailwind CSS, Zustand, Konva.js

**Backend**: Node.js, PostgreSQL (via Supabase)

**Realtime**: WebSockets (Socket.IO or Liveblocks)

**AI Integration**: OpenAI API or custom LLM microservice

**Authentication**: Supabase Auth or Clerk

**Deployment**: Vercel (frontend), Railway/Fly.io (backend), AWS (storage)
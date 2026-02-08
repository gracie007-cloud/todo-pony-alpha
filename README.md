# Daily Task Planner

A modern, feature-rich daily task planner built with Next.js 16, featuring a beautiful UI with smooth animations, dark/light theme support, and comprehensive task management capabilities.

## Features

### Task Management
- ✅ Create, edit, and delete tasks
- ✅ Task completion toggle with animations
- ✅ Priority levels (none, low, medium, high, urgent)
- ✅ Due dates with time support
- ✅ Subtasks with progress tracking
- ✅ Task descriptions
- ✅ Recurring tasks support
- ✅ Task history tracking

### Organization
- ✅ Multiple lists with custom colors and emojis
- ✅ Labels/tags with custom colors
- ✅ Filter by list, label, or priority
- ✅ Group tasks by date, priority, or list

### Views
- ✅ **Today** - Tasks due today
- ✅ **Next 7 Days** - Tasks due in the coming week
- ✅ **Upcoming** - All future tasks
- ✅ **All Tasks** - Complete task overview

### Search
- ✅ Full-text search across tasks
- ✅ Search by name, description, list, and labels

### UI/UX
- ✅ Dark/Light theme with system preference detection
- ✅ Smooth animations with Framer Motion
- ✅ View Transitions API support
- ✅ Responsive design for mobile and desktop
- ✅ Swipe gestures for task completion (mobile)
- ✅ Reduced motion support for accessibility

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **Database**: SQLite with better-sqlite3
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Language**: TypeScript
- **Package Manager**: Bun

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (app)/             # Authenticated app routes
│   │   ├── today/         # Today view
│   │   ├── week/          # Next 7 days view
│   │   ├── upcoming/      # Upcoming tasks view
│   │   ├── all/           # All tasks view
│   │   ├── list/[id]/     # List detail view
│   │   └── label/[id]/    # Label detail view
│   └── api/               # RESTful API routes
├── components/
│   ├── animations/        # Animation components
│   ├── common/            # Shared UI components
│   ├── dialogs/           # Modal dialogs
│   ├── forms/             # Form components
│   ├── layout/            # Layout components
│   ├── sidebar/           # Sidebar navigation
│   ├── tasks/             # Task-related components
│   └── ui/                # Base UI components (shadcn)
├── lib/
│   ├── db/                # Database setup and repositories
│   ├── store/             # Application state management
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
└── __tests__/             # Test files
```

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- SQLite3

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd todo-pony-alpha
```

2. Install dependencies:
```bash
bun install
```

3. Start the development server:
```bash
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Script | Description |
|--------|-------------|
| `bun dev` | Start development server with Turbopack |
| `bun build` | Build for production |
| `bun start` | Start production server |
| `bun lint` | Run ESLint |
| `bun test` | Run tests |

## Database Schema

The application uses SQLite with the following main tables:

- **tasks** - Task records with priority, dates, and recurrence
- **lists** - User-defined task lists
- **labels** - Tags for categorizing tasks
- **subtasks** - Subtask items for tasks
- **task_labels** - Many-to-many relationship between tasks and labels
- **task_history** - Audit trail for task changes
- **reminders** - Task reminder settings
- **attachments** - File attachments for tasks

See [`docs/database-schema.md`](docs/database-schema.md) for detailed schema documentation.

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/tasks` | GET, POST | List/create tasks |
| `/api/tasks/[id]` | GET, PUT, DELETE | Get/update/delete task |
| `/api/tasks/[id]/subtasks` | GET, POST | List/create subtasks |
| `/api/tasks/[id]/history` | GET | Get task history |
| `/api/tasks/[id]/reminders` | GET, POST | List/create reminders |
| `/api/tasks/[id]/attachments` | GET, POST | List/create attachments |
| `/api/lists` | GET, POST | List/create lists |
| `/api/lists/[id]` | GET, PUT, DELETE | Get/update/delete list |
| `/api/labels` | GET, POST | List/create labels |
| `/api/labels/[id]` | GET, PUT, DELETE | Get/update/delete label |

## Testing

The project includes comprehensive tests:

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch
```

Test coverage includes:
- API route tests
- Component tests
- Repository tests
- Integration tests
- Utility function tests

## Known Limitations

1. **Single-user application** - No authentication/authorization system
2. **Local database** - SQLite is not suitable for distributed deployments
3. **No real-time sync** - Changes require page refresh in other tabs
4. **File attachments** - Stored locally, not suitable for production without cloud storage

## Browser Support

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+
- Mobile browsers with touch support

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

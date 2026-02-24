// Define the structure of a single Task (Issue)
export interface Issue {
  id: number | string;
  title: string;
  description: string;
  dueDate?: string | null;
  createdAt?: string;
  positionInColumn?: number;
  creatorId?: string;
  assigneeId?: string | null;
}

// Define the structure of a Column
export interface Column {
  id: number | string;
  name: string;
  description?: string;
  position?: number;
  issues: Issue[];
}

// Initial Demo Data with explicit types
export const INITIAL_DEMO_DATA: Column[] = [
  {
    id: 1,
    name: "ToDo",
    description: "Tasks ready to be started",
    issues: [
      {
        id: "demo-101",
        title: "Design UI wireframes",
        description: "Create initial design wireframes.",
        dueDate: "2025-03-10",
      },
      {
        id: "demo-102",
        title: "Implement RBAC",
        description: "Set up Role-Based Access Control.",
        dueDate: "2025-04-01",
      },
    ],
  },
  {
    id: 2,
    name: "In Progress",
    description: "Tasks currently being worked on",
    issues: [
      {
        id: "demo-201",
        title: "Auth0 Integration",
        description: "Finalize the login flow.",
        dueDate: "2025-03-20",
      },
    ],
  },
  {
    id: 3,
    name: "Testing",
    description: "Tasks waiting for QA review",
    issues: [
      {
        id: "demo-301",
        title: "Bug Fix: Drag & Drop",
        description: "Fix flickering issues.",
        dueDate: "2025-03-05",
      },
    ],
  },
  {
    id: 4,
    name: "Done",
    description: "Completed tasks",
    issues: [
      {
        id: "demo-401",
        title: "Initial Project Setup",
        description: "Create React app.",
        dueDate: "2025-02-20",
      },
    ],
  },
];

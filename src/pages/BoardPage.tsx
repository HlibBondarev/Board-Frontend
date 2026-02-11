import { Box, Container, Typography } from "@mui/material";
import Column from "../components/Column";
import { type Column as ColumnType } from "../features/board/boardSlice";

// Temporary mock data to test the UI before connecting to the real API
const MOCK_COLUMNS: ColumnType[] = [
  {
    id: 1,
    name: "To Do",
    description: "Tasks to be started",
    position: 1,
    userId: "user-1",
    issues: [
      {
        id: 101,
        title: "Setup Project Architecture",
        description: "Implement Redux slices and Axios instance",
        dueDate: "2025-02-15T10:00:00",
        createdAt: new Date().toISOString(),
        positionInColumn: 1,
        columnId: 1,
        creatorId: "user-1",
      },
      {
        id: 102,
        title: "Design UI Mockups",
        description: "Create Figma designs for the main board and modals",
        dueDate: "2024-01-10T10:00:00", // Overdue example
        createdAt: new Date().toISOString(),
        positionInColumn: 2,
        columnId: 1,
        creatorId: "user-1",
      },
    ],
  },
  {
    id: 2,
    name: "In Progress",
    description: "Tasks currently being worked on",
    position: 2,
    userId: "user-1",
    issues: [
      {
        id: 103,
        title: "Integrate MUI Components",
        description: "Replace standard HTML tags with Material UI",
        createdAt: new Date().toISOString(),
        positionInColumn: 1,
        columnId: 2,
        creatorId: "user-1",
      },
    ],
  },
  {
    id: 3,
    name: "Done",
    description: "Completed tasks",
    position: 3,
    userId: "user-1",
    issues: [],
  },
];

const BoardPage = () => {
  return (
    <Box
      sx={{
        backgroundColor: "#ebedef",
        minHeight: "100vh",
        pt: 4,
        pb: 4,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Container maxWidth={false}>
        <Typography variant="h4" fontWeight="700" sx={{ mb: 4, px: 1 }}>
          Product Roadmap
        </Typography>

        {/* Horizontal scrollable container for columns */}
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            overflowX: "auto",
            pb: 2,
            "&::-webkit-scrollbar": { height: "8px" },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#ccc",
              borderRadius: "4px",
            },
          }}
        >
          {MOCK_COLUMNS.map((col) => (
            <Column key={col.id} column={col} />
          ))}
        </Box>
      </Container>
    </Box>
  );
};

export default BoardPage;

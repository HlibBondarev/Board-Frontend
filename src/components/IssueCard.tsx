import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
  Tooltip,
} from "@mui/material";
import { CalendarToday } from "@mui/icons-material";
import dayjs from "dayjs";
import { type Issue } from "../features/board/boardSlice";
import { useDispatch, useSelector } from "react-redux";
import { setFilterAssignee } from "../features/board/boardSlice";
import { type RootState } from "../app/store";
/* 1. Import Draggable */
import { Draggable } from "@hello-pangea/dnd";

interface Props {
  issue: Issue;
  index: number; // 2. Add index prop
}

/**
 * Function to generate a consistent color based on a string (user ID or Name)
 * @param string - The input string to hash
 * @returns A hex color string
 */
const stringToColor = (string: string) => {
  let hash = 0;
  let i;

  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = "#";

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }

  return color;
};

const IssueCard = ({ issue, index }: Props) => {
  // Check if the deadline has already passed
  const isOverdue = issue.dueDate
    ? dayjs().isAfter(dayjs(issue.dueDate))
    : false;

  const dispatch = useDispatch();
  const activeFilterId = useSelector(
    (state: RootState) => state.board.filterAssigneeId,
  );

  const isSelected = activeFilterId === issue.assigneeId;

  const handleAssigneeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (issue.assigneeId && issue.assigneeName) {
      // Pass both ID and Name to the reducer
      dispatch(
        setFilterAssignee({ id: issue.assigneeId, name: issue.assigneeName }),
      );
    }
  };

  /* 3. Disable dragging if a filter is active to avoid index mismatch */
  const isDragDisabled = Boolean(activeFilterId);

  return (
    <Draggable
      draggableId={String(issue.id)}
      index={index}
      isDragDisabled={isDragDisabled}
    >
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          variant="outlined"
          sx={{
            mb: 1.5,
            cursor: "pointer",
            borderRadius: 2,
            /* 4. Visual feedback during drag */
            boxShadow: snapshot.isDragging ? 6 : 1,
            backgroundColor: snapshot.isDragging ? "#fff" : "white",
            opacity:
              isDragDisabled && activeFilterId !== issue.assigneeId ? 0.5 : 1,
          }}
        >
          <CardContent sx={{ "&:last-child": { pb: 2 } }}>
            <Typography variant="subtitle1" fontWeight="600" gutterBottom>
              {issue.title}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 2,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {issue.description}
            </Typography>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              {issue.dueDate ? (
                <Chip
                  icon={<CalendarToday sx={{ fontSize: "14px !important" }} />}
                  label={dayjs(issue.dueDate).format("MMM D, YYYY")}
                  size="small"
                  // Uses "error" color (red) if overdue, otherwise default
                  color={isOverdue ? "error" : "default"}
                  // Using "outlined" because "soft" is not a standard MUI Material variant
                  variant="outlined"
                  sx={{ fontSize: "0.75rem" }}
                />
              ) : (
                <Box /> // Empty box to maintain layout symmetry
              )}
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
              }}
            >
              {issue.assigneeName && (
                <Tooltip
                  title={`Filter by ${issue.assigneeName}`}
                  arrow
                  placement="top"
                >
                  <Chip
                    avatar={
                      <Avatar
                        sx={{
                          width: 20,
                          height: 20,
                          fontSize: "10px",
                          // Generate color based on assigneeId (or Name if ID is missing)
                          bgcolor: stringToColor(
                            issue.assigneeId || issue.assigneeName,
                          ),
                          color: "#fff",
                          // Visual pop for selected state
                          boxShadow: isSelected
                            ? "0 0 0 2px #fff, 0 0 0 4px #1976d2"
                            : "none",
                        }}
                      >
                        {issue.assigneeName.charAt(0)}
                      </Avatar>
                    }
                    label={issue.assigneeName}
                    size="small"
                    onClick={handleAssigneeClick}
                    // Switch between primary (selected) and default (not selected)
                    color={isSelected ? "primary" : "default"}
                    variant={isSelected ? "filled" : "outlined"}
                    sx={{
                      fontSize: "0.7rem",
                      cursor: "pointer",
                      fontWeight: isSelected ? "bold" : "normal",
                      transition: "all 0.2s ease",
                    }}
                  />
                </Tooltip>
              )}
            </Box>
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
};

export default IssueCard;

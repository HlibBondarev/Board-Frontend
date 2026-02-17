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
import { type IssueDto } from "../store/board/boardSlice";
import { useDispatch, useSelector } from "react-redux";
import { setFilterAssignee } from "../store/board/boardSlice";
import { type RootState } from "../store/store";
/* 1. Import dnd-kit sortable hooks and utilities */
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Props {
  issue: IssueDto;
  isOverlay?: boolean; // Add this line (question mark means it's optional)
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

const IssueCard = ({ issue, isOverlay = false }: Props) => {
  const dispatch = useDispatch();
  const activeFilterId = useSelector(
    (state: RootState) => state.board.filterAssigneeId,
  );

  /* 2. Initialize sortable logic */
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: issue.id,
    disabled: isOverlay, // Disable sorting logic for the overlay itself
  });

  /* 3. Apply transformation styles for smooth movement */
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    /* Hide the original card while dragging, but keep overlay visible */
    opacity: isDragging && !isOverlay ? 0.4 : 1,
    cursor: isOverlay ? "grabbing" : "grab",
  };

  const isOverdue = issue.dueDate
    ? dayjs().isAfter(dayjs(issue.dueDate))
    : false;
  const isSelected = activeFilterId === issue.assigneeId;

  const handleAssigneeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (issue.assigneeId && issue.assigneeName) {
      dispatch(
        setFilterAssignee({ id: issue.assigneeId, name: issue.assigneeName }),
      );
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      /* Pass attributes and listeners only to the real card, not the overlay */
      {...(isOverlay ? {} : { ...attributes, ...listeners })}
      variant="outlined"
      sx={{
        mb: 1.5,
        borderRadius: 2,
        backgroundColor: "white",
        /* Add more shadow and a slight tilt for the overlay effect */
        boxShadow: isOverlay ? 8 : 1,
        transform: isOverlay ? "rotate(3deg) scale(1.05)" : style.transform,
        zIndex: isOverlay ? 1000 : "auto",
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
              color={isOverdue ? "error" : "default"}
              variant="outlined"
              sx={{ fontSize: "0.75rem" }}
            />
          ) : (
            <Box />
          )}
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            mt: 1,
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
                      bgcolor: stringToColor(
                        issue.assigneeId || issue.assigneeName,
                      ),
                      color: "#fff",
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
  );
};

export default IssueCard;

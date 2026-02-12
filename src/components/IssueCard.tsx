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

interface Props {
  issue: Issue;
}

const IssueCard = ({ issue }: Props) => {
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

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 1.5,
        cursor: "pointer",
        "&:hover": { boxShadow: 3, borderColor: "primary.main" },
        borderRadius: 2,
      }}
    >
      <CardContent sx={{ "&:last-child": { pb: 2 } }}>
        <Typography variant="subtitle1" fontWeight="600" gutterBottom>
          {issue.title} {issue.assigneeName && `(${issue.assigneeName})`}
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
                      bgcolor: isSelected ? "white" : "primary.main",
                      color: isSelected ? "primary.main" : "white",
                    }}
                  >
                    {issue.assigneeName.charAt(0)}
                  </Avatar>
                }
                label={issue.assigneeName}
                size="small"
                onClick={handleAssigneeClick}
                color={isSelected ? "primary" : "default"}
                sx={{ cursor: "pointer", fontSize: "0.7rem" }}
              />
            </Tooltip>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default IssueCard;

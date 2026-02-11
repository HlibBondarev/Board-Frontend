import { Card, CardContent, Typography, Box, Chip } from "@mui/material";
import { CalendarToday } from "@mui/icons-material";
import dayjs from "dayjs";
import { type Issue } from "../features/board/boardSlice";

interface Props {
  issue: Issue;
}

const IssueCard = ({ issue }: Props) => {
  // Check if the deadline has already passed
  const isOverdue = issue.dueDate
    ? dayjs().isAfter(dayjs(issue.dueDate))
    : false;

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
      </CardContent>
    </Card>
  );
};

export default IssueCard;

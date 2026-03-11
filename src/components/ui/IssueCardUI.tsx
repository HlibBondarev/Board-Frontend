import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  CalendarToday,
  Edit as EditIcon,
  DeleteOutline as DeleteIcon,
} from "@mui/icons-material";
import dayjs from "dayjs";
import { CSS } from "@dnd-kit/utilities";
/* 1. Import useSortable to get its type */
import { useSortable } from "@dnd-kit/sortable";
import { type IssueDto } from "../../store/board/boardSlice";

interface IssueCardUIProps {
  issue: IssueDto;
  isOverlay?: boolean;
  /* 2. Replace 'any' with the return type of useSortable */
  sortable: ReturnType<typeof useSortable>;
  isSelected: boolean;
  isOverdue: boolean;
  stringToColor: (str: string) => string;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onAssigneeClick: (e: React.MouseEvent) => void;
}

const IssueCardUI = (props: IssueCardUIProps) => {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = props.sortable;
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging && !props.isOverlay ? 0.4 : 1,
    cursor: props.isOverlay ? "grabbing" : "grab",
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...(props.isOverlay ? {} : { ...attributes, ...listeners })}
      variant="outlined"
      sx={{
        position: "relative",
        mb: 1.5,
        borderRadius: 2,
        backgroundColor: "white",
        boxShadow: props.isOverlay ? 8 : 1,
        zIndex: props.isOverlay ? 1000 : "auto",
      }}
    >
      <CardContent sx={{ "&:last-child": { pb: 2 } }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            gap: 1,
            mb: 1,
          }}
        >
          <Typography
            variant="subtitle1"
            fontWeight="600"
            sx={{ flexGrow: 1, overflow: "hidden", textOverflow: "ellipsis" }}
          >
            {props.issue.title}
          </Typography>
          <Box sx={{ display: "flex", flexShrink: 0 }}>
            <IconButton size="small" onClick={props.onEdit}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" color="error" onClick={props.onDelete}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
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
          {props.issue.description}
        </Typography>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {props.issue.dueDate ? (
            <Chip
              icon={<CalendarToday sx={{ fontSize: 14 }} />}
              label={dayjs(props.issue.dueDate).format("MMM D, YYYY")}
              size="small"
              color={props.isOverdue ? "error" : "default"}
              variant="outlined"
            />
          ) : (
            <Box />
          )}
          {props.issue.assigneeName && (
            <Tooltip title={`Filter by ${props.issue.assigneeName}`} arrow>
              <Chip
                size="small"
                onClick={props.onAssigneeClick}
                color={props.isSelected ? "primary" : "default"}
                variant={props.isSelected ? "filled" : "outlined"}
                avatar={
                  <Avatar
                    sx={{
                      width: 20,
                      height: 20,
                      fontSize: 10,
                      bgcolor: props.stringToColor(
                        props.issue.assigneeId || props.issue.assigneeName,
                      ),
                    }}
                  >
                    {props.issue.assigneeName.charAt(0)}
                  </Avatar>
                }
                label={props.issue.assigneeName}
              />
            </Tooltip>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
export default IssueCardUI;

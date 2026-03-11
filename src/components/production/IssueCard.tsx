import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSortable } from "@dnd-kit/sortable";
import dayjs from "dayjs";
import { deleteIssue, setFilterAssignee } from "../../store/board/boardSlice";
import { type RootState, type AppDispatch } from "../../store/store";
import IssueCardUI from "../ui/IssueCardUI";
import IssueModal from "../modal/IssueModal";
import { type IssueDto } from "../../store/board/boardSlice";

/* 1. Define the props interface */
interface IssueCardProps {
  issue: IssueDto;
  isOverlay?: boolean;
}

const IssueCard = ({ issue, isOverlay = false }: IssueCardProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const activeFilterId = useSelector(
    (state: RootState) => state.board.filterAssigneeId,
  );
  const sortable = useSortable({ id: issue.id, disabled: isOverlay });

  const isOverdue = issue.dueDate
    ? dayjs().isAfter(dayjs(issue.dueDate))
    : false;
  const isSelected = activeFilterId === issue.assigneeId;

  const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++)
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return `hsl(${hash % 360}, 70%, 45%)`;
  };

  return (
    <>
      <IssueCardUI
        issue={issue}
        isOverlay={isOverlay}
        sortable={sortable}
        isSelected={isSelected}
        isOverdue={isOverdue}
        stringToColor={stringToColor}
        onEdit={(e) => {
          e.stopPropagation();
          setIsModalOpen(true);
        }}
        onDelete={(e) => {
          e.stopPropagation();
          if (window.confirm("Delete?"))
            dispatch(
              deleteIssue({
                issueId: Number(issue.id), // Explicitly convert to number
                columnId: Number(issue.columnId),
              }),
            );
        }}
        onAssigneeClick={(e) => {
          e.stopPropagation();
          if (issue.assigneeId && issue.assigneeName) {
            dispatch(
              setFilterAssignee({
                id: issue.assigneeId as string, // Cast to string
                name: issue.assigneeName as string,
              }),
            );
          }
        }}
      />
      <IssueModal
        open={isModalOpen}
        handleClose={() => setIsModalOpen(false)}
        columnId={issue.columnId}
        issue={issue}
      />
    </>
  );
};
export default IssueCard;

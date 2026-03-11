import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import dayjs from "dayjs";
/* Import the shared UI component and types */
import IssueCardUI from "../ui/IssueCardUI";
import DemoIssueModal from "./DemoIssueModal";
import { type IssueDto } from "../../store/board/boardSlice";

interface DemoIssueCardProps {
  issue: IssueDto;
  isOverlay?: boolean;
  onDelete: (id: number) => void;
  onUpdate: (updatedIssue: IssueDto) => void;
}

const DemoIssueCard = ({
  issue,
  isOverlay = false,
  onDelete,
  onUpdate,
}: DemoIssueCardProps) => {
  /* 1. Local state for the edit modal */
  const [isModalOpen, setIsModalOpen] = useState(false);

  /* 2. DND-kit sortable logic */
  const sortable = useSortable({
    id: issue.id,
    disabled: isOverlay,
  });

  /* 3. Logic for overdue status */
  const isOverdue = issue.dueDate
    ? dayjs().isAfter(dayjs(issue.dueDate))
    : false;

  /* 4. Helper to generate colors for avatars in demo mode */
  const stringToColor = (string: string) => {
    let hash = 0;
    for (let i = 0; i < string.length; i++) {
      hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsl(${hash % 360}, 65%, 50%)`;
  };

  return (
    <>
      <IssueCardUI
        issue={issue}
        isOverlay={isOverlay}
        sortable={sortable}
        isSelected={false} /* Filters logic is simplified for demo */
        isOverdue={isOverdue}
        stringToColor={stringToColor}
        onEdit={(e) => {
          e.stopPropagation();
          setIsModalOpen(true);
        }}
        onDelete={(e) => {
          e.stopPropagation();
          if (window.confirm("Delete this demo task?")) {
            onDelete(Number(issue.id));
          }
        }}
        onAssigneeClick={(e) => {
          e.stopPropagation();
          /* No global filtering in demo for now */
        }}
      />

      {/* Reusing DemoIssueModal for editing */}
      <DemoIssueModal
        open={isModalOpen}
        handleClose={() => setIsModalOpen(false)}
        columnId={Number(issue.columnId)}
        issue={issue}
        onSubmit={onUpdate}
      />
    </>
  );
};

export default DemoIssueCard;

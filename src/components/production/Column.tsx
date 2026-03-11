import { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { useDroppable } from "@dnd-kit/core";
import { type RootState } from "../../store/store";
import ColumnUI from "../ui/ColumnUI";
import IssueCard from "./IssueCard";
import IssueModal from "../modal/IssueModal";
/* 1. Import types for the column and its data */
import {
  type ColumnDto,
  type IssueDto,
  type ColumnCreateUpdateDto,
} from "../../store/board/boardSlice";

/* 2. Define a proper interface for props */
interface ColumnProps {
  column: ColumnDto;
  onUpdateColumn: (id: number, updateColumn: ColumnCreateUpdateDto) => void;
  onDeleteColumn: (id: number) => void;
}

const Column = ({ column, onUpdateColumn, onDeleteColumn }: ColumnProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { setNodeRef } = useDroppable({ id: String(column.id) });

  const userRole = useSelector((state: RootState) => state.board.userRole);
  const isAdmin = userRole === "Admin";
  const canDelete = isAdmin && (!column.issues || column.issues.length === 0);

  /* 3. Fix 'any' in map function by using IssueDto */
  const issueIds = useMemo(
    () => column.issues?.map((i: IssueDto) => i.id) || [],
    [column.issues],
  );

  return (
    <>
      <ColumnUI
        column={column}
        issueIds={issueIds}
        canDelete={canDelete}
        anchorEl={anchorEl}
        setNodeRef={setNodeRef}
        onMenuOpen={(e) => setAnchorEl(e.currentTarget)}
        onMenuClose={() => setAnchorEl(null)}
        onEdit={() => {
          setAnchorEl(null);
          const newName = prompt("New name:", column.name);
          /* 4. Use 'onUpdateColumn' here to fix the 'unused variable' error */
          if (newName) {
            onUpdateColumn(Number(column.id), {
              name: newName,
              description: column.description,
            });
          }
        }}
        onDelete={() => {
          setAnchorEl(null);
          if (window.confirm("Delete?")) onDeleteColumn(Number(column.id));
        }}
        onOpenModal={() => setIsModalOpen(true)}
        /* 5. Specify type for the issue in renderIssue callback */
        renderIssue={(issue: IssueDto) => (
          <IssueCard key={issue.id} issue={issue} />
        )}
      />

      <IssueModal
        open={isModalOpen}
        handleClose={() => setIsModalOpen(false)}
        columnId={Number(column.id)}
      />
    </>
  );
};

export default Column;

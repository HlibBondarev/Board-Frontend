import { useState, useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import ColumnUI from "../ui/ColumnUI";
import DemoIssueCard from "./DemoIssueCard";
import DemoIssueModal from "./DemoIssueModal";
import { type ColumnDto, type IssueDto } from "../../store/board/boardSlice";

interface DemoColumnProps {
  column: ColumnDto;
  onUpdateColumn: (id: number, data: Partial<ColumnDto>) => void;
  onDeleteColumn: (id: number) => void;
  onAddIssue: (colId: number, issue: IssueDto) => void;
  onUpdateIssue: (colId: number, issue: IssueDto) => void;
  onDeleteIssue: (colId: number, issueId: number) => void;
}

const DemoColumn = ({
  column,
  onUpdateColumn,
  onDeleteColumn,
  onAddIssue,
  onUpdateIssue,
  onDeleteIssue,
}: DemoColumnProps) => {
  /* 1. Local UI State */
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  /* 2. DND-kit logic */
  const { setNodeRef } = useDroppable({ id: String(column.id) });

  /* 3. Prepare IDs for SortableContext */
  const issueIds = useMemo(
    () => column.issues?.map((i) => i.id) || [],
    [column.issues],
  );

  return (
    <>
      <ColumnUI
        column={column}
        issueIds={issueIds}
        canDelete={column.issues.length === 0}
        anchorEl={anchorEl}
        setNodeRef={setNodeRef}
        onMenuOpen={(e) => setAnchorEl(e.currentTarget)}
        onMenuClose={() => setAnchorEl(null)}
        onEdit={() => {
          const name = prompt("Enter new column name:", column.name);
          if (name) onUpdateColumn(Number(column.id), { name });
          setAnchorEl(null);
        }}
        onDelete={() => {
          if (window.confirm(`Delete column "${column.name}"?`)) {
            onDeleteColumn(Number(column.id));
          }
          setAnchorEl(null);
        }}
        onOpenModal={() => setIsModalOpen(true)}
        /* Render individual Demo cards */
        renderIssue={(issue: IssueDto) => (
          <DemoIssueCard
            key={issue.id}
            issue={issue}
            onDelete={(id) => onDeleteIssue(Number(column.id), id)}
            onUpdate={(updated) => onUpdateIssue(Number(column.id), updated)}
          />
        )}
      />

      {/* Demo-specific modal for creating issues */}
      <DemoIssueModal
        open={isModalOpen}
        handleClose={() => setIsModalOpen(false)}
        columnId={Number(column.id)}
        onSubmit={(newIssue) => onAddIssue(Number(column.id), newIssue)}
      />
    </>
  );
};

export default DemoColumn;

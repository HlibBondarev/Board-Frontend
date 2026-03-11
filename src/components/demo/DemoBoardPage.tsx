import { useState, useEffect } from "react";
import {
  useSensors,
  useSensor,
  PointerSensor,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import BoardUI from "../ui/BoardUI";
import DemoColumn from "./DemoColumn";
import DemoIssueCard from "./DemoIssueCard";
import { type ColumnDto, type IssueDto } from "../../store/board/boardSlice";

const STORAGE_KEY = "kanban_demo_data_v1";

const DemoBoardPage = ({ onBack }: { onBack: () => void }) => {
  /* 1. Use state initializer to avoid cascading renders and fix ESLint error */
  const [columns, setColumns] = useState<ColumnDto[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse demo data", e);
      }
    }
    return [
      {
        id: 1,
        name: "To Do",
        description: "Tasks to start",
        position: 0,
        issues: [],
      },
      {
        id: 2,
        name: "In Progress",
        description: "Current tasks",
        position: 1,
        issues: [],
      },
    ];
  });

  const loading = false; // Demo data is loaded synchronously, so no loading state neede
  const [activeIssue, setActiveIssue] = useState<IssueDto | null>(null);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [newColDesc, setNewColDesc] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  /* 2. Sync with LocalStorage remains in useEffect */
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
  }, [columns]);

  const handleAddColumn = () => {
    if (!newColName.trim()) return;
    const newCol: ColumnDto = {
      id: Date.now(),
      name: newColName,
      description: newColDesc,
      position: columns.length,
      issues: [],
    };
    setColumns((prev) => [...prev, newCol]);
    setIsAddingColumn(false);
    setNewColName("");
    setNewColDesc("");
  };

  const handleDragStart = (event: DragStartEvent) => {
    const issue = columns
      .flatMap((c) => c.issues)
      .find((i) => i.id === Number(event.active.id));
    if (issue) setActiveIssue(issue);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = Number(active.id);
    const overId = Number(over.id);

    const activeCol = columns.find((c) =>
      c.issues.some((i) => i.id === activeId),
    );
    const overCol = columns.find(
      (c) => c.id === overId || c.issues.some((i) => i.id === overId),
    );

    if (activeCol && overCol && activeCol.id !== overCol.id) {
      setColumns((prev) => {
        const sourceCol = prev.find((c) => c.id === activeCol.id);
        const destCol = prev.find((c) => c.id === overCol.id);

        if (!sourceCol || !destCol) return prev;

        const issue = sourceCol.issues.find((i) => i.id === activeId);
        if (!issue) return prev;

        return prev.map((c): ColumnDto => {
          if (c.id === sourceCol.id) {
            return { ...c, issues: c.issues.filter((i) => i.id !== activeId) };
          }
          if (c.id === destCol.id) {
            /* Fix: Explicitly cast columnId to number to match IssueDto */
            const movedIssue: IssueDto = {
              ...issue,
              columnId: Number(destCol.id),
            };
            return { ...c, issues: [...c.issues, movedIssue] };
          }
          return c;
        });
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveIssue(null);
    if (!over) return;

    const activeId = Number(active.id);
    const overId = Number(over.id);

    setColumns((prev) => {
      const col = prev.find((c) => c.issues.some((i) => i.id === activeId));
      if (!col) return prev;

      const oldIndex = col.issues.findIndex((i) => i.id === activeId);
      const newIndex = col.issues.findIndex((i) => i.id === overId);

      if (oldIndex === newIndex) return prev;

      return prev.map((c) =>
        c.id === col.id
          ? { ...c, issues: arrayMove(c.issues, oldIndex, newIndex) }
          : c,
      );
    });
  };

  return (
    <BoardUI
      columns={columns}
      loading={loading}
      activeIssue={activeIssue}
      sensors={sensors}
      filterAssigneeName={null}
      isAddingColumn={isAddingColumn}
      newColumnName={newColName}
      newColumnDescription={newColDesc}
      renderColumn={(col) => (
        <DemoColumn
          key={col.id}
          column={col}
          onUpdateColumn={(id, data) =>
            setColumns((prev) =>
              prev.map((c) => (c.id === id ? { ...c, ...data } : c)),
            )
          }
          onDeleteColumn={(id) =>
            setColumns((prev) => prev.filter((c) => c.id !== id))
          }
          onAddIssue={(colId, issue) =>
            setColumns((prev) =>
              prev.map((c) =>
                c.id === colId ? { ...c, issues: [...c.issues, issue] } : c,
              ),
            )
          }
          onUpdateIssue={(colId, updated) =>
            setColumns((prev) =>
              prev.map((c) =>
                c.id === colId
                  ? {
                      ...c,
                      issues: c.issues.map((i) =>
                        i.id === updated.id ? updated : i,
                      ),
                    }
                  : c,
              ),
            )
          }
          onDeleteIssue={(colId, issueId) =>
            setColumns((prev) =>
              prev.map((c) =>
                c.id === colId
                  ? { ...c, issues: c.issues.filter((i) => i.id !== issueId) }
                  : c,
              ),
            )
          }
        />
      )}
      renderIssueOverlay={(issue) => (
        <DemoIssueCard
          issue={issue}
          isOverlay
          onDelete={() => {}}
          onUpdate={() => {}}
        />
      )}
      onBack={onBack}
      onClearFilter={() => {}}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onAddColumn={handleAddColumn}
      onCancelAddColumn={() => setIsAddingColumn(false)}
      setIsAddingColumn={setIsAddingColumn}
      setNewColumnName={setNewColName}
      setNewColumnDescription={setNewColDesc}
    />
  );
};

export default DemoBoardPage;

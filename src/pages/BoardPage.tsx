import { useEffect, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAuth0 } from "@auth0/auth0-react";
import {
  useSensors,
  useSensor,
  PointerSensor,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  pointerWithin,
} from "@dnd-kit/core";
import {
  fetchBoard,
  clearFilter,
  moveIssue,
  moveIssueOptimistic,
  resetBoard,
  addColumn,
  updateColumn,
  deleteColumn,
  type IssueDto,
} from "../store/board/boardSlice";
import { type RootState, type AppDispatch } from "../store/store";
import BoardUI from "../components/ui/BoardUI";
import Column from "../components/production/Column";
import IssueCard from "../components/production/IssueCard";
import { setAuthToken } from "../api/axiosInstance";

const BoardPage = ({
  boardId,
  onBack,
}: {
  boardId: number;
  onBack: () => void;
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { getAccessTokenSilently } = useAuth0();
  const { columns, loading, filterAssigneeName, filterAssigneeId } =
    useSelector((state: RootState) => state.board);

  const [activeIssue, setActiveIssue] = useState<IssueDto | null>(null);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [newColDesc, setNewColDesc] = useState("");

  /* Initialize sensors for drag and drop */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
      // Only enable sensors if NO filter is active
      // This effectively disables drag and drop during filtering
      enabled: !filterAssigneeId,
    }),
  );

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        const token = await getAccessTokenSilently();
        if (isMounted) {
          setAuthToken(token);
          dispatch(fetchBoard({ boardId }));
        }
      } catch (e) {
        console.error("Auth error:", e);
      }
    };
    init();
    return () => {
      isMounted = false;
      dispatch(resetBoard());
    };
  }, [dispatch, boardId, getAccessTokenSilently]);

  const handleDragStart = (event: DragStartEvent) => {
    // Guard clause: prevent any drag logic if filter is active
    if (filterAssigneeId) return;
    const issue = columns
      .flatMap((c) => c.issues)
      .find((i) => i.id === Number(event.active.id));
    if (issue) setActiveIssue(issue);
  };

  /* Logic for moving items between columns in real-time */
  const handleDragOver = (event: DragOverEvent) => {
    /* Disable cross-column movement logic during filtering */
    if (filterAssigneeId) return;
    const { active, over } = event;
    if (!over || filterAssigneeId) return;

    // Ensure we work with numbers for ID comparison
    const activeId = Number(active.id);
    const overId = over.id; // Could be a string from ColumnUI or number from Issue

    if (activeId === Number(overId)) return;

    // 1. Find source column using numeric ID
    const activeColumn = columns.find((col) =>
      col.issues.some((issue) => Number(issue.id) === activeId),
    );

    // 2. Find target column using numeric ID (casting overId to Number)
    let overColumn = columns.find((col) => Number(col.id) === Number(overId));

    if (!overColumn) {
      overColumn = columns.find((col) =>
        col.issues.some((issue) => Number(issue.id) === Number(overId)),
      );
    }

    if (!activeColumn || !overColumn) return;

    /* 
     CRITICAL: Cross-column move logic.
     Check IDs as numbers to ensure the condition 'activeColumn.id !== overColumn.id' 
     is correctly evaluated even if IDs came as different types.
  */
    if (Number(activeColumn.id) !== Number(overColumn.id)) {
      dispatch(
        moveIssueOptimistic({
          issueId: activeId,
          sourceColumnId: Number(activeColumn.id),
          destinationColumnId: Number(overColumn.id),
          overId: overId, // Keep original overId for the reducer's findIndex
        }),
      );
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    /* Disable final drop logic during filtering */
    if (filterAssigneeId) return;
    const { active, over } = event;
    setActiveIssue(null);

    if (!over || filterAssigneeId) return;

    const activeId = Number(active.id);
    const overId = over.id;

    // Find columns with numeric safety
    const sourceColumn = columns.find((col) =>
      col.issues.some((issue) => Number(issue.id) === activeId),
    );

    const destColumn = columns.find(
      (col) =>
        Number(col.id) === Number(overId) ||
        col.issues.some((issue) => Number(issue.id) === Number(overId)),
    );

    if (sourceColumn && destColumn) {
      // Final optimistic update to sync internal positions
      dispatch(
        moveIssueOptimistic({
          issueId: activeId,
          sourceColumnId: Number(sourceColumn.id),
          destinationColumnId: Number(destColumn.id),
          overId: overId,
        }),
      );

      // Final API call
      dispatch(
        moveIssue({
          issueId: activeId,
          columnId: Number(destColumn.id),
        }),
      );
    }
  };

  const handleAddColumnAction = useCallback(() => {
    if (newColName.trim()) {
      dispatch(
        addColumn({
          boardId,
          tempColumnId: `temp-${crypto.randomUUID()}`,
          newColumn: {
            name: newColName.trim(),
            description: newColDesc.trim(),
          },
        }),
      );
      setIsAddingColumn(false);
      setNewColName("");
      setNewColDesc("");
    }
  }, [dispatch, boardId, newColName, newColDesc]);

  // 1. Create a filtered version of columns based on assignee filter
  const filteredColumns = useMemo(() => {
    if (!filterAssigneeId) return columns;

    return columns.map((col) => ({
      ...col,
      // Keep only issues that belong to the selected assignee
      issues: col.issues.filter(
        (issue) => issue.assigneeId === filterAssigneeId,
      ),
    }));
  }, [columns, filterAssigneeId]);

  return (
    <BoardUI
      columns={filteredColumns} // Use filtered data here
      loading={loading}
      activeIssue={activeIssue}
      sensors={sensors}
      collisionDetection={pointerWithin}
      filterAssigneeName={filterAssigneeName}
      isAddingColumn={isAddingColumn}
      newColumnName={newColName}
      newColumnDescription={newColDesc}
      renderColumn={(col) => (
        <Column
          key={col.id}
          column={col}
          onUpdateColumn={(id, data) =>
            dispatch(updateColumn({ columnId: Number(id), updateColumn: data }))
          }
          onDeleteColumn={(id) =>
            dispatch(deleteColumn({ columnId: Number(id) }))
          }
        />
      )}
      renderIssueOverlay={(issue) => <IssueCard issue={issue} isOverlay />}
      onBack={onBack}
      onClearFilter={() => dispatch(clearFilter())}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onAddColumn={handleAddColumnAction}
      onCancelAddColumn={() => {
        setIsAddingColumn(false);
        setNewColName("");
        setNewColDesc("");
      }}
      setIsAddingColumn={setIsAddingColumn}
      setNewColumnName={setNewColName}
      setNewColumnDescription={setNewColDesc}
    />
  );
};

export default BoardPage;

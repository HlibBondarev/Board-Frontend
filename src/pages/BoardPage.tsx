import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAuth0 } from "@auth0/auth0-react";
import {
  useSensors,
  useSensor,
  PointerSensor,
  type DragStartEvent,
  type DragEndEvent,
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        const token = await getAccessTokenSilently();
        if (isMounted) {
          setAuthToken(token); // Using the token to clear ESLint 'unused' error
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
    if (filterAssigneeId) return;
    const issue = columns
      .flatMap((c) => c.issues)
      .find((i) => i.id === Number(event.active.id));
    if (issue) setActiveIssue(issue);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveIssue(null);
    if (!over || filterAssigneeId) return;

    const issueId = Number(active.id);
    const destinationColumnId = Number(over.id);

    /* Find source column for optimistic update */
    const sourceColumn = columns.find((col) =>
      col.issues.some((issue) => issue.id === issueId),
    );

    if (sourceColumn) {
      dispatch(
        moveIssueOptimistic({
          issueId,
          sourceColumnId: Number(sourceColumn.id), // Added missing required property
          destinationColumnId,
          overId: over.id,
        }),
      );
      dispatch(moveIssue({ issueId, columnId: destinationColumnId }));
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

  return (
    <BoardUI
      columns={columns}
      loading={loading}
      activeIssue={activeIssue}
      sensors={sensors}
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
      onDragOver={() => {}} // DragOver logic can be added here if cross-column hover is needed
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

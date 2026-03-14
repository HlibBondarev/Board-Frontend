import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useDispatch, useSelector } from "react-redux";
import { type RootState, type AppDispatch } from "../store/store";
import { setAuthToken } from "../api/axiosInstance";
import {
  fetchBoardsByUser,
  createBoard,
  updateBoard,
  addUserToBoard,
  clearError,
  removeUserFromBoard,
  deleteBoard,
} from "../store/board/projectSlice";
import { logout as logoutAction } from "../store/auth/authSlice";
import ProjectsPageUI from "../components/ui/ProjectsPageUI";
import { type BoardDto } from "../store/board/projectSlice";

interface ProjectsPageProps {
  onSelectBoard: (id: number) => void;
}

const ProjectsPage = ({ onSelectBoard }: ProjectsPageProps) => {
  const { user, getAccessTokenSilently, logout: auth0Logout } = useAuth0();
  const dispatch = useDispatch<AppDispatch>();

  // Select data from Redux store
  const { boards, loading, error } = useSelector(
    (state: RootState) => state.project,
  );

  // UI States for Create/Edit Dialog
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentBoardId, setCurrentBoardId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // UI States for User Management Dialogs
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [removeUserOpen, setRemoveUserOpen] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(null);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<"Admin" | "User">("User");
  const [removeUserEmail, setRemoveUserEmail] = useState("");

  // Fetch boards on component mount
  useEffect(() => {
    let isMounted = true;
    const initBoard = async () => {
      try {
        const token = await getAccessTokenSilently();
        if (isMounted) {
          setAuthToken(token);
          dispatch(fetchBoardsByUser());
        }
      } catch (e) {
        if (isMounted) console.error("Error getting token:", e);
      }
    };
    initBoard();
    return () => {
      isMounted = false;
    };
  }, [dispatch, getAccessTokenSilently, user?.sub]);

  // Open dialog for creating a new board
  const handleOpenCreate = () => {
    setEditMode(false);
    setTitle("");
    setDescription("");
    setOpen(true);
  };

  // Open dialog for editing an existing board
  const handleOpenEdit = (e: React.MouseEvent, board: BoardDto) => {
    e.stopPropagation(); // Prevent board selection when clicking edit
    setEditMode(true);
    setCurrentBoardId(board.id);
    setTitle(board.title);
    setDescription(board.description);
    setOpen(true);
  };

  // Logic to save board (either create or update)
  const handleSaveBoard = () => {
    if (editMode && currentBoardId) {
      dispatch(updateBoard({ boardId: currentBoardId, title, description }));
    } else {
      dispatch(createBoard({ title, description }));
    }
    setOpen(false);
  };

  const handleAddUserSubmit = () => {
    if (selectedBoardId && newUserEmail) {
      dispatch(
        addUserToBoard({
          boardId: selectedBoardId,
          email: newUserEmail,
          role: newUserRole,
        }),
      )
        .unwrap()
        .then(() => {
          dispatch(fetchBoardsByUser());
          setAddUserOpen(false);
          setNewUserEmail("");
        });
    }
  };

  const handleRemoveUserSubmit = () => {
    if (selectedBoardId && removeUserEmail) {
      dispatch(
        removeUserFromBoard({
          boardId: selectedBoardId,
          email: removeUserEmail,
        }),
      )
        .unwrap()
        .then(() => {
          dispatch(fetchBoardsByUser());
          setRemoveUserOpen(false);
          setRemoveUserEmail("");
        });
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, boardId: number) => {
    e.stopPropagation();
    if (window.confirm("Delete this board?")) {
      dispatch(deleteBoard({ boardId }));
    }
  };

  const handleLogout = () => {
    dispatch(logoutAction());
    auth0Logout({ logoutParams: { returnTo: window.location.origin } });
  };

  return (
    <ProjectsPageUI
      boards={boards}
      loading={loading}
      error={error}
      onSelectBoard={onSelectBoard}
      onLogout={handleLogout}
      onCloseError={() => dispatch(clearError())}
      // Board Management Props
      dialogOpen={open}
      editMode={editMode}
      onOpenCreate={handleOpenCreate}
      onOpenEdit={handleOpenEdit}
      onCloseDialog={() => setOpen(false)}
      onSaveBoard={handleSaveBoard}
      title={title}
      setTitle={setTitle}
      description={description}
      setDescription={setDescription}
      // User Management Props
      addUserOpen={addUserOpen}
      setAddUserOpen={setAddUserOpen}
      removeUserOpen={removeUserOpen}
      setRemoveUserOpen={setRemoveUserOpen}
      setSelectedBoardId={setSelectedBoardId}
      newUserEmail={newUserEmail}
      setNewUserEmail={setNewUserEmail}
      newUserRole={newUserRole}
      setNewUserRole={setNewUserRole}
      removeUserEmail={removeUserEmail}
      setRemoveUserEmail={setRemoveUserEmail}
      onAddUserSubmit={handleAddUserSubmit}
      onRemoveUserSubmit={handleRemoveUserSubmit}
      onDeleteBoard={handleDeleteClick}
    />
  );
};

export default ProjectsPage;

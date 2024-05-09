// client/src/app/workspace-chat-context.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';

export interface Workspace {
  id: string;
  name: string;
  fileUrls: string[];
  createdAt: number;
}

export interface WorkspaceChatContextValue {
  workspaces: Workspace[];
  addWorkspace: (workspace: Workspace) => void;
  removeWorkspace: (workspaceId: string) => void;
}

const defaultValue: WorkspaceChatContextValue = {
  workspaces: [],
  addWorkspace: () => { },
  removeWorkspace: () => { },
};

export const WorkspaceChatContext = createContext<WorkspaceChatContextValue>(defaultValue);

export const useWorkspaceChatContext = () => useContext(WorkspaceChatContext);

export const WorkspaceChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  useEffect(() => {
    const storedWorkspaces = localStorage.getItem('workspaces');
    if (storedWorkspaces) {
      setWorkspaces(JSON.parse(storedWorkspaces));
    } else {
    }
  }, []);

  const addWorkspace = (workspace: Workspace) => {
    const updatedWorkspaces = [...workspaces, { ...workspace, createdAt: Date.now() }];
    setWorkspaces(updatedWorkspaces);
    localStorage.setItem('workspaces', JSON.stringify(updatedWorkspaces));
  };

  const removeWorkspace = (workspaceId: string) => {
    const updatedWorkspaces = workspaces.filter((workspace) => workspace.id !== workspaceId);
    setWorkspaces(updatedWorkspaces);
    localStorage.setItem('workspaces', JSON.stringify(updatedWorkspaces));
  };

  return (
    <WorkspaceChatContext.Provider value={{ workspaces, addWorkspace, removeWorkspace }}>
      {children}
    </WorkspaceChatContext.Provider>
  );
};
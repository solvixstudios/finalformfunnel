import { createContext, ReactNode, useContext, useState } from 'react';

interface HeaderActionsContextType {
  titleActions: ReactNode | null;
  setTitleActions: (actions: ReactNode | null) => void;
  actions: ReactNode | null;
  setActions: (actions: ReactNode | null) => void;
  centerContent: ReactNode | null;
  setCenterContent: (content: ReactNode | null) => void;
}

const HeaderActionsContext = createContext<HeaderActionsContextType | undefined>(undefined);

export const HeaderActionsProvider = ({ children }: { children: ReactNode }) => {
  const [actions, setActions] = useState<ReactNode | null>(null);
  const [titleActions, setTitleActions] = useState<ReactNode | null>(null);
  const [centerContent, setCenterContent] = useState<ReactNode | null>(null);

  return (
    <HeaderActionsContext.Provider value={{ actions, setActions, titleActions, setTitleActions, centerContent, setCenterContent }}>
      {children}
    </HeaderActionsContext.Provider>
  );
};

export const useHeaderActions = () => {
  const context = useContext(HeaderActionsContext);
  if (context === undefined) {
    throw new Error('useHeaderActions must be used within a HeaderActionsProvider');
  }
  return context;
};

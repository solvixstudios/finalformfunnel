import { createContext, ReactNode, useCallback, useContext, useRef, useState } from 'react';

interface HeaderActionsContextType {
  titleActions: ReactNode | null;
  setTitleActions: (actions: ReactNode | null) => void;
  actions: ReactNode | null;
  setActions: (actions: ReactNode | null) => void;
  centerContent: ReactNode | null;
  setCenterContent: (content: ReactNode | null) => void;
  onSaveBeforeLeave: (() => Promise<void>) | null;
  setOnSaveBeforeLeave: (cb: (() => Promise<void>) | null) => void;
}

const HeaderActionsContext = createContext<HeaderActionsContextType | undefined>(undefined);

export const HeaderActionsProvider = ({ children }: { children: ReactNode }) => {
  const [actions, setActions] = useState<ReactNode | null>(null);
  const [titleActions, setTitleActions] = useState<ReactNode | null>(null);
  const [centerContent, setCenterContent] = useState<ReactNode | null>(null);
  const saveCallbackRef = useRef<(() => Promise<void>) | null>(null);

  const setOnSaveBeforeLeave = useCallback((cb: (() => Promise<void>) | null) => {
    saveCallbackRef.current = cb;
  }, []);

  const onSaveBeforeLeave = saveCallbackRef.current;

  return (
    <HeaderActionsContext.Provider value={{ actions, setActions, titleActions, setTitleActions, centerContent, setCenterContent, onSaveBeforeLeave, setOnSaveBeforeLeave }}>
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

import React, { createContext, useContext } from 'react';

interface BuilderContextType {
    userId: string;
}

const BuilderContext = createContext<BuilderContextType | null>(null);

export const BuilderProvider = ({
    userId,
    children,
}: {
    userId: string;
    children: React.ReactNode;
}) => (
    <BuilderContext.Provider value={{ userId }}>
        {children}
    </BuilderContext.Provider>
);

export const useBuilderContext = () => {
    const ctx = useContext(BuilderContext);
    if (!ctx) throw new Error('useBuilderContext must be used within BuilderProvider');
    return ctx;
};

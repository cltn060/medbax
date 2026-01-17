"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface SidebarContextType {
    isMobileOpen: boolean;
    openMobileSidebar: () => void;
    closeMobileSidebar: () => void;
    toggleMobileSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const openMobileSidebar = useCallback(() => setIsMobileOpen(true), []);
    const closeMobileSidebar = useCallback(() => setIsMobileOpen(false), []);
    const toggleMobileSidebar = useCallback(() => setIsMobileOpen(prev => !prev), []);

    return (
        <SidebarContext.Provider value={{
            isMobileOpen,
            openMobileSidebar,
            closeMobileSidebar,
            toggleMobileSidebar,
        }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const context = useContext(SidebarContext);
    if (context === undefined) {
        throw new Error("useSidebar must be used within a SidebarProvider");
    }
    return context;
}

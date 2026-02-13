'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import AdminRoute from '@/components/AdminRoute';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <AdminRoute>
            <div className="min-h-screen bg-background flex flex-col lg:flex-row text-foreground selection:bg-primary/30">
                {/* Fixed Background Gradient Mesh */}
                <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[100px]" />
                </div>

                {/* Mobile Header */}
                <div className="lg:hidden p-4 border-b border-white/5 bg-background/50 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between">
                    <span className="font-bold text-lg">Admin Panel</span>
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                        aria-label={isMobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
                        aria-expanded={isMobileMenuOpen}
                    >
                        {isMobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>

                {/* Mobile Sidebar Overlay */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ x: '-100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '-100%' }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="fixed inset-y-0 left-0 z-50 lg:hidden"
                            >
                                <AdminSidebar onClose={() => setIsMobileMenuOpen(false)} className="h-full border-r-0" />
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Desktop Sidebar (Hidden on Mobile) */}
                <div className="hidden lg:block sticky top-0 h-screen">
                    <AdminSidebar />
                </div>

                {/* Main Content */}
                <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
                    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {children}
                    </div>
                </main>
            </div>
        </AdminRoute>
    );
}

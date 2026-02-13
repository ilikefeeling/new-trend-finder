'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Users, CreditCard, Settings, BarChart3, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

interface AdminSidebarProps {
    className?: string;
    onClose?: () => void;
}

export default function AdminSidebar({ className, onClose }: AdminSidebarProps) {
    const pathname = usePathname();

    const menuItems = [
        { icon: BarChart3, label: '대시보드', href: '/admin' },
        { icon: Users, label: '사용자 관리', href: '/admin/users' },
        { icon: CreditCard, label: '거래 내역', href: '/admin/transactions' },
        { icon: Settings, label: '설정', href: '/admin/settings' },
    ];

    return (
        <motion.div
            initial={{ x: -250, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`w-64 h-screen bg-sidebar/60 backdrop-blur-xl border-r border-white/5 flex flex-col z-50 ${className || 'sticky top-0'}`}
        >
            {/* Admin Header */}
            <div className="p-6 flex items-center gap-3 border-b border-white/5 bg-white/5 mb-2">
                <div className="p-2 bg-primary/20 rounded-lg">
                    <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-lg font-bold tracking-tight text-white">Admin Panel</h1>
                    <p className="text-xs text-muted-foreground">System Management</p>
                </div>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 px-4 space-y-2 py-4 overflow-y-auto custom-scrollbar">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className="block relative group"
                            aria-label={item.label}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-primary/20 rounded-xl"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                            <div className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                ? 'text-primary-foreground font-semibold'
                                : 'text-muted-foreground group-hover:text-white group-hover:bg-white/5'
                                }`}>
                                <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'group-hover:text-primary transition-colors'}`} />
                                <span>{item.label}</span>
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / Back to Dashboard */}
            <div className="p-4 border-t border-white/5 bg-black/20">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-white transition-all group"
                >
                    <LogOut className="w-5 h-5 group-hover:translate-x-[-2px] transition-transform" />
                    <span className="font-medium">대시보드로 돌아가기</span>
                </Link>
            </div>
        </motion.div>
    );
}

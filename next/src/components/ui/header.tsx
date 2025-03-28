"use client";

import { Upload, LogOut } from "lucide-react";
import Link from "next/link";
import { Button } from "./button";

interface HeaderProps {
  onLogout: () => Promise<void>;
}

export function Header({ onLogout }: HeaderProps) {
    return (
        <header className="border-b">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                <Link href="/" className="flex items-center space-x-2">
                    <Upload className="h-6 w-6" />
                    <span className="text-xl font-bold">Web Image Pro</span>
                </Link>
                <Button variant="ghost" onClick={onLogout} className="flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    ログアウト
                </Button>
            </div>
        </header>
    )
}
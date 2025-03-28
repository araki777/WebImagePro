"use client";

import { Upload } from "lucide-react";
import Link from "next/link";

export function Header() {
    return (
        <header className="border-b">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                <Link href="/" className="flex items-center space-x-2">
                    <Upload className="h-6 w-6" />
                    <span className="text-xl font-bold">Web Image Pro</span>
                </Link>
            </div>
        </header>
    )
}
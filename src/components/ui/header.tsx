"use client";

import Link from "next/link";
import { Upload, LogOut, User, Settings, Home, Image as ImageIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { HeaderProps } from "@/types/types";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function Header({ onLogout, userImage, userName = "User" }: HeaderProps) {
    return (
        <header className="border-b">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                <Link href="/" className="flex items-center space-x-2">
                    <Upload className="h-6 w-6" />
                    <span className="text-xl font-bold">Web Image Pro</span>
                </Link>

                <div className="flex items-center space-x-4">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={userImage} alt={userName} />
                                    <AvatarFallback>{userName[0]}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="w-[300px]">
                            <SheetHeader>
                                <SheetTitle>
                                    <div className="flex items-center space-x-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={userImage} alt={userName} />
                                            <AvatarFallback>{userName[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">{userName}</p>
                                        </div>
                                    </div>
                                </SheetTitle>
                            </SheetHeader>
                            <div className="mt-6 space-y-1">
                                <Button variant="ghost" className="w-full justify-start" asChild>
                                    <Link href="/">
                                        <Home className="mr-2 h-4 w-4" />
                                        ホーム
                                    </Link>
                                </Button>
                                <Button variant="ghost" className="w-full justify-start" asChild>
                                    <Link href="/upload">
                                        <Upload className="mr-2 h-4 w-4" />
                                        アップロード
                                    </Link>
                                </Button>
                                <Button variant="ghost" className="w-full justify-start" asChild>
                                    <Link href="/gallery">
                                        <ImageIcon className="mr-2 h-4 w-4" />
                                        ギャラリー
                                    </Link>
                                </Button>
                                <Button variant="ghost" className="w-full justify-start" asChild>
                                    <Link href="/profile">
                                        <User className="mr-2 h-4 w-4" />
                                        プロフィール
                                    </Link>
                                </Button>
                                <Button variant="ghost" className="w-full justify-start" asChild>
                                    <Link href="/settings">
                                        <Settings className="mr-2 h-4 w-4" />
                                        設定
                                    </Link>
                                </Button>
                            </div>
                            <Separator className="my-4" />
                            <Button
                                variant="ghost"
                                onClick={onLogout}
                                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                ログアウト
                            </Button>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
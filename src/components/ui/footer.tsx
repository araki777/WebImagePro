'use client';

import Link from "next/link";
import { Github, Twitter } from "lucide-react";
import { InstagramIcon } from "lucide-react";

export function Footer() {
  // 現在の年を静的に設定（サーバー側とクライアント側で一致するように）
  const currentYear = new Date().getFullYear().toString();

  return (
    <footer className="border-t py-6 px-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <h3 className="text-lg font-bold">WebImagePro</h3>
            <p className="text-sm text-muted-foreground">
              簡単に画像加工・編集ができるウェブサービスです
            </p>
            <div className="flex space-x-4">
              <Link href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                <Twitter size={20} />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                <Github size={20} />
                <span className="sr-only">GitHub</span>
              </Link>
              <Link href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                <InstagramIcon size={20} />
                <span className="sr-only">Instagram</span>
              </Link>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-lg font-bold">製品</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/upload" className="text-sm text-muted-foreground hover:text-primary hover:underline">
                  画像アップロード
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="text-sm text-muted-foreground hover:text-primary hover:underline">
                  ギャラリー
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-lg font-bold">アカウント</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/profile" className="text-sm text-muted-foreground hover:text-primary hover:underline">
                  プロフィール
                </Link>
              </li>
              <li>
                <Link href="/settings" className="text-sm text-muted-foreground hover:text-primary hover:underline">
                  設定
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-lg font-bold">法的情報</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary hover:underline">
                  利用規約
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary hover:underline">
                  プライバシーポリシー
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary hover:underline">
                  お問い合わせ
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t text-center text-sm text-muted-foreground">
          <p>© {currentYear} WebImagePro. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
} 
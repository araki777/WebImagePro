"use client";

import { usePWAInstallPrompt } from "@/hooks/usePWAInstallPrompt";
import { useEffect, useState } from "react";

export default function PWAInstallDialog() {
  const { isInstallable, promptInstall } = usePWAInstallPrompt();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isInstallable) setOpen(true);
  }, [isInstallable]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded shadow-lg p-6">
        <h2 className="text-lg font-bold mb-2">
          アプリをインストールしませんか？
        </h2>
        <p className="mb-4">WebImageProをホーム画面に追加できます。</p>
        <button
          type="button"
          className="bg-blue-600 text-white py-2 rounded mr-2"
          onClick={() => {
            promptInstall();
            setOpen(false);
          }}
        >
          インストール
        </button>
        <button
          type="button"
          className="bg-gray-300 px-4 py-2 rounded"
          onClick={() => setOpen(false)}
        >
          閉じる
        </button>
      </div>
    </div>
  );
}

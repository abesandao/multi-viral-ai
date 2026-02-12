"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center pt-24 pb-16 px-4 min-h-screen">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-4">
            <span className="text-6xl font-bold text-gray-500">404</span>
            <span className="text-gray-500">|</span>
            <p className="text-gray-400">このページは存在しません</p>
          </div>
          <p className="text-sm text-gray-500 max-w-md">
            お探しのページは削除されたか、URLが変更された可能性があります。
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-neon-blue to-neon-purple hover:shadow-lg hover:shadow-neon-blue/20 transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            トップに戻る
          </Link>
        </div>
      </main>
    </>
  );
}

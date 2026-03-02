"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PairPage() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchInviteCode();
  }, []);

  async function fetchInviteCode() {
    const res = await fetch("/api/pair/invite");
    const data = await res.json();
    if (data.inviteCode) {
      setInviteCode(data.inviteCode);
    }
    if (data.error === "Already paired") {
      router.push("/home");
    }
  }

  async function handlePair() {
    if (!inputCode.trim()) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/pair", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode: inputCode.trim() }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.success) {
      setSuccess(true);
      setTimeout(() => router.push("/home"), 1500);
    } else {
      setError(data.error || "配對失敗");
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-pink-50">
        <div className="text-center">
          <p className="text-2xl font-bold text-pink-600">配對成功！</p>
          <p className="mt-2 text-gray-500">正在跳轉...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-pink-50">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-xl font-bold text-pink-600">
          配對
        </h1>

        {/* My invite code */}
        <div className="mb-8">
          <p className="mb-2 text-sm text-gray-500">你的邀請碼</p>
          <div className="flex items-center justify-center rounded-xl bg-pink-50 py-4">
            <span className="font-mono text-2xl font-bold tracking-widest text-pink-600">
              {inviteCode || "載入中..."}
            </span>
          </div>
          <p className="mt-2 text-center text-xs text-gray-400">
            將此邀請碼分享給對方（24 小時有效）
          </p>
        </div>

        {/* Input partner code */}
        <div>
          <p className="mb-2 text-sm text-gray-500">輸入對方的邀請碼</p>
          <input
            type="text"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            maxLength={6}
            placeholder="輸入 6 碼"
            className="mb-3 w-full rounded-xl border border-gray-200 px-4 py-3 text-center font-mono text-lg tracking-widest uppercase focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100"
          />
          {error && (
            <p className="mb-3 text-center text-sm text-red-500">{error}</p>
          )}
          <button
            onClick={handlePair}
            disabled={loading || inputCode.length !== 6}
            className="w-full rounded-xl bg-pink-500 py-3 text-sm font-medium text-white transition-colors hover:bg-pink-600 disabled:opacity-50"
          >
            {loading ? "配對中..." : "確認配對"}
          </button>
        </div>
      </div>
    </div>
  );
}

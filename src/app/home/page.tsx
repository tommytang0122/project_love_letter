"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

type HomeState = "loading" | "no-pair" | "no-message" | "has-message" | "done";

interface TodayData {
  paired: boolean;
  todayMessage: {
    id: string;
    content: string;
    authorId: string;
    createdAt: string;
  } | null;
  hasSentTomorrow: boolean;
  partnerHasSentTomorrow: boolean;
}

export default function HomePage() {
  const router = useRouter();
  const [state, setState] = useState<HomeState>("loading");
  const [data, setData] = useState<TodayData | null>(null);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  useEffect(() => {
    fetchToday();
  }, []);

  async function fetchToday() {
    setState("loading");
    const res = await fetch("/api/messages/today");

    if (res.status === 401) {
      router.push("/login");
      return;
    }

    const json: TodayData = await res.json();
    setData(json);

    if (!json.paired) {
      setState("no-pair");
      return;
    }

    if (json.todayMessage && json.hasSentTomorrow) {
      setState("done");
    } else if (json.todayMessage) {
      setState("has-message");
    } else {
      setState("no-message");
    }
  }

  async function handleSend() {
    if (!content.trim()) return;
    setSending(true);
    setSendError("");

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.trim() }),
    });

    const json = await res.json();
    setSending(false);

    if (json.error) {
      setSendError(json.error);
    } else {
      setContent("");
      fetchToday();
    }
  }

  if (state === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-pink-50">
        <p className="text-gray-400">載入中...</p>
      </div>
    );
  }

  if (state === "no-pair") {
    router.push("/pair");
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-pink-50">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <h1 className="text-lg font-bold text-pink-600">Love Letter</h1>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          登出
        </button>
      </header>

      <main className="flex flex-1 flex-col items-center px-6 py-8">
        <div className="w-full max-w-sm">
          {/* Today's message section */}
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-medium text-gray-500">
              今日訊息
            </h2>
            {data?.todayMessage ? (
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-lg leading-relaxed text-gray-800">
                  {data.todayMessage.content}
                </p>
                <p className="mt-3 text-xs text-gray-300">
                  {new Date(data.todayMessage.createdAt).toLocaleDateString(
                    "zh-TW"
                  )}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
                <p className="text-gray-400">
                  對方昨天沒有留言給你
                </p>
              </div>
            )}
          </section>

          {/* Write message section */}
          {!data?.hasSentTomorrow ? (
            <section>
              <h2 className="mb-3 text-sm font-medium text-gray-500">
                寫給明天的對方
              </h2>
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={200}
                  rows={4}
                  placeholder="寫下你想說的話..."
                  className="w-full resize-none rounded-xl border border-gray-100 p-3 text-sm text-gray-700 placeholder-gray-300 focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100"
                />
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-gray-300">
                    {content.length}/200
                  </span>
                  <button
                    onClick={handleSend}
                    disabled={sending || !content.trim()}
                    className="rounded-xl bg-pink-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-pink-600 disabled:opacity-50"
                  >
                    {sending ? "傳送中..." : "送出"}
                  </button>
                </div>
                {sendError && (
                  <p className="mt-2 text-sm text-red-500">{sendError}</p>
                )}
              </div>
            </section>
          ) : (
            <section className="rounded-2xl bg-white p-6 text-center shadow-sm">
              <p className="text-pink-500">
                已送出明天的訊息
              </p>
              {data?.partnerHasSentTomorrow && (
                <p className="mt-1 text-xs text-gray-400">
                  對方也已寫好明天的訊息了
                </p>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

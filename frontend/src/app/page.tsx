"use client";

import { FormEvent, useState } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000";

  const [repoUrl, setRepoUrl] = useState("");
  const [projectId, setProjectId] = useState("");
  const [projectName, setProjectName] = useState("");

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [analyzing, setAnalyzing] = useState(false);
  const [asking, setAsking] = useState(false);

  const [error, setError] = useState("");

  async function analyzeRepository(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!repoUrl.trim()) {
      setError("GitHub repository URL required.");
      return;
    }

    setAnalyzing(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/projects/analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            url: repoUrl.trim()
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to analyze repository."
        );
      }

      setProjectId(data.projectId);
      setProjectName(data.repository.name);

      setMessages([
        {
          role: "assistant",
          content:
            "Repository analyzed successfully. Ask me anything about the codebase."
        }
      ]);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setAnalyzing(false);
    }
  }

  async function sendMessage(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const text = message.trim();

    if (!text || !projectId || asking) {
      return;
    }

    setMessage("");
    setError("");

    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        content: text
      }
    ]);

    setAsking(true);

    try {
      const response = await fetch(
        `${API_URL}/api/projects/${projectId}/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message: text
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to get AI response."
        );
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: data.answer
        }
      ]);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setAsking(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#161311] text-[#F2ECE6] selection:bg-[#D97757]/30">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[#D97757]/[0.10] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-3xl px-6 py-16">

        {/* Header */}
        <div className="mb-12 flex items-start justify-between gap-6">
          <div>
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#D97757]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5 text-[#161311]"
              >
                <path
                  d="M12 3v4M12 17v4M4.2 4.2l2.8 2.8M17 17l2.8 2.8M3 12h4M17 12h4M4.2 19.8L7 17M17 7l2.8-2.8"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <h1 className="text-[2.25rem] font-medium leading-tight tracking-[-0.02em] text-[#F7F2ED]">
              Repository Explainer
            </h1>

            <p className="mt-2 max-w-md text-[15px] leading-relaxed text-[#B8AFA6]">
              Point it at a public GitHub repository and talk through the
              codebase like you would with a teammate who already read it.
            </p>
          </div>
        </div>

        {/* Repository form */}
        <form
          onSubmit={analyzeRepository}
          className="rounded-2xl border border-[#3A342E] bg-[#1E1A17] p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset]"
        >
          <label className="mb-2 block text-[13px] font-medium text-[#9C9188]">
            GitHub repository URL
          </label>

          <div className="flex gap-3">
            <input
              type="url"
              value={repoUrl}
              onChange={(event) =>
                setRepoUrl(event.target.value)
              }
              placeholder="https://github.com/owner/repository"
              className="min-w-0 flex-1 rounded-xl border border-[#3A342E] bg-[#161311] px-4 py-3 text-[15px] text-[#F2ECE6] placeholder-[#6E655C] outline-none transition-colors focus:border-[#D97757]"
            />

            <button
              type="submit"
              disabled={analyzing}
              className="shrink-0 rounded-xl bg-[#D97757] px-6 py-3 text-[15px] font-medium text-[#211A15] transition-colors hover:bg-[#E28B6D] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {analyzing
                ? "Analyzing…"
                : "Analyze"}
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-xl border border-[#6B3A2E] bg-[#2A1A15] px-4 py-3 text-[14px] text-[#E5A793]">
            {error}
          </div>
        )}

        {/* Project */}
        {projectId && (
          <section className="mt-8">

            <div className="mb-5 flex items-center justify-between rounded-2xl border border-[#3A342E] bg-[#1E1A17] px-5 py-4">
              <div>
                <p className="text-[12px] font-medium uppercase tracking-wide text-[#8A8078]">
                  Repository
                </p>

                <h2 className="mt-1 text-[17px] font-medium text-[#F7F2ED]">
                  {projectName}
                </h2>
              </div>

              <span className="rounded-full border border-[#3A342E] bg-[#161311] px-3 py-1 text-[12px] text-[#8A8078]">
                {projectId}
              </span>
            </div>

            {/* Chat */}
            <div className="overflow-hidden rounded-2xl border border-[#3A342E] bg-[#1E1A17]">

              <div className="min-h-[420px] space-y-5 p-6">

                {messages.map(
                  (item, index) => (
                    <div
                      key={index}
                      className={
                        item.role === "user"
                          ? "ml-auto max-w-[80%]"
                          : "max-w-[90%]"
                      }
                    >
                      <div
                        className={
                          item.role === "user"
                            ? "rounded-2xl rounded-tr-sm bg-[#D97757] px-4 py-3 text-[#211A15]"
                            : "rounded-2xl rounded-tl-sm border border-[#3A342E] bg-[#161311] px-4 py-3 text-[#EDE6DE]"
                        }
                      >
                        <p className="whitespace-pre-wrap text-[15px] leading-7">
                          {item.content}
                        </p>
                      </div>
                    </div>
                  )
                )}

                {asking && (
                  <div className="flex max-w-[90%] items-center gap-2 rounded-2xl rounded-tl-sm border border-[#3A342E] bg-[#161311] px-4 py-3 text-[#9C9188]">
                    <span className="flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#D97757] [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#D97757] [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#D97757]" />
                    </span>

                    <span className="text-[14px]">
                      Reading the codebase…
                    </span>
                  </div>
                )}

              </div>

              {/* Chat input */}
              <form
                onSubmit={sendMessage}
                className="border-t border-[#3A342E] p-4"
              >
                <div className="flex gap-3">

                  <input
                    value={message}
                    onChange={(event) =>
                      setMessage(event.target.value)
                    }
                    disabled={asking}
                    placeholder="Ask about the code…"
                    className="min-w-0 flex-1 rounded-xl border border-[#3A342E] bg-[#161311] px-4 py-3 text-[15px] text-[#F2ECE6] placeholder-[#6E655C] outline-none transition-colors focus:border-[#D97757] disabled:opacity-60"
                  />

                  <button
                    type="submit"
                    disabled={
                      asking ||
                      !message.trim()
                    }
                    className="shrink-0 rounded-xl bg-[#D97757] px-6 py-3 text-[15px] font-medium text-[#211A15] transition-colors hover:bg-[#E28B6D] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Ask
                  </button>

                </div>
              </form>

            </div>
          </section>
        )}

      </div>
    </main>
  );
}
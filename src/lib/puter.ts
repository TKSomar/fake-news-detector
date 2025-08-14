import { create } from "zustand";
import { prepareInstructions } from "@/constants";


interface PuterStore {
  puterReady: boolean;
  isLoading: boolean;
  error: string | null;
  auth: {
    user: any | null;
    isAuthenticated: boolean;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
  };
  ai: {
    feedback: (
      newsHeadline: string,
      newsSnippet: string
    ) => Promise<any | undefined>;
    feedbackLong: (
      newsHeadline: string,
      longText: string
    ) => Promise<any[] | undefined>;
    img2txt: (
      image: string | File | Blob,
      testMode?: boolean
    ) => Promise<string | undefined>;
  };
  init: () => void;
  clearError: () => void;
}

let puter: any = null;
function getPuter() {
  if (!puter && typeof window !== "undefined") {
    // @ts-ignore
    puter = window.puter;
  }
  return puter;
}

// Utility: Split text into manageable chunks
function chunkText(text: string, maxChars = 4000): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    chunks.push(text.slice(start, start + maxChars));
    start += maxChars;
  }
  return chunks;
}

export const usePuterStore = create<PuterStore>((set, get) => {
  const setError = (msg: string) => set({ error: msg, isLoading: false });

  const checkAuthStatus = async (): Promise<void> => {
    const p = getPuter();
    if (!p) {
      setError("Puter.js not available");
      return;
    }
    try {
      const isSignedIn = await p.auth.isSignedIn();
      const user = isSignedIn ? await p.auth.getUser() : null;
      set({
        auth: {
          user,
          isAuthenticated: isSignedIn,
          signIn: get().auth.signIn,
          signOut: get().auth.signOut,
        },
        isLoading: false,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to check auth status";
      setError(msg);
    }
  };

  const signIn = async (): Promise<void> => {
    const p = getPuter();
    if (!p) {
      setError("Puter.js not available");
      return;
    }

    set({ isLoading: true, error: null });

    try {
      await p.auth.signIn();
      await checkAuthStatus();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign in failed";
      setError(msg);
    }
  };

  const signOut = async (): Promise<void> => {
    const p = getPuter();
    if (!p) {
      setError("Puter.js not available");
      return;
    }

    set({ isLoading: true, error: null });

    try {
      await p.auth.signOut();
      set({
        auth: {
          user: null,
          isAuthenticated: false,
          signIn: get().auth.signIn,
          signOut: get().auth.signOut,
        },
        isLoading: false,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign out failed";
      setError(msg);
    }
  };

  // Single short-text feedback
  const feedback = async (newsHeadline: string, newsSnippet: string) => {
    const p = getPuter();
    if (!p) {
      setError("Puter.js not available");
      return;
    }

    set({ isLoading: true, error: null });

    const prompt = prepareInstructions({ newsHeadline, newsSnippet });
    console.log("Prompt sent to AI:", prompt);

    try {
      const response = await Promise.race([
        p.ai.chat(prompt, { model: "gpt-5-2025-08-07" }),
        new Promise<undefined>((_, reject) =>
          setTimeout(() => reject(new Error("AI request timed out")), 15000)
        ),
      ]);

      console.log("Raw AI response:", response);
      const text = response?.content?.[0]?.trim();

      if (!text) {
        console.warn("AI returned empty response");
        return "No feedback available";
      }

      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    } catch (err) {
      console.error("AI feedback error:", err);
      setError(err instanceof Error ? err.message : "Unknown AI error");
      return "AI request failed";
    } finally {
      set({ isLoading: false });
    }
  };

  // Long-text feedback (chunking)
  const feedbackLong = async (newsHeadline: string, longText: string) => {
    const chunks = chunkText(longText);
    console.log(`Splitting into ${chunks.length} chunks`);
    const results: any[] = [];

    for (let i = 0; i < chunks.length; i++) {
      console.log(`Processing chunk ${i + 1}/${chunks.length}`);
      const result = await get().ai.feedback(newsHeadline, chunks[i]);
      results.push(result);
    }

    return results;
  };

  // Image/PDF → Text (OCR)
  const img2txt = async (image: string | File | Blob, testMode?: boolean) => {
    const p = getPuter();
    if (!p) {
      setError("Puter.js not available");
      return;
    }
    try {
      const result = await p.ai.img2txt(image, testMode);
      return result?.text || result; // Depending on API output
    } catch (err) {
      setError("Image to text conversion failed");
      return;
    }
  };

  const init = (): void => {
    set({ isLoading: true });
    const interval = setInterval(() => {
      if (getPuter()) {
        clearInterval(interval);
        set({ puterReady: true, isLoading: false });
        checkAuthStatus();
        console.log("Puter.js is ready!");
      }
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      if (!getPuter()) setError("Puter.js failed to load within 10 seconds");
    }, 10000);
  };

  return {
    puterReady: false,
    isLoading: false,
    error: null,
    auth: {
      user: null,
      isAuthenticated: false,
      signIn,
      signOut,
    },
    ai: { feedback, feedbackLong, img2txt },
    init,
    clearError: () => set({ error: null }),
  };
});

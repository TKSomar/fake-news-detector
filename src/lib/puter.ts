import { create } from "zustand";
import { prepareInstructions } from "@/constants";

type AIResponse = {
  role: string;
  content: { type: string; text: string }[];
};

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

  const feedback = async (newsHeadline: string, newsSnippet: string) => {
    const p = getPuter();
    if (!p) {
        setError("Puter.js not available");
        return;
    }

    set({ isLoading: true, error: null });

    const prompt = prepareInstructions({ newsHeadline, newsSnippet });

    try {
        // Wrap in a Promise.race to avoid hanging indefinitely
        const response: AIResponse | undefined = await Promise.race([
        p.ai.chat(prompt, { model: "gpt-5-2025-08-07" }) as Promise<AIResponse>,
        new Promise<AIResponse | undefined>((_, reject) =>
            setTimeout(() => reject(new Error("AI request timed out")), 15000)
        ),
        ]);

        if (!response?.content?.[0]?.text) {
        console.warn("AI returned empty response");
        return;
        }

        try {
        return JSON.parse(response.content[0].text);
        } catch {
        console.warn("AI returned non-JSON text, returning raw string");
        return response.content[0].text;
        }
    } catch (err) {
        console.error("AI feedback error:", err);
    } finally {
        set({ isLoading: false });
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
    ai: { feedback },
    init,
    clearError: () => set({ error: null }),
  };
});

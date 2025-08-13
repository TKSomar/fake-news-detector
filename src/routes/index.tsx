import { createFileRoute, Link } from '@tanstack/react-router'
import { usePuterStore } from '@/lib/puter';
import { FormEvent, useState } from 'react';

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const { auth, ai } = usePuterStore();
  const isAuthenticated = auth?.isAuthenticated ?? false;
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');

  const handleAnalyze = async ({
    newsHeadline,
    newsSnippet,
  }: {
    newsHeadline: string;
    newsSnippet: string;
  }) => {
    setIsProcessing(true);
    setStatusText("Preparing data...");

    try {
      setStatusText("Analyzing...");

      // Call the new feedback function directly
      const feedback = await ai.feedback(newsHeadline, newsSnippet);

      if (!feedback) {
        setStatusText("Error: Failed to analyze the news article.");
        setIsProcessing(false);
        return;
      }

      setStatusText("Analysis complete!");
      console.log("AI Feedback:", feedback);
      // setAnalysisResult(feedback);

    } catch (err) {
      console.error("Analysis error:", err);
      setStatusText(`Error: ${(err as Error).message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const newsHeadline = (formData.get('news-headline') as string | null)?.trim();
    const newsSnippet = (formData.get('news-snippet') as string | null)?.trim();

    if (!newsHeadline || !newsSnippet) {
      setStatusText("Please enter both headline and news snippet.");
      return;
    }

    handleAnalyze({ newsHeadline, newsSnippet });
  };

  return (
    <section className="main-section">
      <div className="page-heading">
        <h1>That's Fake News!</h1>
        {!isAuthenticated && !isProcessing ? (
          <div>
            <h2>Welcome! Please login to begin using this tool.</h2>
            <Link to="/auth" className="auth-button">Login</Link>
          </div>
        ) : !isProcessing ? (
          <div>
            <form id="upload-form" className="" onSubmit={handleSubmit}>
              <textarea
                className="w-full h-32 p-4 mt-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Paste the news headline here..."
                id="news-headline"
                name="news-headline" />
              <textarea
                className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Paste the news article text here..."
                id="news-snippet"
                name="news-snippet" />
              <button type="submit" className="primary-button">Check for Fake News</button>
            </form>
          </div>
        ) : isProcessing ? (
          <>
            <h2>{statusText}</h2>
            <img src="src\images\resume-scan.gif" className="w-full" />
          </>
        ) : null}
      </div>
    </section>
  )
}

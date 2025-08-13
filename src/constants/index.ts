export const prepareInstructions = ({
  newsHeadline,
  newsSnippet,
}: {
  newsHeadline: string;
  newsSnippet: string;
}) => `
You are an expert fact-checker. Analyze the following news headline and snippet, and provide a JSON object with these fields:

- overallScore: number between 0-100 representing overall accuracy
- factCheckScore: object with 'score' (0-10) and 'comments' (array of strings)
- unverifiedScore: object with 'score' (0-10) and 'comments' (array of strings)
- nonFactsScore: object with 'score' (0-10) and 'comments' (array of strings)
- sources: array of strings listing the sources you used

News headline: "${newsHeadline}"
News snippet: "${newsSnippet}"

Return a valid JSON object only. Do not include any explanations, comments, or extra text outside the JSON.
`;

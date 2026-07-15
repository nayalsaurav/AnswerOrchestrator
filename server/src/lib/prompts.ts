const JUDGE_PROMPT = `
You are an expert evaluator.

The user asked:
{{prompt}}

Here are the responses from the three AI models:
{{responses}}

Your task is NOT to summarize.

Your task is to create a NEW answer that is BETTER than every individual answer.

Instructions:

1. Compare every response.
2. Identify factual mistakes.
3. Identify missing information.
4. Extract the strongest explanations from each response.
5. Merge complementary information.
6. Keep useful analogies if they improve understanding.
7. Keep practical examples when helpful.
8. Prefer the clearest explanation.
9. Remove duplicated information.
10. Do NOT copy any response verbatim.

The final answer should be more complete than any single response.
`;

export function getJudgePrompt(
  prompt: string,
  responses: {
    model: string | null;
    data: any | null;
    error: any | null;
  }[],
) {
  return JUDGE_PROMPT.replace("{{prompt}}", prompt).replace(
    "{{responses}}",
    responses
      .map((r) => `Model: ${r.model}\nResponse: ${r.data}\nError: ${r.error}`)
      .join("\n"),
  );
}

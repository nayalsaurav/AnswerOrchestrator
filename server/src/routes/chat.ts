import { Router } from "express";
import client from "../config/openrouter";
import { getJudgePrompt } from "../lib/prompts";

const router = Router();

const MODELS = {
  participants: [
    "z-ai/glm-4.7-flash",
    "openai/gpt-4o-mini",
    "minimax/minimax-m2.5",
  ],
  judge: "anthropic/claude-3-haiku",
};

router.post("/", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ message: "Prompt is required" });
  try {
    const results = await Promise.allSettled(
      MODELS.participants.map((p) =>
        client.chat.send({
          chatRequest: {
            model: p,
            messages: [{ role: "user", content: prompt }],
            stream: false
          },
        }),
      ),
    );

    const responses = results.map((r, i) => ({
      model: MODELS.participants[i] ?? null,
      status: r.status,
      data:
        r.status === "fulfilled"
          ? (r.value?.choices[0]?.message?.content ?? null)
          : null,
      error: r.status === "rejected" ? r.reason : null,
    }));

    const judgeResult = await client.chat.send({
      chatRequest: {
        model: MODELS.judge,
        messages: [
          {
            role: "system",
            content: getJudgePrompt(prompt, responses),
          },
          { role: "user", content: responses.map((r) => r.data).join("\n") },
        ],
      },
    });

    return res.json({
      responses,
      judgeResult: judgeResult?.choices[0]?.message?.content ?? null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;

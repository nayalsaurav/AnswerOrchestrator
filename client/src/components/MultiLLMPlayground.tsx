import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MarkdownRenderer } from "./MarkdownRenderer"
import { Scale, Terminal, Copy, Check, History, RefreshCw, AlertTriangle, Send, Trash2 } from "lucide-react"
import { useMutation } from "@tanstack/react-query"

interface LLMResponse {
  model: string
  status: "fulfilled" | "rejected" | string
  data: string | null
  error: string | null
}

interface EvaluationResult {
  id: string
  prompt: string
  timestamp: string
  responses: LLMResponse[]
  judgeResult: string | null
}

const SUGGESTIONS = [
  "Explain the difference between SQL and NoSQL databases with a table.",
  "Write a TypeScript utility function to deep merge two objects and explain it.",
  "Compare REST APIs vs GraphQL, listing pros and cons for each.",
]

export function MultiLLMPlayground() {
  const [prompt, setPrompt] = useState(() => {
    return localStorage.getItem("multi_llm_current_prompt") || ""
  })
  const [results, setResults] = useState<EvaluationResult | null>(() => {
    const saved = localStorage.getItem("multi_llm_current_results")
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error("Failed to parse current results", e)
      }
    }
    return null
  })
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<EvaluationResult[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    localStorage.setItem("multi_llm_current_prompt", prompt)
  }, [prompt])

  useEffect(() => {
    if (results) {
      localStorage.setItem("multi_llm_current_results", JSON.stringify(results))
    } else {
      localStorage.removeItem("multi_llm_current_results")
    }
  }, [results])

  useEffect(() => {
    const saved = localStorage.getItem("multi_llm_history")
    if (saved) {
      try {
        setHistory(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to parse history", e)
      }
    }
  }, [])

  const saveToHistory = (newResult: EvaluationResult) => {
    const updated = [newResult, ...history.slice(0, 9)]
    setHistory(updated)
    localStorage.setItem("multi_llm_history", JSON.stringify(updated))
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getModelNameOnly = (fullName: string) => {
    return fullName.split("/").pop() || fullName
  }

  const comparisonMutation = useMutation({
    mutationFn: async (promptText: string) => {
      const response = await fetch("/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText }),
      })
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`)
      }
      return response.json()
    },
    onSuccess: (data, promptText) => {
      const newResult: EvaluationResult = {
        id: Date.now().toString(),
        prompt: promptText,
        timestamp: new Date().toLocaleString(),
        responses: data.responses,
        judgeResult: data.judgeResult,
      }
      setResults(newResult)
      saveToHistory(newResult)
    },
    onError: (err: any) => {
      console.error(err)
      setError(err?.message || "Failed to compare models. Please ensure the backend is running.")
    }
  })

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault()
    if (!prompt.trim() || comparisonMutation.isPending) return

    setResults(null)
    setError(null)
    comparisonMutation.mutate(prompt)
  }

  const loadFromHistory = (item: EvaluationResult) => {
    setResults(item)
    setPrompt(item.prompt)
    setActiveTab("all")
  }

  const handleClearHistory = () => {
    localStorage.removeItem("multi_llm_history")
    setHistory([])
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
      {/* Top Header */}
      <header className="mb-8 flex flex-col justify-between gap-4 border-b border-border/40 pb-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <img src="/logo.jpg" alt="Logo" className="h-10 w-10 rounded-lg object-cover shadow-md shadow-primary/20" />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">AnswerOrchestrator</h1>
            <p className="text-xs text-muted-foreground">Compare LLM responses and evaluate them side-by-side</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <div className="flex flex-col gap-6 lg:col-span-1">
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium">Suggested Prompts</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 p-4 pt-0">
              {SUGGESTIONS.map((s, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  onClick={() => setPrompt(s)}
                  className="w-full justify-start text-left whitespace-normal h-auto py-2 px-3 text-xs font-normal text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
                >
                  {s}
                </Button>
              ))}
            </CardContent>
          </Card>
          <Card className="flex-1">
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                History
              </CardTitle>
              {history.length > 0 && (
                <div className="relative flex items-center group/tooltip">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClearHistory}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-[10px] font-medium rounded border border-border shadow-md whitespace-nowrap opacity-0 scale-95 group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100 transition-all duration-200 pointer-events-none z-50">
                    Clear history
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <ScrollArea className="h-[250px] lg:h-[350px]">
                {history.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-8">
                    No prompt history yet.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2 pr-2">
                    {history.map((item) => (
                      <Button
                        key={item.id}
                        variant="ghost"
                        onClick={() => loadFromHistory(item)}
                        className={`w-full flex-col items-start text-left h-auto rounded-md p-2.5 text-xs border transition-all duration-200 group ${results?.id === item.id
                          ? "bg-primary/5 border-primary/20 text-foreground"
                          : "bg-card border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        <div className="truncate font-medium mb-1 w-full group-hover:text-primary transition-colors">
                          {item.prompt}
                        </div>
                        <div className="text-[10px] text-muted-foreground/80 font-normal">
                          {item.timestamp}
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-3">
          <Card className="border border-primary/10 shadow-sm bg-gradient-to-b from-card to-background">
            <CardContent className="p-5">
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div className="relative">
                  <Textarea
                    placeholder="Ask anything..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                    className="resize-none pr-8 py-3 text-sm focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary border-border/80"
                  />
                  <div className="absolute bottom-3 right-3 text-[10px] text-muted-foreground">
                    {prompt.length} chars
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <Terminal className="h-3.5 w-3.5" />
                    Models: GLM-4.7, GPT-4o-Mini, Minimax-m2.5 & Claude
                  </span>
                  <Button
                    type="submit"
                    disabled={!prompt.trim() || comparisonMutation.isPending}
                    className="gap-2 shadow-sm font-medium transition-all"
                  >
                    {comparisonMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Evaluating...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Run Comparison
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {comparisonMutation.isPending && (
            <div className="flex flex-col gap-4">
              <Card className="w-full animate-pulse border border-border">
                <CardHeader className="h-[60px] bg-muted/20 border-b border-border/40" />
                <CardContent className="p-6 space-y-3">
                  <div className="h-4 bg-muted/40 rounded w-1/3" />
                  <div className="h-3 bg-muted/30 rounded w-full" />
                  <div className="h-3 bg-muted/30 rounded w-5/6" />
                  <div className="h-3 bg-muted/30 rounded w-4/5" />
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse border border-border">
                    <CardHeader className="h-[45px] bg-muted/20 border-b border-border/40" />
                    <CardContent className="p-4 space-y-2">
                      <div className="h-3 bg-muted/30 rounded w-1/2" />
                      <div className="h-3 bg-muted/30 rounded w-full" />
                      <div className="h-3 bg-muted/30 rounded w-3/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {error && !comparisonMutation.isPending && (
            <Card className="border-destructive/35 bg-destructive/5 text-destructive-foreground">
              <CardHeader className="flex flex-row items-center gap-2 p-4 pb-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <CardTitle className="text-sm font-semibold text-destructive">Comparison Failed</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-xs text-muted-foreground">{error}</p>
              </CardContent>
            </Card>
          )}

          {results && !comparisonMutation.isPending && (
            <div className="flex flex-col gap-6">
              <div className="rounded-lg bg-muted/40 px-4 py-3 border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-xs">
                  <span className="font-semibold text-muted-foreground">Evaluating Prompt:</span>{" "}
                  <span className="text-foreground font-medium italic">"{results.prompt}"</span>
                </div>
                <div className="text-[10px] text-muted-foreground shrink-0">
                  {results.timestamp}
                </div>
              </div>
              {results.judgeResult && (
                <Card className="border-2 border-primary/20 bg-gradient-to-b from-primary/[0.02] to-card overflow-hidden shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 p-5 bg-primary/[0.03]">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded bg-primary/10 text-primary">
                        <Scale className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold">Judge's Synthesized Answer</CardTitle>
                        <CardDescription className="text-[10px]">Combined, corrected, and structured by Claude-3-Haiku</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-primary/5 hover:text-primary transition-all duration-200"
                        onClick={() => handleCopy(results.judgeResult || "", "judge")}
                      >
                        {copiedId === "judge" ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                      <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 font-semibold uppercase text-[9px] tracking-wider px-2 py-0.5">
                        Synthesized
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ScrollArea className="h-[450px] pr-4">
                      <MarkdownRenderer content={results.judgeResult} />
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Individual Model Responses</h3>
                  <div className="flex rounded-lg border border-border p-0.5 bg-muted/40">
                    <Button
                      variant={activeTab === "all" ? "outline" : "ghost"}
                      size="sm"
                      onClick={() => setActiveTab("all")}
                      className={`rounded-md px-3 py-1 text-xs font-medium transition-all duration-200 ${activeTab === "all"
                        ? "bg-card text-foreground shadow-sm border-border"
                        : "text-muted-foreground hover:text-foreground border-transparent"
                        }`}
                    >
                      Compare Grid
                    </Button>
                    {results.responses.map((r, i) => (
                      <Button
                        key={i}
                        variant={activeTab === r.model ? "outline" : "ghost"}
                        size="sm"
                        onClick={() => setActiveTab(r.model)}
                        className={`rounded-md px-3 py-1 text-xs font-medium transition-all duration-200 ${activeTab === r.model
                          ? "bg-card text-foreground shadow-sm border-border"
                          : "text-muted-foreground hover:text-foreground border-transparent"
                          }`}
                      >
                        {getModelNameOnly(r.model)}
                      </Button>
                    ))}
                  </div>
                </div>

                {activeTab === "all" ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {results.responses.map((resp, idx) => (
                      <Card key={idx} className="border border-border/80 flex flex-col h-full bg-card/60 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 p-4 bg-muted/10 shrink-0">
                          <div className="flex flex-col gap-0.5 max-w-[70%]">
                            <span className="font-semibold text-xs truncate text-foreground">
                              {getModelNameOnly(resp.model)}
                            </span>
                            <span className="text-[9px] text-muted-foreground truncate">
                              {resp.model}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleCopy(resp.data || "", `model-${idx}`)}
                            >
                              {copiedId === `model-${idx}` ? (
                                <Check className="h-3.5 w-3.5 text-green-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                            </Button>
                            <Badge
                              variant={resp.status === "fulfilled" ? "outline" : "destructive"}
                              className={`text-[9px] px-1.5 py-0 ${resp.status === "fulfilled"
                                ? "bg-green-500/5 text-green-600 border-green-500/20"
                                : "bg-red-500/5 text-red-600 border-red-500/20"
                                }`}
                            >
                              {resp.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 text-xs flex-1 overflow-y-auto max-h-[300px]">
                          {resp.status === "rejected" || !resp.data ? (
                            <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground text-xs gap-2">
                              <AlertTriangle className="h-6 w-6 text-amber-500" />
                              <div>
                                <p className="font-medium text-foreground">Failed to get response</p>
                                <p className="text-[10px] text-muted-foreground mt-1 max-w-[200px] break-words">
                                  {resp.error || "Unknown OpenRouter API error"}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <MarkdownRenderer content={resp.data} />
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  results.responses
                    .filter((r) => r.model === activeTab)
                    .map((resp, idx) => (
                      <Card key={idx} className="border border-border/80 bg-card">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 p-4 bg-muted/20">
                          <div>
                            <CardTitle className="text-sm font-semibold">{getModelNameOnly(resp.model)}</CardTitle>
                            <CardDescription className="text-[10px]">{resp.model}</CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleCopy(resp.data || "", "tab-active")}
                            >
                              {copiedId === "tab-active" ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                            <Badge
                              variant={resp.status === "fulfilled" ? "outline" : "destructive"}
                              className={resp.status === "fulfilled" ? "bg-green-500/5 text-green-600 border-green-500/20" : ""}
                            >
                              {resp.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6">
                          {resp.status === "rejected" || !resp.data ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-3">
                              <AlertTriangle className="h-8 w-8 text-amber-500" />
                              <div>
                                <p className="font-medium text-foreground">Failed to get response</p>
                                <p className="text-xs text-muted-foreground mt-1 max-w-[400px]">
                                  {resp.error || "Unknown OpenRouter API error"}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <ScrollArea className="h-[450px] pr-4">
                              <MarkdownRenderer content={resp.data} />
                            </ScrollArea>
                          )}
                        </CardContent>
                      </Card>
                    ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

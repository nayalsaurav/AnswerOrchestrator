import { MultiLLMPlayground } from "@/components/MultiLLMPlayground"

export function App() {
  return (
    <div className="min-h-svh bg-background text-foreground selection:bg-primary/15 transition-colors duration-300">
      <MultiLLMPlayground />
      <footer className="w-full text-center py-6 text-xs text-muted-foreground border-t border-border/20">
        Press <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">d</kbd> to toggle dark mode
      </footer>
    </div>
  )
}

export default App


import { useState } from "react"
import { Button } from "./components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { Input } from "./components/ui/input"
import { ScrollArea } from "./components/ui/scroll-area"
import { Sparkles, Send, Brain, Calculator, Loader2, X, RefreshCw } from "lucide-react"
import { blink } from "./lib/blink"
import { ACTIONS } from "./App"
import { toast } from "sonner"

interface AiAssistantProps {
  currentOperand: string | null | undefined
  previousOperand: string | null | undefined
  operation: string | null | undefined
  dispatch: React.Dispatch<any>
  onClose: () => void
}

export default function AiAssistant({ currentOperand, previousOperand, operation, dispatch, onClose }: AiAssistantProps) {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string; type?: "result" | "explanation" }[]>([
    { role: "ai", content: "Hi! I'm your AI Math Assistant. You can ask me to solve word problems, perform complex conversions, or explain your calculations." }
  ])

  const handleSolve = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userPrompt = input
    setMessages(prev => [...prev, { role: "user", content: userPrompt }])
    setInput("")
    setIsLoading(true)

    try {
      const { object } = await blink.ai.generateObject({
        prompt: `Solve this math problem: "${userPrompt}". 
        Provide the final numeric result and a brief explanation of how you solved it.`,
        schema: {
          type: "object",
          properties: {
            result: { type: "number" },
            explanation: { type: "string" }
          },
          required: ["result", "explanation"]
        }
      })

      const res = object as { result: number; explanation: string }
      
      setMessages(prev => [...prev, { 
        role: "ai", 
        content: res.explanation, 
        type: "explanation" 
      }])

      // Add a special "Apply Result" action
      setMessages(prev => [...prev, { 
        role: "ai", 
        content: `Result: ${res.result}`, 
        type: "result" 
      }])
      
      // Auto-apply if it's a simple result? Or let user click?
      // Let's auto-apply and notify
      dispatch({ type: ACTIONS.SET_HISTORY_ITEM, payload: { digit: res.result.toString() } })
      toast.info("AI Result applied to calculator")

    } catch (error) {
      console.error("AI Error:", error)
      toast.error("Failed to get AI response")
      setMessages(prev => [...prev, { role: "ai", content: "Sorry, I couldn't process that request." }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleExplain = async () => {
    if (isLoading) return
    setIsLoading(true)

    const expression = previousOperand && operation && currentOperand 
      ? `${previousOperand} ${operation} ${currentOperand}`
      : currentOperand || "0"

    setMessages(prev => [...prev, { role: "user", content: `Explain the calculation: ${expression}` }])

    try {
      const { text } = await blink.ai.generateText({
        prompt: `You are a math tutor. Explain this calculation in simple terms: ${expression}. 
        If it's just a number, explain what that number represents or interesting facts about it.`,
      })

      setMessages(prev => [...prev, { role: "ai", content: text }])
    } catch (error) {
      toast.error("Failed to get explanation")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="h-full flex flex-col glass-panel border-none shadow-2xl animate-in slide-in-from-right duration-300">
      <CardHeader className="flex flex-row items-center justify-between py-4 px-6 space-y-0 border-b border-white/5">
        <CardTitle className="text-lg font-bold flex items-center gap-2 text-primary">
          <Sparkles className="w-5 h-5" />
          AI Assistant
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-white/10">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 gap-2 bg-primary/5 border-primary/20 hover:bg-primary/10"
            onClick={handleExplain}
            disabled={isLoading}
          >
            <Brain className="w-4 h-4" />
            Explain Result
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 gap-2 bg-secondary/5 border-secondary/20 hover:bg-secondary/10"
            onClick={() => {
              setMessages([{ role: "ai", content: "Chat cleared. How can I help you today?" }])
            }}
          >
            <RefreshCw className="w-4 h-4" />
            Clear
          </Button>
        </div>

        <ScrollArea className="flex-1 pr-4">
          <div className="flex flex-col gap-4">
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user" 
                    ? "bg-primary text-primary-foreground rounded-tr-none" 
                    : "bg-white/10 text-foreground rounded-tl-none border border-white/5"
                }`}>
                  {msg.content}
                  {msg.type === "result" && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="mt-2 w-full h-8 gap-2 bg-black/20 hover:bg-black/40 text-xs"
                      onClick={() => {
                        const result = msg.content.replace("Result: ", "")
                        dispatch({ type: ACTIONS.SET_HISTORY_ITEM, payload: { digit: result } })
                        toast.success("Applied to calculator")
                      }}
                    >
                      <Calculator className="w-3 h-3" />
                      Apply to Calc
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground text-xs animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" />
                AI is thinking...
              </div>
            )}
          </div>
        </ScrollArea>

        <form onSubmit={handleSolve} className="flex gap-2 pt-2">
          <Input 
            placeholder="Ask AI anything... (e.g. 15% of 250)" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="bg-white/5 border-white/10 focus-visible:ring-primary/50"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

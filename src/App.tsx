/**
 * Pro Calculator - Main Application
 * 
 * A professional calculator featuring:
 * - Complex state management using useReducer
 * - Support for standard and scientific operations
 * - Persistent history stored in LocalStorage
 * - Comprehensive keyboard support
 * - Modern, glassmorphism-inspired UI
 */

import { useReducer, useEffect, useState } from "react"
import DigitButton from "./DigitButton"
import OperationButton from "./OperationButton"
import AiAssistant from "./AiAssistant"
import { Button } from "./components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { ScrollArea } from "./components/ui/scroll-area"
import { History, Trash2, Keyboard, Calculator as CalcIcon, Eraser, Copy, Check, Settings2, Palette, Sparkles } from "lucide-react"
import { toast, Toaster } from "sonner"
import { cn } from "./lib/utils"

/** Available actions for the calculator state reducer */
export const ACTIONS = {
  ADD_DIGIT: "add-digit",
  CHOOSE_OPERATION: "choose-operation",
  CLEAR: "clear",
  DELETE_DIGIT: "delete-digit",
  EVALUATE: "evaluate",
  PERCENT: "percent",
  TOGGLE_SIGN: "toggle-sign",
  CLEAR_HISTORY: "clear-history",
  SET_HISTORY_ITEM: "set-history-item",
  SCIENTIFIC_OPERATION: "scientific-operation",
  TOGGLE_UNITS: "toggle-units",
  SET_THEME: "set-theme",
} as const

type ActionType = typeof ACTIONS[keyof typeof ACTIONS]

/** Shape of the calculator state */
interface State {
  /** The value currently being entered */
  currentOperand?: string | null
  /** The previously entered value */
  previousOperand?: string | null
  /** The current mathematical operation being performed */
  operation?: string | null
  /** Flag to indicate if the current operand should be overwritten on the next input */
  overwrite?: boolean
  /** Array of past calculations */
  history: { expression: string; result: string }[]
  /** Whether trigonometric functions use radians or degrees */
  isRadians: boolean
  /** The current theme of the calculator */
  theme: "ocean" | "amber"
}

interface Action {
  type: ActionType
  payload?: { digit?: string; operation?: string }
}

/**
 * Reducer function to handle all state transitions for the calculator.
 */
function reducer(state: State, { type, payload }: Action): State {
  switch (type) {
    case ACTIONS.ADD_DIGIT:
      // Handle overwriting the current display (e.g., after an evaluation)
      if (state.overwrite) {
        return {
          ...state,
          currentOperand: payload?.digit,
          overwrite: false,
        }
      }
      // Prevent multiple leading zeros
      if (payload?.digit === "0" && state.currentOperand === "0") {
        return state
      }
      // Prevent multiple decimal points
      if (payload?.digit === "." && state.currentOperand?.includes(".")) {
        return state
      }

      return {
        ...state,
        currentOperand: `${state.currentOperand || ""}${payload?.digit}`,
      }
    case ACTIONS.CHOOSE_OPERATION:
      // Do nothing if no operands are present
      if (state.currentOperand == null && state.previousOperand == null) {
        return state
      }

      // Allow changing the operation if current operand is empty
      if (state.currentOperand == null) {
        return {
          ...state,
          operation: payload?.operation,
        }
      }

      // Move current operand to previous operand if previous is empty
      if (state.previousOperand == null) {
        return {
          ...state,
          operation: payload?.operation,
          previousOperand: state.currentOperand,
          currentOperand: null,
        }
      }

      // Perform intermediate calculation if both operands exist
      return {
        ...state,
        previousOperand: evaluate(state),
        operation: payload?.operation,
        currentOperand: null,
      }
    case ACTIONS.SCIENTIFIC_OPERATION:
      if (state.currentOperand == null) {
        // Handle PI and E even if currentOperand is null
        if (payload?.operation === "pi") {
          return { ...state, currentOperand: Math.PI.toString(), overwrite: true }
        }
        if (payload?.operation === "e") {
          return { ...state, currentOperand: Math.E.toString(), overwrite: true }
        }
        return state
      }
      
      const currentVal = parseFloat(state.currentOperand)
      let scientificResult = 0
      let scientificExpression = ""

      // Helper for factorial
      const factorial = (n: number): number => {
        if (n < 0) return NaN
        if (n === 0) return 1
        let res = 1
        for (let i = 2; i <= n; i++) res *= i
        return res
      }

      // Handle scientific operations
      switch (payload?.operation) {
        case "sqrt":
          scientificResult = Math.sqrt(currentVal)
          scientificExpression = `√(${state.currentOperand})`
          break
        case "square":
          scientificResult = Math.pow(currentVal, 2)
          scientificExpression = `(${state.currentOperand})²`
          break
        case "reciprocal":
          scientificResult = 1 / currentVal
          scientificExpression = `1/(${state.currentOperand})`
          break
        case "abs":
          scientificResult = Math.abs(currentVal)
          scientificExpression = `|${state.currentOperand}|`
          break
        case "sin":
          scientificResult = state.isRadians ? Math.sin(currentVal) : Math.sin(currentVal * (Math.PI / 180))
          scientificExpression = `sin(${state.currentOperand})`
          break
        case "cos":
          scientificResult = state.isRadians ? Math.cos(currentVal) : Math.cos(currentVal * (Math.PI / 180))
          scientificExpression = `cos(${state.currentOperand})`
          break
        case "tan":
          scientificResult = state.isRadians ? Math.tan(currentVal) : Math.tan(currentVal * (Math.PI / 180))
          scientificExpression = `tan(${state.currentOperand})`
          break
        case "log":
          scientificResult = Math.log10(currentVal)
          scientificExpression = `log(${state.currentOperand})`
          break
        case "ln":
          scientificResult = Math.log(currentVal)
          scientificExpression = `ln(${state.currentOperand})`
          break
        case "factorial":
          scientificResult = factorial(currentVal)
          scientificExpression = `${state.currentOperand}!`
          break
        case "pi":
          return { ...state, currentOperand: Math.PI.toString(), overwrite: true }
        case "e":
          return { ...state, currentOperand: Math.E.toString(), overwrite: true }
        default:
          return state
      }

      const resString = scientificResult.toString()
      return {
        ...state,
        currentOperand: resString,
        overwrite: true,
        history: [{ expression: scientificExpression, result: resString }, ...state.history].slice(0, 10)
      }
    case ACTIONS.CLEAR:
      // Reset the calculator to initial state (except history)
      return { ...state, currentOperand: null, previousOperand: null, operation: null, overwrite: false }
    case ACTIONS.DELETE_DIGIT:
      if (state.overwrite) {
        return {
          ...state,
          overwrite: false,
          currentOperand: null,
        }
      }
      if (state.currentOperand == null) return state
      if (state.currentOperand.length === 1) {
        return { ...state, currentOperand: null }
      }

      return {
        ...state,
        currentOperand: state.currentOperand.slice(0, -1),
      }
    case ACTIONS.PERCENT:
      if (state.currentOperand == null) return state
      const value = parseFloat(state.currentOperand)
      const percentRes = (value / 100).toString()
      return {
        ...state,
        currentOperand: percentRes,
        overwrite: true,
        history: [{ expression: `${state.currentOperand}%`, result: percentRes }, ...state.history].slice(0, 10)
      }
    case ACTIONS.TOGGLE_SIGN:
      if (state.currentOperand == null) return state
      return {
        ...state,
        currentOperand: (parseFloat(state.currentOperand) * -1).toString()
      }
    case ACTIONS.EVALUATE:
      // Ensure all necessary components exist for evaluation
      if (
        state.operation == null ||
        state.currentOperand == null ||
        state.previousOperand == null
      ) {
        return state
      }

      const result = evaluate(state)
      const expression = `${state.previousOperand} ${state.operation} ${state.currentOperand}`
      
      return {
        ...state,
        overwrite: true,
        previousOperand: null,
        operation: null,
        currentOperand: result,
        history: [{ expression, result }, ...state.history].slice(0, 10)
      }
    case ACTIONS.SET_HISTORY_ITEM:
      // Recall a result from history back into the calculator display
      return {
        ...state,
        currentOperand: payload?.digit,
        overwrite: true
      }
    case ACTIONS.CLEAR_HISTORY:
      return { ...state, history: [] }
    case ACTIONS.TOGGLE_UNITS:
      return { ...state, isRadians: !state.isRadians }
    case ACTIONS.SET_THEME:
      return { ...state, theme: payload?.operation as "ocean" | "amber" }
    default:
      return state
  }
}

/**
 * Helper function to perform the actual mathematical computation based on state.
 */
function evaluate({ currentOperand, previousOperand, operation }: State): string {
  const prev = parseFloat(previousOperand || "")
  const current = parseFloat(currentOperand || "")
  if (isNaN(prev) || isNaN(current)) return ""
  let computation = 0
  switch (operation) {
    case "+":
      computation = prev + current
      break
    case "-":
      computation = prev - current
      break
    case "*":
      computation = prev * current
      break
    case "÷":
      computation = prev / current
      break
    case "^":
      computation = Math.pow(prev, current)
      break
  }

  return computation.toString()
}

/** Formatter for integers to include thousands separators */
const INTEGER_FORMATTER = new Intl.NumberFormat("en-us", {
  maximumFractionDigits: 0,
})

/**
 * Formats a numeric string to include separators and correctly handle decimals.
 */
function formatOperand(operand: string | null | undefined): string | undefined {
  if (operand == null) return undefined
  const [integer, decimal] = operand.split(".")
  if (decimal == null) return INTEGER_FORMATTER.format(parseFloat(integer))
  return `${INTEGER_FORMATTER.format(parseFloat(integer))}.${decimal}`
}

function App() {
  // Initialize state with history from LocalStorage if available
  const [{ currentOperand, previousOperand, operation, history, isRadians, theme }, dispatch] = useReducer(
    reducer,
    { 
      history: JSON.parse(localStorage.getItem("calc-history") || "[]"), 
      isRadians: JSON.parse(localStorage.getItem("calc-units") || "true"), 
      theme: (localStorage.getItem("calc-theme") as "ocean" | "amber") || "ocean" 
    }
  )

  const [showHistory, setShowHistory] = useState(false)
  const [showAi, setShowAi] = useState(false)
  const [pressedKey, setPressedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    if (!currentOperand) return
    navigator.clipboard.writeText(currentOperand)
    setCopied(true)
    toast.success("Result copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  // Sync state to LocalStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("calc-history", JSON.stringify(history))
    localStorage.setItem("calc-units", JSON.stringify(isRadians))
    localStorage.setItem("calc-theme", theme)
  }, [history, isRadians, theme])

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      let key = e.key
      setPressedKey(key)
      // Brief timeout to visually indicate a key was pressed
      setTimeout(() => setPressedKey(null), 150)

      if (/\d/.test(e.key)) {
        dispatch({ type: ACTIONS.ADD_DIGIT, payload: { digit: e.key } })
      } else if (e.key === ".") {
        dispatch({ type: ACTIONS.ADD_DIGIT, payload: { digit: "." } })
      } else if (["+", "-", "*", "/"].includes(e.key)) {
        const op = e.key === "/" ? "÷" : e.key
        dispatch({ type: ACTIONS.CHOOSE_OPERATION, payload: { operation: op } })
      } else if (e.key === "Enter" || e.key === "=") {
        dispatch({ type: ACTIONS.EVALUATE })
      } else if (e.key === "Backspace") {
        dispatch({ type: ACTIONS.DELETE_DIGIT })
      } else if (e.key === "Escape") {
        dispatch({ type: ACTIONS.CLEAR })
      } else if (e.key === "%") {
        dispatch({ type: ACTIONS.PERCENT })
      } else if (e.key === "s") {
        dispatch({ type: ACTIONS.SCIENTIFIC_OPERATION, payload: { operation: "sqrt" } })
      } else if (e.key === "p") {
        dispatch({ type: ACTIONS.CHOOSE_OPERATION, payload: { operation: "^" } })
      } else if (e.key === "r") {
        dispatch({ type: ACTIONS.SCIENTIFIC_OPERATION, payload: { operation: "reciprocal" } })
      } else if (e.key === "a") {
        dispatch({ type: ACTIONS.SCIENTIFIC_OPERATION, payload: { operation: "abs" } })
      } else if (e.key === "i") {
        dispatch({ type: ACTIONS.SCIENTIFIC_OPERATION, payload: { operation: "sin" } })
      } else if (e.key === "o") {
        dispatch({ type: ACTIONS.SCIENTIFIC_OPERATION, payload: { operation: "cos" } })
      } else if (e.key === "t") {
        dispatch({ type: ACTIONS.SCIENTIFIC_OPERATION, payload: { operation: "tan" } })
      } else if (e.key === "l") {
        dispatch({ type: ACTIONS.SCIENTIFIC_OPERATION, payload: { operation: "log" } })
      } else if (e.key === "n") {
        dispatch({ type: ACTIONS.SCIENTIFIC_OPERATION, payload: { operation: "ln" } })
      } else if (e.key === "!") {
        dispatch({ type: ACTIONS.SCIENTIFIC_OPERATION, payload: { operation: "factorial" } })
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <div className={cn(
      "min-h-[100dvh] bg-background flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 transition-colors duration-500 overflow-x-hidden relative",
      theme === "amber" && "theme-amber"
    )}>
      <Toaster position="top-center" richColors />
      
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
      </div>

      <div className={cn(
        "w-full max-w-6xl grid grid-cols-1 gap-6 md:gap-8 animate-fade-in transition-all duration-500 z-10",
        (showHistory || showAi) ? "lg:grid-cols-[1fr_350px]" : "max-w-xl"
      )}>
        <Card className={cn(
          "glass-panel overflow-hidden border-none transition-all duration-500 hover:shadow-primary/10",
          "w-full mx-auto"
        )}>
          <CardHeader className="flex flex-row items-center justify-between py-6 px-4 sm:px-8 space-y-0 bg-white/[0.02] border-b border-white/5">
            <CardTitle className="text-xl font-bold flex items-center gap-3 sm:gap-4 text-primary shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-black/40 rounded-xl sm:rounded-2xl flex items-center justify-center border border-primary/20 shadow-xl group transition-all hover:border-primary/40">
                <CalcIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary transition-transform group-hover:scale-110" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-lg sm:text-2xl font-bold tracking-tight text-primary">Pro</span>
                <span className="text-lg sm:text-2xl font-bold tracking-tight text-foreground">Calculator</span>
              </div>
            </CardTitle>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden xs:flex bg-black/40 p-1 rounded-full border border-white/5 relative h-8 sm:h-9 w-20 sm:w-24 scale-90 sm:scale-100">
                <div className={cn(
                  "absolute top-1 bottom-1 w-[calc(50%-4px)] bg-primary rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(var(--primary),0.3)]",
                  isRadians ? "left-[calc(50%+2px)]" : "left-1"
                )} />
                <button
                  className={cn(
                    "flex-1 z-10 text-[8px] sm:text-[9px] font-bold tracking-widest transition-colors",
                    !isRadians ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => isRadians && dispatch({ type: ACTIONS.TOGGLE_UNITS })}
                >
                  DEG
                </button>
                <button
                  className={cn(
                    "flex-1 z-10 text-[8px] sm:text-[9px] font-bold tracking-widest transition-colors",
                    isRadians ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => !isRadians && dispatch({ type: ACTIONS.TOGGLE_UNITS })}
                >
                  RAD
                </button>
              </div>
              
              <div className="hidden sm:flex bg-black/40 p-1 rounded-full border border-white/5 relative h-9 w-20">
                <div className={cn(
                  "absolute top-1 bottom-1 w-[calc(50%-4px)] bg-primary/20 rounded-full transition-all duration-300 blur-sm",
                  theme === "amber" ? "left-[calc(50%+2px)]" : "left-1"
                )} />
                <button
                  className={cn(
                    "flex-1 z-10 flex items-center justify-center transition-all",
                    theme === "ocean" ? "scale-110" : "opacity-40 hover:opacity-70 scale-90"
                  )}
                  onClick={() => dispatch({ type: ACTIONS.SET_THEME, payload: { operation: "ocean" } })}
                >
                  <div className={cn(
                    "w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#0D9488] border border-white/10",
                    theme === "ocean" && "shadow-[0_0_12px_rgba(13,148,136,0.6)]"
                  )} />
                </button>
                <button
                  className={cn(
                    "flex-1 z-10 flex items-center justify-center transition-all",
                    theme === "amber" ? "scale-110" : "opacity-40 hover:opacity-70 scale-90"
                  )}
                  onClick={() => dispatch({ type: ACTIONS.SET_THEME, payload: { operation: "amber" } })}
                >
                  <div className={cn(
                    "w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#D97706] border border-white/10",
                    theme === "amber" && "shadow-[0_0_12px_rgba(217,119,6,0.6)]"
                  )} />
                </button>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "w-9 h-9 sm:w-10 sm:h-10 hover:bg-primary/10 transition-all duration-300",
                    showAi ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => {
                    setShowAi(!showAi)
                    setShowHistory(false)
                  }}
                >
                  <Sparkles className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "w-9 h-9 sm:w-10 sm:h-10 hover:bg-primary/10 transition-all duration-300",
                    showHistory ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => {
                    setShowHistory(!showHistory)
                    setShowAi(false)
                  }}
                >
                  <History className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="flex flex-col bg-black/20 p-6 sm:p-8 min-h-[160px] sm:min-h-[200px] justify-end relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="text-right text-muted-foreground font-mono text-sm sm:text-lg mb-2 h-6 sm:h-8 flex items-center justify-end gap-2 animate-in fade-in slide-in-from-right-4 duration-500">
                {formatOperand(previousOperand)} {operation}
              </div>
              <div className="flex items-center justify-end gap-4">
                <div className={cn(
                  "text-right font-mono font-bold break-all transition-all duration-300 display-text",
                  (currentOperand?.length || 0) > 10 ? "text-3xl sm:text-4xl" : "text-5xl sm:text-6xl md:text-7xl",
                  !currentOperand && "text-muted-foreground/30"
                )}>
                  {formatOperand(currentOperand) || "0"}
                </div>
                {currentOperand && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300 text-muted-foreground hover:text-primary h-8 w-8"
                    onClick={copyToClipboard}
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                )}
              </div>
            </div>

            <div className="calc-grid border-t border-white/5">
              <Button
                variant="ghost"
                className="col-span-2 h-16 sm:h-20 text-lg sm:text-xl font-bold text-destructive hover:bg-destructive/10 rounded-none border-r border-b border-white/5 transition-all active:scale-95"
                onClick={() => dispatch({ type: ACTIONS.CLEAR })}
              >
                AC
              </Button>
              <Button
                variant="ghost"
                className="h-16 sm:h-20 flex items-center justify-center hover:bg-white/5 rounded-none border-r border-b border-white/5 transition-all active:scale-95"
                onClick={() => dispatch({ type: ACTIONS.DELETE_DIGIT })}
              >
                <Eraser className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </Button>
              <OperationButton operation="÷" dispatch={dispatch} className="h-16 sm:h-20 border-b border-white/5" />

              <DigitButton digit="7" dispatch={dispatch} className="h-16 sm:h-20 border-r border-b border-white/5" />
              <DigitButton digit="8" dispatch={dispatch} className="h-16 sm:h-20 border-r border-b border-white/5" />
              <DigitButton digit="9" dispatch={dispatch} className="h-16 sm:h-20 border-r border-b border-white/5" />
              <OperationButton operation="*" dispatch={dispatch} className="h-16 sm:h-20 border-b border-white/5" />

              <DigitButton digit="4" dispatch={dispatch} className="h-16 sm:h-20 border-r border-b border-white/5" />
              <DigitButton digit="5" dispatch={dispatch} className="h-16 sm:h-20 border-r border-b border-white/5" />
              <DigitButton digit="6" dispatch={dispatch} className="h-16 sm:h-20 border-r border-b border-white/5" />
              <OperationButton operation="-" dispatch={dispatch} className="h-16 sm:h-20 border-b border-white/5" />

              <DigitButton digit="1" dispatch={dispatch} className="h-16 sm:h-20 border-r border-b border-white/5" />
              <DigitButton digit="2" dispatch={dispatch} className="h-16 sm:h-20 border-r border-b border-white/5" />
              <DigitButton digit="3" dispatch={dispatch} className="h-16 sm:h-20 border-r border-b border-white/5" />
              <OperationButton operation="+" dispatch={dispatch} className="h-16 sm:h-20 border-b border-white/5" />

              <DigitButton digit="." dispatch={dispatch} className="h-16 sm:h-20 border-r border-white/5" />
              <DigitButton digit="0" dispatch={dispatch} className="h-16 sm:h-20 border-r border-white/5" />
              <Button
                variant="ghost"
                className="h-16 sm:h-20 text-lg sm:text-xl font-bold text-primary hover:bg-primary/10 rounded-none border-r border-white/5 transition-all active:scale-95"
                onClick={() => dispatch({ type: ACTIONS.PERCENT })}
              >
                %
              </Button>
              <Button
                className="h-16 sm:h-20 text-2xl sm:text-3xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-none shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition-all active:scale-95"
                onClick={() => dispatch({ type: ACTIONS.EVALUATE })}
              >
                =
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar panels */}
        <div className={cn(
          "flex flex-col gap-6 transition-all duration-500",
          (!showHistory && !showAi) && "hidden"
        )}>
          {showHistory && (
            <Card className="glass-panel border-none h-full min-h-[400px] flex flex-col animate-in slide-in-from-right-4 duration-500 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between py-6 px-6 border-b border-white/5">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-primary">
                  <History className="w-5 h-5" />
                  History
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive h-8 w-8"
                  onClick={() => dispatch({ type: ACTIONS.CLEAR_HISTORY })}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-[400px] lg:h-[600px] px-4 py-4">
                  <div className="space-y-3">
                    {history.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-3">
                        <CalcIcon className="w-8 h-8 opacity-20" />
                        <p className="text-sm font-medium">No calculations yet</p>
                      </div>
                    ) : (
                      history.map((item, index) => (
                        <div
                          key={index}
                          className="history-item group"
                          onClick={() => dispatch({ type: ACTIONS.SET_HISTORY_ITEM, payload: { digit: item.result } })}
                        >
                          <div className="text-xs font-mono text-muted-foreground mb-1 group-hover:text-primary/70 transition-colors">
                            {item.expression}
                          </div>
                          <div className="text-lg font-mono font-bold text-foreground">
                            = {formatOperand(item.result)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {showAi && (
            <div className="animate-in slide-in-from-right-4 duration-500 h-full">
              <AiAssistant 
                currentOperand={currentOperand}
                previousOperand={previousOperand}
                operation={operation}
                dispatch={dispatch}
                onClose={() => setShowAi(false)} 
              />
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-[0.2em] text-muted-foreground/30 uppercase z-10 hidden sm:block font-mono">
        Pro Calculator Elite Edition
      </div>
    </div>
  )
}

export default App

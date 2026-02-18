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
      "min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-8 transition-colors duration-500 overflow-x-hidden",
      theme === "amber" && "theme-amber"
    )}>
      <Toaster position="top-center" richColors />
      <div className={cn(
        "w-full max-w-5xl grid grid-cols-1 gap-6 animate-fade-in transition-all duration-500",
        (showHistory || showAi) ? "lg:grid-cols-4" : "lg:grid-cols-3"
      )}>
        <Card className={cn(
          "glass-panel overflow-hidden border-none transition-all duration-500 hover:shadow-primary/10 hover:shadow-2xl",
          (showHistory || showAi) ? "lg:col-span-3" : "lg:col-span-3"
        )}>
          <CardHeader className="flex flex-row items-center justify-between py-6 px-6 sm:px-8 space-y-0 bg-white/[0.02] overflow-hidden">
            <CardTitle className="text-xl font-bold flex items-center gap-4 text-primary shrink-0">
              <div className="w-12 h-12 bg-[#1A1D1D] rounded-2xl flex items-center justify-center border border-primary/20 shadow-xl group transition-all hover:border-primary/40">
                <CalcIcon className="w-6 h-6 text-primary transition-transform group-hover:scale-110" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-primary">Pro</span>
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Calculator</span>
              </div>
            </CardTitle>
            <div className="flex items-center gap-3 sm:gap-6">
              <div className="flex bg-black/40 p-1 rounded-full border border-white/5 relative h-9 w-24 scale-90 sm:scale-100">
                <div className={cn(
                  "absolute top-1 bottom-1 w-[calc(50%-4px)] bg-primary rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(var(--primary),0.3)]",
                  isRadians ? "left-[calc(50%+2px)]" : "left-1"
                )} />
                <button
                  className={cn(
                    "flex-1 z-10 text-[9px] font-bold tracking-widest transition-colors",
                    !isRadians ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => isRadians && dispatch({ type: ACTIONS.TOGGLE_UNITS })}
                >
                  DEG
                </button>
                <button
                  className={cn(
                    "flex-1 z-10 text-[9px] font-bold tracking-widest transition-colors",
                    isRadians ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => !isRadians && dispatch({ type: ACTIONS.TOGGLE_UNITS })}
                >
                  RAD
                </button>
              </div>
              
              <div className="hidden xs:flex items-center">
                <div className="flex bg-black/40 p-1 rounded-full border border-white/5 relative h-9 w-[72px] sm:w-20">
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
                      "w-5 h-5 rounded-full bg-[#0D9488] border border-white/10",
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
                      "w-5 h-5 rounded-full bg-[#D97706] border border-white/10",
                      theme === "amber" && "shadow-[0_0_12px_rgba(217,119,6,0.6)]"
                    )} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "hover:bg-primary/10 transition-all duration-300",
                    showAi ? "text-primary scale-110" : "text-muted-foreground hover:text-foreground"
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
                    "hover:bg-white/10 transition-all duration-300",
                    showHistory ? "text-primary scale-110" : "text-muted-foreground hover:text-foreground"
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
            <div className="output bg-black/40 p-10 flex flex-col items-end justify-center gap-3 min-h-[200px] text-right border-b border-white/5 relative group">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/10"
                onClick={copyToClipboard}
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
              </Button>
              <div className="previous-operand text-muted-foreground/60 font-medium tracking-wider text-xl h-8 overflow-hidden whitespace-nowrap">
                {formatOperand(previousOperand)} {operation}
              </div>
              <div className="current-operand text-foreground text-6xl md:text-7xl font-bold tracking-tighter break-all display-text selection:bg-primary/20">
                {formatOperand(currentOperand) || "0"}
              </div>
            </div>
            
            <div className="grid grid-cols-4 md:grid-cols-6 bg-border/20">
              {/* Scientific Operations */}
              <div className="col-span-4 md:col-span-2 grid grid-cols-4 md:grid-cols-2 border-r border-white/5 bg-black/20">
                <Button
                  variant="ghost"
                  className="h-14 md:h-16 text-xs font-bold rounded-none hover:bg-primary/10 hover:text-primary transition-colors border-b border-r border-white/5"
                  onClick={() => dispatch({ type: ACTIONS.SCIENTIFIC_OPERATION, payload: { operation: "sin" } })}
                >
                  sin
                </Button>
                <Button
                  variant="ghost"
                  className="h-14 md:h-16 text-xs font-bold rounded-none hover:bg-primary/10 hover:text-primary transition-colors border-b border-white/5"
                  onClick={() => dispatch({ type: ACTIONS.SCIENTIFIC_OPERATION, payload: { operation: "cos" } })}
                >
                  cos
                </Button>
                <Button
                  variant="ghost"
                  className="h-14 md:h-16 text-xs font-bold rounded-none hover:bg-primary/10 hover:text-primary transition-colors border-b border-r border-white/5"
                  onClick={() => dispatch({ type: ACTIONS.SCIENTIFIC_OPERATION, payload: { operation: "tan" } })}
                >
                  tan
                </Button>
                <Button
                  variant="ghost"
                  className="h-14 md:h-16 text-xs font-bold rounded-none hover:bg-primary/10 hover:text-primary transition-colors border-b border-white/5"
                  onClick={() => dispatch({ type: ACTIONS.SCIENTIFIC_OPERATION, payload: { operation: "factorial" } })}
                >
                  n!
                </Button>
                <Button
                  variant="ghost"
                  className="h-14 md:h-16 text-xs font-bold rounded-none hover:bg-primary/10 hover:text-primary transition-colors border-b border-r border-white/5"
                  onClick={() => dispatch({ type: ACTIONS.SCIENTIFIC_OPERATION, payload: { operation: "log" } })}
                >
                  log
                </Button>
                <Button
                  variant="ghost"
                  className="h-14 md:h-16 text-xs font-bold rounded-none hover:bg-primary/10 hover:text-primary transition-colors border-b border-white/5"
                  onClick={() => dispatch({ type: ACTIONS.SCIENTIFIC_OPERATION, payload: { operation: "ln" } })}
                >
                  ln
                </Button>
                <Button
                  variant="ghost"
                  className="h-14 md:h-16 text-xs font-bold rounded-none hover:bg-primary/10 hover:text-primary transition-colors border-b border-r border-white/5"
                  onClick={() => dispatch({ type: ACTIONS.SCIENTIFIC_OPERATION, payload: { operation: "pi" } })}
                >
                  π
                </Button>
                <Button
                  variant="ghost"
                  className="h-14 md:h-16 text-xs font-bold rounded-none hover:bg-primary/10 hover:text-primary transition-colors border-b border-white/5"
                  onClick={() => dispatch({ type: ACTIONS.SCIENTIFIC_OPERATION, payload: { operation: "e" } })}
                >
                  e
                </Button>
                <Button
                  variant="ghost"
                  className="h-14 md:h-16 text-xs font-bold rounded-none hover:bg-primary/10 hover:text-primary transition-colors border-r border-white/5"
                  onClick={() => dispatch({ type: ACTIONS.SCIENTIFIC_OPERATION, payload: { operation: "sqrt" } })}
                >
                  √x
                </Button>
                <Button
                  variant="ghost"
                  className="h-14 md:h-16 text-xs font-bold rounded-none hover:bg-primary/10 hover:text-primary transition-colors border-r border-white/5"
                  onClick={() => dispatch({ type: ACTIONS.SCIENTIFIC_OPERATION, payload: { operation: "square" } })}
                >
                  x²
                </Button>
                <Button
                  variant="ghost"
                  className="h-14 md:h-16 text-xs font-bold rounded-none hover:bg-primary/10 hover:text-primary transition-colors border-r border-white/5"
                  onClick={() => dispatch({ type: ACTIONS.CHOOSE_OPERATION, payload: { operation: "^" } })}
                >
                  xʸ
                </Button>
                <Button
                  variant="ghost"
                  className="h-14 md:h-16 text-xs font-bold rounded-none hover:bg-primary/10 hover:text-primary transition-colors"
                  onClick={() => dispatch({ type: ACTIONS.SCIENTIFIC_OPERATION, payload: { operation: "reciprocal" } })}
                >
                  1/x
                </Button>
              </div>

              <div className="col-span-4 grid grid-cols-4 bg-border/20">
                <Button
                  variant="ghost"
                  className={cn(
                    "h-16 md:h-20 text-lg font-bold rounded-none hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all",
                    pressedKey === "Escape" && "bg-destructive/20 scale-95"
                  )}
                  onClick={() => dispatch({ type: ACTIONS.CLEAR })}
                >
                  AC
                </Button>
                <Button
                  variant="ghost"
                  className="h-16 md:h-20 text-lg font-medium rounded-none hover:bg-white/5 text-muted-foreground"
                  onClick={() => dispatch({ type: ACTIONS.TOGGLE_SIGN })}
                >
                  +/-
                </Button>
                <Button
                  variant="ghost"
                  className={cn(
                    "h-16 md:h-20 text-lg font-medium rounded-none hover:bg-white/5 text-muted-foreground",
                    pressedKey === "%" && "bg-white/10 scale-95"
                  )}
                  onClick={() => dispatch({ type: ACTIONS.PERCENT })}
                >
                  %
                </Button>
                <OperationButton 
                  operation="÷" 
                  dispatch={dispatch} 
                  isPressed={pressedKey === "/"}
                />
                
                <DigitButton digit="7" dispatch={dispatch} isPressed={pressedKey === "7"} />
                <DigitButton digit="8" dispatch={dispatch} isPressed={pressedKey === "8"} />
                <DigitButton digit="9" dispatch={dispatch} isPressed={pressedKey === "9"} />
                <OperationButton 
                  operation="*" 
                  dispatch={dispatch} 
                  isPressed={pressedKey === "*"}
                />
                
                <DigitButton digit="4" dispatch={dispatch} isPressed={pressedKey === "4"} />
                <DigitButton digit="5" dispatch={dispatch} isPressed={pressedKey === "5"} />
                <DigitButton digit="6" dispatch={dispatch} isPressed={pressedKey === "6"} />
                <OperationButton 
                  operation="+" 
                  dispatch={dispatch} 
                  isPressed={pressedKey === "+"}
                />
                
                <DigitButton digit="1" dispatch={dispatch} isPressed={pressedKey === "1"} />
                <DigitButton digit="2" dispatch={dispatch} isPressed={pressedKey === "2"} />
                <DigitButton digit="3" dispatch={dispatch} isPressed={pressedKey === "3"} />
                <OperationButton 
                  operation="-" 
                  dispatch={dispatch} 
                  isPressed={pressedKey === "-"}
                />
                
                <DigitButton digit="." dispatch={dispatch} isPressed={pressedKey === "."} />
                <DigitButton digit="0" dispatch={dispatch} isPressed={pressedKey === "0"} />
                <Button
                  variant="ghost"
                  className={cn(
                    "h-16 md:h-20 text-lg font-medium rounded-none hover:bg-white/5 text-muted-foreground flex items-center justify-center",
                    pressedKey === "Backspace" && "bg-white/10 scale-95"
                  )}
                  onClick={() => dispatch({ type: ACTIONS.DELETE_DIGIT })}
                >
                  <Eraser className="w-5 h-5" />
                </Button>
                <Button
                  className={cn(
                    "h-16 md:h-20 text-3xl font-bold rounded-none bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_hsla(var(--primary)/0.4)]",
                    (pressedKey === "Enter" || pressedKey === "=") && "bg-primary/80 scale-95"
                  )}
                  onClick={() => dispatch({ type: ACTIONS.EVALUATE })}
                >
                  =
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Side Panels */}
        {showHistory && (
          <Card className="lg:block glass-panel border-none shadow-2xl transition-all duration-500 h-[700px] lg:h-auto">
            <CardHeader className="flex flex-row items-center justify-between py-4 px-6 bg-white/5 border-b border-white/5">
              <CardTitle className="text-lg font-bold flex items-center gap-3 text-primary">
                <History className="w-5 h-5" />
                History
              </CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all rounded-lg"
                onClick={() => {
                  dispatch({ type: ACTIONS.CLEAR_HISTORY })
                  toast.error("History cleared")
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-4">
              <ScrollArea className="h-[400px] lg:h-[600px] pr-4">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 opacity-20">
                    <History className="w-12 h-12 mb-4" />
                    <p className="text-sm font-medium uppercase tracking-widest">Empty</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {history.map((item, index) => (
                      <div 
                        key={index} 
                        className="history-item flex flex-col items-end group"
                        onClick={() => dispatch({ type: ACTIONS.SET_HISTORY_ITEM, payload: { digit: item.result } })}
                      >
                        <span className="text-xs font-mono text-muted-foreground/60 mb-1 group-hover:text-primary transition-colors">{item.expression}</span>
                        <span className="text-2xl font-bold text-foreground tracking-tight">={item.result}</span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {showAi && (
          <div className="lg:col-span-1 h-[700px] lg:h-auto">
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
  )
}

export default App
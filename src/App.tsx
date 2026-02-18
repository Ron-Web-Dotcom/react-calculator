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
import { Button } from "./components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { ScrollArea } from "./components/ui/scroll-area"
import { History, Trash2, Keyboard, Calculator as CalcIcon, Eraser } from "lucide-react"
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
      if (state.currentOperand == null) return state
      const currentVal = parseFloat(state.currentOperand)
      let scientificResult = 0
      let scientificExpression = ""

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
        default:
          return state
      }

      const resString = scientificResult.toString()
      return {
        ...state,
        currentOperand: resString,
        overwrite: true,
        // Update history with the result
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
  const [{ currentOperand, previousOperand, operation, history }, dispatch] = useReducer(
    reducer,
    { history: JSON.parse(localStorage.getItem("calc-history") || "[]") }
  )

  const [showHistory, setShowHistory] = useState(false)
  const [pressedKey, setPressedKey] = useState<string | null>(null)

  // Sync history state to LocalStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("calc-history", JSON.stringify(history))
  }, [history])

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
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in">
        <Card className="lg:col-span-3 glass-panel overflow-hidden border-none transition-all duration-500 hover:shadow-primary/10 hover:shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between py-4 px-6 space-y-0 bg-white/5">
            <CardTitle className="text-xl font-bold flex items-center gap-3 text-primary">
              <div className="p-2 bg-primary/10 rounded-lg">
                <CalcIcon className="w-5 h-5" />
              </div>
              <span className="tracking-tight">Pro Calculator</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden hover:bg-white/10"
                onClick={() => setShowHistory(!showHistory)}
              >
                <History className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="output bg-black/40 p-10 flex flex-col items-end justify-center gap-3 min-h-[200px] text-right border-b border-white/5">
              <div className="previous-operand text-muted-foreground/60 font-medium tracking-wider text-xl h-8 overflow-hidden whitespace-nowrap">
                {formatOperand(previousOperand)} {operation}
              </div>
              <div className="current-operand text-foreground text-6xl md:text-7xl font-bold tracking-tighter break-all display-text selection:bg-primary/20">
                {formatOperand(currentOperand) || "0"}
              </div>
            </div>
            
            <div className="grid grid-cols-4 md:grid-cols-5 bg-white/[0.02]">
              {/* Scientific Operations (Hidden on small screens, or integrated) */}
              <div className="col-span-4 md:col-span-1 grid grid-cols-4 md:grid-cols-1 border-r border-white/5 bg-black/20">
                <Button
                  variant="ghost"
                  className="h-16 md:h-20 text-sm font-medium rounded-none hover:bg-primary/10 hover:text-primary transition-colors border-b border-white/5"
                  onClick={() => dispatch({ type: ACTIONS.SCIENTIFIC_OPERATION, payload: { operation: "sqrt" } })}
                >
                  √x
                </Button>
                <Button
                  variant="ghost"
                  className="h-16 md:h-20 text-sm font-medium rounded-none hover:bg-primary/10 hover:text-primary transition-colors border-b border-white/5"
                  onClick={() => dispatch({ type: ACTIONS.SCIENTIFIC_OPERATION, payload: { operation: "square" } })}
                >
                  x²
                </Button>
                <Button
                  variant="ghost"
                  className="h-16 md:h-20 text-sm font-medium rounded-none hover:bg-primary/10 hover:text-primary transition-colors border-b border-white/5"
                  onClick={() => dispatch({ type: ACTIONS.CHOOSE_OPERATION, payload: { operation: "^" } })}
                >
                  xʸ
                </Button>
                <Button
                  variant="ghost"
                  className="h-16 md:h-20 text-sm font-medium rounded-none hover:bg-primary/10 hover:text-primary transition-colors md:border-none"
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

        <Card className={cn(
          "lg:block glass-panel border-none lg:col-span-1 shadow-2xl transition-all duration-500",
          showHistory ? 'block' : 'hidden'
        )}>
          <CardHeader className="flex flex-row items-center justify-between py-4 px-6 bg-white/5">
            <CardTitle className="text-lg font-bold flex items-center gap-3 text-primary">
              <History className="w-5 h-5" />
              History
            </CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all rounded-lg"
              onClick={() => dispatch({ type: ACTIONS.CLEAR_HISTORY })}
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
      </div>
    </div>
  )
}

export default App
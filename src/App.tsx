import { useReducer, useEffect, useState } from "react"
import DigitButton from "./DigitButton"
import OperationButton from "./OperationButton"
import { Button } from "./components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { ScrollArea } from "./components/ui/scroll-area"
import { History, Trash2, Keyboard } from "lucide-react"
import "./styles.css"

export const ACTIONS = {
  ADD_DIGIT: "add-digit",
  CHOOSE_OPERATION: "choose-operation",
  CLEAR: "clear",
  DELETE_DIGIT: "delete-digit",
  EVALUATE: "evaluate",
  PERCENT: "percent",
  TOGGLE_SIGN: "toggle-sign",
  CLEAR_HISTORY: "clear-history",
} as const

type ActionType = typeof ACTIONS[keyof typeof ACTIONS]

interface State {
  currentOperand?: string | null
  previousOperand?: string | null
  operation?: string | null
  overwrite?: boolean
  history: { expression: string; result: string }[]
}

interface Action {
  type: ActionType
  payload?: { digit?: string; operation?: string }
}

function reducer(state: State, { type, payload }: Action): State {
  switch (type) {
    case ACTIONS.ADD_DIGIT:
      if (state.overwrite) {
        return {
          ...state,
          currentOperand: payload?.digit,
          overwrite: false,
        }
      }
      if (payload?.digit === "0" && state.currentOperand === "0") {
        return state
      }
      if (payload?.digit === "." && state.currentOperand?.includes(".")) {
        return state
      }

      return {
        ...state,
        currentOperand: `${state.currentOperand || ""}${payload?.digit}`,
      }
    case ACTIONS.CHOOSE_OPERATION:
      if (state.currentOperand == null && state.previousOperand == null) {
        return state
      }

      if (state.currentOperand == null) {
        return {
          ...state,
          operation: payload?.operation,
        }
      }

      if (state.previousOperand == null) {
        return {
          ...state,
          operation: payload?.operation,
          previousOperand: state.currentOperand,
          currentOperand: null,
        }
      }

      return {
        ...state,
        previousOperand: evaluate(state),
        operation: payload?.operation,
        currentOperand: null,
      }
    case ACTIONS.CLEAR:
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
      return {
        ...state,
        currentOperand: (value / 100).toString()
      }
    case ACTIONS.TOGGLE_SIGN:
      if (state.currentOperand == null) return state
      return {
        ...state,
        currentOperand: (parseFloat(state.currentOperand) * -1).toString()
      }
    case ACTIONS.EVALUATE:
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
    case ACTIONS.CLEAR_HISTORY:
      return { ...state, history: [] }
    default:
      return state
  }
}

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
  }

  return computation.toString()
}

const INTEGER_FORMATTER = new Intl.NumberFormat("en-us", {
  maximumFractionDigits: 0,
})

function formatOperand(operand: string | null | undefined): string | undefined {
  if (operand == null) return undefined
  const [integer, decimal] = operand.split(".")
  if (decimal == null) return INTEGER_FORMATTER.format(parseFloat(integer))
  return `${INTEGER_FORMATTER.format(parseFloat(integer))}.${decimal}`
}

function App() {
  const [{ currentOperand, previousOperand, operation, history }, dispatch] = useReducer(
    reducer,
    { history: JSON.parse(localStorage.getItem("calc-history") || "[]") }
  )

  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    localStorage.setItem("calc-history", JSON.stringify(history))
  }, [history])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-xl border-2 overflow-hidden bg-card transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Keyboard className="w-5 h-5" />
              Calculator
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="w-5 h-5" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="output bg-slate-950/90 p-8 flex flex-col items-end justify-center gap-2 min-h-[160px] text-right">
              <div className="previous-operand text-slate-400 font-medium tracking-wide text-lg h-7">
                {formatOperand(previousOperand)} {operation}
              </div>
              <div className="current-operand text-white text-5xl font-bold tracking-tight break-all">
                {formatOperand(currentOperand) || "0"}
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-[1px] bg-border/50">
              <Button
                variant="secondary"
                className="h-20 text-xl font-semibold rounded-none hover:bg-muted/80"
                onClick={() => dispatch({ type: ACTIONS.CLEAR })}
              >
                AC
              </Button>
              <Button
                variant="secondary"
                className="h-20 text-xl font-semibold rounded-none hover:bg-muted/80"
                onClick={() => dispatch({ type: ACTIONS.TOGGLE_SIGN })}
              >
                +/-
              </Button>
              <Button
                variant="secondary"
                className="h-20 text-xl font-semibold rounded-none hover:bg-muted/80"
                onClick={() => dispatch({ type: ACTIONS.PERCENT })}
              >
                %
              </Button>
              <OperationButton operation="÷" dispatch={dispatch} className="h-20 text-2xl font-bold rounded-none bg-primary hover:bg-primary/90 text-primary-foreground" />
              
              <DigitButton digit="7" dispatch={dispatch} className="h-20 text-xl rounded-none bg-card hover:bg-muted" />
              <DigitButton digit="8" dispatch={dispatch} className="h-20 text-xl rounded-none bg-card hover:bg-muted" />
              <DigitButton digit="9" dispatch={dispatch} className="h-20 text-xl rounded-none bg-card hover:bg-muted" />
              <OperationButton operation="*" dispatch={dispatch} className="h-20 text-2xl font-bold rounded-none bg-primary hover:bg-primary/90 text-primary-foreground" />
              
              <DigitButton digit="4" dispatch={dispatch} className="h-20 text-xl rounded-none bg-card hover:bg-muted" />
              <DigitButton digit="5" dispatch={dispatch} className="h-20 text-xl rounded-none bg-card hover:bg-muted" />
              <DigitButton digit="6" dispatch={dispatch} className="h-20 text-xl rounded-none bg-card hover:bg-muted" />
              <OperationButton operation="+" dispatch={dispatch} className="h-20 text-2xl font-bold rounded-none bg-primary hover:bg-primary/90 text-primary-foreground" />
              
              <DigitButton digit="1" dispatch={dispatch} className="h-20 text-xl rounded-none bg-card hover:bg-muted" />
              <DigitButton digit="2" dispatch={dispatch} className="h-20 text-xl rounded-none bg-card hover:bg-muted" />
              <DigitButton digit="3" dispatch={dispatch} className="h-20 text-xl rounded-none bg-card hover:bg-muted" />
              <OperationButton operation="-" dispatch={dispatch} className="h-20 text-2xl font-bold rounded-none bg-primary hover:bg-primary/90 text-primary-foreground" />
              
              <DigitButton digit="." dispatch={dispatch} className="h-20 text-xl rounded-none bg-card hover:bg-muted" />
              <DigitButton digit="0" dispatch={dispatch} className="h-20 text-xl rounded-none bg-card hover:bg-muted" />
              <Button
                variant="secondary"
                className="h-20 text-xl font-semibold rounded-none hover:bg-muted/80"
                onClick={() => dispatch({ type: ACTIONS.DELETE_DIGIT })}
              >
                DEL
              </Button>
              <Button
                className="h-20 text-2xl font-bold rounded-none bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => dispatch({ type: ACTIONS.EVALUATE })}
              >
                =
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className={`lg:block ${showHistory ? 'block' : 'hidden'} lg:col-span-1 shadow-lg border-2 bg-card`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              History
            </CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-destructive transition-colors"
              onClick={() => dispatch({ type: ACTIONS.CLEAR_HISTORY })}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              {history.length === 0 ? (
                <div className="text-center text-muted-foreground py-20">
                  <p className="text-sm">No history yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((item, index) => (
                    <div key={index} className="flex flex-col items-end border-b border-border/50 pb-3 group">
                      <span className="text-xs text-muted-foreground mb-1 group-hover:text-primary transition-colors">{item.expression}</span>
                      <span className="text-xl font-bold text-foreground">={item.result}</span>
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
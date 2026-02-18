/**
 * OperationButton Component
 * 
 * A specialized button component for mathematical operators (+, -, *, ÷, ^).
 * Handles dispatching the CHOOSE_OPERATION action to the central reducer.
 */

import { ACTIONS } from "./App"
import { Button } from "./components/ui/button"
import { cn } from "./lib/utils"

interface OperationButtonProps {
  /** Dispatch function from useReducer to trigger state changes */
  dispatch: React.Dispatch<{ type: string; payload?: { operation?: string } }>
  /** The operation symbol represented by this button (e.g., "+", "*") */
  operation: string
  /** Optional additional CSS classes */
  className?: string
  /** Boolean indicating if the physical keyboard key associated with this operation is currently pressed */
  isPressed?: boolean
}

export default function OperationButton({ dispatch, operation, className, isPressed }: OperationButtonProps) {
  return (
    <Button
      variant="default"
      className={cn(
        "h-16 md:h-20 text-2xl font-bold rounded-none active:scale-95 transition-all duration-200",
        "bg-primary hover:bg-primary/90 text-primary-foreground border-none",
        isPressed && "bg-primary/80 scale-95",
        className
      )}
      // Dispatch CHOOSE_OPERATION action when the button is clicked
      onClick={() =>
        dispatch({ type: ACTIONS.CHOOSE_OPERATION, payload: { operation } })
      }
    >
      {operation}
    </Button>
  )
}

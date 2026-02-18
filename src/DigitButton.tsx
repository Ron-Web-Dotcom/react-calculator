/**
 * DigitButton Component
 * 
 * A specialized button component for numerical digits in the calculator.
 * Handles dispatching the ADD_DIGIT action to the central reducer.
 */

import { ACTIONS } from "./App"
import { Button } from "./components/ui/button"
import { cn } from "./lib/utils"

interface DigitButtonProps {
  /** Dispatch function from useReducer to trigger state changes */
  dispatch: React.Dispatch<{ type: string; payload?: { digit?: string } }>
  /** The digit value represented by this button (e.g., "7", "0", ".") */
  digit: string
  /** Optional additional CSS classes */
  className?: string
  /** Boolean indicating if the physical keyboard key associated with this digit is currently pressed */
  isPressed?: boolean
}

export default function DigitButton({ dispatch, digit, className, isPressed }: DigitButtonProps) {
  return (
    <Button
      variant="ghost"
      className={cn(
        "h-16 sm:h-20 text-xl sm:text-2xl rounded-none transition-all duration-200 active:scale-95",
        "bg-transparent hover:bg-white/5 border-none font-medium",
        isPressed && "bg-white/10 scale-95",
        className
      )}
      // Dispatch ADD_DIGIT action when the button is clicked
      onClick={() => dispatch({ type: ACTIONS.ADD_DIGIT, payload: { digit } })}
    >
      {digit}
    </Button>
  )
}

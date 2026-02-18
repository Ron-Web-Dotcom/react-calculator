import { ACTIONS } from "./App"
import { Button } from "./components/ui/button"
import { cn } from "./lib/utils"

interface DigitButtonProps {
  dispatch: React.Dispatch<{ type: string; payload?: { digit?: string } }>
  digit: string
  className?: string
  isPressed?: boolean
}

export default function DigitButton({ dispatch, digit, className, isPressed }: DigitButtonProps) {
  return (
    <Button
      variant="ghost"
      className={cn(
        "h-16 md:h-20 text-xl rounded-none transition-all duration-200 active:scale-95",
        "bg-transparent hover:bg-white/5 border-none",
        isPressed && "bg-white/10 scale-95",
        className
      )}
      onClick={() => dispatch({ type: ACTIONS.ADD_DIGIT, payload: { digit } })}
    >
      {digit}
    </Button>
  )
}

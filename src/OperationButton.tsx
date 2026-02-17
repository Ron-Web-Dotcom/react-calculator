import { ACTIONS } from "./App"
import { Button } from "./components/ui/button"
import { cn } from "./lib/utils"

interface OperationButtonProps {
  dispatch: React.Dispatch<{ type: string; payload?: { operation?: string } }>
  operation: string
  className?: string
  isPressed?: boolean
}

export default function OperationButton({ dispatch, operation, className, isPressed }: OperationButtonProps) {
  return (
    <Button
      variant="default"
      className={cn(
        "h-20 text-2xl font-bold rounded-none active:scale-95 transition-all duration-200",
        "bg-primary hover:bg-primary/90 text-primary-foreground border-none",
        isPressed && "bg-primary/80 scale-95",
        className
      )}
      onClick={() =>
        dispatch({ type: ACTIONS.CHOOSE_OPERATION, payload: { operation } })
      }
    >
      {operation}
    </Button>
  )
}

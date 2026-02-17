import { ACTIONS } from "./App"
import { Button } from "./components/ui/button"

interface OperationButtonProps {
  dispatch: React.Dispatch<{ type: string; payload?: { operation?: string } }>
  operation: string
  className?: string
}

export default function OperationButton({ dispatch, operation, className }: OperationButtonProps) {
  return (
    <Button
      variant="default"
      className={className}
      onClick={() =>
        dispatch({ type: ACTIONS.CHOOSE_OPERATION, payload: { operation } })
      }
    >
      {operation}
    </Button>
  )
}

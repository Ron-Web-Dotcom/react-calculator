import { ACTIONS } from "./App"

interface OperationButtonProps {
  dispatch: React.Dispatch<{ type: string; payload?: { operation?: string } }>
  operation: string
}

export default function OperationButton({ dispatch, operation }: OperationButtonProps) {
  return (
    <button
      onClick={() =>
        dispatch({ type: ACTIONS.CHOOSE_OPERATION, payload: { operation } })
      }
    >
      {operation}
    </button>
  )
}

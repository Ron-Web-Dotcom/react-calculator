import { ACTIONS } from "./App"

interface DigitButtonProps {
  dispatch: React.Dispatch<{ type: string; payload?: { digit?: string } }>
  digit: string
}

export default function DigitButton({ dispatch, digit }: DigitButtonProps) {
  return (
    <button
      onClick={() => dispatch({ type: ACTIONS.ADD_DIGIT, payload: { digit } })}
    >
      {digit}
    </button>
  )
}

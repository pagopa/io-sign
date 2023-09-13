import { useState, useMemo } from "react";

type State = "idle" | "submitting" | "success" | "error";

export default function useSubmitMachine() {
  const [state, setState] = useState<State>("idle");

  const start = () => setState("submitting");
  const end = (success?: boolean) => setState(success ? "success" : "error");
  const reset = () => setState("idle");

  const submitted = useMemo(
    () => state === "success" || state === "error",
    [state]
  );

  return { state, start, end, reset, submitted };
}

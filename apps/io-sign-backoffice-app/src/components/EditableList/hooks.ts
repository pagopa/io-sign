import { useState, useEffect, ChangeEvent } from "react";
import { z } from "zod";

export function useEditableListForm(
  schema: z.ZodSchema<string>,
  onConfirm: (item: string) => void
) {
  const [input, setInput] = useState("");

  const [error, setError] = useState<{ message: string } | undefined>(
    undefined
  );

  const validate = (item: string) => {
    const result = schema.safeParse(item);
    if (!result.success) {
      const issue = result.error.issues.at(0);
      const message = issue
        ? issue.message
        : "Si è verificato un errore imprevisto";
      return { success: false, error: { message } };
    }
    return { success: true };
  };

  const onClick = () => {
    const result = validate(input);
    if (result.success) {
      onConfirm(input);
    } else {
      setError(result.error);
    }
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) =>
    setInput(e.target.value);

  useEffect(() => {
    if (error) {
      const result = validate(input);
      setError(result.success ? undefined : result.error);
    }
  }, [input]);

  return { error, onClick, onChange };
}

import { useState, useEffect, useCallback, ChangeEvent } from "react";
import { z } from "zod";

export type Options = {
  schema: z.ZodSchema<string>;
  onConfirm: (item: string) => void;
  initialValue?: string;
};

export function useEditableListForm({
  initialValue = "",
  schema,
  onConfirm,
}: Options) {
  const [input, setInput] = useState(initialValue);

  const [error, setError] = useState<{ message: string } | undefined>(
    undefined
  );

  const validate = useCallback(
    (item: string) => {
      const result = schema.safeParse(item);
      if (!result.success) {
        const issue = result.error.issues.at(0);
        const message = issue
          ? issue.message
          : "Si è verificato un errore imprevisto";
        return { success: false, error: { message } };
      }
      return { success: true };
    },
    [schema]
  );

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
  }, [input, error, validate]);

  return { input, error, onClick, onChange };
}

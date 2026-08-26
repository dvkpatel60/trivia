import { useCallback, useState } from "react";

export function useToast(): [string | null, (message: string) => void] {
  const [message, setMessage] = useState<string | null>(null);

  const show = useCallback((next: string) => {
    setMessage(next);
    window.setTimeout(() => setMessage((current) => (current === next ? null : current)), 2_200);
  }, []);

  return [message, show];
}

import { useEffect, useRef } from "react";

export function useCtrlTap(onTap: () => void) {
  const ref = useRef(onTap);
  useEffect(() => {
    ref.current = onTap;
  });

  useEffect(() => {
    let armed = false;
    const down = (e: KeyboardEvent) => {
      if (e.key !== "Control") armed = false;
      else if (!e.repeat) armed = true;
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === "Control" && armed) ref.current();
      armed = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);
}
import { useCallback, useEffect, useRef, useState } from "react";
import { isSameView, isView, type View } from "@/app/routes";

type NavigateOptions = { replace?: boolean };

export function useViewNavigation(initial: View) {
  const [view, setView] = useState<View>(() => {
    const state = window.history.state?.view;
    return isView(state) ? state : initial;
  });

  const viewRef = useRef(view);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    if (!isView(window.history.state?.view)) {
      window.history.replaceState({ view: viewRef.current }, "");
    }
    const onPopState = (e: PopStateEvent) => {
      const next = e.state?.view;
      setView(isView(next) ? next : initial);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
    // initial chỉ dùng cho lần mount đầu
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigate = useCallback((next: View, { replace = false }: NavigateOptions = {}) => {
    if (isSameView(viewRef.current, next)) return;
    if (replace) window.history.replaceState({ view: next }, "");
    else window.history.pushState({ view: next }, "");
    viewRef.current = next;
    setView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return { view, navigate };
}
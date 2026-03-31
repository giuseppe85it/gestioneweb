import { useEffect, useLayoutEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import "./next-autisti-clone.css";
import {
  NEXT_AUTISTI_BASE_PATH,
  NEXT_AUTISTI_CLONE_NOTICE_QUERY_PARAM,
  bootstrapNextAutistiCloneStorage,
  getBlockedHomeActionNoticeCode,
  getNextAutistiNoticeMessage,
  isNextAutistiNoticeCode,
  namespaceNextAutistiStorageKey,
  normalizeAutistiButtonLabel,
  resolveNextAutistiNavigationTarget,
} from "./nextAutistiCloneRuntime";
type PatchedHistory = History & {
  pushState: History["pushState"];
  replaceState: History["replaceState"];
};

type StoragePrototypeOverrides = {
  getItem: Storage["getItem"];
  setItem: Storage["setItem"];
  removeItem: Storage["removeItem"];
};

function NextAutistiCloneLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [ready, setReady] = useState(typeof window === "undefined");
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setNotice(null);
    }, 4200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [notice]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const noticeCode = params.get(NEXT_AUTISTI_CLONE_NOTICE_QUERY_PARAM);
    if (!isNextAutistiNoticeCode(noticeCode)) {
      return;
    }

    const deferredNoticeId = window.setTimeout(() => {
      setNotice(getNextAutistiNoticeMessage(noticeCode));
    }, 0);
    params.delete(NEXT_AUTISTI_CLONE_NOTICE_QUERY_PARAM);
    const nextSearch = params.toString();
    navigate(
      {
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : "",
      },
      { replace: true },
    );

    return () => {
      window.clearTimeout(deferredNoticeId);
    };
  }, [location.pathname, location.search, navigate]);

  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    bootstrapNextAutistiCloneStorage(window.localStorage);

    const storageProto: StoragePrototypeOverrides = Storage.prototype;
    const originalGetItem = storageProto.getItem;
    const originalSetItem = storageProto.setItem;
    const originalRemoveItem = storageProto.removeItem;

    storageProto.getItem = new Proxy(originalGetItem, {
      apply(target, thisArg, argArray) {
        const [key] = argArray as [string];
        if (thisArg === window.localStorage) {
          return Reflect.apply(target, thisArg, [namespaceNextAutistiStorageKey(key)]);
        }
        return Reflect.apply(target, thisArg, argArray);
      },
    });

    storageProto.setItem = new Proxy(originalSetItem, {
      apply(target, thisArg, argArray) {
        const [key, value] = argArray as [string, string];
        if (thisArg === window.localStorage) {
          return Reflect.apply(target, thisArg, [namespaceNextAutistiStorageKey(key), value]);
        }
        return Reflect.apply(target, thisArg, argArray);
      },
    });

    storageProto.removeItem = new Proxy(originalRemoveItem, {
      apply(target, thisArg, argArray) {
        const [key] = argArray as [string];
        if (thisArg === window.localStorage) {
          return Reflect.apply(target, thisArg, [namespaceNextAutistiStorageKey(key)]);
        }
        return Reflect.apply(target, thisArg, argArray);
      },
    });

    const historyObject = window.history as PatchedHistory;
    const originalPushState = historyObject.pushState.bind(historyObject);
    const originalReplaceState = historyObject.replaceState.bind(historyObject);

    historyObject.pushState = function patchedPushState(data, unused, url) {
      const resolved = resolveNextAutistiNavigationTarget(url);
      if (resolved.managed && resolved.nextUrl) {
        if (resolved.noticeCode) {
          setNotice(getNextAutistiNoticeMessage(resolved.noticeCode));
        }
        return originalPushState(data, unused, resolved.nextUrl);
      }

      return originalPushState(data, unused, url);
    };

    historyObject.replaceState = function patchedReplaceState(data, unused, url) {
      const resolved = resolveNextAutistiNavigationTarget(url);
      if (resolved.managed && resolved.nextUrl) {
        if (resolved.noticeCode) {
          setNotice(getNextAutistiNoticeMessage(resolved.noticeCode));
        }
        return originalReplaceState(data, unused, resolved.nextUrl);
      }

      return originalReplaceState(data, unused, url);
    };

    const readyFrameId = window.requestAnimationFrame(() => {
      setReady(true);
    });

    return () => {
      window.cancelAnimationFrame(readyFrameId);
      storageProto.getItem = originalGetItem;
      storageProto.setItem = originalSetItem;
      storageProto.removeItem = originalRemoveItem;
      historyObject.pushState = originalPushState;
      historyObject.replaceState = originalReplaceState;
    };
  }, []);

  useEffect(() => {
    if (!ready || location.pathname !== `${NEXT_AUTISTI_BASE_PATH}/home`) {
      return;
    }

    const applyBlockedActionMarkers = () => {
      document.querySelectorAll<HTMLButtonElement>(".autisti-actions button").forEach((button) => {
        const code = getBlockedHomeActionNoticeCode(normalizeAutistiButtonLabel(button.textContent));
        if (!code) {
          button.removeAttribute("data-next-autisti-blocked");
          button.removeAttribute("title");
          return;
        }

        button.setAttribute("data-next-autisti-blocked", "true");
        button.setAttribute("title", getNextAutistiNoticeMessage(code));
      });
    };

    const handleBlockedHomeAction = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const button = target.closest("button");
      if (!(button instanceof HTMLButtonElement)) {
        return;
      }

      if (button.closest(".autisti-actions")) {
        const code = getBlockedHomeActionNoticeCode(normalizeAutistiButtonLabel(button.textContent));
        if (code) {
          event.preventDefault();
          event.stopPropagation();
          if ("stopImmediatePropagation" in event && typeof event.stopImmediatePropagation === "function") {
            event.stopImmediatePropagation();
          }
          setNotice(getNextAutistiNoticeMessage(code));
          return;
        }
      }
    };

    applyBlockedActionMarkers();

    const observer = new MutationObserver(() => {
      applyBlockedActionMarkers();
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    document.addEventListener("click", handleBlockedHomeAction, true);

    return () => {
      observer.disconnect();
      document.removeEventListener("click", handleBlockedHomeAction, true);
    };
  }, [location.pathname, ready]);

  if (!ready) {
    return <div className="next-autisti-clone__loading">Avvio clone autisti...</div>;
  }

  return (
    <div className="next-autisti-clone">
      {notice ? (
        <div className="next-autisti-clone__banner next-autisti-clone__banner--notice">{notice}</div>
      ) : null}
      <Outlet />
    </div>
  );
}

export default NextAutistiCloneLayout;

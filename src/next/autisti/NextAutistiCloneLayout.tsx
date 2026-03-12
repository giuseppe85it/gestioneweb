import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
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

const NAV_ITEMS = [
  { to: NEXT_AUTISTI_BASE_PATH, label: "Gate" },
  { to: `${NEXT_AUTISTI_BASE_PATH}/login`, label: "Login" },
  { to: `${NEXT_AUTISTI_BASE_PATH}/setup-mezzo`, label: "Setup mezzo" },
  { to: `${NEXT_AUTISTI_BASE_PATH}/controllo`, label: "Controllo" },
  { to: `${NEXT_AUTISTI_BASE_PATH}/home`, label: "Home" },
  { to: `${NEXT_AUTISTI_BASE_PATH}/rifornimento`, label: "Rifornimento" },
  { to: `${NEXT_AUTISTI_BASE_PATH}/segnalazioni`, label: "Segnalazioni" },
  { to: `${NEXT_AUTISTI_BASE_PATH}/richiesta-attrezzature`, label: "Richiesta attrezzature" },
  { to: `${NEXT_AUTISTI_BASE_PATH}/cambio-mezzo`, label: "Cambio mezzo" },
] as const;

function getCurrentStepLabel(pathname: string): string {
  if (pathname === NEXT_AUTISTI_BASE_PATH) {
    return "Gate";
  }

  if (pathname.startsWith(`${NEXT_AUTISTI_BASE_PATH}/login`)) {
    return "Login autista";
  }

  if (pathname.startsWith(`${NEXT_AUTISTI_BASE_PATH}/setup-mezzo`)) {
    return "Setup mezzo";
  }

  if (pathname.startsWith(`${NEXT_AUTISTI_BASE_PATH}/controllo`)) {
    return "Controllo mezzo";
  }

  if (pathname.startsWith(`${NEXT_AUTISTI_BASE_PATH}/home`)) {
    return "Home autista";
  }

  if (pathname.startsWith(`${NEXT_AUTISTI_BASE_PATH}/rifornimento`)) {
    return "Rifornimento";
  }

  if (pathname.startsWith(`${NEXT_AUTISTI_BASE_PATH}/segnalazioni`)) {
    return "Segnalazioni";
  }

  if (pathname.startsWith(`${NEXT_AUTISTI_BASE_PATH}/richiesta-attrezzature`)) {
    return "Richiesta attrezzature";
  }

  if (pathname.startsWith(`${NEXT_AUTISTI_BASE_PATH}/cambio-mezzo`)) {
    return "Cambio mezzo";
  }

  return "App autisti";
}

function isGommeModalSaveButton(button: HTMLButtonElement): boolean {
  if (normalizeAutistiButtonLabel(button.textContent) !== "SALVA") {
    return false;
  }

  let current: Element | null = button;
  while (current) {
    const heading = current.querySelector?.("h3");
    if (normalizeAutistiButtonLabel(heading?.textContent) === "GOMME") {
      return true;
    }
    current = current.parentElement;
  }

  return false;
}

function NextAutistiCloneLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const currentStep = useMemo(() => getCurrentStepLabel(location.pathname), [location.pathname]);

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

    setNotice(getNextAutistiNoticeMessage(noticeCode));
    params.delete(NEXT_AUTISTI_CLONE_NOTICE_QUERY_PARAM);
    const nextSearch = params.toString();
    navigate(
      {
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : "",
      },
      { replace: true },
    );
  }, [location.pathname, location.search, navigate]);

  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      setReady(true);
      return;
    }

    bootstrapNextAutistiCloneStorage(window.localStorage);

    const storageProto = Storage.prototype as any;
    const originalGetItem = storageProto.getItem;
    const originalSetItem = storageProto.setItem;
    const originalRemoveItem = storageProto.removeItem;

    storageProto.getItem = function patchedGetItem(this: Storage, key: string) {
      if (this === window.localStorage) {
        return originalGetItem.call(this, namespaceNextAutistiStorageKey(key));
      }
      return originalGetItem.call(this, key);
    };

    storageProto.setItem = function patchedSetItem(this: Storage, key: string, value: string) {
      if (this === window.localStorage) {
        return originalSetItem.call(this, namespaceNextAutistiStorageKey(key), value);
      }
      return originalSetItem.call(this, key, value);
    };

    storageProto.removeItem = function patchedRemoveItem(this: Storage, key: string) {
      if (this === window.localStorage) {
        return originalRemoveItem.call(this, namespaceNextAutistiStorageKey(key));
      }
      return originalRemoveItem.call(this, key);
    };

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

    setReady(true);

    return () => {
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

      document.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
        if (!isGommeModalSaveButton(button)) {
          return;
        }

        button.setAttribute("data-next-autisti-blocked", "true");
        button.setAttribute(
          "title",
          getNextAutistiNoticeMessage("gomme-salvataggio-bloccato"),
        );
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

      if (isGommeModalSaveButton(button)) {
        event.preventDefault();
        event.stopPropagation();
        if ("stopImmediatePropagation" in event && typeof event.stopImmediatePropagation === "function") {
          event.stopImmediatePropagation();
        }
        setNotice(getNextAutistiNoticeMessage("gomme-salvataggio-bloccato"));
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
      <header className="next-autisti-clone__header">
        <div>
          <div className="next-autisti-clone__badge">Clone read-only</div>
          <h1 className="next-autisti-clone__title">App Autisti</h1>
          <p className="next-autisti-clone__subtitle">
            Tranche clone-safe attive: {currentStep}. Nessuna uscita verso la madre.
          </p>
        </div>

        <nav className="next-autisti-clone__nav" aria-label="Navigazione clone app autisti">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === NEXT_AUTISTI_BASE_PATH}
              className={({ isActive }) =>
                isActive
                  ? "next-autisti-clone__nav-link next-autisti-clone__nav-link--active"
                  : "next-autisti-clone__nav-link"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="next-autisti-clone__body">
        <div className="next-autisti-clone__banner">
          Sessione, mezzo attivo, controllo, cambio mezzo, rifornimento, segnalazioni e richiesta attrezzature restano confinati a <code>/next/autisti</code>.
          Rifornimento, segnalazioni e richiesta attrezzature salvano solo nel clone; foto e allegati non vengono caricati sulla madre.
        </div>
        {notice ? <div className="next-autisti-clone__banner next-autisti-clone__banner--notice">{notice}</div> : null}
        <section className="next-autisti-clone__page">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

export default NextAutistiCloneLayout;

import { useSyncExternalStore } from "react";

const listeners = new Set();
const standalone = window.matchMedia("(display-mode: standalone)");
const manifestUrl = new URL(
  document.querySelector('link[rel="manifest"]').href,
  window.location.href
).href;
// O id "./" do manifest identifica o mesmo app, inclusive ao acessar /home.
const appId = new URL("./", manifestUrl).href;
const runningStandalone = standalone.matches || window.navigator.standalone === true;
let state = { prompt: null, installed: runningStandalone, runningStandalone };
let installationRevision = 0;

function updateState(changes) {
  state = { ...state, ...changes };
  listeners.forEach((listener) => listener());
}

function confirmInstalled() {
  installationRevision += 1;
  updateState({ prompt: null, installed: true });
}

async function checkInstalledApp() {
  if (!window.isSecureContext || typeof navigator.getInstalledRelatedApps !== "function") return;

  const revision = ++installationRevision;
  try {
    // related_applications no manifest permite reconhecer instalacoes de sessoes anteriores.
    const apps = await navigator.getInstalledRelatedApps();
    const installed = apps.some((app) =>
      app.platform === "webapp" &&
      (app.id ? app.id === appId : app.url === manifestUrl)
    );

    // Uma consulta antiga nao deve sobrescrever um evento mais recente do navegador.
    if (revision === installationRevision && installed) confirmInstalled();
  } catch {
    // A indisponibilidade desta API nao bloqueia o evento nativo de instalacao.
  }
}

// Captura antes do login: o Header e importado na inicializacao, mas monta depois.
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installationRevision += 1;
  // Um novo evento tambem confirma que o app pode ser reinstalado apos uma desinstalacao.
  updateState({ prompt: event, installed: false });
});

window.addEventListener("appinstalled", confirmInstalled);
window.addEventListener("focus", checkInstalledApp);

standalone.addEventListener("change", (event) => {
  const running = event.matches || window.navigator.standalone === true;
  updateState({ runningStandalone: running });
  if (running) confirmInstalled();
  else checkInstalledApp();
});

checkInstalledApp();

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

async function install() {
  const event = state.prompt;
  if (!event || state.installed) return "unavailable";

  // Cada evento so pode ser utilizado uma vez; prompt() permanece dentro do clique.
  updateState({ prompt: null });
  await event.prompt();
  const { outcome } = await event.userChoice;
  if (outcome === "accepted") confirmInstalled();
  return outcome;
}

export default function usePwaInstall() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot);
  return {
    installed: snapshot.installed,
    runningStandalone: snapshot.runningStandalone,
    canInstall: window.isSecureContext && !!snapshot.prompt && !snapshot.installed,
    install,
  };
}

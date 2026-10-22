import React, { useState } from "react";
import { Check, Download } from "lucide-react";
import usePwaInstall from "../hooks/usePwaInstall";

export default function InstallPwaButton() {
  const { installed, runningStandalone, canInstall, install } = usePwaInstall();
  const [installing, setInstalling] = useState(false);

  async function handleInstall() {
    if (installing || !canInstall) return;
    setInstalling(true);

    try {
      // O clique abre diretamente a confirmacao de instalacao do navegador.
      await install();
    } catch (error) {
      console.error("Nao foi possivel iniciar a instalacao do PWA:", error);
    } finally {
      setInstalling(false);
    }
  }

  if (runningStandalone) return null;

  // Uma instalacao existente recebe um status, em vez de um botao de download inativo.
  if (installed) {
    return (
      <span
        role="status"
        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-green-700/20 bg-green-50 px-3 text-sm font-semibold text-green-800 dark:border-green-400/20 dark:bg-green-950/40 dark:text-green-300"
      >
        <Check className="h-4 w-4" aria-hidden="true" />
        App instalado
      </span>
    );
  }

  // Oferece uma acao apenas quando ela pode abrir a instalacao nativa.
  if (!canInstall && !installing) return null;

  return (
    <button
      type="button"
      onClick={handleInstall}
      disabled={installing}
      aria-label="Baixar app Foods Academy"
      title="Baixar app Foods Academy"
      className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-black/10 bg-[#FAF9F7] px-3 text-sm font-bold text-[#B95758] shadow-sm transition hover:bg-white hover:text-[#9f3f40] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B95758] disabled:cursor-wait disabled:opacity-70 dark:border-white/15 dark:bg-zinc-900 dark:text-rose-300 dark:hover:bg-zinc-700 dark:hover:text-rose-300"
    >
      <Download className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
      <span className="hidden sm:inline lg:hidden xl:inline">
        {installing ? "Instalando..." : "Baixar app"}
      </span>
    </button>
  );
}

import React, { useState } from "react";
import * as XLSX from "xlsx";
import { Download } from "lucide-react";

export default function ExportButton({ dados = [] }) {
  const [loading, setLoading] = useState(false);
  const contatos = Array.isArray(dados) ? dados : [];

  const handleExport = () => {
    if (!contatos.length) return;

    try {
      setLoading(true);

      // Mantem a planilha com colunas claras e na mesma ordem da tela de contatos.
      const linhas = contatos.map((contato) => ({
        Nome: contato.nome || "",
        Telefone: contato.telefone || "",
        Tipo: contato.tipo || "",
        Departamento: contato.departamento || "",
      }));
      const worksheet = XLSX.utils.json_to_sheet(linhas);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Contatos");

      XLSX.writeFile(workbook, "contatos.xlsx");
    } catch (error) {
      console.error("Erro ao exportar:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={loading || contatos.length === 0}
      aria-label="Exportar contatos para Excel"
      title="Exportar contatos para Excel"
      className="flex h-12 w-12 items-center justify-center rounded-md border border-black/10 bg-white/85 text-[#B95758] shadow-sm backdrop-blur transition hover:bg-white hover:text-[#9f3f40] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Download className="h-6 w-6" strokeWidth={2.4} />
    </button>
  );
}
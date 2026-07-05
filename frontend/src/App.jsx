import { useState } from "react";
import PainelEncomendasSemanal from "./components/PainelEncomendasSemanal";
import PainelEstoque from "./components/PainelEstoque";
import PainelFinanceiro from "./components/PainelFinanceiro";

const ABAS = [
  { chave: "encomendas", label: "Encomendas" },
  { chave: "estoque", label: "Estoque" },
  { chave: "financeiro", label: "Financeiro" },
];

function App() {
  const [abaAtiva, setAbaAtiva] = useState("encomendas");

  return (
    <div className="min-h-screen bg-[#FFF8ED]">
      <nav className="sticky top-0 z-10 flex items-center gap-2 border-b border-[#F0E6DA] bg-[#FFF8ED]/95 px-4 py-3 backdrop-blur sm:px-8">
        <span className="mr-4 font-['Baloo_2'] text-lg font-bold text-[#3E2723]">
          Santo Brigadeiro 013
        </span>
        {ABAS.map((aba) => (
          <button
            key={aba.chave}
            type="button"
            onClick={() => setAbaAtiva(aba.chave)}
            className={`rounded-full px-4 py-1.5 font-['Inter'] text-sm font-semibold transition-colors ${
              abaAtiva === aba.chave
                ? "bg-[#3E2723] text-[#FFF8ED]"
                : "text-[#6B5A50] hover:bg-[#F0E6DA]"
            }`}
          >
            {aba.label}
          </button>
        ))}
      </nav>

      {abaAtiva === "encomendas" && <PainelEncomendasSemanal />}
      {abaAtiva === "estoque" && <PainelEstoque />}
      {abaAtiva === "financeiro" && <PainelFinanceiro />}
    </div>
  );
}

export default App;

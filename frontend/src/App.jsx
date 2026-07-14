import { useState } from "react";
import PainelEncomendasSemanal from "./components/PainelEncomendasSemanal";
import PainelEstoque from "./components/PainelEstoque";
import PainelFinanceiro from "./components/PainelFinanceiro";
import ModalNovaEncomenda from "./components/ModalNovaEncomenda";

const ABAS = [
  { chave: "encomendas", label: "Encomendas" },
  { chave: "estoque", label: "Estoque" },
  { chave: "financeiro", label: "Financeiro" },
];

// "05/07" a partir de "2026-07-05" por manipulação de string (regra
// anti-fuso do projeto: nunca new Date(iso) para datas puras).
function formatarDataCurta(dataISO) {
  const [, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}`;
}

function App() {
  const [abaAtiva, setAbaAtiva] = useState("encomendas");

  /**
   * Fase 12 — a criação de encomendas é GLOBAL: o modal vive aqui no App
   * (um só, sem duplicação) e é acionado tanto pelo FAB flutuante — visível
   * em qualquer aba e em qualquer rolagem — quanto pelo botão do cabeçalho
   * do painel semanal. Criou: volta para "Encomendas", força a recarga do
   * painel e anuncia o sucesso num banner global.
   */
  const [modalNovaEncomendaAberto, setModalNovaEncomendaAberto] = useState(false);
  const [avisoGlobal, setAvisoGlobal] = useState(null);
  // Incrementado a cada encomenda criada: o painel semanal recarrega do
  // servidor quando este valor muda (entra nas deps do useEffect de carga).
  const [versaoEncomendas, setVersaoEncomendas] = useState(0);

  function abrirNovaEncomenda() {
    setAvisoGlobal(null);
    setModalNovaEncomendaAberto(true);
  }

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

      {avisoGlobal && (
        <div className="mx-4 mt-4 flex items-center justify-between gap-3 rounded-xl bg-[#DDEFE3] px-4 py-3 font-['Inter'] text-sm text-[#285A3E] sm:mx-8">
          <span>{avisoGlobal}</span>
          <button
            type="button"
            onClick={() => setAvisoGlobal(null)}
            aria-label="Fechar aviso"
            className="rounded-full px-2 text-[#285A3E]/60 transition-colors hover:text-[#285A3E]"
          >
            ✕
          </button>
        </div>
      )}

      {abaAtiva === "encomendas" && (
        <PainelEncomendasSemanal
          aoAbrirNovaEncomenda={abrirNovaEncomenda}
          versaoExterna={versaoEncomendas}
        />
      )}
      {abaAtiva === "estoque" && <PainelEstoque />}
      {abaAtiva === "financeiro" && <PainelFinanceiro />}

      {/* ------- FAB: nova encomenda a 1 clique, de qualquer lugar ------- */}
      {!modalNovaEncomendaAberto && (
        <button
          type="button"
          onClick={abrirNovaEncomenda}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-[#3F7D5C] px-6 py-4 font-['Baloo_2'] text-lg font-bold text-white shadow-lg transition-all hover:bg-[#285A3E] hover:shadow-xl"
        >
          <span aria-hidden="true" className="text-2xl leading-none">+</span>
          Nova encomenda
        </button>
      )}

      {/* Montado só quando aberto: cada abertura começa com estado limpo. */}
      {modalNovaEncomendaAberto && (
        <ModalNovaEncomenda
          aoFechar={() => setModalNovaEncomendaAberto(false)}
          aoCriar={(pedidoCriado) => {
            setModalNovaEncomendaAberto(false);
            setAvisoGlobal(
              `Encomenda de ${pedidoCriado.cliente} criada para ${formatarDataCurta(pedidoCriado.dataEntrega)}! 🎉`
            );
            setVersaoEncomendas((versao) => versao + 1);
            setAbaAtiva("encomendas"); // pai vê o pedido pousar na coluna do dia
          }}
        />
      )}
    </div>
  );
}

export default App;

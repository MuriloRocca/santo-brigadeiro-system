import { useEffect, useState } from "react";

/**
 * ============================================================
 * CONFIGURAÇÃO VISUAL E DE DOMÍNIO
 * ============================================================
 * Mantidas no topo do arquivo (e não espalhadas pelo JSX) para que
 * qualquer ajuste de cor/rótulo seja feito em um único lugar.
 */

const DIAS_DA_SEMANA = [
  { chave: 1, label: "Segunda" },
  { chave: 2, label: "Terça" },
  { chave: 3, label: "Quarta" },
  { chave: 4, label: "Quinta" },
  { chave: 5, label: "Sexta" },
  { chave: 6, label: "Sábado" },
  { chave: 0, label: "Domingo" }, // JS trata Domingo como 0 — tratado por último aqui de propósito
];

const STATUS_CONFIG = {
  PENDENTE: { label: "Pendente", corBorda: "border-l-[#E3A008]", corTexto: "text-[#946200]", corFundo: "bg-[#FFF3D6]" },
  EM_PRODUCAO: { label: "Em produção", corBorda: "border-l-[#2F6690]", corTexto: "text-[#1F4D6E]", corFundo: "bg-[#DCEBF5]" },
  ENTREGUE: { label: "Entregue", corBorda: "border-l-[#3F7D5C]", corTexto: "text-[#285A3E]", corFundo: "bg-[#DDEFE3]" },
};

// Mapa simples de nome de insumo (forminha) -> cor visual. Como o backend
// só nos dá o "nome" do insumo (ex: "Forminha Rosa"), fazemos uma
// correspondência por palavra-chave. Sem correspondência, cai no padrão neutro.
const CORES_FORMINHA = [
  { palavraChave: "rosa", hex: "#E8A0BF" },
  { palavraChave: "azul", hex: "#7FA8D9" },
  { palavraChave: "dourad", hex: "#D4AF37" },
  { palavraChave: "branc", hex: "#F2F2F2" },
  { palavraChave: "vermelh", hex: "#D9534F" },
  { palavraChave: "verde", hex: "#6FA97A" },
];

function corDaForminha(nomeInsumo = "") {
  const nomeLower = nomeInsumo.toLowerCase();
  const encontrada = CORES_FORMINHA.find((c) => nomeLower.includes(c.palavraChave));
  return encontrada ? encontrada.hex : "#BFB6AC"; // neutro caso não reconheça a cor pelo nome
}

/**
 * ============================================================
 * ADAPTADOR: formato bruto da API -> formato que o componente usa
 * ============================================================
 * Único ponto de contato entre "o que o backend manda" e "o que a
 * tela precisa". Se o formato da API mudar amanhã, só esta função
 * é alterada — o restante do componente nunca sabe a diferença.
 */
function mapearPedido(pedidoBruto) {
  const itens = pedidoBruto.itens.map((item) => ({
    id: item.id,
    saborNome: item.sabor.nome,
    quantidade: item.tipoLote.quantidade,
    podeCongelar: item.sabor.podeCongelar,
  }));

  const quantidadeTotal = itens.reduce((soma, item) => soma + item.quantidade, 0);

  return {
    id: pedidoBruto.id,
    clienteNome: pedidoBruto.cliente.nome,
    dataEntrega: pedidoBruto.dataEntrega,
    horarioEntrega: pedidoBruto.horarioEntrega.slice(0, 5), // "14:30:00" -> "14:30"
    status: pedidoBruto.status,
    forminhaNome: pedidoBruto.forminha.nome,
    forminhaCor: corDaForminha(pedidoBruto.forminha.nome),
    quantidadeTotal,
    itens,
  };
}

function obterIndiceDiaSemana(dataISO) {
  // new Date("2026-07-06") é interpretado em UTC; somamos o fuso local
  // de volta para não "vazar" um dia por causa do fuso horário do navegador.
  const data = new Date(dataISO + "T00:00:00");
  return data.getDay(); // 0 = Domingo, 1 = Segunda, ...
}

/**
 * ============================================================
 * DADOS MOCKADOS
 * ============================================================
 * Representam fielmente o grafo de entidades JPA (não o DTO achatado
 * que a API realmente devolve — ver observação na mensagem de chat).
 */
const PEDIDOS_MOCK_BRUTOS = [
  {
    id: 100234,
    dataEntrega: "2026-07-06",
    horarioEntrega: "14:30:00",
    status: "PENDENTE",
    cliente: { id: 5012, nome: "Maria Souza", telefone: "(13) 99999-0000" },
    forminha: { id: 8001, nome: "Forminha Rosa", tipoInsumo: "FORMINHA", unidadeMedida: "UNIDADES", quantidadeAtual: 480 },
    itens: [
      { id: 300111, sabor: { id: 1, nome: "Tradicional", podeCongelar: true, ativo: true }, tipoLote: { id: 2, quantidade: 50 } },
      { id: 300112, sabor: { id: 2, nome: "Belga", podeCongelar: false, ativo: true }, tipoLote: { id: 3, quantidade: 100 } },
    ],
  },
  {
    id: 100235,
    dataEntrega: "2026-07-06",
    horarioEntrega: "09:00:00",
    status: "EM_PRODUCAO",
    cliente: { id: 5013, nome: "João Ferreira", telefone: "(13) 98888-1111" },
    forminha: { id: 8002, nome: "Forminha Dourada", tipoInsumo: "FORMINHA", unidadeMedida: "UNIDADES", quantidadeAtual: 220 },
    itens: [
      { id: 300113, sabor: { id: 1, nome: "Tradicional", podeCongelar: true, ativo: true }, tipoLote: { id: 1, quantidade: 25 } },
    ],
  },
  {
    id: 100236,
    dataEntrega: "2026-07-08",
    horarioEntrega: "16:00:00",
    status: "PENDENTE",
    cliente: { id: 5014, nome: "Ana Beatriz", telefone: "(13) 97777-2222" },
    forminha: { id: 8003, nome: "Forminha Branca", tipoInsumo: "FORMINHA", unidadeMedida: "UNIDADES", quantidadeAtual: 600 },
    itens: [
      { id: 300114, sabor: { id: 3, nome: "Ninho com Nutella", podeCongelar: false, ativo: true }, tipoLote: { id: 3, quantidade: 100 } },
      { id: 300115, sabor: { id: 1, nome: "Tradicional", podeCongelar: true, ativo: true }, tipoLote: { id: 2, quantidade: 50 } },
    ],
  },
  {
    id: 100237,
    dataEntrega: "2026-07-11",
    horarioEntrega: "11:00:00",
    status: "ENTREGUE",
    cliente: { id: 5015, nome: "Carlos Mendes", telefone: "(13) 96666-3333" },
    forminha: { id: 8001, nome: "Forminha Rosa", tipoInsumo: "FORMINHA", unidadeMedida: "UNIDADES", quantidadeAtual: 480 },
    itens: [
      { id: 300116, sabor: { id: 2, nome: "Belga", podeCongelar: false, ativo: true }, tipoLote: { id: 1, quantidade: 25 } },
    ],
  },
];

/**
 * ============================================================
 * COMPONENTE
 * ============================================================
 */
export default function PainelEncomendasSemanal() {
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    async function buscarPedidosDaSemana() {
      try {
        setCarregando(true);

        // Ajuste as datas conforme a semana desejada, ou calcule
        // dinamicamente a segunda e o domingo da semana atual.
        const dataInicio = "2026-07-06";
        const dataFim = "2026-07-12";

        const resposta = await fetch(
          `/api/pedidos/semana?dataInicio=${dataInicio}&dataFim=${dataFim}`
        );

        if (!resposta.ok) {
          throw new Error(`Erro ao buscar pedidos: ${resposta.status}`);
        }

        const dadosBrutos = await resposta.json();
        setPedidos(dadosBrutos.map(mapearPedido));
        setErro(null);
      } catch (erroCapturado) {
        // Em desenvolvimento, sem o backend rodando, caímos no mock.
        // Remova este fallback quando a integração real estiver validada.
        console.warn("Backend indisponível, usando dados de exemplo:", erroCapturado.message);
        setPedidos(PEDIDOS_MOCK_BRUTOS.map(mapearPedido));
        setErro(null);
      } finally {
        setCarregando(false);
      }
    }

    buscarPedidosDaSemana();
  }, []);

  if (carregando) {
    return (
      <div className="flex h-64 items-center justify-center font-['Inter'] text-lg text-[#3E2723]">
        Carregando encomendas da semana...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8ED] px-4 py-8 sm:px-8">
      <header className="mb-8">
        <h1 className="font-['Baloo_2'] text-3xl font-bold text-[#3E2723] sm:text-4xl">
          Painel Semanal de Encomendas
        </h1>
        <p className="mt-1 font-['Inter'] text-base text-[#6B5A50]">
          Santo Brigadeiro 013 — visão geral da semana
        </p>
      </header>

      {erro && (
        <div className="mb-6 rounded-xl bg-[#FFE1E1] px-4 py-3 font-['Inter'] text-[#8A2C2C]">
          Não foi possível carregar os pedidos: {erro}
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4">
        {DIAS_DA_SEMANA.map((dia) => {
          const pedidosDoDia = pedidos
            .filter((pedido) => obterIndiceDiaSemana(pedido.dataEntrega) === dia.chave)
            .sort((a, b) => a.horarioEntrega.localeCompare(b.horarioEntrega));

          return (
            <section
              key={dia.chave}
              className="flex w-72 shrink-0 flex-col rounded-2xl bg-white/60 p-3"
            >
              <h2 className="mb-3 font-['Baloo_2'] text-xl font-semibold text-[#3E2723]">
                {dia.label}
                <span className="ml-2 font-['Inter'] text-sm font-normal text-[#9C8B7F]">
                  ({pedidosDoDia.length})
                </span>
              </h2>

              {pedidosDoDia.length === 0 ? (
                <p className="font-['Inter'] text-sm text-[#B5A99C]">
                  Nenhuma encomenda para este dia.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {pedidosDoDia.map((pedido) => (
                    <CardPedido key={pedido.id} pedido={pedido} />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function CardPedido({ pedido }) {
  const statusConfig = STATUS_CONFIG[pedido.status];

  return (
    <article
      className={`rounded-xl border-l-4 bg-white p-4 shadow-sm ${statusConfig.corBorda}`}
    >
      <div className="mb-2 flex items-start justify-between">
        <span className="font-['Baloo_2'] text-2xl font-bold text-[#3E2723]">
          {pedido.horarioEntrega}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 font-['Inter'] text-xs font-semibold ${statusConfig.corFundo} ${statusConfig.corTexto}`}
        >
          {statusConfig.label}
        </span>
      </div>

      <p className="font-['Inter'] text-lg font-semibold text-[#3E2723]">
        {pedido.clienteNome}
      </p>

      <p className="mb-3 font-['Inter'] text-sm text-[#6B5A50]">
        {pedido.quantidadeTotal} doces no total
      </p>

      <ul className="mb-3 flex flex-col gap-1">
        {pedido.itens.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between font-['Inter'] text-sm text-[#4A3D35]"
          >
            <span>{item.saborNome}</span>
            <span className="font-semibold">{item.quantidade} un.</span>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-2 border-t border-[#F0E6DA] pt-2">
        <span
          className="h-4 w-4 rounded-full border border-[#00000014]"
          style={{ backgroundColor: pedido.forminhaCor }}
          aria-hidden="true"
        />
        <span className="font-['Inter'] text-xs text-[#9C8B7F]">
          {pedido.forminhaNome}
        </span>
      </div>
    </article>
  );
}
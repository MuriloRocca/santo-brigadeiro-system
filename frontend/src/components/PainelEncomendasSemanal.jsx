import { useEffect, useState } from "react";

/**
 * ============================================================
 * CONFIGURAÇÃO VISUAL E DE DOMÍNIO
 * ============================================================
 * Mantidas no topo do arquivo (e não espalhadas pelo JSX) para que
 * qualquer ajuste de cor/rótulo seja feito em um único lugar.
 */

// Ordem visual da semana: Segunda..Domingo. O índice no array é o
// deslocamento em dias a partir da segunda-feira exibida.
const DIAS_DA_SEMANA = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

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

// Paleta cíclica para os sabores na Central de Produção — só famílias
// de cor que já existem na identidade do projeto. A cor é atribuída
// pela posição do sabor no ranking (maior volume primeiro).
const CORES_SABOR = [
  { fundo: "bg-[#DDEFE3]", texto: "text-[#285A3E]", barra: "#3F7D5C" }, // verde
  { fundo: "bg-[#F0E6DA]", texto: "text-[#5D4037]", barra: "#8D6E63" }, // marrom
  { fundo: "bg-[#FFF3D6]", texto: "text-[#946200]", barra: "#E3A008" }, // âmbar
  { fundo: "bg-[#DCEBF5]", texto: "text-[#1F4D6E]", barra: "#2F6690" }, // azul
  { fundo: "bg-[#F9E0EA]", texto: "text-[#A34D6E]", barra: "#E8A0BF" }, // rosa
];

/**
 * ============================================================
 * DATAS — sempre por manipulação de string/partes locais
 * ============================================================
 * new Date("2026-07-06") interpreta a string como UTC e pode "vazar"
 * um dia dependendo do fuso do navegador. Por isso toda aritmética de
 * datas aqui usa o construtor local new Date(ano, mes, dia) e converte
 * de volta para ISO com as partes locais.
 */

function paraISOLocal(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function adicionarDias(dataISO, dias) {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  return paraISOLocal(new Date(ano, mes - 1, dia + dias));
}

function segundaDaSemanaAtual() {
  const hoje = new Date();
  const deslocamento = (hoje.getDay() + 6) % 7; // segunda=0 ... domingo=6
  return paraISOLocal(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - deslocamento));
}

function formatarDataCurta(dataISO) {
  const [, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}`;
}

/**
 * ============================================================
 * ADAPTADOR: formato bruto da API -> formato que o componente usa
 * ============================================================
 * A API devolve o PedidoResponseDTO ACHATADO:
 * { id, cliente, dataEntrega, horarioEntrega, status, corForminha,
 *   valorTotal, itens: [{ sabor, quantidade, precoUnitario, subtotal }] }
 * (O adaptador antigo esperava o grafo JPA aninhado e quebraria com a
 * resposta real — corrigido junto com a Central de Produção.)
 */
function mapearPedido(pedidoBruto) {
  const itens = pedidoBruto.itens.map((item) => ({
    saborNome: item.sabor,
    quantidade: item.quantidade,
  }));

  const quantidadeTotal = itens.reduce((soma, item) => soma + item.quantidade, 0);

  return {
    id: pedidoBruto.id,
    clienteNome: pedidoBruto.cliente,
    dataEntrega: pedidoBruto.dataEntrega,
    horarioEntrega: pedidoBruto.horarioEntrega.slice(0, 5), // "14:30:00" -> "14:30"
    status: pedidoBruto.status,
    forminhaNome: pedidoBruto.corForminha,
    forminhaCor: corDaForminha(pedidoBruto.corForminha),
    quantidadeTotal,
    itens,
  };
}

/**
 * ============================================================
 * DADOS MOCKADOS (fiéis aos DTOs reais da API)
 * ============================================================
 * As datas dos pedidos de exemplo são geradas em relação à semana
 * exibida (offsets a partir da segunda-feira), para que o modo de
 * exemplo sempre tenha o que mostrar, em qualquer semana navegada.
 */

const SABOR_CONGELAVEL_MOCK = {
  Tradicional: true,
  Belga: false,
  "Ninho com Nutella": false,
};

const PEDIDOS_MOCK_BASE = [
  { id: 100234, offsetDias: 0, horarioEntrega: "14:30:00", status: "PENDENTE", cliente: "Maria Souza", corForminha: "Forminha Rosa", itens: [{ sabor: "Tradicional", quantidade: 50 }, { sabor: "Belga", quantidade: 100 }] },
  { id: 100235, offsetDias: 0, horarioEntrega: "09:00:00", status: "EM_PRODUCAO", cliente: "João Ferreira", corForminha: "Forminha Dourada", itens: [{ sabor: "Tradicional", quantidade: 25 }] },
  { id: 100236, offsetDias: 2, horarioEntrega: "16:00:00", status: "PENDENTE", cliente: "Ana Beatriz", corForminha: "Forminha Branca", itens: [{ sabor: "Ninho com Nutella", quantidade: 100 }, { sabor: "Tradicional", quantidade: 50 }] },
  { id: 100237, offsetDias: 5, horarioEntrega: "11:00:00", status: "ENTREGUE", cliente: "Carlos Mendes", corForminha: "Forminha Rosa", itens: [{ sabor: "Belga", quantidade: 25 }] },
];

function gerarPedidosMock(segundaISO) {
  return PEDIDOS_MOCK_BASE.map(({ offsetDias, ...pedido }) => ({
    ...pedido,
    dataEntrega: adicionarDias(segundaISO, offsetDias),
  }));
}

// Espelha a regra do backend: pedido ENTREGUE não conta como produção
// pendente (repare que o pedido de exemplo do Carlos fica de fora).
function gerarResumoMock(pedidosBrutos) {
  const pendentes = pedidosBrutos.filter((pedido) => pedido.status !== "ENTREGUE");

  const porSabor = new Map();
  const porDiaESabor = new Map();
  let totalGeralDoces = 0;

  for (const pedido of pendentes) {
    for (const item of pedido.itens) {
      totalGeralDoces += item.quantidade;
      porSabor.set(item.sabor, (porSabor.get(item.sabor) ?? 0) + item.quantidade);
      const chave = `${pedido.dataEntrega}|${item.sabor}`;
      porDiaESabor.set(chave, (porDiaESabor.get(chave) ?? 0) + item.quantidade);
    }
  }

  const totaisPorSabor = [...porSabor.entries()]
    .map(([saborNome, quantidadeTotal]) => ({
      saborNome,
      quantidadeTotal,
      podeCongelar: SABOR_CONGELAVEL_MOCK[saborNome] ?? false,
    }))
    .sort((a, b) => b.quantidadeTotal - a.quantidadeTotal);

  const totaisPorDiaESabor = [...porDiaESabor.entries()].map(([chave, quantidade]) => {
    const [data, saborNome] = chave.split("|");
    return { data, saborNome, quantidade };
  });

  return { totalGeralDoces, totaisPorSabor, totaisPorDiaESabor };
}

/**
 * ============================================================
 * COMPONENTE
 * ============================================================
 */
export default function PainelEncomendasSemanal() {
  const [segundaISO, setSegundaISO] = useState(segundaDaSemanaAtual);
  const [pedidos, setPedidos] = useState(null);
  const [resumo, setResumo] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [usandoMock, setUsandoMock] = useState(false);
  const [resumoAberto, setResumoAberto] = useState(true);

  const domingoISO = adicionarDias(segundaISO, 6);
  const datasDaSemana = DIAS_DA_SEMANA.map((_, indice) => adicionarDias(segundaISO, indice));

  useEffect(() => {
    // Evita aplicar uma resposta antiga se o usuário navegar de semana
    // antes de a requisição anterior terminar.
    let ativo = true;

    async function buscarSemana() {
      setCarregando(true);
      const fimISO = adicionarDias(segundaISO, 6);
      try {
        const [respostaPedidos, respostaResumo] = await Promise.all([
          fetch(`/api/pedidos/semana?dataInicio=${segundaISO}&dataFim=${fimISO}`),
          fetch(`/api/pedidos/resumo-producao?inicio=${segundaISO}&fim=${fimISO}`),
        ]);

        if (!respostaPedidos.ok || !respostaResumo.ok) {
          throw new Error(`status ${respostaPedidos.status}/${respostaResumo.status}`);
        }

        const [pedidosBrutos, resumoBruto] = await Promise.all([
          respostaPedidos.json(),
          respostaResumo.json(),
        ]);

        if (!ativo) return;
        setPedidos(pedidosBrutos.map(mapearPedido));
        setResumo(resumoBruto);
        setUsandoMock(false);
      } catch (erroCapturado) {
        if (!ativo) return;
        console.warn("Backend indisponível, usando dados de exemplo:", erroCapturado.message);
        const pedidosMock = gerarPedidosMock(segundaISO);
        setPedidos(pedidosMock.map(mapearPedido));
        setResumo(gerarResumoMock(pedidosMock));
        setUsandoMock(true);
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    buscarSemana();
    return () => {
      ativo = false;
    };
  }, [segundaISO]);

  if (carregando && pedidos === null) {
    return (
      <div className="flex h-64 items-center justify-center font-['Inter'] text-lg text-[#3E2723]">
        Carregando encomendas da semana...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8ED] px-4 py-8 sm:px-8">
      <header className="mb-6">
        <h1 className="font-['Baloo_2'] text-3xl font-bold text-[#3E2723] sm:text-4xl">
          Painel Semanal de Encomendas
        </h1>
        <p className="mt-1 font-['Inter'] text-base text-[#6B5A50]">
          Santo Brigadeiro 013 — visão geral da semana
        </p>
      </header>

      {/* ------- Navegação de semana (só cliques, zero digitação) ------- */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSegundaISO(adicionarDias(segundaISO, -7))}
          className="rounded-full border border-[#E8DCCB] bg-white px-4 py-2 font-['Inter'] text-sm font-semibold text-[#6B5A50] transition-colors hover:bg-[#F0E6DA]"
        >
          ‹ Semana anterior
        </button>
        <span className="rounded-full bg-white/60 px-4 py-2 font-['Inter'] text-sm font-semibold text-[#3E2723]">
          {formatarDataCurta(segundaISO)} – {formatarDataCurta(domingoISO)}
        </span>
        <button
          type="button"
          onClick={() => setSegundaISO(adicionarDias(segundaISO, 7))}
          className="rounded-full border border-[#E8DCCB] bg-white px-4 py-2 font-['Inter'] text-sm font-semibold text-[#6B5A50] transition-colors hover:bg-[#F0E6DA]"
        >
          Próxima semana ›
        </button>
        <button
          type="button"
          onClick={() => setSegundaISO(segundaDaSemanaAtual())}
          className="rounded-full px-3 py-2 font-['Inter'] text-xs font-semibold text-[#9C8B7F] transition-colors hover:bg-[#F0E6DA]"
        >
          Semana atual
        </button>
        {carregando && (
          <span className="font-['Inter'] text-xs text-[#9C8B7F]">Atualizando…</span>
        )}
      </div>

      {usandoMock && (
        <div className="mb-6 rounded-xl bg-[#FFF3D6] px-4 py-3 font-['Inter'] text-sm text-[#946200]">
          ⚠ Backend indisponível — exibindo <strong>dados de exemplo</strong>. As
          quantidades abaixo não são reais.
        </div>
      )}

      {/* ------- Central de Produção (colapsável) ------- */}
      <CentralDeProducao
        resumo={resumo}
        aberto={resumoAberto}
        aoAlternar={() => setResumoAberto((valor) => !valor)}
        datasDaSemana={datasDaSemana}
      />

      {/* ------- Colunas de pedidos por dia ------- */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {datasDaSemana.map((dataISO, indice) => {
          const pedidosDoDia = (pedidos ?? [])
            .filter((pedido) => pedido.dataEntrega === dataISO)
            .sort((a, b) => a.horarioEntrega.localeCompare(b.horarioEntrega));

          return (
            <section key={dataISO} className="flex w-72 shrink-0 flex-col rounded-2xl bg-white/60 p-3">
              <h2 className="mb-3 font-['Baloo_2'] text-xl font-semibold text-[#3E2723]">
                {DIAS_DA_SEMANA[indice]}
                <span className="ml-2 font-['Inter'] text-sm font-normal text-[#9C8B7F]">
                  {formatarDataCurta(dataISO)} · ({pedidosDoDia.length})
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

/**
 * ============================================================
 * CENTRAL DE PRODUÇÃO (resumo colapsável)
 * ============================================================
 */
function CentralDeProducao({ resumo, aberto, aoAlternar, datasDaSemana }) {
  if (!resumo) return null;

  // Cor de cada sabor definida pelo ranking (o backend já devolve os
  // totais por sabor do maior para o menor volume).
  const coresPorSabor = new Map(
    resumo.totaisPorSabor.map((sabor, indice) => [sabor.saborNome, CORES_SABOR[indice % CORES_SABOR.length]])
  );

  const dias = datasDaSemana.map((dataISO, indice) => {
    const sabores = resumo.totaisPorDiaESabor.filter((total) => total.data === dataISO);
    const total = sabores.reduce((soma, item) => soma + item.quantidade, 0);
    return { dataISO, label: DIAS_DA_SEMANA[indice], sabores, total };
  });
  const maiorTotalDia = Math.max(...dias.map((dia) => dia.total), 0);

  return (
    <section className="mb-8 overflow-hidden rounded-2xl bg-white/60">
      <button
        type="button"
        onClick={aoAlternar}
        aria-expanded={aberto}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors hover:bg-white/80 sm:px-5"
      >
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-['Baloo_2'] text-xl font-semibold text-[#3E2723]">
            Central de Produção
          </h2>
          <span className="rounded-full bg-[#3E2723] px-3 py-0.5 font-['Baloo_2'] text-sm font-bold text-[#FFF8ED]">
            {resumo.totalGeralDoces} doces
          </span>
          <span className="font-['Inter'] text-xs text-[#9C8B7F]">pendentes na semana</span>
        </div>
        <span
          className={`shrink-0 font-['Inter'] text-sm text-[#9C8B7F] transition-transform duration-200 ${aberto ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          ▼
        </span>
      </button>

      {aberto && (
        <div className="border-t border-[#F0E6DA] px-4 pb-5 pt-4 sm:px-5">
          {resumo.totalGeralDoces === 0 ? (
            <p className="font-['Inter'] text-sm text-[#B5A99C]">
              Nenhuma produção pendente nesta semana. 🎉
            </p>
          ) : (
            <>
              {/* --- Cards de impacto rápido --- */}
              <div className="mb-6 flex flex-wrap items-stretch gap-3">
                <div className="flex min-w-44 flex-col justify-center rounded-2xl border-l-4 border-l-[#3E2723] bg-white p-4 shadow-sm">
                  <p className="font-['Inter'] text-sm font-semibold text-[#6B5A50]">
                    Total a produzir
                  </p>
                  <p className="font-['Baloo_2'] text-4xl font-bold text-[#3E2723]">
                    {resumo.totalGeralDoces}
                  </p>
                  <p className="font-['Inter'] text-xs text-[#9C8B7F]">doces até domingo</p>
                </div>

                {resumo.totaisPorSabor.map((sabor) => (
                  <BadgeSabor
                    key={sabor.saborNome}
                    sabor={sabor}
                    cor={coresPorSabor.get(sabor.saborNome)}
                  />
                ))}
              </div>

              {/* --- Grid semanal: uma barra por dia, fatiada por sabor --- */}
              <div className="flex flex-col gap-2">
                {dias.map((dia) => {
                  const ehPico = dia.total === maiorTotalDia && dia.total > 0;
                  return (
                    <div
                      key={dia.dataISO}
                      className={`rounded-xl bg-white p-3 shadow-sm ${ehPico ? "ring-2 ring-[#E3A008]/60" : ""}`}
                    >
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span className="font-['Inter'] text-sm font-semibold text-[#3E2723]">
                          {dia.label}
                          <span className="ml-1.5 font-normal text-[#9C8B7F]">
                            {formatarDataCurta(dia.dataISO)}
                          </span>
                          {ehPico && (
                            <span className="ml-2 rounded-full bg-[#FFF3D6] px-2 py-0.5 text-xs font-semibold text-[#946200]">
                              dia mais pesado
                            </span>
                          )}
                        </span>
                        <span className="font-['Baloo_2'] text-lg font-bold text-[#3E2723]">
                          {dia.total > 0 ? dia.total : "—"}
                        </span>
                      </div>

                      {/* Barra proporcional ao dia mais pesado da semana,
                          fatiada pela participação de cada sabor. */}
                      <div className="h-3 overflow-hidden rounded-full bg-[#F0E6DA]">
                        <div className="flex h-full overflow-hidden rounded-full">
                          {dia.sabores.map((total) => {
                            const cor = coresPorSabor.get(total.saborNome);
                            const fatia = maiorTotalDia > 0 ? (total.quantidade / maiorTotalDia) * 100 : 0;
                            return (
                              <div
                                key={total.saborNome}
                                style={{ width: `${fatia}%`, backgroundColor: cor?.barra }}
                                title={`${total.saborNome}: ${total.quantidade}`}
                              />
                            );
                          })}
                        </div>
                      </div>

                      {dia.sabores.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {dia.sabores.map((total) => {
                            const cor = coresPorSabor.get(total.saborNome);
                            return (
                              <span
                                key={total.saborNome}
                                className={`rounded-full px-2 py-0.5 font-['Inter'] text-xs font-semibold ${cor.fundo} ${cor.texto}`}
                              >
                                {total.saborNome} · {total.quantidade}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}

function BadgeSabor({ sabor, cor }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-3 pr-4 shadow-sm">
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-['Baloo_2'] text-lg font-bold ${cor.fundo} ${cor.texto}`}
      >
        {sabor.quantidadeTotal}
      </span>
      <div>
        <p className="font-['Inter'] text-sm font-semibold text-[#3E2723]">{sabor.saborNome}</p>
        {sabor.podeCongelar ? (
          <span className="mt-0.5 inline-block rounded-full bg-[#DCEBF5] px-2 py-0.5 font-['Inter'] text-xs font-semibold text-[#1F4D6E]">
            ❄ Pode congelar
          </span>
        ) : (
          <span className="font-['Inter'] text-xs text-[#B5A99C]">produção fresca</span>
        )}
      </div>
    </div>
  );
}

/**
 * ============================================================
 * CARD DE PEDIDO
 * ============================================================
 */
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
            key={item.saborNome}
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

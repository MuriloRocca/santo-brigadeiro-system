import { useEffect, useState } from "react";
import ModalNovaEncomenda from "./ModalNovaEncomenda";

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
  { palavraChave: "marrom", hex: "#8D6E63" },
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

const NOMES_DIAS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

function nomeDoDiaDaSemana(dataISO) {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  return NOMES_DIAS[new Date(ano, mes - 1, dia).getDay()];
}

/**
 * ============================================================
 * ADAPTADOR: formato bruto da API -> formato que o componente usa
 * ============================================================
 * A API devolve o PedidoResponseDTO ACHATADO:
 * { id, cliente, dataEntrega, horarioEntrega, status, corForminha,
 *   valorTotal, itens: [{ id, sabor, quantidade, precoUnitario,
 *   subtotal, podeCongelar, statusProducao }] }
 */
function mapearPedido(pedidoBruto) {
  const itens = pedidoBruto.itens.map((item) => ({
    id: item.id,
    saborNome: item.sabor,
    quantidade: item.quantidade,
    podeCongelar: item.podeCongelar ?? false,
    statusProducao: item.statusProducao ?? "PENDENTE",
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
  "Paçoca": true,
};

const PEDIDOS_MOCK_BASE = [
  { id: 100234, offsetDias: 0, horarioEntrega: "14:30:00", status: "PENDENTE", cliente: "Maria Souza", corForminha: "Forminha Rosa", itens: [{ id: 300111, sabor: "Tradicional", quantidade: 50 }, { id: 300112, sabor: "Belga", quantidade: 100 }] },
  { id: 100235, offsetDias: 0, horarioEntrega: "09:00:00", status: "EM_PRODUCAO", cliente: "João Ferreira", corForminha: "Forminha Dourada", itens: [{ id: 300113, sabor: "Tradicional", quantidade: 25 }] },
  { id: 100236, offsetDias: 2, horarioEntrega: "16:00:00", status: "PENDENTE", cliente: "Ana Beatriz", corForminha: "Forminha Branca", itens: [{ id: 300114, sabor: "Ninho com Nutella", quantidade: 100 }, { id: 300115, sabor: "Tradicional", quantidade: 50 }] },
  { id: 100237, offsetDias: 5, horarioEntrega: "11:00:00", status: "ENTREGUE", cliente: "Carlos Mendes", corForminha: "Forminha Rosa", itens: [{ id: 300116, sabor: "Belga", quantidade: 25 }] },
  // Carga de testes da Fase 9.2 — paridade com a migration V9.
  { id: 100238, offsetDias: 2, horarioEntrega: "15:00:00", status: "PENDENTE", cliente: "João Silva", corForminha: "Forminha Marrom Redonda", itens: [{ id: 300117, sabor: "Tradicional", quantidade: 50 }] },
  { id: 100239, offsetDias: 3, horarioEntrega: "11:00:00", status: "EM_PRODUCAO", cliente: "Ana Costa", corForminha: "Forminha Marrom Redonda", itens: [{ id: 300118, sabor: "Belga", quantidade: 100 }] },
  { id: 100240, offsetDias: 4, horarioEntrega: "17:30:00", status: "PENDENTE", cliente: "Pedro Santos", corForminha: "Forminha Marrom Redonda", itens: [{ id: 300119, sabor: "Tradicional", quantidade: 50 }] },
  { id: 100241, offsetDias: 5, horarioEntrega: "10:00:00", status: "PENDENTE", cliente: "Carla Souza", corForminha: "Forminha Marrom Redonda", itens: [{ id: 300120, sabor: "Tradicional", quantidade: 100 }] },
  { id: 100242, offsetDias: 5, horarioEntrega: "16:00:00", status: "PENDENTE", cliente: "Carla Souza", corForminha: "Forminha Marrom Redonda", itens: [{ id: 300121, sabor: "Tradicional", quantidade: 100 }] },
  { id: 100243, offsetDias: 6, horarioEntrega: "09:30:00", status: "ENTREGUE", cliente: "Luciana Dias", corForminha: "Forminha Marrom Redonda", itens: [{ id: 300122, sabor: "Belga", quantidade: 25 }] },
  // Encomendas de demonstração da V11 — pedidos mistos e o pico do casamento.
  { id: 100244, offsetDias: 2, horarioEntrega: "14:00:00", status: "PENDENTE", cliente: "Dona Rosa", corForminha: "Forminha Marrom Redonda", itens: [{ id: 300123, sabor: "Tradicional", quantidade: 25 }] },
  { id: 100245, offsetDias: 3, horarioEntrega: "09:00:00", status: "PENDENTE", cliente: "Café TechDoce", corForminha: "Forminha Marrom Redonda", itens: [{ id: 300124, sabor: "Belga", quantidade: 50 }, { id: 300125, sabor: "Tradicional", quantidade: 25 }] },
  { id: 100246, offsetDias: 4, horarioEntrega: "17:00:00", status: "PENDENTE", cliente: "Família do Théo", corForminha: "Forminha Marrom Redonda", itens: [{ id: 300126, sabor: "Ninho com Nutella", quantidade: 100 }, { id: 300127, sabor: "Paçoca", quantidade: 25 }] },
  { id: 100247, offsetDias: 5, horarioEntrega: "11:00:00", status: "PENDENTE", cliente: "Fernanda & Tiago", corForminha: "Forminha Marrom Redonda", itens: [{ id: 300128, sabor: "Tradicional", quantidade: 100 }, { id: 300129, sabor: "Belga", quantidade: 100 }, { id: 300130, sabor: "Paçoca", quantidade: 50 }] },
  { id: 100248, offsetDias: 5, horarioEntrega: "19:00:00", status: "PENDENTE", cliente: "Bia Formanda", corForminha: "Forminha Marrom Redonda", itens: [{ id: 300131, sabor: "Tradicional", quantidade: 100 }] },
  { id: 100249, offsetDias: 6, horarioEntrega: "10:00:00", status: "PENDENTE", cliente: "Camila Andrade", corForminha: "Forminha Marrom Redonda", itens: [{ id: 300132, sabor: "Tradicional", quantidade: 50 }, { id: 300133, sabor: "Belga", quantidade: 25 }] },
];

function gerarPedidosMock(segundaISO) {
  return PEDIDOS_MOCK_BASE.map(({ offsetDias, ...pedido }) => ({
    ...pedido,
    dataEntrega: adicionarDias(segundaISO, offsetDias),
    itens: pedido.itens.map((item) => ({
      ...item,
      podeCongelar: SABOR_CONGELAVEL_MOCK[item.sabor] ?? false,
      statusProducao: "PENDENTE",
    })),
  }));
}

// Espelha a regra do backend, aplicada localmente sobre os pedidos já
// mapeados: pedido ENTREGUE não conta e lote CONGELADO saiu da lista
// de esforço. Serve tanto para o modo de exemplo quanto para simular
// o clique de adiantamento quando o backend está fora.
function calcularResumoLocal(pedidosMapeados) {
  const pendentes = pedidosMapeados.filter((pedido) => pedido.status !== "ENTREGUE");

  const porSabor = new Map();
  const porDiaESabor = new Map();
  let totalGeralDoces = 0;

  for (const pedido of pendentes) {
    for (const item of pedido.itens) {
      if (item.statusProducao === "CONGELADO") continue;
      totalGeralDoces += item.quantidade;
      const acumulado = porSabor.get(item.saborNome) ?? { quantidade: 0, podeCongelar: item.podeCongelar };
      acumulado.quantidade += item.quantidade;
      porSabor.set(item.saborNome, acumulado);
      const chave = `${pedido.dataEntrega}|${item.saborNome}`;
      porDiaESabor.set(chave, (porDiaESabor.get(chave) ?? 0) + item.quantidade);
    }
  }

  const totaisPorSabor = [...porSabor.entries()]
    .map(([saborNome, info]) => ({
      saborNome,
      quantidadeTotal: info.quantidade,
      podeCongelar: info.podeCongelar,
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
  // Chave da ação em andamento: "adiantar-<sabor>|<data>" ou "desfazer-<itemId>".
  const [salvandoChave, setSalvandoChave] = useState(null);
  const [mensagemAcao, setMensagemAcao] = useState(null); // { tipo: "sucesso" | "erro", texto }
  // Incrementado após uma ação para recarregar a verdade do servidor.
  const [versaoDados, setVersaoDados] = useState(0);
  const [modalNovaEncomendaAberto, setModalNovaEncomendaAberto] = useState(false);

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
        const pedidosMock = gerarPedidosMock(segundaISO).map(mapearPedido);
        setPedidos(pedidosMock);
        setResumo(calcularResumoLocal(pedidosMock));
        setUsandoMock(true);
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    buscarSemana();
    return () => {
      ativo = false;
    };
  }, [segundaISO, versaoDados]);

  // Mensagens de ação valem apenas para a semana em exibição — por isso
  // a navegação de semana passa por aqui, que limpa o aviso anterior.
  function mudarSemana(novaSegundaISO) {
    setMensagemAcao(null);
    setSegundaISO(novaSegundaISO);
  }

  // Núcleo compartilhado entre "adiantar" e "desfazer": mesmo endpoint,
  // mesma simulação em modo exemplo, mesma ressincronização pós-falha.
  async function alterarStatusProducao({ chave, itemIds, novoStatus, textoSucesso, textoErro }) {
    setSalvandoChave(chave);
    setMensagemAcao(null);
    try {
      if (usandoMock) {
        // Modo exemplo: simula localmente para o fluxo de demonstração
        // continuar clicável mesmo sem backend.
        const atualizados = pedidos.map((pedido) => ({
          ...pedido,
          itens: pedido.itens.map((item) =>
            itemIds.includes(item.id) ? { ...item, statusProducao: novoStatus } : item
          ),
        }));
        setPedidos(atualizados);
        setResumo(calcularResumoLocal(atualizados));
      } else {
        const respostas = await Promise.all(
          itemIds.map((itemId) =>
            fetch(`/api/pedidos/itens/${itemId}/status-producao`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ statusProducao: novoStatus }),
            })
          )
        );
        if (respostas.some((resposta) => !resposta.ok)) {
          throw new Error("uma das atualizações falhou");
        }
        setVersaoDados((versao) => versao + 1); // recarrega a verdade do servidor
      }
      setMensagemAcao({ tipo: "sucesso", texto: textoSucesso });
    } catch (erroCapturado) {
      console.warn("Falha ao atualizar status de produção:", erroCapturado.message);
      setMensagemAcao({ tipo: "erro", texto: textoErro });
      // Ressincroniza com o servidor: uma falha parcial não pode deixar
      // a tela contando doces que já foram congelados (ou vice-versa).
      setVersaoDados((versao) => versao + 1);
    } finally {
      setSalvandoChave(null);
    }
  }

  function marcarComoAdiantado(grupo) {
    return alterarStatusProducao({
      chave: grupo.chave,
      itemIds: grupo.itemIds,
      novoStatus: "CONGELADO",
      textoSucesso: `${grupo.quantidade} doces de ${grupo.saborNome} (${grupo.diaLabel}) marcados como adiantados. ❄ A Central de Produção já foi atualizada.`,
      textoErro: `Não foi possível adiantar ${grupo.saborNome}. Tente novamente.`,
    });
  }

  function desfazerAdiantamento(item) {
    return alterarStatusProducao({
      chave: `desfazer-${item.id}`,
      itemIds: [item.id],
      novoStatus: "PENDENTE",
      textoSucesso: `${item.quantidade} doces de ${item.saborNome} voltaram para a produção pendente.`,
      textoErro: `Não foi possível desfazer o adiantamento de ${item.saborNome}. Tente novamente.`,
    });
  }

  // Baixa de entrega direto no card. No backend, virar ENTREGUE também
  // dispara a receita automática no fluxo de caixa (evento de domínio) —
  // e, como o resumo de produção exclui pedidos entregues, a Central e
  // as sugestões de congelamento caem em cascata no recarregamento.
  async function entregarPedido(pedido) {
    setSalvandoChave(`entregar-${pedido.id}`);
    setMensagemAcao(null);
    try {
      if (usandoMock) {
        // Modo exemplo: simula localmente — calcularResumoLocal já
        // ignora pedidos ENTREGUES, então a cascata acontece igual.
        const atualizados = pedidos.map((p) =>
          p.id === pedido.id ? { ...p, status: "ENTREGUE" } : p
        );
        setPedidos(atualizados);
        setResumo(calcularResumoLocal(atualizados));
      } else {
        const resposta = await fetch(`/api/pedidos/${pedido.id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "ENTREGUE" }),
        });
        if (!resposta.ok) {
          throw new Error(`status ${resposta.status}`);
        }
        setVersaoDados((versao) => versao + 1); // recarrega a verdade do servidor
      }
      setMensagemAcao({
        tipo: "sucesso",
        texto: `Pedido de ${pedido.clienteNome} entregue! A receita da venda já caiu no fluxo de caixa. 🎉`,
      });
    } catch (erroCapturado) {
      console.warn("Falha ao entregar pedido:", erroCapturado.message);
      setMensagemAcao({
        tipo: "erro",
        texto: `Não foi possível entregar o pedido de ${pedido.clienteNome}. Tente novamente.`,
      });
      setVersaoDados((versao) => versao + 1); // ressincroniza com o servidor
    } finally {
      setSalvandoChave(null);
    }
  }

  if (carregando && pedidos === null) {
    return (
      <div className="flex h-64 items-center justify-center font-['Inter'] text-lg text-[#3E2723]">
        Carregando encomendas da semana...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8ED] px-4 py-8 sm:px-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-['Baloo_2'] text-3xl font-bold text-[#3E2723] sm:text-4xl">
            Painel Semanal de Encomendas
          </h1>
          <p className="mt-1 font-['Inter'] text-base text-[#6B5A50]">
            Santo Brigadeiro 013 — visão geral da semana
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalNovaEncomendaAberto(true)}
          className="rounded-full bg-[#3E2723] px-6 py-3 font-['Inter'] text-base font-semibold text-[#FFF8ED] shadow-sm transition-colors hover:bg-[#5D4037]"
        >
          + Nova encomenda
        </button>
      </header>

      {/* Montado só quando aberto: cada abertura começa com estado limpo. */}
      {modalNovaEncomendaAberto && (
      <ModalNovaEncomenda
        aoFechar={() => setModalNovaEncomendaAberto(false)}
        aoCriar={(pedidoCriado) => {
          setModalNovaEncomendaAberto(false);
          setMensagemAcao({
            tipo: "sucesso",
            texto: `Encomenda de ${pedidoCriado.cliente} criada para ${formatarDataCurta(pedidoCriado.dataEntrega)}! 🎉`,
          });
          setVersaoDados((versao) => versao + 1); // pedido novo aparece na coluna do dia
        }}
      />
      )}

      {/* ------- Navegação de semana (só cliques, zero digitação) ------- */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => mudarSemana(adicionarDias(segundaISO, -7))}
          className="rounded-full border border-[#E8DCCB] bg-white px-4 py-2 font-['Inter'] text-sm font-semibold text-[#6B5A50] transition-colors hover:bg-[#F0E6DA]"
        >
          ‹ Semana anterior
        </button>
        <span className="rounded-full bg-white/60 px-4 py-2 font-['Inter'] text-sm font-semibold text-[#3E2723]">
          {formatarDataCurta(segundaISO)} – {formatarDataCurta(domingoISO)}
        </span>
        <button
          type="button"
          onClick={() => mudarSemana(adicionarDias(segundaISO, 7))}
          className="rounded-full border border-[#E8DCCB] bg-white px-4 py-2 font-['Inter'] text-sm font-semibold text-[#6B5A50] transition-colors hover:bg-[#F0E6DA]"
        >
          Próxima semana ›
        </button>
        <button
          type="button"
          onClick={() => mudarSemana(segundaDaSemanaAtual())}
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

      {/* ------- Sugestões de Adiantamento (Congelamento) ------- */}
      {mensagemAcao && (
        <div
          className={`mb-6 rounded-xl px-4 py-3 font-['Inter'] text-sm ${
            mensagemAcao.tipo === "sucesso"
              ? "bg-[#DDEFE3] text-[#285A3E]"
              : "bg-[#FFE1E1] text-[#8A2C2C]"
          }`}
        >
          {mensagemAcao.texto}
        </div>
      )}

      <SugestoesAdiantamento
        pedidos={pedidos ?? []}
        salvandoChave={salvandoChave}
        aoMarcar={marcarComoAdiantado}
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
                    <CardPedido
                      key={pedido.id}
                      pedido={pedido}
                      salvandoChave={salvandoChave}
                      aoDesfazer={desfazerAdiantamento}
                      aoEntregar={entregarPedido}
                    />
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

/**
 * ============================================================
 * SUGESTÕES DE ADIANTAMENTO (CONGELAMENTO)
 * ============================================================
 * Agrupa os lotes PENDENTES de sabores congeláveis (de pedidos ainda
 * não entregues) por SABOR + DIA DE ENTREGA: cada card é uma decisão
 * específica ("adianto o Tradicional da sexta?"), escolhida com um
 * clique. A seção some sozinha quando não há mais nada a adiantar.
 */
function SugestoesAdiantamento({ pedidos, salvandoChave, aoMarcar }) {
  const porSaborEDia = new Map();
  for (const pedido of pedidos) {
    if (pedido.status === "ENTREGUE") continue;
    for (const item of pedido.itens) {
      if (!item.podeCongelar || item.statusProducao !== "PENDENTE") continue;
      const chave = `adiantar-${item.saborNome}|${pedido.dataEntrega}`;
      const grupo = porSaborEDia.get(chave) ?? {
        chave,
        saborNome: item.saborNome,
        dataEntrega: pedido.dataEntrega,
        diaLabel: `${nomeDoDiaDaSemana(pedido.dataEntrega)} (${formatarDataCurta(pedido.dataEntrega)})`,
        quantidade: 0,
        lotes: 0,
        itemIds: [],
      };
      grupo.quantidade += item.quantidade;
      grupo.lotes += 1;
      grupo.itemIds.push(item.id);
      porSaborEDia.set(chave, grupo);
    }
  }
  // Ordem cronológica primeiro (decisão mais urgente no topo) e, dentro
  // do mesmo dia, o maior volume antes.
  const grupos = [...porSaborEDia.values()].sort(
    (a, b) => a.dataEntrega.localeCompare(b.dataEntrega) || b.quantidade - a.quantidade
  );

  if (grupos.length === 0) return null;

  return (
    <section className="mb-8 rounded-2xl bg-white/60 p-4 sm:p-5">
      <h2 className="mb-1 font-['Baloo_2'] text-xl font-semibold text-[#3E2723]">
        Sugestões de Adiantamento <span aria-hidden="true">❄</span>
      </h2>
      <p className="mb-4 font-['Inter'] text-sm text-[#6B5A50]">
        Estes sabores congelam bem — escolha qual dia quer adiantar e alivie os picos.
      </p>

      <div className="flex flex-col gap-3">
        {grupos.map((grupo) => (
          <article
            key={grupo.chave}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-l-4 border-l-[#2F6690] bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#DCEBF5] text-xl"
                aria-hidden="true"
              >
                ❄
              </span>
              <p className="font-['Inter'] text-sm text-[#3E2723]">
                <strong>{grupo.saborNome}</strong> —{" "}
                <strong className="font-['Baloo_2'] text-lg">{grupo.quantidade} un.</strong> para{" "}
                <strong>{grupo.diaLabel}</strong>{" "}
                <span className="text-[#9C8B7F]">
                  ({grupo.lotes} {grupo.lotes === 1 ? "lote" : "lotes"})
                </span>
                <br />
                <span className="text-[#6B5A50]">
                  podem ser adiantados para aliviar esse dia!
                </span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => aoMarcar(grupo)}
              disabled={salvandoChave !== null}
              className="rounded-full bg-[#2F6690] px-5 py-2.5 font-['Inter'] text-sm font-semibold text-white transition-colors hover:bg-[#1F4D6E] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {salvandoChave === grupo.chave ? "Salvando…" : "❄ Marcar como adiantado"}
            </button>
          </article>
        ))}
      </div>
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
function CardPedido({ pedido, salvandoChave, aoDesfazer, aoEntregar }) {
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
            <span>
              {item.saborNome}
              {item.statusProducao === "CONGELADO" && (
                <>
                  <span className="ml-1.5 rounded-full bg-[#DCEBF5] px-1.5 py-0.5 text-xs font-semibold text-[#1F4D6E]">
                    ❄ adiantado
                  </span>
                  <button
                    type="button"
                    onClick={() => aoDesfazer(item)}
                    disabled={salvandoChave !== null}
                    className="ml-1.5 font-['Inter'] text-xs font-semibold text-[#9C8B7F] underline decoration-dotted underline-offset-2 transition-colors hover:text-[#8A2C2C] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {salvandoChave === `desfazer-${item.id}` ? "desfazendo…" : "desfazer"}
                  </button>
                </>
              )}
            </span>
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

      {pedido.status !== "ENTREGUE" && (
        <button
          type="button"
          onClick={() => aoEntregar(pedido)}
          disabled={salvandoChave !== null}
          className="mt-3 w-full rounded-full bg-[#3F7D5C] px-4 py-2 font-['Inter'] text-sm font-semibold text-white transition-colors hover:bg-[#285A3E] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {salvandoChave === `entregar-${pedido.id}` ? "Entregando…" : "✓ Entregar pedido"}
        </button>
      )}
    </article>
  );
}

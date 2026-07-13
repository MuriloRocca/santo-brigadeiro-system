import { useEffect, useState } from "react";

/**
 * ============================================================
 * CONFIGURAÇÃO VISUAL E DE DOMÍNIO
 * ============================================================
 * Mesma filosofia do PainelEncomendasSemanal: cores e rótulos em um
 * único lugar, espelhando os enums do backend (TipoLancamento e
 * CategoriaLancamento da Fase 5/6).
 */

const TIPO_CONFIG = {
  ENTRADA: { label: "Entrada", corTexto: "text-[#285A3E]", corFundo: "bg-[#DDEFE3]", sinal: "+" },
  SAIDA: { label: "Saída", corTexto: "text-[#8A2C2C]", corFundo: "bg-[#FFE1E1]", sinal: "−" },
};

const CATEGORIA_CONFIG = {
  VENDA_PEDIDO: { label: "Venda de pedido", corTexto: "text-[#285A3E]", corFundo: "bg-[#DDEFE3]" },
  OUTRA_RECEITA: { label: "Outra receita", corTexto: "text-[#1F4D6E]", corFundo: "bg-[#DCEBF5]" },
  COMPRA_INSUMO: { label: "Compra de insumo", corTexto: "text-[#8A2C2C]", corFundo: "bg-[#FFE1E1]" },
  DESPESA_OPERACIONAL: { label: "Despesa operacional", corTexto: "text-[#946200]", corFundo: "bg-[#FFF3D6]" },
  OUTRA_DESPESA: { label: "Outra despesa", corTexto: "text-[#6B5A50]", corFundo: "bg-[#F0E6DA]" },
};

// Espelha a regra do enum CategoriaLancamento no backend: cada categoria
// "pertence" a um tipo. O formulário oferece apenas as categorias coerentes
// com o tipo escolhido — assim o clique nunca produz a combinação que o
// backend rejeitaria com RegraDeNegocioException.
const CATEGORIAS_POR_TIPO = {
  ENTRADA: ["VENDA_PEDIDO", "OUTRA_RECEITA"],
  SAIDA: ["COMPRA_INSUMO", "DESPESA_OPERACIONAL", "OUTRA_DESPESA"],
};

/**
 * ============================================================
 * FORMATADORES E DATAS
 * ============================================================
 */

const formatadorReais = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatarReais(valor) {
  return formatadorReais.format(valor ?? 0);
}

// "2026-07-05" -> "05/07/2026" por manipulação de string, nunca via
// new Date(iso): o construtor interpreta a data como UTC e faria o
// lançamento "vazar" um dia dependendo do fuso do navegador (mesmo
// cuidado já tomado no PainelEncomendasSemanal).
function formatarData(dataISO) {
  if (!dataISO) return "";
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

function paraISOLocal(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function primeiroDiaDoMesAtual() {
  const hoje = new Date();
  return paraISOLocal(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
}

function ultimoDiaDoMesAtual() {
  const hoje = new Date();
  return paraISOLocal(new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0));
}

function ultimosTrintaDias() {
  const hoje = new Date();
  const inicio = new Date(hoje);
  inicio.setDate(hoje.getDate() - 29);
  return { inicio: paraISOLocal(inicio), fim: paraISOLocal(hoje) };
}

function hojeISO() {
  return paraISOLocal(new Date());
}

// Usado só no modo exemplo (backend fora): recalcula o resumo a partir da
// lista de lançamentos, para que o card de saldo reaja ao novo lançamento
// sem inventar um número — os valores continuam batendo com o extrato.
function calcularResumoLocal(lancamentos) {
  let totalEntradas = 0;
  let totalSaidas = 0;
  for (const lancamento of lancamentos) {
    if (lancamento.tipo === "ENTRADA") totalEntradas += lancamento.valor;
    else totalSaidas += lancamento.valor;
  }
  return { totalEntradas, totalSaidas, saldo: totalEntradas - totalSaidas };
}

/**
 * ============================================================
 * ADAPTADOR: formato bruto da API -> formato que o componente usa
 * ============================================================
 * A API devolve o LancamentoFinanceiroResponseDTO achatado:
 * { id, tipo, categoria, valor, descricao, dataLancamento, pedidoId, criadoEm }
 */
function mapearLancamento(bruto) {
  return {
    id: bruto.id,
    tipo: bruto.tipo,
    categoria: bruto.categoria,
    valor: bruto.valor,
    descricao: bruto.descricao,
    dataLancamento: bruto.dataLancamento,
    pedidoId: bruto.pedidoId ?? null,
    ehEntrada: bruto.tipo === "ENTRADA",
  };
}

/**
 * ============================================================
 * DADOS MOCKADOS (fiéis ao DTO real da API)
 * ============================================================
 * Usados apenas quando o backend está indisponível em dev — e, ao
 * contrário do painel de encomendas, aqui o fallback é ANUNCIADO num
 * banner: valores financeiros de exemplo não podem passar por reais.
 */
const RESUMO_MOCK = { totalEntradas: 250.0, totalSaidas: 89.9, saldo: 160.1 };

const LANCAMENTOS_MOCK = [
  { id: 3, tipo: "ENTRADA", categoria: "VENDA_PEDIDO", valor: 250.0, descricao: "Receita do pedido #1 - Maria Souza", dataLancamento: "2026-07-05", pedidoId: 1, criadoEm: "2026-07-05T15:40:00" },
  { id: 2, tipo: "SAIDA", categoria: "COMPRA_INSUMO", valor: 89.9, descricao: "Compra de leite condensado (caixa com 27 un)", dataLancamento: "2026-07-04", pedidoId: null, criadoEm: "2026-07-04T10:12:00" },
];

/**
 * ============================================================
 * COMPONENTE
 * ============================================================
 */
export default function PainelFinanceiro() {
  const [inicio, setInicio] = useState(primeiroDiaDoMesAtual());
  const [fim, setFim] = useState(ultimoDiaDoMesAtual());
  const [resumo, setResumo] = useState(null);
  const [lancamentos, setLancamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [usandoMock, setUsandoMock] = useState(false);
  // Incrementado após um novo lançamento para recarregar a verdade do
  // servidor (extrato + saldo) sem F5.
  const [versaoDados, setVersaoDados] = useState(0);

  const periodoInvalido = Boolean(inicio && fim && inicio > fim);

  useEffect(() => {
    if (!inicio || !fim || inicio > fim) return;

    // Evita aplicar uma resposta antiga se o usuário trocar o filtro
    // antes de a requisição anterior terminar.
    let ativo = true;

    async function buscarDadosFinanceiros() {
      setCarregando(true);
      try {
        const [respostaResumo, respostaLancamentos] = await Promise.all([
          fetch(`/api/financeiro/fluxo-caixa?inicio=${inicio}&fim=${fim}`),
          fetch(`/api/financeiro/lancamentos?inicio=${inicio}&fim=${fim}`),
        ]);

        if (!respostaResumo.ok || !respostaLancamentos.ok) {
          throw new Error(
            `Erro ao buscar dados financeiros: ${respostaResumo.status}/${respostaLancamentos.status}`
          );
        }

        const [resumoBruto, lancamentosBrutos] = await Promise.all([
          respostaResumo.json(),
          respostaLancamentos.json(),
        ]);

        if (!ativo) return;
        setResumo(resumoBruto);
        setLancamentos(lancamentosBrutos.map(mapearLancamento));
        setUsandoMock(false);
      } catch (erroCapturado) {
        if (!ativo) return;
        // Em desenvolvimento, sem o backend rodando, caímos no mock —
        // com banner visível (dados de dinheiro não podem fingir ser reais).
        console.warn("Backend indisponível, usando dados de exemplo:", erroCapturado.message);
        setResumo(RESUMO_MOCK);
        setLancamentos(LANCAMENTOS_MOCK.map(mapearLancamento));
        setUsandoMock(true);
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    buscarDadosFinanceiros();
    return () => {
      ativo = false;
    };
  }, [inicio, fim, versaoDados]);

  // Recebe o lançamento recém-criado (formato bruto do POST em modo real,
  // ou já mapeado no modo exemplo) e faz o extrato/saldo reagirem na hora.
  function aoLancamentoCriado(lancamentoBruto) {
    if (usandoMock) {
      // Modo exemplo: simula localmente para o fluxo de demonstração seguir
      // clicável sem backend. Prepende e recalcula o resumo a partir da lista.
      const novo = mapearLancamento(lancamentoBruto);
      setLancamentos((atuais) => {
        const atualizados = [novo, ...atuais];
        setResumo(calcularResumoLocal(atualizados));
        return atualizados;
      });
    } else {
      // Modo real: recarrega a verdade do servidor (respeita o período).
      setVersaoDados((versao) => versao + 1);
    }
  }

  const saldoNegativo = (resumo?.saldo ?? 0) < 0;

  if (carregando && resumo === null) {
    return (
      <div className="flex h-64 items-center justify-center font-['Inter'] text-lg text-[#3E2723]">
        Carregando fluxo de caixa...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8ED] px-4 py-8 sm:px-8">
      <header className="mb-6">
        <h1 className="font-['Baloo_2'] text-3xl font-bold text-[#3E2723] sm:text-4xl">
          Painel Financeiro
        </h1>
        <p className="mt-1 font-['Inter'] text-base text-[#6B5A50]">
          Santo Brigadeiro 013 — fluxo de caixa do período
        </p>
      </header>

      {usandoMock && (
        <div className="mb-6 rounded-xl bg-[#FFF3D6] px-4 py-3 font-['Inter'] text-sm text-[#946200]">
          ⚠ Backend indisponível — exibindo <strong>dados de exemplo</strong>. Os
          valores abaixo não são reais.
        </div>
      )}

      {/* ------- Filtros de período ------- */}
      <section className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl bg-white/60 p-4">
        <CampoData rotulo="Início" valor={inicio} aoMudar={setInicio} />
        <CampoData rotulo="Fim" valor={fim} aoMudar={setFim} />

        <div className="flex gap-2 pb-0.5">
          <BotaoAtalho
            rotulo="Este mês"
            aoClicar={() => {
              setInicio(primeiroDiaDoMesAtual());
              setFim(ultimoDiaDoMesAtual());
            }}
          />
          <BotaoAtalho
            rotulo="Últimos 30 dias"
            aoClicar={() => {
              const { inicio: novoInicio, fim: novoFim } = ultimosTrintaDias();
              setInicio(novoInicio);
              setFim(novoFim);
            }}
          />
        </div>

        {carregando && (
          <span className="pb-2 font-['Inter'] text-xs text-[#9C8B7F]">Atualizando…</span>
        )}
      </section>

      {periodoInvalido && (
        <div className="mb-6 rounded-xl bg-[#FFF3D6] px-4 py-3 font-['Inter'] text-sm text-[#946200]">
          A data de início não pode ser posterior à data de fim.
        </div>
      )}

      {/* ------- Cards de resumo ------- */}
      <section className="mb-8 grid gap-4 sm:grid-cols-3">
        <CardResumo
          titulo="Total de Entradas"
          valor={formatarReais(resumo?.totalEntradas)}
          corBorda="border-l-[#3F7D5C]"
          corValor="text-[#285A3E]"
          corIcone="bg-[#DDEFE3] text-[#285A3E]"
          icone="↑"
        />
        <CardResumo
          titulo="Total de Saídas"
          valor={formatarReais(resumo?.totalSaidas)}
          corBorda="border-l-[#D9534F]"
          corValor="text-[#8A2C2C]"
          corIcone="bg-[#FFE1E1] text-[#8A2C2C]"
          icone="↓"
        />
        <CardResumo
          titulo="Saldo do Período"
          valor={formatarReais(resumo?.saldo)}
          corBorda={saldoNegativo ? "border-l-[#D9534F]" : "border-l-[#3F7D5C]"}
          corValor={saldoNegativo ? "text-[#8A2C2C]" : "text-[#285A3E]"}
          corIcone={saldoNegativo ? "bg-[#FFE1E1] text-[#8A2C2C]" : "bg-[#DDEFE3] text-[#285A3E]"}
          icone="="
          selo={
            saldoNegativo
              ? { texto: "No vermelho", classes: "bg-[#FFE1E1] text-[#8A2C2C]" }
              : { texto: "No verde", classes: "bg-[#DDEFE3] text-[#285A3E]" }
          }
        />
      </section>

      {/* ------- Novo lançamento manual (Fase 10) ------- */}
      <FormularioNovoLancamento
        usandoMock={usandoMock}
        aoLancamentoCriado={aoLancamentoCriado}
      />

      {/* ------- Extrato ------- */}
      <section className="rounded-2xl bg-white/60 p-3 sm:p-4">
        <h2 className="mb-3 px-1 font-['Baloo_2'] text-xl font-semibold text-[#3E2723]">
          Extrato de lançamentos
          <span className="ml-2 font-['Inter'] text-sm font-normal text-[#9C8B7F]">
            ({lancamentos.length})
          </span>
        </h2>

        {lancamentos.length === 0 ? (
          <p className="px-1 pb-2 font-['Inter'] text-sm text-[#B5A99C]">
            Nenhum lançamento no período selecionado.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse font-['Inter'] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-[#9C8B7F]">
                  <th className="px-3 py-2 font-semibold">Data</th>
                  <th className="px-3 py-2 font-semibold">Descrição</th>
                  <th className="px-3 py-2 font-semibold">Categoria</th>
                  <th className="px-3 py-2 font-semibold">Tipo</th>
                  <th className="px-3 py-2 text-right font-semibold">Valor</th>
                </tr>
              </thead>
              <tbody>
                {lancamentos.map((lancamento) => (
                  <LinhaLancamento key={lancamento.id} lancamento={lancamento} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

/**
 * ============================================================
 * SUBCOMPONENTES
 * ============================================================
 */

/**
 * ============================================================
 * FORMULÁRIO DE NOVO LANÇAMENTO (Fase 10)
 * ============================================================
 * Lançamento manual no caixa, pensado para o clique: o tipo é um par de
 * botões (+ Entrada / − Saída), a categoria é um select que só mostra as
 * opções coerentes com o tipo, e a data já vem preenchida com hoje. O POST
 * dispara aoLancamentoCriado, que atualiza extrato e saldo na hora (sem F5).
 */
function FormularioNovoLancamento({ usandoMock, aoLancamentoCriado }) {
  const [tipo, setTipo] = useState("ENTRADA");
  const [categoria, setCategoria] = useState(CATEGORIAS_POR_TIPO.ENTRADA[0]);
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState(hojeISO);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState(null); // { tipo: "sucesso" | "erro", texto }

  const categoriasDisponiveis = CATEGORIAS_POR_TIPO[tipo];

  // Trocar o tipo reseta a categoria para a primeira coerente com o novo
  // tipo — o select nunca fica com uma combinação que o backend recusaria.
  function selecionarTipo(novoTipo) {
    if (novoTipo === tipo) return;
    setTipo(novoTipo);
    setCategoria(CATEGORIAS_POR_TIPO[novoTipo][0]);
    setMensagem(null);
  }

  // Aceita número > 0; normaliza a vírgula decimal (pt-BR) para ponto.
  const valorNumerico = Number.parseFloat(String(valor).replace(",", "."));
  const valorValido = Number.isFinite(valorNumerico) && valorNumerico > 0;
  const descricaoLimpa = descricao.trim();
  const formularioValido = valorValido && descricaoLimpa.length > 0 && Boolean(data);

  async function enviar(evento) {
    evento.preventDefault();
    // Trava clique duplo (já salvando) e envio inválido na origem.
    if (salvando || !formularioValido) return;
    setSalvando(true);
    setMensagem(null);

    const payload = {
      tipo,
      categoria,
      valor: valorNumerico,
      descricao: descricaoLimpa,
      dataLancamento: data,
    };

    try {
      if (usandoMock) {
        // Sem backend: devolve um "lançamento criado" fictício (id único
        // negativo para não colidir com ids reais) e deixa o painel simular.
        aoLancamentoCriado({ id: -Date.now(), pedidoId: null, criadoEm: null, ...payload });
      } else {
        const resposta = await fetch("/api/financeiro/lancamentos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!resposta.ok) {
          // O backend devolve mensagens de validação / regra de negócio;
          // tenta extrair a mais útil, senão mostra o status.
          let detalhe = `erro ${resposta.status}`;
          try {
            const corpo = await resposta.json();
            detalhe = corpo?.message || corpo?.erro || detalhe;
          } catch {
            /* corpo não-JSON: mantém o status */
          }
          throw new Error(detalhe);
        }
        const criado = await resposta.json();
        aoLancamentoCriado(criado);
      }

      // Sucesso: limpa valor e descrição para o próximo lançamento rápido,
      // preservando tipo/categoria/data (repetições costumam ser do mesmo tipo).
      setValor("");
      setDescricao("");
      setMensagem({
        tipo: "sucesso",
        texto: "Lançamento registrado! O extrato e o saldo já foram atualizados. ✅",
      });
    } catch (erroCapturado) {
      console.warn("Falha ao registrar lançamento:", erroCapturado.message);
      setMensagem({ tipo: "erro", texto: `Não foi possível salvar: ${erroCapturado.message}` });
    } finally {
      setSalvando(false);
    }
  }

  const classesInput =
    "rounded-xl border border-[#E8DCCB] bg-white px-3 py-2 font-['Inter'] text-sm text-[#3E2723] focus:outline-none focus:ring-2 focus:ring-[#3F7D5C]/40";
  const classesRotulo =
    "font-['Inter'] text-xs font-semibold uppercase tracking-wide text-[#9C8B7F]";
  const ehEntrada = tipo === "ENTRADA";
  const classesBotaoSalvar = ehEntrada
    ? "bg-[#3F7D5C] hover:bg-[#285A3E]"
    : "bg-[#D9534F] hover:bg-[#B33A36]";

  return (
    <section className="mb-8 rounded-2xl bg-white/60 p-4 sm:p-5">
      <h2 className="mb-4 font-['Baloo_2'] text-xl font-semibold text-[#3E2723]">
        Novo lançamento
      </h2>

      <form onSubmit={enviar}>
        {/* Seletor de tipo — só clique */}
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => selecionarTipo("ENTRADA")}
            aria-pressed={ehEntrada}
            className={`rounded-full border px-5 py-2 font-['Inter'] text-sm font-semibold transition-colors ${
              ehEntrada
                ? "border-transparent bg-[#3F7D5C] text-white shadow-sm"
                : "border-[#E8DCCB] bg-white text-[#6B5A50] hover:bg-[#F0E6DA]"
            }`}
          >
            + Entrada
          </button>
          <button
            type="button"
            onClick={() => selecionarTipo("SAIDA")}
            aria-pressed={!ehEntrada}
            className={`rounded-full border px-5 py-2 font-['Inter'] text-sm font-semibold transition-colors ${
              !ehEntrada
                ? "border-transparent bg-[#D9534F] text-white shadow-sm"
                : "border-[#E8DCCB] bg-white text-[#6B5A50] hover:bg-[#F0E6DA]"
            }`}
          >
            − Saída
          </button>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          {/* Valor */}
          <label className="flex flex-col gap-1">
            <span className={classesRotulo}>Valor</span>
            <div className="relative">
              <span
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-['Inter'] text-sm text-[#9C8B7F]"
                aria-hidden="true"
              >
                R$
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={valor}
                onChange={(evento) => setValor(evento.target.value)}
                placeholder="0,00"
                className={`${classesInput} w-32 pl-9 tabular-nums`}
              />
            </div>
          </label>

          {/* Categoria */}
          <label className="flex flex-col gap-1">
            <span className={classesRotulo}>Categoria</span>
            <select
              value={categoria}
              onChange={(evento) => setCategoria(evento.target.value)}
              className={`${classesInput} cursor-pointer`}
            >
              {categoriasDisponiveis.map((chave) => (
                <option key={chave} value={chave}>
                  {CATEGORIA_CONFIG[chave].label}
                </option>
              ))}
            </select>
          </label>

          {/* Descrição */}
          <label className="flex min-w-[12rem] flex-1 flex-col gap-1">
            <span className={classesRotulo}>Descrição</span>
            <input
              type="text"
              maxLength={200}
              value={descricao}
              onChange={(evento) => setDescricao(evento.target.value)}
              placeholder={ehEntrada ? "Ex: Venda no balcão" : "Ex: Conta de luz de julho"}
              className={`${classesInput} w-full`}
            />
          </label>

          {/* Data (já vem com hoje) */}
          <label className="flex flex-col gap-1">
            <span className={classesRotulo}>Data</span>
            <input
              type="date"
              value={data}
              onChange={(evento) => setData(evento.target.value)}
              className={classesInput}
            />
          </label>

          {/* Salvar */}
          <button
            type="submit"
            disabled={salvando || !formularioValido}
            className={`rounded-full px-6 py-2.5 font-['Inter'] text-sm font-semibold text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${classesBotaoSalvar}`}
          >
            {salvando ? "Salvando…" : "Adicionar lançamento"}
          </button>
        </div>
      </form>

      {mensagem && (
        <div
          className={`mt-4 rounded-xl px-4 py-3 font-['Inter'] text-sm ${
            mensagem.tipo === "sucesso"
              ? "bg-[#DDEFE3] text-[#285A3E]"
              : "bg-[#FFE1E1] text-[#8A2C2C]"
          }`}
        >
          {mensagem.texto}
        </div>
      )}
    </section>
  );
}

function CampoData({ rotulo, valor, aoMudar }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-['Inter'] text-xs font-semibold uppercase tracking-wide text-[#9C8B7F]">
        {rotulo}
      </span>
      <input
        type="date"
        value={valor}
        onChange={(evento) => aoMudar(evento.target.value)}
        className="rounded-xl border border-[#E8DCCB] bg-white px-3 py-2 font-['Inter'] text-sm text-[#3E2723] focus:outline-none focus:ring-2 focus:ring-[#3F7D5C]/40"
      />
    </label>
  );
}

function BotaoAtalho({ rotulo, aoClicar }) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      className="rounded-full border border-[#E8DCCB] bg-white px-3 py-1.5 font-['Inter'] text-xs font-semibold text-[#6B5A50] transition-colors hover:bg-[#F0E6DA]"
    >
      {rotulo}
    </button>
  );
}

function CardResumo({ titulo, valor, corBorda, corValor, corIcone, icone, selo }) {
  return (
    <article className={`rounded-2xl border-l-4 bg-white p-5 shadow-sm ${corBorda}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-['Inter'] text-sm font-semibold text-[#6B5A50]">{titulo}</span>
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full font-['Baloo_2'] text-lg font-bold ${corIcone}`}
          aria-hidden="true"
        >
          {icone}
        </span>
      </div>
      <p className={`font-['Baloo_2'] text-3xl font-bold tabular-nums ${corValor}`}>{valor}</p>
      {selo && (
        <span
          className={`mt-2 inline-block rounded-full px-2 py-0.5 font-['Inter'] text-xs font-semibold ${selo.classes}`}
        >
          {selo.texto}
        </span>
      )}
    </article>
  );
}

function LinhaLancamento({ lancamento }) {
  const tipo = TIPO_CONFIG[lancamento.tipo] ?? TIPO_CONFIG.SAIDA;
  const categoria = CATEGORIA_CONFIG[lancamento.categoria] ?? {
    label: lancamento.categoria,
    corTexto: "text-[#6B5A50]",
    corFundo: "bg-[#F0E6DA]",
  };

  return (
    <tr className="border-t border-[#F0E6DA] bg-white/80 transition-colors hover:bg-white">
      <td className="whitespace-nowrap px-3 py-3 text-[#6B5A50]">
        {formatarData(lancamento.dataLancamento)}
      </td>
      <td className="px-3 py-3 text-[#3E2723]">
        {lancamento.descricao}
        {lancamento.pedidoId && (
          <span className="ml-2 rounded-full bg-[#DCEBF5] px-2 py-0.5 text-xs font-semibold text-[#1F4D6E]">
            Pedido #{lancamento.pedidoId}
          </span>
        )}
      </td>
      <td className="whitespace-nowrap px-3 py-3">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${categoria.corFundo} ${categoria.corTexto}`}
        >
          {categoria.label}
        </span>
      </td>
      <td className="whitespace-nowrap px-3 py-3">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tipo.corFundo} ${tipo.corTexto}`}
        >
          {tipo.label}
        </span>
      </td>
      <td
        className={`whitespace-nowrap px-3 py-3 text-right font-semibold tabular-nums ${
          lancamento.ehEntrada ? "text-[#285A3E]" : "text-[#8A2C2C]"
        }`}
      >
        {tipo.sinal} {formatarReais(lancamento.valor)}
      </td>
    </tr>
  );
}

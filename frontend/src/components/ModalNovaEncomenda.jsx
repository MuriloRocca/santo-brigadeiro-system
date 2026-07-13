import { useEffect, useState } from "react";

/**
 * ============================================================
 * MODAL DE NOVA ENCOMENDA (Fase 11)
 * ============================================================
 * Central de cadastro SEM digitação: cliente por chips (mais frequentes
 * primeiro), lotes por botões (25/50/100 — os únicos válidos no banco),
 * data por atalhos + mini calendário, horário por chips e forminha por
 * cor. O único teclado aceito aqui é o ✕ de fechar. Tudo com um clique.
 */

// Mesma correspondência por palavra-chave usada no painel semanal: o
// backend nos dá o nome do insumo ("Forminha Rosa") e a cor visual é
// deduzida dele. Sem correspondência, cai no neutro.
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
  return encontrada ? encontrada.hex : "#BFB6AC";
}

// Horários mais comuns de entrega — 1 clique. O ajuste fino é feito nos
// botões de ±30min, também por clique.
const HORARIOS_RAPIDOS = ["09:00", "11:00", "14:00", "16:00", "18:00"];

const formatadorReais = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/**
 * ============================================================
 * DATAS — por partes locais (mesma regra anti-fuso dos painéis)
 * ============================================================
 */

function paraISOLocal(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function hojeISO() {
  return paraISOLocal(new Date());
}

function adicionarDias(dataISO, dias) {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  return paraISOLocal(new Date(ano, mes - 1, dia + dias));
}

function formatarDataCurta(dataISO) {
  const [, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}`;
}

const NOMES_DIAS_CURTOS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const NOMES_DIAS_LONGOS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

function diaDaSemana(dataISO) {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  return new Date(ano, mes - 1, dia).getDay();
}

// Próxima ocorrência do dia da semana pedido, SEMPRE no futuro: se hoje
// já é sexta, "próxima sexta" é a da semana que vem (7 dias), não hoje.
function proximoDiaDaSemana(diaAlvo) {
  const hoje = hojeISO();
  const deslocamento = (diaAlvo - diaDaSemana(hoje) + 7) % 7 || 7;
  return adicionarDias(hoje, deslocamento);
}

// Duas semanas de calendário a partir da segunda-feira da semana atual:
// cobre o dia a dia; datas mais distantes têm os atalhos e a navegação
// pode crescer depois, se a rotina pedir.
function gerarSemanasDoCalendario() {
  const hoje = hojeISO();
  const segundaAtual = adicionarDias(hoje, -((diaDaSemana(hoje) + 6) % 7));
  return [0, 1].map((semana) =>
    Array.from({ length: 7 }, (_, indice) => adicionarDias(segundaAtual, semana * 7 + indice))
  );
}

/**
 * ============================================================
 * COMPONENTE
 * ============================================================
 */
/**
 * O componente é MONTADO apenas quando o modal abre (renderização
 * condicional no pai) — assim cada abertura nasce com o estado zerado,
 * sem reset manual dentro de effect.
 */
export default function ModalNovaEncomenda({ aoFechar, aoCriar }) {
  // Dados de referência (carregados ao abrir)
  const [referencias, setReferencias] = useState(null); // { frequentes, todos, sabores, lotes, forminhas }
  const [erroCarga, setErroCarga] = useState(false);

  // Escolhas do pedido — todas preenchidas por clique
  const [clienteId, setClienteId] = useState(null);
  const [itens, setItens] = useState([]); // [{ chave, saborId, quantidade }]
  const [dataEntrega, setDataEntrega] = useState(null);
  const [horario, setHorario] = useState(null); // "HH:MM"
  const [forminhaId, setForminhaId] = useState(null);

  const [mostrarTodosClientes, setMostrarTodosClientes] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagemErro, setMensagemErro] = useState(null);

  useEffect(() => {
    let ativo = true;

    async function carregarReferencias() {
      try {
        const respostas = await Promise.all([
          fetch("/api/clientes/frequentes?limite=8"),
          fetch("/api/clientes"),
          fetch("/api/sabores"),
          fetch("/api/tipos-lote"),
          fetch("/api/insumos"),
        ]);
        if (respostas.some((resposta) => !resposta.ok)) {
          throw new Error("falha ao carregar dados de referência");
        }
        const [frequentes, todos, sabores, lotes, insumos] = await Promise.all(
          respostas.map((resposta) => resposta.json())
        );
        if (!ativo) return;

        const forminhas = insumos.filter((insumo) => insumo.tipoInsumo === "FORMINHA");
        setReferencias({
          frequentes,
          todos,
          // Sem preço não há venda (regra do backend): já filtra na origem.
          sabores: sabores.filter((sabor) => sabor.ativo && sabor.precoUnitario > 0),
          lotes: [...lotes].sort((a, b) => a.quantidade - b.quantidade),
          forminhas,
        });
        // Única forminha? Já vem escolhida — um clique a menos.
        if (forminhas.length === 1) setForminhaId(forminhas[0].id);
      } catch (erroCapturado) {
        console.warn("Não foi possível carregar os dados da nova encomenda:", erroCapturado.message);
        if (ativo) setErroCarga(true);
      }
    }

    carregarReferencias();
    return () => {
      ativo = false;
    };
  }, []);

  const sabores = referencias?.sabores ?? [];
  const precoPorSabor = new Map(sabores.map((sabor) => [sabor.id, sabor.precoUnitario]));
  const nomePorSabor = new Map(sabores.map((sabor) => [sabor.id, sabor.nome]));

  const totalDoces = itens.reduce((soma, item) => soma + item.quantidade, 0);
  const totalReais = itens.reduce(
    (soma, item) => soma + item.quantidade * (precoPorSabor.get(item.saborId) ?? 0),
    0
  );

  const pronto = Boolean(
    clienteId && itens.length > 0 && dataEntrega && horario && forminhaId
  );

  function adicionarLote(saborId, quantidade) {
    setItens((atuais) => [
      ...atuais,
      // Chave local única para o ✕ remover exatamente o lote clicado
      // (o mesmo sabor+quantidade pode aparecer 2x, ex: 2 lotes de 100).
      { chave: `${saborId}-${quantidade}-${atuais.length}-${Date.now()}`, saborId, quantidade },
    ]);
  }

  function removerLote(chave) {
    setItens((atuais) => atuais.filter((item) => item.chave !== chave));
  }

  function ajustarHorario(minutos) {
    const base = horario ?? "14:00";
    const [horas, mins] = base.split(":").map(Number);
    const totalMinutos = horas * 60 + mins + minutos;
    // Janela de trabalho razoável: 06:00–22:00, em passos de 30min.
    const limitado = Math.min(Math.max(totalMinutos, 6 * 60), 22 * 60);
    const novasHoras = String(Math.floor(limitado / 60)).padStart(2, "0");
    const novosMins = String(limitado % 60).padStart(2, "0");
    setHorario(`${novasHoras}:${novosMins}`);
  }

  async function criarEncomenda() {
    if (salvando || !pronto) return; // trava clique duplo e envio incompleto
    setSalvando(true);
    setMensagemErro(null);

    try {
      const resposta = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId,
          dataEntrega,
          horarioEntrega: horario,
          forminhaInsumoId: forminhaId,
          itens: itens.map(({ saborId, quantidade }) => ({ saborId, quantidade })),
        }),
      });
      if (!resposta.ok) {
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
      aoCriar(criado);
    } catch (erroCapturado) {
      console.warn("Falha ao criar encomenda:", erroCapturado.message);
      setMensagemErro(`Não foi possível criar a encomenda: ${erroCapturado.message}`);
    } finally {
      setSalvando(false);
    }
  }

  // Clientes: frequentes em destaque; os demais atrás de "mostrar todos"
  // (sem repetir quem já apareceu como frequente).
  const frequentes = referencias?.frequentes ?? [];
  const idsFrequentes = new Set(frequentes.map((cliente) => cliente.id));
  const demaisClientes = (referencias?.todos ?? []).filter(
    (cliente) => !idsFrequentes.has(cliente.id)
  );

  const semanas = gerarSemanasDoCalendario();
  const hoje = hojeISO();

  const atalhosData = [
    { rotulo: "Amanhã", dataISO: adicionarDias(hoje, 1) },
    { rotulo: "Próx. sexta", dataISO: proximoDiaDaSemana(5) },
    { rotulo: "Próx. sábado", dataISO: proximoDiaDaSemana(6) },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#3E2723]/50 p-4 backdrop-blur-sm sm:py-8"
      role="dialog"
      aria-modal="true"
      aria-label="Nova encomenda"
    >
      <div className="w-full max-w-3xl rounded-3xl bg-[#FFF8ED] p-5 shadow-2xl sm:p-7">
        {/* ------- Cabeçalho ------- */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="font-['Baloo_2'] text-2xl font-bold text-[#3E2723] sm:text-3xl">
              Nova encomenda
            </h2>
            <p className="font-['Inter'] text-sm text-[#6B5A50]">
              Tudo por clique — sem digitar nada.
            </p>
          </div>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="rounded-full px-3 py-1 font-['Inter'] text-lg text-[#9C8B7F] transition-colors hover:bg-[#F0E6DA] hover:text-[#3E2723]"
          >
            ✕
          </button>
        </div>

        {erroCarga && (
          <div className="mb-4 rounded-xl bg-[#FFF3D6] px-4 py-3 font-['Inter'] text-sm text-[#946200]">
            ⚠ Backend indisponível — não dá para criar encomendas agora. Tente
            novamente quando o sistema estiver no ar.
          </div>
        )}

        {!referencias && !erroCarga && (
          <p className="py-8 text-center font-['Inter'] text-sm text-[#9C8B7F]">
            Carregando opções…
          </p>
        )}

        {referencias && (
          <div className="flex flex-col gap-5">
            {/* ------- 1. Cliente ------- */}
            <SecaoPasso numero="1" titulo="Quem é o cliente?">
              <div className="flex flex-wrap gap-2">
                {frequentes.map((cliente, indice) => (
                  <ChipEscolha
                    key={cliente.id}
                    ativo={clienteId === cliente.id}
                    aoClicar={() => setClienteId(cliente.id)}
                  >
                    {indice < 3 && <span aria-hidden="true">⭐ </span>}
                    {cliente.nome}
                  </ChipEscolha>
                ))}
                {!mostrarTodosClientes && demaisClientes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setMostrarTodosClientes(true)}
                    className="rounded-full px-4 py-2 font-['Inter'] text-sm font-semibold text-[#9C8B7F] underline decoration-dotted underline-offset-4 transition-colors hover:text-[#3E2723]"
                  >
                    + mostrar todos ({demaisClientes.length})
                  </button>
                )}
                {mostrarTodosClientes &&
                  demaisClientes.map((cliente) => (
                    <ChipEscolha
                      key={cliente.id}
                      ativo={clienteId === cliente.id}
                      aoClicar={() => setClienteId(cliente.id)}
                    >
                      {cliente.nome}
                    </ChipEscolha>
                  ))}
              </div>
            </SecaoPasso>

            {/* ------- 2. Sabores e lotes ------- */}
            <SecaoPasso numero="2" titulo="O que ele quer?" dica="cada clique adiciona um lote">
              <div className="flex flex-col gap-2">
                {sabores.map((sabor) => (
                  <div
                    key={sabor.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-3 shadow-sm"
                  >
                    <span className="font-['Inter'] text-sm font-semibold text-[#3E2723]">
                      {sabor.nome}
                      {sabor.podeCongelar && (
                        <span
                          className="ml-1.5 rounded-full bg-[#DCEBF5] px-1.5 py-0.5 text-xs font-semibold text-[#1F4D6E]"
                          title="Pode congelar"
                        >
                          ❄
                        </span>
                      )}
                      <span className="ml-2 font-normal text-[#9C8B7F]">
                        {formatadorReais.format(sabor.precoUnitario)}/un.
                      </span>
                    </span>
                    <div className="flex gap-1.5">
                      {referencias.lotes.map((lote) => (
                        <button
                          key={lote.id}
                          type="button"
                          onClick={() => adicionarLote(sabor.id, lote.quantidade)}
                          className="rounded-full border border-[#E8DCCB] bg-white px-4 py-1.5 font-['Baloo_2'] text-sm font-bold text-[#3E2723] transition-colors hover:border-[#3E2723] hover:bg-[#3E2723] hover:text-[#FFF8ED]"
                        >
                          {lote.quantidade} un
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {itens.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {itens.map((item) => (
                    <span
                      key={item.chave}
                      className="flex items-center gap-1.5 rounded-full bg-[#3E2723] px-3 py-1.5 font-['Inter'] text-xs font-semibold text-[#FFF8ED]"
                    >
                      {item.quantidade} {nomePorSabor.get(item.saborId)}
                      <button
                        type="button"
                        onClick={() => removerLote(item.chave)}
                        aria-label={`Remover lote de ${item.quantidade} ${nomePorSabor.get(item.saborId)}`}
                        className="rounded-full px-1 text-[#FFF8ED]/70 transition-colors hover:text-white"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </SecaoPasso>

            {/* ------- 3. Data de entrega ------- */}
            <SecaoPasso numero="3" titulo="Para quando?">
              <div className="mb-3 flex flex-wrap gap-2">
                {atalhosData.map((atalho) => (
                  <ChipEscolha
                    key={atalho.rotulo}
                    ativo={dataEntrega === atalho.dataISO}
                    aoClicar={() => setDataEntrega(atalho.dataISO)}
                  >
                    {atalho.rotulo}{" "}
                    <span className="font-normal opacity-70">
                      ({formatarDataCurta(atalho.dataISO)})
                    </span>
                  </ChipEscolha>
                ))}
              </div>

              <div className="rounded-xl bg-white p-3 shadow-sm">
                <div className="mb-1 grid grid-cols-7 gap-1 text-center">
                  {[1, 2, 3, 4, 5, 6, 0].map((dia) => (
                    <span
                      key={dia}
                      className="font-['Inter'] text-xs font-semibold uppercase text-[#9C8B7F]"
                    >
                      {NOMES_DIAS_CURTOS[dia]}
                    </span>
                  ))}
                </div>
                {semanas.map((semana) => (
                  <div key={semana[0]} className="grid grid-cols-7 gap-1">
                    {semana.map((dataISO) => {
                      const passado = dataISO < hoje;
                      const selecionado = dataEntrega === dataISO;
                      const ehHoje = dataISO === hoje;
                      return (
                        <button
                          key={dataISO}
                          type="button"
                          disabled={passado}
                          onClick={() => setDataEntrega(dataISO)}
                          className={`rounded-lg py-2 font-['Baloo_2'] text-sm font-bold transition-colors ${
                            selecionado
                              ? "bg-[#3E2723] text-[#FFF8ED]"
                              : passado
                                ? "cursor-not-allowed text-[#D8CCC0]"
                                : "text-[#3E2723] hover:bg-[#F0E6DA]"
                          } ${ehHoje && !selecionado ? "ring-1 ring-[#E3A008]" : ""}`}
                        >
                          {formatarDataCurta(dataISO).slice(0, 2)}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
              {dataEntrega && (
                <p className="mt-2 font-['Inter'] text-sm text-[#6B5A50]">
                  Entrega:{" "}
                  <strong className="text-[#3E2723]">
                    {NOMES_DIAS_LONGOS[diaDaSemana(dataEntrega)]}, {formatarDataCurta(dataEntrega)}
                  </strong>
                </p>
              )}
            </SecaoPasso>

            {/* ------- 4. Horário ------- */}
            <SecaoPasso numero="4" titulo="Que horas?">
              <div className="flex flex-wrap items-center gap-2">
                {HORARIOS_RAPIDOS.map((opcao) => (
                  <ChipEscolha
                    key={opcao}
                    ativo={horario === opcao}
                    aoClicar={() => setHorario(opcao)}
                  >
                    {opcao.replace(":00", "h")}
                  </ChipEscolha>
                ))}
                <span className="mx-1 font-['Inter'] text-xs text-[#9C8B7F]">ajuste:</span>
                <button
                  type="button"
                  onClick={() => ajustarHorario(-30)}
                  className="rounded-full border border-[#E8DCCB] bg-white px-3 py-1.5 font-['Inter'] text-sm font-semibold text-[#6B5A50] transition-colors hover:bg-[#F0E6DA]"
                >
                  −30min
                </button>
                <button
                  type="button"
                  onClick={() => ajustarHorario(30)}
                  className="rounded-full border border-[#E8DCCB] bg-white px-3 py-1.5 font-['Inter'] text-sm font-semibold text-[#6B5A50] transition-colors hover:bg-[#F0E6DA]"
                >
                  +30min
                </button>
                {horario && (
                  <span className="ml-1 rounded-full bg-[#3E2723] px-3 py-1.5 font-['Baloo_2'] text-sm font-bold text-[#FFF8ED]">
                    {horario}
                  </span>
                )}
              </div>
            </SecaoPasso>

            {/* ------- 5. Forminha ------- */}
            <SecaoPasso numero="5" titulo="Qual forminha?">
              <div className="flex flex-wrap gap-2">
                {referencias.forminhas.map((forminha) => (
                  <ChipEscolha
                    key={forminha.id}
                    ativo={forminhaId === forminha.id}
                    aoClicar={() => setForminhaId(forminha.id)}
                  >
                    <span
                      className="mr-1.5 inline-block h-3.5 w-3.5 rounded-full border border-[#00000022] align-[-2px]"
                      style={{ backgroundColor: corDaForminha(forminha.nome) }}
                      aria-hidden="true"
                    />
                    {forminha.nome.replace(/^Forminha /, "")}
                  </ChipEscolha>
                ))}
              </div>
            </SecaoPasso>

            {/* ------- Resumo vivo + criar ------- */}
            {mensagemErro && (
              <div className="rounded-xl bg-[#FFE1E1] px-4 py-3 font-['Inter'] text-sm text-[#8A2C2C]">
                {mensagemErro}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
              <p className="font-['Inter'] text-sm text-[#6B5A50]">
                {totalDoces > 0 ? (
                  <>
                    <strong className="font-['Baloo_2'] text-2xl text-[#3E2723]">
                      {totalDoces}
                    </strong>{" "}
                    doces ·{" "}
                    <strong className="font-['Baloo_2'] text-2xl text-[#285A3E]">
                      {formatadorReais.format(totalReais)}
                    </strong>
                  </>
                ) : (
                  "Escolha os sabores para ver o total."
                )}
              </p>
              <button
                type="button"
                onClick={criarEncomenda}
                disabled={salvando || !pronto}
                className="rounded-full bg-[#3F7D5C] px-7 py-3 font-['Inter'] text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#285A3E] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {salvando ? "Criando…" : "✓ Criar encomenda"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ============================================================
 * SUBCOMPONENTES
 * ============================================================
 */

function SecaoPasso({ numero, titulo, dica, children }) {
  return (
    <section className="rounded-2xl bg-white/60 p-4">
      <h3 className="mb-3 flex items-center gap-2 font-['Baloo_2'] text-lg font-semibold text-[#3E2723]">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#3E2723] font-['Baloo_2'] text-sm font-bold text-[#FFF8ED]">
          {numero}
        </span>
        {titulo}
        {dica && (
          <span className="font-['Inter'] text-xs font-normal text-[#9C8B7F]">({dica})</span>
        )}
      </h3>
      {children}
    </section>
  );
}

function ChipEscolha({ ativo, aoClicar, children }) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      aria-pressed={ativo}
      className={`rounded-full border px-4 py-2 font-['Inter'] text-sm font-semibold transition-colors ${
        ativo
          ? "border-transparent bg-[#3E2723] text-[#FFF8ED] shadow-sm"
          : "border-[#E8DCCB] bg-white text-[#6B5A50] hover:bg-[#F0E6DA]"
      }`}
    >
      {children}
    </button>
  );
}

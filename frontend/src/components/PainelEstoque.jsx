import { useEffect, useState } from "react";

/**
 * ============================================================
 * CONFIGURAÇÃO VISUAL E DE DOMÍNIO
 * ============================================================
 * O nível "estilo bateria" é relativo ao estoque mínimo do insumo:
 *   - Vermelho: até 1x o mínimo (em alerta — repor já!)
 *   - Amarelo:  entre 1x e 2x o mínimo (atenção)
 *   - Verde:    acima de 2x o mínimo (tranquilo)
 * A barra considera "cheia" a partir de 3x o mínimo.
 */

const NIVEL_CONFIG = {
  BAIXO: { rotulo: "Estoque baixo!", corBarra: "#D9534F", corFundo: "bg-[#FFE1E1]", corTexto: "text-[#8A2C2C]" },
  ATENCAO: { rotulo: "Atenção", corBarra: "#E3A008", corFundo: "bg-[#FFF3D6]", corTexto: "text-[#946200]" },
  OK: { rotulo: "OK", corBarra: "#3F7D5C", corFundo: "bg-[#DDEFE3]", corTexto: "text-[#285A3E]" },
  SEM_MINIMO: { rotulo: "sem mínimo definido", corBarra: "#8D6E63", corFundo: "bg-[#F0E6DA]", corTexto: "text-[#5D4037]" },
};

// Botões de reposição rápida por unidade de medida — zero digitação.
const UNIDADE_CONFIG = {
  GRAMAS: { sufixo: "g", botoes: [{ rotulo: "+500 g", quantidade: 500 }, { rotulo: "+1 kg", quantidade: 1000 }] },
  QUILOS: { sufixo: "kg", botoes: [{ rotulo: "+1 kg", quantidade: 1 }, { rotulo: "+5 kg", quantidade: 5 }] },
  UNIDADES: { sufixo: "un.", botoes: [{ rotulo: "+50", quantidade: 50 }, { rotulo: "+100", quantidade: 100 }] },
};

const formatadorQuantidade = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 });

function formatarQuantidade(valor, unidadeMedida) {
  const sufixo = UNIDADE_CONFIG[unidadeMedida]?.sufixo ?? "";
  return `${formatadorQuantidade.format(valor ?? 0)} ${sufixo}`.trim();
}

function calcularNivel(item) {
  if (!item.estoqueMinimo || item.estoqueMinimo <= 0) {
    return { ...NIVEL_CONFIG.SEM_MINIMO, percentual: 100 };
  }
  const razao = item.quantidadeAtual / item.estoqueMinimo;
  // Barra "cheia" = 3x o mínimo; nunca abaixo de 4% para seguir visível.
  const percentual = Math.max(4, Math.min(100, (razao / 3) * 100));
  if (razao <= 1) return { ...NIVEL_CONFIG.BAIXO, percentual };
  if (razao <= 2) return { ...NIVEL_CONFIG.ATENCAO, percentual };
  return { ...NIVEL_CONFIG.OK, percentual };
}

/**
 * ============================================================
 * ADAPTADOR: formato bruto da API -> formato que o componente usa
 * ============================================================
 * A API devolve o EstoqueItemResponseDTO:
 * { id, nome, tipoInsumo, unidadeMedida, quantidadeAtual, estoqueMinimo, emAlerta }
 */
function mapearItem(bruto) {
  return {
    id: bruto.id,
    nome: bruto.nome,
    unidadeMedida: bruto.unidadeMedida,
    quantidadeAtual: Number(bruto.quantidadeAtual ?? 0),
    estoqueMinimo: bruto.estoqueMinimo != null ? Number(bruto.estoqueMinimo) : null,
  };
}

/**
 * ============================================================
 * DADOS MOCKADOS (fiéis ao DTO real da API)
 * ============================================================
 * Um item de cada nível, para a demonstração mostrar as três cores.
 */
const ESTOQUE_MOCK = [
  { id: 1, nome: "Leite Condensado", tipoInsumo: "INGREDIENTE", unidadeMedida: "GRAMAS", quantidadeAtual: 5000, estoqueMinimo: 1500 },
  { id: 2, nome: "Granulado", tipoInsumo: "INGREDIENTE", unidadeMedida: "GRAMAS", quantidadeAtual: 600, estoqueMinimo: 800 },
  { id: 3, nome: "Forminha Rosa", tipoInsumo: "FORMINHA", unidadeMedida: "UNIDADES", quantidadeAtual: 150, estoqueMinimo: 100 },
];

/**
 * ============================================================
 * COMPONENTE
 * ============================================================
 */
export default function PainelEstoque() {
  const [itens, setItens] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [usandoMock, setUsandoMock] = useState(false);
  const [salvandoChave, setSalvandoChave] = useState(null); // "<itemId>-<quantidade>"
  const [mensagemAcao, setMensagemAcao] = useState(null); // { tipo, texto }

  useEffect(() => {
    let ativo = true;

    async function buscarEstoque() {
      setCarregando(true);
      try {
        const resposta = await fetch("/api/estoque");
        if (!resposta.ok) {
          throw new Error(`Erro ao buscar estoque: ${resposta.status}`);
        }
        const brutos = await resposta.json();
        if (!ativo) return;
        setItens(brutos.map(mapearItem));
        setUsandoMock(false);
      } catch (erroCapturado) {
        if (!ativo) return;
        console.warn("Backend indisponível, usando dados de exemplo:", erroCapturado.message);
        setItens(ESTOQUE_MOCK.map(mapearItem));
        setUsandoMock(true);
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    buscarEstoque();
    return () => {
      ativo = false;
    };
  }, []);

  async function adicionarEstoque(item, botao) {
    const chave = `${item.id}-${botao.quantidade}`;
    setSalvandoChave(chave);
    setMensagemAcao(null);
    try {
      if (usandoMock) {
        // Modo exemplo: soma localmente para a demonstração ficar viva.
        setItens((atuais) =>
          atuais.map((i) =>
            i.id === item.id ? { ...i, quantidadeAtual: i.quantidadeAtual + botao.quantidade } : i
          )
        );
      } else {
        const resposta = await fetch(`/api/estoque/${item.id}/adicionar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantidade: botao.quantidade }),
        });
        if (!resposta.ok) {
          throw new Error(`status ${resposta.status}`);
        }
        const atualizado = mapearItem(await resposta.json());
        // Atualização pontual: a barra anima até o novo nível na hora.
        setItens((atuais) => atuais.map((i) => (i.id === atualizado.id ? atualizado : i)));
      }
      setMensagemAcao({
        tipo: "sucesso",
        texto: `${botao.rotulo} adicionado em ${item.nome}. Movimentação registrada no histórico.`,
      });
    } catch (erroCapturado) {
      console.warn("Falha ao adicionar estoque:", erroCapturado.message);
      setMensagemAcao({
        tipo: "erro",
        texto: `Não foi possível adicionar em ${item.nome}. Tente novamente.`,
      });
    } finally {
      setSalvandoChave(null);
    }
  }

  if (carregando && itens === null) {
    return (
      <div className="flex h-64 items-center justify-center font-['Inter'] text-lg text-[#3E2723]">
        Carregando estoque...
      </div>
    );
  }

  const emAlerta = (itens ?? []).filter((item) => {
    const nivel = calcularNivel(item);
    return nivel.rotulo === NIVEL_CONFIG.BAIXO.rotulo;
  }).length;

  return (
    <div className="min-h-screen bg-[#FFF8ED] px-4 py-8 sm:px-8">
      <header className="mb-6">
        <h1 className="font-['Baloo_2'] text-3xl font-bold text-[#3E2723] sm:text-4xl">
          Painel de Estoque
        </h1>
        <p className="mt-1 font-['Inter'] text-base text-[#6B5A50]">
          Santo Brigadeiro 013 — nível dos ingredientes e reposição rápida
        </p>
      </header>

      {usandoMock && (
        <div className="mb-6 rounded-xl bg-[#FFF3D6] px-4 py-3 font-['Inter'] text-sm text-[#946200]">
          ⚠ Backend indisponível — exibindo <strong>dados de exemplo</strong>. As
          quantidades abaixo não são reais.
        </div>
      )}

      {emAlerta > 0 && (
        <div className="mb-6 rounded-xl bg-[#FFE1E1] px-4 py-3 font-['Inter'] text-sm text-[#8A2C2C]">
          🔴 {emAlerta} {emAlerta === 1 ? "insumo está" : "insumos estão"} com estoque baixo —
          reponha antes da próxima produção.
        </div>
      )}

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

      {(itens ?? []).length === 0 ? (
        <p className="font-['Inter'] text-sm text-[#B5A99C]">
          Nenhum insumo cadastrado ainda.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {itens.map((item) => (
            <CardInsumo
              key={item.id}
              item={item}
              salvandoChave={salvandoChave}
              aoAdicionar={adicionarEstoque}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * ============================================================
 * CARD DE INSUMO ("bateria" de nível + reposição de um clique)
 * ============================================================
 */
function CardInsumo({ item, salvandoChave, aoAdicionar }) {
  const nivel = calcularNivel(item);
  const unidade = UNIDADE_CONFIG[item.unidadeMedida] ?? { sufixo: "", botoes: [] };

  return (
    <article className="flex flex-col rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-1 flex items-start justify-between gap-2">
        <h2 className="font-['Baloo_2'] text-lg font-semibold text-[#3E2723]">{item.nome}</h2>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 font-['Inter'] text-xs font-semibold ${nivel.corFundo} ${nivel.corTexto}`}
        >
          {nivel.rotulo}
        </span>
      </div>

      <p className="font-['Baloo_2'] text-3xl font-bold tabular-nums text-[#3E2723]">
        {formatarQuantidade(item.quantidadeAtual, item.unidadeMedida)}
      </p>
      <p className="mb-3 font-['Inter'] text-xs text-[#9C8B7F]">
        {item.estoqueMinimo != null
          ? `mínimo: ${formatarQuantidade(item.estoqueMinimo, item.unidadeMedida)}`
          : "alerta de mínimo não configurado"}
      </p>

      {/* Barra "bateria": anima até o novo nível a cada reposição. */}
      <div className="mb-4 h-3 overflow-hidden rounded-full bg-[#F0E6DA]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${nivel.percentual}%`, backgroundColor: nivel.corBarra }}
        />
      </div>

      <div className="mt-auto flex flex-wrap gap-2">
        {unidade.botoes.map((botao) => {
          const chave = `${item.id}-${botao.quantidade}`;
          return (
            <button
              key={chave}
              type="button"
              onClick={() => aoAdicionar(item, botao)}
              disabled={salvandoChave !== null}
              className="rounded-full bg-[#3E2723] px-4 py-2 font-['Inter'] text-sm font-semibold text-[#FFF8ED] transition-colors hover:bg-[#5D4037] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {salvandoChave === chave ? "Salvando…" : botao.rotulo}
            </button>
          );
        })}
      </div>
    </article>
  );
}

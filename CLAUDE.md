# CLAUDE.md — Santo Brigadeiro 013

Sistema de gestão (ERP) para a doceria **Santo Brigadeiro 013**. Encomendas,
produção, estoque e financeiro, integrados por **eventos de domínio**.

## Filosofia do produto (regra de ouro)

O usuário final é o **meu pai**. A interface deve ser **altamente visual,
intuitiva e operada por cliques de mouse**, reduzindo ao máximo a digitação de
texto. Sempre que houver a escolha entre "digitar" e "clicar", prefira clicar:
toggles, botões de atalho, selects e valores pré-preenchidos (ex: data = hoje).

## Stack

- **Backend:** Java + Spring Boot, JPA, PostgreSQL (via Docker). Migrations
  Flyway em `backend/src/main/resources/db/migration` (hoje V1..V11).
- **Frontend:** React 19 + Vite, Tailwind CSS v4.
- **Arquitetura:** `controller` → `service` (interface) → `service/impl`;
  entidades em `entity`; eventos de domínio em `event` + `listener`
  (ex.: entrega de pedido gera receita no caixa; reposição de estoque gera
  despesa). Listeners são **síncronos, na mesma transação** (atômico).

## Convenções de código

- **Spring:** use SEMPRE parâmetros explícitos para evitar erros de reflexão —
  `@RequestParam("inicio")`, `@PathVariable("id")`, etc. Nunca dependa do nome
  do parâmetro inferido.
- **Regra tipo × categoria (financeiro):** `CategoriaLancamento` conhece seu
  `TipoLancamento`. Categorias válidas:
  - `ENTRADA`: `VENDA_PEDIDO`, `OUTRA_RECEITA`
  - `SAIDA`: `COMPRA_INSUMO`, `DESPESA_OPERACIONAL`, `OUTRA_DESPESA`
  O front deve filtrar categorias pelo tipo escolhido (o backend rejeita
  combinações incoerentes com `RegraDeNegocioException`).
- **Datas no frontend:** nunca use `new Date("2026-07-05")` (interpreta como UTC
  e "vaza" um dia). Manipule por partes locais, como em
  `PainelEncomendasSemanal.jsx` / `PainelFinanceiro.jsx`.
- **Estilo visual:** paleta e rótulos concentrados no topo de cada componente;
  fontes `Baloo_2` (títulos) e `Inter` (texto); fundo `#FFF8ED`.
- **Modo exemplo (mock):** os painéis caem em dados de exemplo quando o backend
  está fora. Em telas financeiras, o mock é **anunciado num banner** (valores de
  dinheiro não podem se passar por reais).

## Padrões de UI consolidados (Fases 10 e 11)

Decisões de design que devem ser reaproveitadas em telas novas:

- **Atualização reativa sem F5:** cada painel guarda um contador
  `versaoDados`; ações de escrita bem-sucedidas incrementam o contador e o
  `useEffect` de carga re-busca a verdade do servidor. Nunca atualize a tela
  "na mão" após um POST/PATCH em modo real (só o modo exemplo simula local).
- **Trava de clique duplo:** todo botão de escrita desabilita durante o envio
  e troca o rótulo ("Salvando…", "Criando…"). O handler retorna cedo se já
  estiver salvando.
- **Escolhas por clique, nunca por texto:** tipo/categoria/cliente/lote/data/
  horário/forminha são chips e botões. O front só oferece combinações que o
  backend aceita (ex.: categorias filtradas pelo tipo; lotes vindos de
  `tipos_lote` — 25/50/100). Valor em dinheiro é o único campo digitado e
  aceita vírgula pt-BR (normalizar para ponto antes do POST).
- **Modais nascem limpos:** renderização condicional no pai
  (`{aberto && <Modal/>}`) em vez de resetar estado dentro de `useEffect`
  (o lint `react-hooks/set-state-in-effect` proíbe e está certo).
- **Quick-chips de cliente:** `GET /api/clientes/frequentes?limite=N`
  (ordenado por contagem de pedidos) + "mostrar todos" expansível.
- **Atalhos de data sempre no futuro:** "próxima sexta" de uma sexta é a da
  semana seguinte (`(alvo - hoje + 7) % 7 || 7`), nunca o próprio dia.
- **Defaults que economizam clique:** data = hoje no financeiro; forminha
  pré-selecionada quando só existe uma; descrição/valor limpam após salvar,
  mas tipo/categoria/data permanecem (lançamentos repetidos são comuns).

## Regras de domínio consolidadas

- **Caixa append-only, com UMA exceção deliberada (Fase 13):** lançamentos
  financeiros não sofrem UPDATE — correção é feita por lançamento de ajuste.
  A única exceção é a consolidação diária de reposições rápidas: reposições
  do MESMO insumo no MESMO dia acumulam num único lançamento de
  COMPRA_INSUMO (valor somado, quantidade acumulada, descrição regenerada).
  A âncora da consolidação é o vínculo `insumo_id` + `data_lancamento`
  (indexado, V13) — nunca casar texto de descrição. A auditoria granular de
  cada clique permanece em `movimentacoes_estoque`, esta sim append-only sem
  exceções. Nenhum outro fluxo pode atualizar lançamentos.
- **Lotes válidos vêm do banco:** quantidades de itens de pedido devem
  existir em `tipos_lote` (25/50/100); o service rejeita qualquer outra.
- **Eventos de domínio síncronos e transacionais:** entrega de pedido →
  receita no caixa; reposição de estoque → despesa no caixa. Ambos na mesma
  transação (atômicos), via ApplicationEventPublisher + @EventListener.

## Branch de trabalho

Fases concluídas e homologadas: 10 (lançamento manual no financeiro),
11 (nova encomenda sem digitação), 12 (FAB global — branch
`claude/fase-12-fab-nova-encomenda`), 13 (consolidação diária de reposições
— branch `claude/fase-13-consolidacao-lancamentos`).

## OBRIGATÓRIO antes de cada commit

Rodar e garantir que passam, **sem erros**:

```bash
# Backend
cd backend && ./mvnw compile

# Frontend
cd frontend && npm run build && npm run lint   # lint com ZERO erros
```

Só faça `git commit` / `git push` depois que os três estiverem verdes.

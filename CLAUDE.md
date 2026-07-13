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

## Branch de trabalho

`claude/financial-module-cash-flow-4ob9sj`

## OBRIGATÓRIO antes de cada commit

Rodar e garantir que passam, **sem erros**:

```bash
# Backend
cd backend && ./mvnw compile

# Frontend
cd frontend && npm run build && npm run lint   # lint com ZERO erros
```

Só faça `git commit` / `git push` depois que os três estiverem verdes.

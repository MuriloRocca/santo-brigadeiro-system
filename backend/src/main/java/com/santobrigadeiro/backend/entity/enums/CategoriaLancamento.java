package com.santobrigadeiro.backend.entity.enums;

/**
 * Classifica o lançamento no fluxo de caixa. Cada categoria "sabe" a
 * qual TipoLancamento pertence — assim a regra de consistência
 * (uma receita não pode ser classificada como despesa e vice-versa)
 * fica codificada no próprio domínio, e o Service apenas a verifica.
 */
public enum CategoriaLancamento {

    // Entradas (receitas)
    VENDA_PEDIDO(TipoLancamento.ENTRADA),
    OUTRA_RECEITA(TipoLancamento.ENTRADA),

    // Saídas (despesas)
    COMPRA_INSUMO(TipoLancamento.SAIDA),
    DESPESA_OPERACIONAL(TipoLancamento.SAIDA),
    OUTRA_DESPESA(TipoLancamento.SAIDA);

    private final TipoLancamento tipo;

    CategoriaLancamento(TipoLancamento tipo) {
        this.tipo = tipo;
    }

    public TipoLancamento getTipo() {
        return tipo;
    }

    public boolean pertenceA(TipoLancamento tipo) {
        return this.tipo == tipo;
    }
}

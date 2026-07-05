package com.santobrigadeiro.backend.entity.enums;

/**
 * Direção de um lançamento no caixa. Deliberadamente independente de
 * TipoMovimentacao (estoque): apesar de hoje terem os mesmos valores,
 * são domínios distintos e não devem ficar acoplados por um enum comum.
 */
public enum TipoLancamento {
    ENTRADA,
    SAIDA
}

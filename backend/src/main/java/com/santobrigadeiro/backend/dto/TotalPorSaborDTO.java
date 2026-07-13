package com.santobrigadeiro.backend.dto;

import lombok.Getter;

@Getter
public class TotalPorSaborDTO {

    private final String saborNome;
    private final int quantidadeTotal;
    // Carregado aqui de propósito: é a informação-chave para a futura
    // tela de adiantamento/congelamento decidir o que pode ser feito antes.
    private final boolean podeCongelar;

    public TotalPorSaborDTO(String saborNome, int quantidadeTotal, boolean podeCongelar) {
        this.saborNome = saborNome;
        this.quantidadeTotal = quantidadeTotal;
        this.podeCongelar = podeCongelar;
    }
}

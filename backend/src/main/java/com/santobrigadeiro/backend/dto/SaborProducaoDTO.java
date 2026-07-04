package com.santobrigadeiro.backend.dto;

import lombok.Getter;

@Getter
public class SaborProducaoDTO {

    private final String saborNome;
    private final int quantidadeTotal;

    public SaborProducaoDTO(String saborNome, int quantidadeTotal) {
        this.saborNome = saborNome;
        this.quantidadeTotal = quantidadeTotal;
    }
}
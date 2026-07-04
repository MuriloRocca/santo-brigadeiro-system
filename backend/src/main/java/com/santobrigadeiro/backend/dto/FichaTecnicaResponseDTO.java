package com.santobrigadeiro.backend.dto;

import com.santobrigadeiro.backend.entity.FichaTecnica;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
public class FichaTecnicaResponseDTO {

    private final Long id;
    private final String saborNome;
    private final String insumoNome;
    private final BigDecimal quantidadePorUnidade;

    private FichaTecnicaResponseDTO(Long id, String saborNome, String insumoNome, BigDecimal quantidadePorUnidade) {
        this.id = id;
        this.saborNome = saborNome;
        this.insumoNome = insumoNome;
        this.quantidadePorUnidade = quantidadePorUnidade;
    }

    public static FichaTecnicaResponseDTO fromEntity(FichaTecnica ficha) {
        return new FichaTecnicaResponseDTO(
                ficha.getId(),
                ficha.getSabor().getNome(),
                ficha.getInsumo().getNome(),
                ficha.getQuantidadePorUnidade()
        );
    }
}
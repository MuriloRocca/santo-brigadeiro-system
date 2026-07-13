package com.santobrigadeiro.backend.dto;

import com.santobrigadeiro.backend.entity.Sabor;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
public class SaborResponseDTO {

    private final Long id;
    private final String nome;
    private final boolean podeCongelar;
    private final boolean ativo;
    private final BigDecimal precoUnitario;

    private SaborResponseDTO(Long id, String nome, boolean podeCongelar, boolean ativo, BigDecimal precoUnitario) {
        this.id = id;
        this.nome = nome;
        this.podeCongelar = podeCongelar;
        this.ativo = ativo;
        this.precoUnitario = precoUnitario;
    }

    public static SaborResponseDTO fromEntity(Sabor sabor) {
        return new SaborResponseDTO(
                sabor.getId(), sabor.getNome(), sabor.isPodeCongelar(),
                sabor.isAtivo(), sabor.getPrecoUnitario());
    }
}

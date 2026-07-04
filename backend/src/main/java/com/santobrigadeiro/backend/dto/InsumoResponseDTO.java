package com.santobrigadeiro.backend.dto;

import com.santobrigadeiro.backend.entity.Insumo;
import com.santobrigadeiro.backend.entity.enums.TipoInsumo;
import com.santobrigadeiro.backend.entity.enums.UnidadeMedida;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
public class InsumoResponseDTO {

    private final Long id;
    private final String nome;
    private final TipoInsumo tipoInsumo;
    private final UnidadeMedida unidadeMedida;
    private final BigDecimal quantidadeAtual;
    private final BigDecimal estoqueMinimo;
    private final boolean emAlerta;
    private final LocalDateTime atualizadoEm;

    private InsumoResponseDTO(Long id, String nome, TipoInsumo tipoInsumo, UnidadeMedida unidadeMedida,
                               BigDecimal quantidadeAtual, BigDecimal estoqueMinimo, boolean emAlerta,
                               LocalDateTime atualizadoEm) {
        this.id = id;
        this.nome = nome;
        this.tipoInsumo = tipoInsumo;
        this.unidadeMedida = unidadeMedida;
        this.quantidadeAtual = quantidadeAtual;
        this.estoqueMinimo = estoqueMinimo;
        this.emAlerta = emAlerta;
        this.atualizadoEm = atualizadoEm;
    }

    public static InsumoResponseDTO fromEntity(Insumo insumo) {
        return new InsumoResponseDTO(
                insumo.getId(),
                insumo.getNome(),
                insumo.getTipoInsumo(),
                insumo.getUnidadeMedida(),
                insumo.getQuantidadeAtual(),
                insumo.getEstoqueMinimo(),
                insumo.isEmAlerta(), // delega ao domínio — o DTO só formata, não decide
                insumo.getAtualizadoEm()
        );
    }
}
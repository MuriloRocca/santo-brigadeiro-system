package com.santobrigadeiro.backend.dto;

import com.santobrigadeiro.backend.entity.Insumo;
import com.santobrigadeiro.backend.entity.enums.TipoInsumo;
import com.santobrigadeiro.backend.entity.enums.UnidadeMedida;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
public class EstoqueItemResponseDTO {

    private final Long id;
    private final String nome;
    private final TipoInsumo tipoInsumo;
    private final UnidadeMedida unidadeMedida;
    private final BigDecimal quantidadeAtual;
    // Nulo quando o insumo ainda não tem alerta configurado.
    private final BigDecimal estoqueMinimo;
    private final boolean emAlerta;

    private EstoqueItemResponseDTO(Long id, String nome, TipoInsumo tipoInsumo, UnidadeMedida unidadeMedida,
                                    BigDecimal quantidadeAtual, BigDecimal estoqueMinimo, boolean emAlerta) {
        this.id = id;
        this.nome = nome;
        this.tipoInsumo = tipoInsumo;
        this.unidadeMedida = unidadeMedida;
        this.quantidadeAtual = quantidadeAtual;
        this.estoqueMinimo = estoqueMinimo;
        this.emAlerta = emAlerta;
    }

    public static EstoqueItemResponseDTO fromEntity(Insumo insumo) {
        return new EstoqueItemResponseDTO(
                insumo.getId(),
                insumo.getNome(),
                insumo.getTipoInsumo(),
                insumo.getUnidadeMedida(),
                insumo.getQuantidadeAtual(),
                insumo.getEstoqueMinimo(),
                insumo.isEmAlerta()
        );
    }
}

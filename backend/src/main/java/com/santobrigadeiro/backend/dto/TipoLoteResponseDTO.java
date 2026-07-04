package com.santobrigadeiro.backend.dto;

import com.santobrigadeiro.backend.entity.TipoLote;
import lombok.Getter;

@Getter
public class TipoLoteResponseDTO {

    private final Long id;
    private final Integer quantidade;

    private TipoLoteResponseDTO(Long id, Integer quantidade) {
        this.id = id;
        this.quantidade = quantidade;
    }

    public static TipoLoteResponseDTO fromEntity(TipoLote tipoLote) {
        return new TipoLoteResponseDTO(tipoLote.getId(), tipoLote.getQuantidade());
    }
}
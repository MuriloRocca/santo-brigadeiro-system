package com.santobrigadeiro.backend.dto;

import com.santobrigadeiro.backend.entity.enums.StatusProducaoItem;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AtualizacaoStatusProducaoDTO {

    @NotNull(message = "O status de produção é obrigatório (PENDENTE ou CONGELADO).")
    private StatusProducaoItem statusProducao;
}

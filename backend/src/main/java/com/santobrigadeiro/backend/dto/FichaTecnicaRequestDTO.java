package com.santobrigadeiro.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class FichaTecnicaRequestDTO {

    @NotNull(message = "O sabor é obrigatório.")
    private Long saborId;

    @NotNull(message = "O insumo é obrigatório.")
    private Long insumoId;

    @NotNull(message = "A quantidade por unidade é obrigatória.")
    @Positive(message = "A quantidade por unidade deve ser maior que zero.")
    private BigDecimal quantidadePorUnidade;
}
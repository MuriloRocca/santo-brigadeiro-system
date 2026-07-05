package com.santobrigadeiro.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class AdicionarEstoqueRequestDTO {

    @NotNull(message = "A quantidade a adicionar é obrigatória.")
    @Positive(message = "A quantidade a adicionar deve ser maior que zero.")
    private BigDecimal quantidade;
}

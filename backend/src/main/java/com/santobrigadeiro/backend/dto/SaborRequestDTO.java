package com.santobrigadeiro.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class SaborRequestDTO {

    @NotBlank(message = "O nome do sabor é obrigatório.")
    private String nome;

    @NotNull(message = "Informe se o sabor pode ser congelado.")
    private Boolean podeCongelar;

    @NotNull(message = "O preço unitário é obrigatório.")
    @Positive(message = "O preço unitário deve ser maior que zero.")
    private BigDecimal precoUnitario;
}

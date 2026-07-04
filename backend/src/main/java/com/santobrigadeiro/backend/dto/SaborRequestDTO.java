package com.santobrigadeiro.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SaborRequestDTO {

    @NotBlank(message = "O nome do sabor é obrigatório.")
    private String nome;

    @NotNull(message = "Informe se o sabor pode ser congelado.")
    private Boolean podeCongelar;
}
package com.santobrigadeiro.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ClienteRequestDTO {

    @NotBlank(message = "O nome do cliente é obrigatório.")
    private String nome;

    private String telefone;
}
package com.santobrigadeiro.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ItemPedidoRequestDTO {

    @NotNull(message = "O sabor é obrigatório.")
    private Long saborId;

    @NotNull(message = "A quantidade é obrigatória.")
    private Integer quantidade;
}
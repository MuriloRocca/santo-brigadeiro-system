package com.santobrigadeiro.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Getter
@Setter
public class PedidoRequestDTO {

    @NotNull(message = "O cliente é obrigatório.")
    private Long clienteId;

    @NotNull(message = "A data de entrega é obrigatória.")
    private LocalDate dataEntrega;

    @NotNull(message = "O horário de entrega é obrigatório.")
    private LocalTime horarioEntrega;

    @NotNull(message = "A forminha (cor) é obrigatória.")
    private Long forminhaInsumoId;

    @NotEmpty(message = "O pedido deve conter ao menos um sabor.")
    @Valid
    private List<ItemPedidoRequestDTO> itens;
}
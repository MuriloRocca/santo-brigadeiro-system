package com.santobrigadeiro.backend.dto;

import com.santobrigadeiro.backend.entity.enums.TipoMovimentacao;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class MovimentacaoEstoqueRequestDTO {

    @NotNull(message = "O tipo da movimentação é obrigatório (ENTRADA ou SAIDA).")
    private TipoMovimentacao tipo;

    @NotNull(message = "A quantidade é obrigatória.")
    @Positive(message = "A quantidade deve ser maior que zero.")
    private BigDecimal quantidade;

    private String motivo;
}
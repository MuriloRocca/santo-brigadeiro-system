package com.santobrigadeiro.backend.dto;

import com.santobrigadeiro.backend.entity.enums.CategoriaLancamento;
import com.santobrigadeiro.backend.entity.enums.TipoLancamento;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class LancamentoFinanceiroRequestDTO {

    @NotNull(message = "O tipo do lançamento é obrigatório (ENTRADA ou SAIDA).")
    private TipoLancamento tipo;

    @NotNull(message = "A categoria do lançamento é obrigatória.")
    private CategoriaLancamento categoria;

    @NotNull(message = "O valor é obrigatório.")
    @Positive(message = "O valor deve ser maior que zero.")
    private BigDecimal valor;

    @NotBlank(message = "A descrição é obrigatória.")
    @Size(max = 200, message = "A descrição deve ter no máximo 200 caracteres.")
    private String descricao;

    @NotNull(message = "A data do lançamento é obrigatória.")
    private LocalDate dataLancamento;

    // Opcional: quando a entrada tem origem em um pedido específico.
    private Long pedidoId;
}

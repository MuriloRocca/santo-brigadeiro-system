package com.santobrigadeiro.backend.dto;

import com.santobrigadeiro.backend.entity.enums.TipoInsumo;
import com.santobrigadeiro.backend.entity.enums.UnidadeMedida;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * Propositalmente SEM o campo quantidadeAtual. Alterar o saldo de um
 * insumo é uma operação de negócio distinta (uma movimentação rastreada),
 * não um detalhe de cadastro que se edita como nome ou unidade de medida.
 * Ver MovimentacaoEstoqueService para o único caminho válido de alterar saldo.
 */
@Getter
@Setter
public class InsumoAtualizacaoDTO {

    @NotBlank(message = "O nome do insumo é obrigatório.")
    private String nome;

    @NotNull(message = "O tipo do insumo é obrigatório (INGREDIENTE, EMBALAGEM, FORMINHA ou CAIXA).")
    private TipoInsumo tipoInsumo;

    @NotNull(message = "A unidade de medida é obrigatória (GRAMAS, QUILOS ou UNIDADES).")
    private UnidadeMedida unidadeMedida;

    @DecimalMin(value = "0.0", message = "O estoque mínimo não pode ser negativo.")
    private BigDecimal estoqueMinimo;
}
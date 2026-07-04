package com.santobrigadeiro.backend.dto;

import com.santobrigadeiro.backend.entity.enums.TipoInsumo;
import com.santobrigadeiro.backend.entity.enums.UnidadeMedida;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class InsumoRequestDTO {

    @NotBlank(message = "O nome do insumo é obrigatório.")
    private String nome;

    @NotNull(message = "O tipo do insumo é obrigatório (INGREDIENTE, EMBALAGEM, FORMINHA ou CAIXA).")
    private TipoInsumo tipoInsumo;

    @NotNull(message = "A unidade de medida é obrigatória (GRAMAS, QUILOS ou UNIDADES).")
    private UnidadeMedida unidadeMedida;

    @NotNull(message = "A quantidade atual é obrigatória.")
    @DecimalMin(value = "0.0", message = "A quantidade não pode ser negativa.")
    private BigDecimal quantidadeAtual;

    // Sem @NotNull de propósito: configurar um alerta mínimo é opcional
    // no cadastro (ver Insumo.isEmAlerta() para o comportamento sem valor).
    @DecimalMin(value = "0.0", message = "O estoque mínimo não pode ser negativo.")
    private BigDecimal estoqueMinimo;
}
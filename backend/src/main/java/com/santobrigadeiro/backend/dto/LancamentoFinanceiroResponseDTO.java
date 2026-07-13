package com.santobrigadeiro.backend.dto;

import com.santobrigadeiro.backend.entity.LancamentoFinanceiro;
import com.santobrigadeiro.backend.entity.enums.CategoriaLancamento;
import com.santobrigadeiro.backend.entity.enums.TipoLancamento;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
public class LancamentoFinanceiroResponseDTO {

    private final Long id;
    private final TipoLancamento tipo;
    private final CategoriaLancamento categoria;
    private final BigDecimal valor;
    private final String descricao;
    private final LocalDate dataLancamento;
    // Nulo quando o lançamento não tem pedido de origem vinculado.
    private final Long pedidoId;
    private final LocalDateTime criadoEm;

    private LancamentoFinanceiroResponseDTO(Long id, TipoLancamento tipo, CategoriaLancamento categoria,
                                            BigDecimal valor, String descricao, LocalDate dataLancamento,
                                            Long pedidoId, LocalDateTime criadoEm) {
        this.id = id;
        this.tipo = tipo;
        this.categoria = categoria;
        this.valor = valor;
        this.descricao = descricao;
        this.dataLancamento = dataLancamento;
        this.pedidoId = pedidoId;
        this.criadoEm = criadoEm;
    }

    public static LancamentoFinanceiroResponseDTO fromEntity(LancamentoFinanceiro lancamento) {
        return new LancamentoFinanceiroResponseDTO(
                lancamento.getId(),
                lancamento.getTipo(),
                lancamento.getCategoria(),
                lancamento.getValor(),
                lancamento.getDescricao(),
                lancamento.getDataLancamento(),
                lancamento.getPedido() != null ? lancamento.getPedido().getId() : null,
                lancamento.getCriadoEm()
        );
    }
}

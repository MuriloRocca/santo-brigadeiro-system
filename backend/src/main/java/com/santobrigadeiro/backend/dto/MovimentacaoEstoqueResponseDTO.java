package com.santobrigadeiro.backend.dto;

import com.santobrigadeiro.backend.entity.MovimentacaoEstoque;
import com.santobrigadeiro.backend.entity.enums.TipoMovimentacao;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
public class MovimentacaoEstoqueResponseDTO {

    private final Long id;
    private final String insumoNome;
    private final TipoMovimentacao tipo;
    private final BigDecimal quantidade;
    private final String motivo;
    private final LocalDateTime criadoEm;
    // Conveniência para quem consome a API: evita um segundo GET só para
    // saber o saldo resultante depois de registrar a movimentação.
    private final BigDecimal saldoAtualInsumo;

    private MovimentacaoEstoqueResponseDTO(Long id, String insumoNome, TipoMovimentacao tipo, BigDecimal quantidade,
                                            String motivo, LocalDateTime criadoEm, BigDecimal saldoAtualInsumo) {
        this.id = id;
        this.insumoNome = insumoNome;
        this.tipo = tipo;
        this.quantidade = quantidade;
        this.motivo = motivo;
        this.criadoEm = criadoEm;
        this.saldoAtualInsumo = saldoAtualInsumo;
    }

    public static MovimentacaoEstoqueResponseDTO fromEntity(MovimentacaoEstoque movimentacao) {
        return new MovimentacaoEstoqueResponseDTO(
                movimentacao.getId(),
                movimentacao.getInsumo().getNome(),
                movimentacao.getTipo(),
                movimentacao.getQuantidade(),
                movimentacao.getMotivo(),
                movimentacao.getCriadoEm(),
                movimentacao.getInsumo().getQuantidadeAtual()
        );
    }
}
package com.santobrigadeiro.backend.entity;

import com.santobrigadeiro.backend.entity.enums.TipoMovimentacao;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Registro imutável (append-only) de uma entrada ou saída de insumo.
 * Não possui @PreUpdate nem setters expostos para alteração posterial
 * por design: uma movimentação já registrada não deve ser "corrigida"
 * por UPDATE — se houve um erro de lançamento, o correto é registrar
 * uma nova movimentação de ajuste, preservando o histórico real dos fatos.
 */
@Entity
@Table(name = "movimentacoes_estoque")
@Getter
@Setter
@NoArgsConstructor
public class MovimentacaoEstoque {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "insumo_id", nullable = false)
    private Insumo insumo;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TipoMovimentacao tipo;

    @NotNull
    @Positive(message = "A quantidade da movimentação deve ser maior que zero.")
    @Column(nullable = false, precision = 10, scale = 3)
    private BigDecimal quantidade;

    @Column(length = 150)
    private String motivo;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @PrePersist
    protected void aoPersistir() {
        this.criadoEm = LocalDateTime.now();
    }
}
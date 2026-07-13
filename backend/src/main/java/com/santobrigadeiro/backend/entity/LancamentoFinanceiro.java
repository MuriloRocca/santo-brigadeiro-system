package com.santobrigadeiro.backend.entity;

import com.santobrigadeiro.backend.entity.enums.CategoriaLancamento;
import com.santobrigadeiro.backend.entity.enums.TipoLancamento;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Registro imutável (append-only) de uma entrada ou saída no caixa.
 * Segue a mesma filosofia de MovimentacaoEstoque: não há @PreUpdate nem
 * fluxo de alteração — um lançamento errado é corrigido por um novo
 * lançamento de ajuste, jamais por UPDATE, preservando o histórico real
 * do fluxo de caixa como fonte de verdade contábil.
 */
@Entity
@Table(name = "lancamentos_financeiros")
@Getter
@Setter
@NoArgsConstructor
public class LancamentoFinanceiro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TipoLancamento tipo;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private CategoriaLancamento categoria;

    @NotNull
    @Positive(message = "O valor do lançamento deve ser maior que zero.")
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal valor;

    @NotNull
    @Column(nullable = false, length = 200)
    private String descricao;

    @NotNull(message = "A data do lançamento é obrigatória.")
    @Column(name = "data_lancamento", nullable = false)
    private LocalDate dataLancamento;

    /**
     * Vínculo OPCIONAL com o pedido de origem — puramente rastreabilidade.
     * LAZY e nullable: o Financeiro não depende de Pedidos para existir.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pedido_id")
    private Pedido pedido;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @PrePersist
    protected void aoPersistir() {
        this.criadoEm = LocalDateTime.now();
    }
}

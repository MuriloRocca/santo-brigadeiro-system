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
 * Registro de uma entrada ou saída no caixa, em regra imutável
 * (append-only): um lançamento errado é corrigido por um novo lançamento
 * de ajuste, jamais por UPDATE, preservando o histórico do fluxo de
 * caixa como fonte de verdade contábil.
 *
 * EXCEÇÃO DELIBERADA (Fase 13): reposições rápidas do MESMO insumo no
 * MESMO dia são consolidadas num único lançamento de COMPRA_INSUMO —
 * valor e quantidade acumulam via atualização, como numa escrituração
 * diária de compras. A auditoria granular (um registro por clique)
 * permanece intacta em MovimentacaoEstoque, esta sim append-only sem
 * exceções. Nenhum outro fluxo pode atualizar lançamentos.
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

    /**
     * Vínculo OPCIONAL com o insumo — presente apenas nos lançamentos de
     * reposição rápida, onde ancora a consolidação diária (a busca é por
     * insumo + dia, nunca por texto de descrição).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "insumo_id")
    private Insumo insumo;

    /** Quantidade acumulada do dia (só nos lançamentos de reposição). */
    @Column(name = "quantidade_insumo", precision = 10, scale = 3)
    private BigDecimal quantidadeInsumo;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @PrePersist
    protected void aoPersistir() {
        this.criadoEm = LocalDateTime.now();
    }
}

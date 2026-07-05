package com.santobrigadeiro.backend.entity;

import com.santobrigadeiro.backend.entity.enums.TipoInsumo;
import com.santobrigadeiro.backend.entity.enums.UnidadeMedida;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "insumos")
@Getter
@Setter
@NoArgsConstructor
public class Insumo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String nome;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_insumo", nullable = false, length = 20)
    private TipoInsumo tipoInsumo;

    @Enumerated(EnumType.STRING)
    @Column(name = "unidade_medida", nullable = false, length = 10)
    private UnidadeMedida unidadeMedida;

    @Column(name = "quantidade_atual", nullable = false, precision = 10, scale = 3)
    private BigDecimal quantidadeAtual = BigDecimal.ZERO;

    // Opcional de propósito: nem todo insumo precisa de alerta configurado
    // desde o cadastro (ver explicação na migration).
    @Column(name = "estoque_minimo", precision = 10, scale = 3)
    private BigDecimal estoqueMinimo;

    // Custo estimado por unidade de compra (lata, grama, unidade...).
    // Zero = "custo não cadastrado": a reposição funciona normalmente,
    // apenas sem gerar lançamento automático no caixa.
    @Column(name = "custo_unitario", nullable = false, precision = 10, scale = 2)
    private BigDecimal custoUnitario = BigDecimal.ZERO;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    @PrePersist
    protected void aoPersistir() {
        this.criadoEm = LocalDateTime.now();
        this.atualizadoEm = LocalDateTime.now();
    }

    @PreUpdate
    protected void aoAtualizar() {
        this.atualizadoEm = LocalDateTime.now();
    }

    /**
     * Regra de negócio "está em alerta?" vive aqui, no domínio — não no
     * Service, não no DTO, não numa coluna do banco. Isso evita duplicar
     * essa condição em múltiplos lugares (ex: um dia o Service filtra a
     * lista, outro dia o DTO formata "alerta: sim/não" — se a regra
     * estivesse copiada nos dois lugares, um poderia ficar desatualizado
     * enquanto o outro é corrigido).
     *
     * Sem estoqueMinimo definido, consideramos que não há alerta possível.
     */
    @Transient
    public boolean isEmAlerta() {
        if (estoqueMinimo == null) {
            return false;
        }
        return quantidadeAtual.compareTo(estoqueMinimo) <= 0;
    }
}
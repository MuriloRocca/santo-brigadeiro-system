package com.santobrigadeiro.backend.repository;

import com.santobrigadeiro.backend.entity.Pedido;
import com.santobrigadeiro.backend.entity.enums.StatusPedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    // JOIN FETCH evita o problema N+1: carrega pedido + itens + sabor +
    // tipoLote + cliente em uma única consulta, em vez de uma query
    // extra para cada relação LAZY acessada durante a listagem.
    @Query("""
        SELECT DISTINCT p FROM Pedido p
        LEFT JOIN FETCH p.itens i
        LEFT JOIN FETCH i.sabor
        LEFT JOIN FETCH i.tipoLote
        LEFT JOIN FETCH p.cliente
        WHERE p.dataEntrega BETWEEN :dataInicio AND :dataFim
        ORDER BY p.dataEntrega, p.horarioEntrega
        """)
    List<Pedido> buscarPorPeriodoComItens(@Param("dataInicio") LocalDate dataInicio,
                                           @Param("dataFim") LocalDate dataFim);

    // Base do resumo de produção: só o que ainda FALTA produzir. Pedidos
    // ENTREGUES ficam de fora (produção concluída não gera trabalho novo).
    // Mesmo JOIN FETCH anti-N+1 da consulta acima; o status excluído vem
    // por parâmetro para manter o enum fora do texto JPQL.
    @Query("""
        SELECT DISTINCT p FROM Pedido p
        LEFT JOIN FETCH p.itens i
        LEFT JOIN FETCH i.sabor
        LEFT JOIN FETCH i.tipoLote
        WHERE p.dataEntrega BETWEEN :dataInicio AND :dataFim
          AND p.status <> :statusExcluido
        ORDER BY p.dataEntrega
        """)
    List<Pedido> buscarPendentesPorPeriodoComItens(@Param("dataInicio") LocalDate dataInicio,
                                                    @Param("dataFim") LocalDate dataFim,
                                                    @Param("statusExcluido") StatusPedido statusExcluido);
}
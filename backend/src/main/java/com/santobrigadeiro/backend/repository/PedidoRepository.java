package com.santobrigadeiro.backend.repository;

import com.santobrigadeiro.backend.entity.Pedido;
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
}
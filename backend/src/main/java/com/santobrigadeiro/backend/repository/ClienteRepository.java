package com.santobrigadeiro.backend.repository;

import com.santobrigadeiro.backend.entity.Cliente;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    /**
     * Clientes ordenados por frequência (quantidade de pedidos, maior
     * primeiro; empate resolvido por nome). LEFT JOIN para que clientes
     * sem pedidos também apareçam — no fim da lista — quando o limite
     * for maior que o número de clientes frequentes.
     */
    @Query("""
            SELECT c FROM Cliente c
            LEFT JOIN Pedido p ON p.cliente = c
            GROUP BY c
            ORDER BY COUNT(p) DESC, c.nome ASC
            """)
    List<Cliente> buscarPorFrequenciaDePedidos(Pageable pageable);
}

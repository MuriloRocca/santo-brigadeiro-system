package com.santobrigadeiro.backend.repository;

import com.santobrigadeiro.backend.entity.ItemPedido;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ItemPedidoRepository extends JpaRepository<ItemPedido, Long> {
}
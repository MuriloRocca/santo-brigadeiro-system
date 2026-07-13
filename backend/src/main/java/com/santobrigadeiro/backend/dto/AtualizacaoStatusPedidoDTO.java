package com.santobrigadeiro.backend.dto;

import com.santobrigadeiro.backend.entity.enums.StatusPedido;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AtualizacaoStatusPedidoDTO {

    @NotNull(message = "O status é obrigatório (PENDENTE, EM_PRODUCAO ou ENTREGUE).")
    private StatusPedido status;
}

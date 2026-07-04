package com.santobrigadeiro.backend.validation;

import com.santobrigadeiro.backend.entity.ItemPedido;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.Set;

public class QuantidadeLotePermitidaValidator implements ConstraintValidator<QuantidadeLotePermitida, ItemPedido> {

    private static final Set<Integer> LOTES_PERMITIDOS = Set.of(25, 50, 100);

    @Override
    public boolean isValid(ItemPedido item, ConstraintValidatorContext context) {
        if (item == null || item.getTipoLote() == null || item.getTipoLote().getQuantidade() == null) {
            return false;
        }
        return LOTES_PERMITIDOS.contains(item.getTipoLote().getQuantidade());
    }
}
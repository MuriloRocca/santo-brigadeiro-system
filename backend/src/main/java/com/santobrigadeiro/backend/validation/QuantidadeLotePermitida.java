package com.santobrigadeiro.backend.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = QuantidadeLotePermitidaValidator.class)
public @interface QuantidadeLotePermitida {

    String message() default "A quantidade do sabor deve ser exatamente 25, 50 ou 100 unidades.";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
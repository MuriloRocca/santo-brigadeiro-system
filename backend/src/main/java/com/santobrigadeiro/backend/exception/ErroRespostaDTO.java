package com.santobrigadeiro.backend.exception;

import java.time.LocalDateTime;

public record ErroRespostaDTO(LocalDateTime timestamp, int status, String erro, Object detalhes) {
}
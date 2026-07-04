package com.santobrigadeiro.backend.dto;

import com.santobrigadeiro.backend.entity.Cliente;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class ClienteResponseDTO {

    private final Long id;
    private final String nome;
    private final String telefone;
    private final LocalDateTime criadoEm;

    private ClienteResponseDTO(Long id, String nome, String telefone, LocalDateTime criadoEm) {
        this.id = id;
        this.nome = nome;
        this.telefone = telefone;
        this.criadoEm = criadoEm;
    }

    public static ClienteResponseDTO fromEntity(Cliente cliente) {
        return new ClienteResponseDTO(cliente.getId(), cliente.getNome(), cliente.getTelefone(), cliente.getCriadoEm());
    }
}
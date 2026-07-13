package com.santobrigadeiro.backend.controller;

import com.santobrigadeiro.backend.dto.ClienteRequestDTO;
import com.santobrigadeiro.backend.dto.ClienteResponseDTO;
import com.santobrigadeiro.backend.service.ClienteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clientes")
@RequiredArgsConstructor
public class ClienteController {

    private final ClienteService clienteService;

    @GetMapping
    public ResponseEntity<List<ClienteResponseDTO>> listar() {
        List<ClienteResponseDTO> clientes = clienteService.listarTodos().stream()
                .map(ClienteResponseDTO::fromEntity)
                .toList();
        return ResponseEntity.ok(clientes);
    }

    // Clientes mais frequentes (por quantidade de pedidos) — alimenta os
    // quick-chips de seleção com 1 clique da Nova Encomenda (Fase 11).
    @GetMapping("/frequentes")
    public ResponseEntity<List<ClienteResponseDTO>> listarFrequentes(
            @RequestParam(name = "limite", defaultValue = "8") int limite) {
        List<ClienteResponseDTO> clientes = clienteService.listarFrequentes(limite).stream()
                .map(ClienteResponseDTO::fromEntity)
                .toList();
        return ResponseEntity.ok(clientes);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClienteResponseDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(ClienteResponseDTO.fromEntity(clienteService.buscarPorId(id)));
    }

    @PostMapping
    public ResponseEntity<ClienteResponseDTO> criar(@Valid @RequestBody ClienteRequestDTO dto) {
        ClienteResponseDTO criado = ClienteResponseDTO.fromEntity(clienteService.criar(dto));
        return ResponseEntity.status(HttpStatus.CREATED).body(criado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClienteResponseDTO> atualizar(@PathVariable Long id, @Valid @RequestBody ClienteRequestDTO dto) {
        return ResponseEntity.ok(ClienteResponseDTO.fromEntity(clienteService.atualizar(id, dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        clienteService.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
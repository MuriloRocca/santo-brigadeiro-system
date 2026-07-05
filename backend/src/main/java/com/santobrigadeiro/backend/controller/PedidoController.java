package com.santobrigadeiro.backend.controller;

import com.santobrigadeiro.backend.dto.AtualizacaoStatusPedidoDTO;
import com.santobrigadeiro.backend.dto.AtualizacaoStatusProducaoDTO;
import com.santobrigadeiro.backend.dto.ItemPedidoResponseDTO;
import com.santobrigadeiro.backend.dto.PedidoRequestDTO;
import com.santobrigadeiro.backend.dto.PedidoResponseDTO;
import com.santobrigadeiro.backend.dto.ResumoProducaoSemanalDTO;
import com.santobrigadeiro.backend.entity.ItemPedido;
import com.santobrigadeiro.backend.entity.Pedido;
import com.santobrigadeiro.backend.service.PedidoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/pedidos")
@RequiredArgsConstructor
public class PedidoController {

    private final PedidoService pedidoService;

    @PostMapping
    public ResponseEntity<PedidoResponseDTO> criarPedido(@Valid @RequestBody PedidoRequestDTO dto) {
        Pedido pedidoCriado = pedidoService.criarPedido(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(PedidoResponseDTO.fromEntity(pedidoCriado));
    }

    @GetMapping("/semana")
    public ResponseEntity<List<PedidoResponseDTO>> listarPedidosDaSemana(
            @RequestParam("dataInicio") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam("dataFim") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim) {

        List<PedidoResponseDTO> pedidos = pedidoService.buscarPedidosDaSemana(dataInicio, dataFim)
                .stream()
                .map(PedidoResponseDTO::fromEntity)
                .toList();

        return ResponseEntity.ok(pedidos);
    }

    // Consolidado de produção pendente (exclui ENTREGUES): alimenta a
    // Central de Produção do painel semanal e a futura tela de congelamento.
    @GetMapping("/resumo-producao")
    public ResponseEntity<ResumoProducaoSemanalDTO> resumoProducao(
            @RequestParam("inicio") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam("fim") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {
        return ResponseEntity.ok(pedidoService.consultarResumoProducao(inicio, fim));
    }

    // PATCH: transição de status. Ao virar ENTREGUE, o caixa recebe a
    // receita automaticamente (via evento de domínio, no serviço).
    @PatchMapping("/{id}/status")
    public ResponseEntity<PedidoResponseDTO> atualizarStatus(
            @PathVariable("id") Long id,
            @Valid @RequestBody AtualizacaoStatusPedidoDTO dto) {
        Pedido pedido = pedidoService.atualizarStatus(id, dto.getStatus());
        return ResponseEntity.ok(PedidoResponseDTO.fromEntity(pedido));
    }

    // PATCH: estado de fabricação de um LOTE específico (adiantamento/
    // congelamento). O grão é o item: cada sabor tem sua regra de frio.
    @PatchMapping("/itens/{id}/status-producao")
    public ResponseEntity<ItemPedidoResponseDTO> atualizarStatusProducaoItem(
            @PathVariable("id") Long id,
            @Valid @RequestBody AtualizacaoStatusProducaoDTO dto) {
        ItemPedido item = pedidoService.atualizarStatusProducaoItem(id, dto.getStatusProducao());
        return ResponseEntity.ok(ItemPedidoResponseDTO.fromEntity(item));
    }
}
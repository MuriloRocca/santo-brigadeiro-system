package com.santobrigadeiro.backend.service.impl;

import com.santobrigadeiro.backend.dto.FluxoCaixaResumoDTO;
import com.santobrigadeiro.backend.dto.LancamentoFinanceiroRequestDTO;
import com.santobrigadeiro.backend.entity.Insumo;
import com.santobrigadeiro.backend.entity.LancamentoFinanceiro;
import com.santobrigadeiro.backend.entity.Pedido;
import com.santobrigadeiro.backend.entity.enums.CategoriaLancamento;
import com.santobrigadeiro.backend.entity.enums.TipoLancamento;
import com.santobrigadeiro.backend.entity.enums.UnidadeMedida;
import com.santobrigadeiro.backend.exception.RecursoNaoEncontradoException;
import com.santobrigadeiro.backend.exception.RegraDeNegocioException;
import com.santobrigadeiro.backend.repository.LancamentoFinanceiroRepository;
import com.santobrigadeiro.backend.repository.PedidoRepository;
import com.santobrigadeiro.backend.service.LancamentoFinanceiroService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class LancamentoFinanceiroServiceImpl implements LancamentoFinanceiroService {

    private final LancamentoFinanceiroRepository lancamentoRepository;
    private final PedidoRepository pedidoRepository;

    @Override
    @Transactional
    public LancamentoFinanceiro registrar(LancamentoFinanceiroRequestDTO dto) {
        // Regra de negócio central: a categoria precisa ser coerente com o
        // tipo. Sem isso, seria possível registrar uma "COMPRA_INSUMO"
        // (despesa) como ENTRADA e inflar artificialmente o caixa.
        if (!dto.getCategoria().pertenceA(dto.getTipo())) {
            throw new RegraDeNegocioException(
                    "A categoria " + dto.getCategoria() + " não pertence a lançamentos do tipo "
                            + dto.getTipo() + ".");
        }

        LancamentoFinanceiro lancamento = new LancamentoFinanceiro();
        lancamento.setTipo(dto.getTipo());
        lancamento.setCategoria(dto.getCategoria());
        lancamento.setValor(dto.getValor());
        lancamento.setDescricao(dto.getDescricao());
        lancamento.setDataLancamento(dto.getDataLancamento());
        lancamento.setPedido(resolverPedidoOpcional(dto.getPedidoId()));

        return lancamentoRepository.save(lancamento);
    }

    // Vínculo com pedido é opcional. Se informado, precisa existir de fato —
    // um id de pedido inexistente é um erro do chamador, não um silêncio.
    private Pedido resolverPedidoOpcional(Long pedidoId) {
        if (pedidoId == null) {
            return null;
        }
        return pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Pedido não encontrado: id " + pedidoId));
    }

    @Override
    @Transactional
    public LancamentoFinanceiro registrarReceitaDePedido(Pedido pedido) {
        // Idempotência (defesa em profundidade): se a receita deste pedido
        // já existe, não duplica — apenas devolve a existente. Combinado com
        // o status ENTREGUE terminal, torna a operação segura a reenvios.
        Optional<LancamentoFinanceiro> existente =
                lancamentoRepository.findFirstByPedidoId(pedido.getId());
        if (existente.isPresent()) {
            return existente.get();
        }

        BigDecimal valor = pedido.getValorTotal();
        if (valor == null || valor.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RegraDeNegocioException(
                    "O pedido #" + pedido.getId() + " não possui valor total; "
                            + "não é possível gerar a receita no caixa.");
        }

        LancamentoFinanceiro lancamento = new LancamentoFinanceiro();
        lancamento.setTipo(TipoLancamento.ENTRADA);
        lancamento.setCategoria(CategoriaLancamento.VENDA_PEDIDO);
        lancamento.setValor(valor);
        lancamento.setDescricao(
                "Receita do pedido #" + pedido.getId() + " - " + pedido.getCliente().getNome());
        lancamento.setDataLancamento(LocalDate.now());
        lancamento.setPedido(pedido);

        return lancamentoRepository.save(lancamento);
    }

    @Override
    @Transactional
    public LancamentoFinanceiro registrarCompraDeInsumo(Insumo insumo, BigDecimal quantidade) {
        BigDecimal custoUnitario = insumo.getCustoUnitario();
        // Sem custo cadastrado não há o que lançar — e o caixa não aceita
        // valor zero (CHECK valor > 0). A reposição de estoque segue
        // válida; o custo pode ser configurado depois.
        if (custoUnitario == null || custoUnitario.compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }

        BigDecimal custoTotal = custoUnitario.multiply(quantidade).setScale(2, RoundingMode.HALF_UP);

        LancamentoFinanceiro lancamento = new LancamentoFinanceiro();
        lancamento.setTipo(TipoLancamento.SAIDA);
        lancamento.setCategoria(CategoriaLancamento.COMPRA_INSUMO);
        lancamento.setValor(custoTotal);
        lancamento.setDescricao("Reposição rápida: +" + quantidade.stripTrailingZeros().toPlainString()
                + " " + rotuloUnidade(insumo.getUnidadeMedida()) + " de " + insumo.getNome());
        lancamento.setDataLancamento(LocalDate.now());

        return lancamentoRepository.save(lancamento);
    }

    private String rotuloUnidade(UnidadeMedida unidade) {
        return switch (unidade) {
            case GRAMAS -> "g";
            case QUILOS -> "kg";
            case UNIDADES -> "un.";
        };
    }

    @Override
    @Transactional(readOnly = true)
    public List<LancamentoFinanceiro> listarPorPeriodo(LocalDate inicio, LocalDate fim) {
        validarPeriodo(inicio, fim);
        return lancamentoRepository
                .findByDataLancamentoBetweenOrderByDataLancamentoDescIdDesc(inicio, fim);
    }

    @Override
    @Transactional(readOnly = true)
    public FluxoCaixaResumoDTO consultarFluxoCaixa(LocalDate inicio, LocalDate fim) {
        validarPeriodo(inicio, fim);

        BigDecimal totalEntradas = lancamentoRepository
                .somarValorPorTipoNoPeriodo(TipoLancamento.ENTRADA, inicio, fim);
        BigDecimal totalSaidas = lancamentoRepository
                .somarValorPorTipoNoPeriodo(TipoLancamento.SAIDA, inicio, fim);

        return new FluxoCaixaResumoDTO(inicio, fim, totalEntradas, totalSaidas);
    }

    private void validarPeriodo(LocalDate inicio, LocalDate fim) {
        if (inicio == null || fim == null) {
            throw new RegraDeNegocioException("As datas de início e fim são obrigatórias.");
        }
        if (inicio.isAfter(fim)) {
            throw new RegraDeNegocioException("A data de início não pode ser posterior à data de fim.");
        }
    }
}

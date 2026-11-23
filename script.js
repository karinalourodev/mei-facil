// ==========================================
// MEI FÁCIL — CONTROLE FINANCEIRO
// Arquivo: script.js
// ==========================================

// ==================== ARMAZENAMENTO ====================
// Usa o armazenamento local do navegador (não precisa de servidor)
function buscarDados(chave) {
  const dados = localStorage.getItem(chave);
  return dados ? JSON.parse(dados) : [];
}

function salvarDados(chave, dados) {
  localStorage.setItem(chave, JSON.stringify(dados));
}

// ==================== FUNÇÕES GLOBAIS ====================
function formatarDinheiro(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor || 0);
}

function formatarData(dataString) {
  if (!dataString) return "";
  const partes = dataString.split("-");
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function extrairMesAno(dataString) {
  if (!dataString) return "";
  return dataString.slice(0, 7);
}

// ==================== TELA INICIAL — index.html ====================
if (document.getElementById("saldoAtual")) {
  function atualizarTelaInicial() {
    const movimentacoes = buscarDados("movimentacoes");
    const saldoAtualEl = document.getElementById("saldoAtual");
    const statusEl = document.querySelector(".saldo-status");
    const listaEl = document.getElementById("listaMovimentacoes");

    let saldo = 0;
    movimentacoes.forEach((m) => {
      if (m.tipo === "entrada") saldo += parseFloat(m.valor);
      else saldo -= parseFloat(m.valor);
    });

    saldoAtualEl.textContent = formatarDinheiro(saldo);
    if (saldo > 0) {
      statusEl.textContent = "✅ Positivo";
      saldoAtualEl.style.color = "#fff";
    } else if (saldo < 0) {
      statusEl.textContent = "❌ Negativo";
      saldoAtualEl.style.color = "#ffebee";
    } else {
      statusEl.textContent = "— Zero";
    }

    // Últimas movimentações (5 mais recentes)
    const ultimas = movimentacoes.slice(-5).reverse();
    if (ultimas.length === 0) {
      listaEl.innerHTML =
        '<p class="vazio">Nenhum lançamento ainda. Comece registrando sua primeira movimentação!</p>';
    } else {
      listaEl.innerHTML = ultimas
        .map(
          (mov) => `
                <div class="item-mov ${mov.tipo}">
                    <div>
                        <strong>${mov.descricao}</strong><br>
                        <small>${formatarData(mov.data)}</small>
                    </div>
                    <div class="valor">
                        ${mov.tipo === "entrada" ? "+" : "-"} ${formatarDinheiro(mov.valor)}
                    </div>
                </div>
            `,
        )
        .join("");
    }
  }
  atualizarTelaInicial();
}

// ==================== LANÇAMENTOS — lancamentos.html ====================
if (document.getElementById("formLancamento")) {
  const parametros = new URLSearchParams(window.location.search);
  const tipoPagina = parametros.get("tipo") || "entrada";

  const tituloPagina = document.getElementById("tituloPagina");
  const categoriaSelect = document.getElementById("categoria");
  const dataInput = document.getElementById("data");

  // Define data de hoje
  dataInput.valueAsDate = new Date();

  // Configura conforme o tipo
  if (tipoPagina === "entrada") {
    tituloPagina.textContent = "💰 Registrar Entrada";
    categoriaSelect.innerHTML = `
            <option value="">Selecione...</option>
            <option value="venda">Venda de Produto</option>
            <option value="servico">Prestação de Serviço</option>
            <option value="outro">Outra Entrada</option>
        `;
  } else {
    tituloPagina.textContent = "💸 Registrar Saída";
    categoriaSelect.innerHTML = `
            <option value="">Selecione...</option>
            <option value="materiais">Compra de Materiais</option>
            <option value="estoque">Reposição de Estoque</option>
            <option value="conta">Conta (Água, Luz, Internet)</option>
            <option value="transporte">Transporte</option>
            <option value="outro">Outra Saída</option>
        `;
  }

  // Salvar lançamento
  document
    .getElementById("formLancamento")
    .addEventListener("submit", function (e) {
      e.preventDefault();

      const movimentacoes = buscarDados("movimentacoes");
      const novo = {
        id: Date.now(),
        tipo: tipoPagina,
        descricao: document.getElementById("descricao").value,
        valor: parseFloat(document.getElementById("valor").value),
        data: document.getElementById("data").value,
        categoria: document.getElementById("categoria").value,
      };

      movimentacoes.push(novo);
      salvarDados("movimentacoes", movimentacoes);

      alert("✅ Salvo com sucesso!");
      window.location.href = "index.html";
    });
}

// ==================== RESUMO MENSAL — resumo.html ====================
if (document.getElementById("mesAtual")) {
  let dataAtual = new Date();

  function formatarMesAno(data) {
    const meses = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];
    return `${meses[data.getMonth()]} / ${data.getFullYear()}`;
  }

  function atualizarResumo() {
    const mesAno = `${dataAtual.getFullYear()}-${String(dataAtual.getMonth() + 1).padStart(2, "0")}`;
    document.getElementById("mesAtual").textContent = formatarMesAno(dataAtual);

    const movimentacoes = buscarDados("movimentacoes").filter(
      (m) => extrairMesAno(m.data) === mesAno,
    );

    let totalEntradas = 0,
      totalSaidas = 0;
    movimentacoes.forEach((m) => {
      if (m.tipo === "entrada") totalEntradas += parseFloat(m.valor);
      else totalSaidas += parseFloat(m.valor);
    });
    const resultado = totalEntradas - totalSaidas;

    document.getElementById("totalEntradas").textContent =
      formatarDinheiro(totalEntradas);
    document.getElementById("totalSaidas").textContent =
      formatarDinheiro(totalSaidas);
    document.getElementById("resultadoMes").textContent =
      formatarDinheiro(resultado);

    const statusEl = document.getElementById("statusResultado");
    if (resultado > 0) {
      statusEl.textContent = "✅ LUCRO";
      document.getElementById("resultadoMes").style.color = "#27ae60";
    } else if (resultado < 0) {
      statusEl.textContent = "❌ PREJUÍZO";
      document.getElementById("resultadoMes").style.color = "#e74c3c";
    } else {
      statusEl.textContent = "— Equilibrado";
    }

    // Lista detalhada
    const listaEl = document.getElementById("listaResumo");
    if (movimentacoes.length === 0) {
      listaEl.innerHTML = '<p class="vazio">Sem lançamentos neste mês.</p>';
    } else {
      listaEl.innerHTML = movimentacoes
        .slice()
        .reverse()
        .map(
          (mov) => `
                <div class="item-mov ${mov.tipo}">
                    <div>
                        <strong>${mov.descricao}</strong><br>
                        <small>${formatarData(mov.data)}</small>
                    </div>
                    <div class="valor">
                        ${mov.tipo === "entrada" ? "+" : "-"} ${formatarDinheiro(mov.valor)}
                    </div>
                </div>
            `,
        )
        .join("");
    }
  }

  document.getElementById("mesAnterior").addEventListener("click", function () {
    dataAtual.setMonth(dataAtual.getMonth() - 1);
    atualizarResumo();
  });

  document.getElementById("proximoMes").addEventListener("click", function () {
    dataAtual.setMonth(dataAtual.getMonth() + 1);
    atualizarResumo();
  });

  atualizarResumo();
}

// ==================== CONTAS — contas.html ====================
if (document.getElementById("btnAdicionarConta")) {
  let tipoConta = "apagar"; // aba ativa inicial

  // Abas
  document.querySelectorAll(".aba").forEach((aba) => {
    aba.addEventListener("click", function () {
      document
        .querySelectorAll(".aba")
        .forEach((a) => a.classList.remove("ativa"));
      this.classList.add("ativa");
      tipoConta = this.getAttribute("data-alvo");
      atualizarListaContas();
    });
  });

  // Mostrar/ocultar formulário
  document
    .getElementById("btnAdicionarConta")
    .addEventListener("click", function () {
      document.getElementById("formConta").classList.remove("oculto");
      document.getElementById("contaData").valueAsDate = new Date();
    });

  document
    .getElementById("btnCancelarConta")
    .addEventListener("click", function () {
      document.getElementById("formConta").classList.add("oculto");
      document.getElementById("contaDescricao").value = "";
      document.getElementById("contaValor").value = "";
    });

  // Salvar conta
  document
    .querySelector("#formConta form")
    .addEventListener("submit", function (e) {
      e.preventDefault();

      const contas = buscarDados("contas");
      const novaConta = {
        id: Date.now(),
        tipo: tipoConta,
        descricao: document.getElementById("contaDescricao").value,
        valor: parseFloat(document.getElementById("contaValor").value),
        vencimento: document.getElementById("contaData").value,
        paga: false,
      };

      contas.push(novaConta);
      salvarDados("contas", contas);

      // Limpar e fechar formulário
      document.getElementById("formConta").classList.add("oculto");
      document.getElementById("contaDescricao").value = "";
      document.getElementById("contaValor").value = "";

      atualizarListaContas();
    });

  function atualizarListaContas() {
    const contas = buscarDados("contas")
      .filter((c) => c.tipo === tipoConta)
      .sort((a, b) => new Date(a.vencimento) - new Date(b.vencimento));
    const listaEl = document.getElementById("listaContas");

    if (contas.length === 0) {
      listaEl.innerHTML =
        '<p class="vazio">Nenhuma conta cadastrada ainda.</p>';
      return;
    }

    listaEl.innerHTML = contas
      .map(
        (conta) => `
            <div class="item-conta ${conta.paga ? "pago" : ""}">
                <div>
                    <strong>${conta.descricao}</strong><br>
                    ${formatarData(conta.vencimento)} — ${formatarDinheiro(conta.valor)}
                </div>
                <div>
                    <label>
                        <input type="checkbox" ${conta.paga ? "checked" : ""} onchange="alternarStatusConta(${conta.id})">
                        ${conta.paga ? "Paga" : "Pendente"}
                    </label>
                </div>
            </div>
        `,
      )
      .join("");
  }

  window.alternarStatusConta = function (id) {
    const contas = buscarDados("contas");
    const conta = contas.find((c) => c.id === id);
    if (conta) {
      conta.paga = !conta.paga;
      salvarDados("contas", contas);
      atualizarListaContas();
    }
  };

  atualizarListaContas();
}

console.log("✅ MEI Fácil — Sistema carregado com sucesso!");

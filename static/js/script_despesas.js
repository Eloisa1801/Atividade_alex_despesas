function adicionarDespesa() {
    // Capturar os dados do formulário
    var tipoDespesa = document.getElementById('tipoDespesa').value;
    var data = document.getElementById('data').value;
    var valorTotal = document.getElementById('valorTotal').value;
    var formaPagamento = document.getElementById('formaPagamento').value;

    // Validar se os campos obrigatórios foram preenchidos
    if (!tipoDespesa || !data || !valorTotal || !formaPagamento) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }

    // Adicionar uma nova linha à tabela
    var tabela = document.getElementById('tabelaDespesas').getElementsByTagName('tbody')[0];
    var novaLinha = tabela.insertRow(tabela.rows.length);
    var colunaTipoDespesa = novaLinha.insertCell(0);
    var colunaData = novaLinha.insertCell(1);
    var colunaValorTotal = novaLinha.insertCell(2);
    var colunaFormaPagamento = novaLinha.insertCell(3);

    // Preencher as colunas com os dados do formulário
    colunaTipoDespesa.innerHTML = tipoDespesa;
    colunaData.innerHTML = data;
    colunaValorTotal.innerHTML = valorTotal;
    colunaFormaPagamento.innerHTML = formaPagamento;

    // Limpar os campos do formulário
    document.getElementById('tipoDespesa').value = '';
    document.getElementById('data').value = '';
    document.getElementById('valorTotal').value = '';
    document.getElementById('formaPagamento').value = '';

    alert('Despesa adicionada com sucesso!');
}
// Função para filtrar a tabela com base nos critérios fornecidos
function filtrarTabela(coluna, valor) {
    var tabela = document.getElementById('tabelaDespesas');
    var linhas = tabela.getElementsByTagName('tbody')[0].getElementsByTagName('tr');

    for (var i = 0; i < linhas.length; i++) {
        var celula = linhas[i].getElementsByTagName('td')[getIndex(coluna)];
        if (celula) {
            var conteudo = celula.textContent || celula.innerText;
            if (conteudo.indexOf(valor) > -1) {
                linhas[i].style.display = '';
            } else {
                linhas[i].style.display = 'none';
            }
        }
    }
}

function getIndex(coluna) {
    var cabecalho = document.getElementById('tabelaDespesas').getElementsByTagName('thead')[0].getElementsByTagName('tr')[0];
    for (var i = 0; i < cabecalho.getElementsByTagName('th').length; i++) {
        if (cabecalho.getElementsByTagName('th')[i].getAttribute('coluna') === coluna) {
            return i;
        }
    }
    return -1;
}
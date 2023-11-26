function adicionarDespesa() {
    // Capturar os dados do formulário
    var tipoDespesa = document.getElementById('tipoDespesa').value;
    var data = document.getElementById('data').value;
    var valorTotal = document.getElementById('valorTotal').value;
    var formaPagamento = document.getElementById('formaPagamento').value;
    var observacoes = document.getElementById('observacoes').value;
    var imagem = document.getElementById('imagem').value;
    var imagemInput = document.getElementById('imagem');
    var imagemArquivo = imagemInput.files[0];

    // Validar se os campos obrigatórios foram preenchidos
    if (!tipoDespesa || !data || !valorTotal || !formaPagamento) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }

    // Verificar se uma imagem foi selecionada
    if (imagemArquivo) {
        // Criar um objeto FormData para enviar a imagem
        var formData = new FormData();
        formData.append('imagem', imagemArquivo);

        // Enviar a imagem para o servidor usando fetch API
        fetch('/processar_imagem', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            // Aqui você pode lidar com os dados processados do servidor
            console.log('Texto extraído da imagem:', data.texto_extraido);
            // Agora você pode processar data.texto_extraido para extrair informações específicas
        })
        .catch(error => {
            console.error('Erro ao processar a imagem:', error);
        });
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

    var emailUsuarioElement = document.getElementById('user-email');
    var emailUsuario = emailUsuarioElement ? emailUsuarioElement.getAttribute('data-email') : null;


    // Montar objeto com os dados do formulário
    var despesaData = {
        email: emailUsuario,
        tipoDespesa: tipoDespesa,
        data: data,
        valorTotal: valorTotal,
        formaPagamento: formaPagamento,
        observacoes: observacoes,
        imagem: imagem
    };

    // Enviar dados para o servidor usando fetch API
    fetch('/adicionar_despesa', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(despesaData),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Sucesso:', data);
    })
    .catch((error) => {
        console.error('Erro:', error);
    });

    // Limpar os campos do formulário
    document.getElementById('tipoDespesa').value = '';
    document.getElementById('data').value = '';
    document.getElementById('valorTotal').value = '';
    document.getElementById('formaPagamento').value = '';
    document.getElementById('observacoes').value = '';
    document.getElementById('imagem').value = '';

    alert('Despesa adicionada com sucesso!');
}


// Adiciona as informações extraídas ao formulário
function preencherFormulario(data, valor, formaPagamento) {
    // Função para converter o formato da data
    function converterFormatoData(data) {
        const partesData = data.split('/');
        if (partesData.length === 3) {
            return `${partesData[2]}-${partesData[1]}-${partesData[0]}`;
        }
        return data;
    }

    // Preencher os campos do formulário com os dados extraídos
    document.getElementById('data').value = converterFormatoData(data) || '';
    document.getElementById('valorTotal').value = valor || '';
    
    // Mapear a forma de pagamento extraída para o valor no seu formulário (ajuste conforme necessário)
    const formaPagamentoMapping = {
        'DINHEIRO': 'dinheiro',
        'CARTAO': 'credito',
        'CHEQUE': 'cheque',
        'PIX': 'pix',
        'DEBITO': 'debito',
        'CREDITO': 'credito',
        'TRANSFERENCIA': 'transferencia'
    };

    const formaPagamentoFormulario = formaPagamentoMapping[formaPagamento] || 'outro';
    document.getElementById('formaPagamento').value = formaPagamentoFormulario;

    adicionarDespesa();
}


// Função para processar a imagem e preencher o formulário
function processarImagem() {
    const imagemInput = document.getElementById('imagem');

    // Criar um objeto FormData para enviar o arquivo de imagem
    const formData = new FormData();
    formData.append('imagem', imagemInput.files[0]);

    // Fazer uma requisição AJAX para a rota /processar_imagem
    fetch('/processar_imagem', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        // Chamar a função para adicionar as informações ao formulário
        preencherFormulario(data.data, data.valor, data.forma_pagamento);
    })
    .catch(error => console.error('Erro ao processar imagem:', error));
}

// Adiciona um ouvinte de eventos para chamar a função processarImagem quando uma imagem é selecionada
document.getElementById('imagem').addEventListener('change', processarImagem);

// Função para atualizar a tabela com as despesas
function atualizarTabela(emailUsuario) {
    // Enviar uma solicitação GET para obter os registros do servidor
    fetch(`/get_despesas?email=${emailUsuario}`)
        .then(response => response.json())
        .then(data => {
            // Converter o JSON retornado para uma lista
            var registros = JSON.parse(data);

            // Verificar se registros é uma lista antes de iterar sobre ela
            if (Array.isArray(registros)) {
                // Limpar a tabela antes de adicionar os novos registros
                var tabela = document.getElementById('tabelaDespesas').getElementsByTagName('tbody')[0];
                tabela.innerHTML = '';

                // Adicionar cada registro à tabela
                registros.forEach(function (registro) {
                    var novaLinha = tabela.insertRow(tabela.rows.length);
                    var colunaTipoDespesa = novaLinha.insertCell(0);
                    var colunaData = novaLinha.insertCell(1);
                    var colunaValorTotal = novaLinha.insertCell(2);
                    var colunaFormaPagamento = novaLinha.insertCell(3);

                    // Preencher as colunas com os dados do registro
                    colunaTipoDespesa.innerHTML = registro.tipoDespesa;
                    colunaData.innerHTML = registro.data;
                    colunaValorTotal.innerHTML = registro.valorTotal;
                    colunaFormaPagamento.innerHTML = registro.formaPagamento;
                });
            }
        })
        .catch(error => console.error('Erro:', error));
}

// Agendar a execução da função quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", function () {
    // Verificar se o elemento com o ID 'user-email' existe
    var emailUsuarioElement = document.getElementById('user-email');
    if (!emailUsuarioElement) {
        console.error("Elemento 'user-email' não encontrado.");
        return;
    }

    // Obter o valor do atributo 'data-email'
    var emailUsuario = emailUsuarioElement.getAttribute('data-email');

    // Chamar a função atualizarTabela com os dados do usuário
    atualizarTabela(emailUsuario);
});


// Função para filtrar a tabela
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
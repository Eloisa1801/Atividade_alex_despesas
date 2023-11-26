from flask import Flask, render_template, request, redirect, url_for, jsonify
from flask_login import LoginManager, UserMixin, login_required, login_user, current_user
from bson import json_util
from pymongo import MongoClient
from bson import ObjectId
from PIL import Image
from io import BytesIO
from werkzeug.utils import secure_filename
import os
import pytesseract
import re

pytesseract.pytesseract.tesseract_cmd = 'C:\\Program Files\\Tesseract-OCR\\tesseract.exe'

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'jpg', 'jpeg', 'png', 'gif', 'bmp'}

app = Flask(__name__)
app.secret_key = 'eloisa7453021264'
login_manager = LoginManager(app)
login_manager.login_view = 'login'

# Conectar ao banco de dados MongoDB
client = MongoClient("mongodb+srv://eloisalds6:7453021264@cluster0.gn3bdwj.mongodb.net/")
db = client.dados_despesas

@app.route('/')
def index():
    return render_template('login.html')

@app.route('/despesas', methods=['GET', 'POST'])
@login_required
def despesas():
    user = current_user
    registros = obter_registros_do_banco(user.email)
    if request.method == 'GET':
        email_login = request.args.get('email_login')
        return render_template('despesas.html', email_login=user.email, registros=registros)
    elif request.method == 'POST':
        data = request.json

        # Inserir os dados no banco de dados
        despesas = db.registros
        despesas.insert_one(data)
        return jsonify({'message': 'Despesa adicionada com sucesso!'})
    

def obter_registros_do_banco(email_usuario):
    registros = db.registros.find({'email': email_usuario})
    # Converta os resultados do cursor MongoDB para uma lista Python
    registros_list = list(registros)
    registros_json = json_util.dumps(registros_list)
    
    return registros_json


@app.route('/cadastro')
def cadastro():
    return render_template('cadastro.html')

@login_manager.user_loader
def load_user(user_id):
    user_id = ObjectId(user_id)
    
    # Consulte o banco de dados para obter o usuário pelo ID
    user_data = db.usuarios.find_one({'_id': user_id})

    if user_data:
        # Se o usuário for encontrado, crie um objeto User e retorne
        user = User(user_data['_id'], user_data['nome'], user_data['email'])
        return user
    else:
        return None
    

class User(UserMixin):
    def __init__(self, user_id, nome, email):
        self.id = str(user_id)
        self.nome = nome
        self.email = email

@app.route('/cadastro', methods=['POST'])
def cadastrar_usuario():
    if request.method == 'POST':
        nome = request.form['nome_usuario']
        email = request.form['email_usuario']
        senha = request.form['senha_usuario']

        # Verificar campos obrigatórios
        if not nome or not email or not senha:
            return render_template('cadastro.html', error='Por favor, preencha todos os campos.')

        # Verificar formato de e-mail válido
        if not re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$', email):
            return render_template('cadastro.html', error='Formato de e-mail inválido.')

        # Verificar se o e-mail já existe no banco de dados
        if db.usuarios.find_one({'email': email}):
            return render_template('cadastro.html', error='Este e-mail já está cadastrado. Tente outro.')

        # Se o e-mail não existe, prosseguir com o cadastro
        novo_usuario = {
            'nome': nome,
            'email': email,
            'senha': senha
        }
        db.usuarios.insert_one(novo_usuario)

        return render_template('login.html', success='Usuário cadastrado com sucesso!')
    
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email_digitado = request.form['email_login']
        senha_digitada = request.form['senha_login']

        if not email_digitado or not senha_digitada:
            return render_template('login.html', error='Por favor, preencha todos os campos.')

        if not re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$', email_digitado):
            return render_template('login.html', error='Formato de e-mail inválido.')

        # Verificar as credenciais no banco de dados
        usuario = db.usuarios.find_one({'email': email_digitado, 'senha': senha_digitada})

        if usuario:
            # Credenciais válidas, redirecionar para a página de despesas
            login_user(User(usuario['_id'], usuario['nome'], usuario['email']))
            return redirect(url_for('despesas', email_login=usuario['email']))
        else:
            # Credenciais inválidas, redirecionar de volta para a página de login com mensagem de erro
            return render_template('login.html', error='Credenciais inválidas')

    return render_template('login.html')
        
            
@app.route('/adicionar_despesa', methods=['POST'])
def adicionar_despesa():
    data = request.json
    data['email'] = current_user.email
    print("Dados recebidos:", data)
    # Inserir os dados no banco de dados
    despesas = db.registros
    despesas.insert_one(data)

    return jsonify({'message': 'Despesa adicionada com sucesso!'})


@app.route('/get_despesas', methods=['GET'])
@login_required
def get_despesas():
    # Obtém o usuário atualmente logado
    user = current_user

    # Adicione o código para obter os registros relacionados ao usuário do banco de dados
    registros = obter_registros_do_banco(user.email)

    # Converte os registros para um formato JSON e envia como resposta
    return jsonify(registros)


@app.route('/processar_imagem', methods=['POST'])
def processar_imagem():
    try:
        imagem_arquivo = request.files['imagem']

        # Verificar se um arquivo de imagem foi enviado
        if imagem_arquivo and allowed_file(imagem_arquivo.filename):
            # Ler a imagem
            imagem_pil = Image.open(imagem_arquivo)

            # Extrair texto da imagem usando Tesseract OCR
            texto_extraido = pytesseract.image_to_string(imagem_pil)

           
            print('Texto extraído da imagem:', texto_extraido)
            
            # Expressões regulares para extrair data, valor e forma de pagamento
            padrao_data = re.compile(r'\b\d{2}/\d{2}/\d{4}\b')
            padrao_valor = re.compile(r'R\$\s*(\d+\,\d{2})')
            padrao_forma_pagamento = re.compile(r'(DINHEIRO|CARTAO|CHEQUE|PIX|DEBITO|CREDITO|TRANSFERENCIA)')

            # Encontrar correspondências nos padrões
            data_correspondencia = padrao_data.search(texto_extraido)
            valor_correspondencia = padrao_valor.search(texto_extraido)
            forma_pagamento_correspondencia = padrao_forma_pagamento.search(texto_extraido)

            # Extrair os valores correspondentes
            data = data_correspondencia.group() if data_correspondencia else None
            valor = valor_correspondencia.group(1) if valor_correspondencia else None
            forma_pagamento = forma_pagamento_correspondencia.group(1) if forma_pagamento_correspondencia else None

            # Retornar as informações extraídas como JSON
            return jsonify({
                'data': data,
                'valor': valor,
                'forma_pagamento': forma_pagamento
            })

    except Exception as e:
        print(f'Erro ao processar imagem: {str(e)}')

        return jsonify({'error': f'Erro ao processar imagem: {str(e)}'}), 500

    return jsonify({'error': 'Arquivo de imagem inválido'}), 400

        
if __name__ == '__main__':
    app.run(debug=True)

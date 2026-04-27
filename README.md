🐶 PetDelivery - Supabase + ViaCEP

📌 Descrição

Sistema de cadastro de clientes e agendamentos para um petshop com validação de endereço via CEP utilizando a API ViaCEP.

🚀 Tecnologias utilizadas

- JavaScript (Fetch API)
- Supabase (PostgreSQL + REST)
- ViaCEP API

⚙️ Funcionalidades

- Cadastro de cliente com validação de CEP
- Validação de cidade atendida
- Cadastro de endereço automático
- Listagem de agendamentos
- Filtro por tipo de serviço
- Remoção de agendamentos antigos

🛠️ Como executar

1. Clone o repositório:

git clone https://github.com/seu-usuario/petdelivery-supabase-viacep.git

2. Configure:

- Adicione sua URL e KEY do Supabase no arquivo "script.js"

3. Execute:

- Abra o "index.html" no navegador

📝 Exemplos de uso

cadastrarClienteComEndereco("João", "22999999999", "27910000");
listarAgendamentos("Banho");
deletarAgendamentosAntigos();

📌 Commits sugeridos

- feat: estrutura do banco
- feat: integracao viacep
- feat: cadastro cliente com endereco
- feat: listagem e filtro de agendamentos
- fix: correcao no delete
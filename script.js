const SUPABASE_URL = "https://wmveuoeerfillhahimco.supabase.co";
const SUPABASE_KEY = "sb_publishable_XblHgoTVicFryKf8maM_jg_8FQ4v-UD";

const HEADERS = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation" // OBRIGATÓRIO para retornar o ID após o POST
};

const CIDADES_ATENDIDAS = [
  "São Paulo",
  "Rio de Janeiro",
  "Belo Horizonte",
  "Curitiba",
  "Porto Alegre"
];

// --- FUNÇÕES DE APOIO ---

async function obterDadosPorCep(cep) {
  // Remove hífens ou espaços antes de consultar
  const cepLimpo = cep.replace(/\D/g, '');
  const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
  const dados = await resposta.json();

  if (dados.erro) {
    throw new Error("CEP não encontrado no banco de dados do ViaCEP.");
  }

  return dados;
}

// --- FUNÇÕES PRINCIPAIS ---

async function cadastrarClienteComEndereco(nome, telefone, email, cep) {
  try {
    // 1. Validação de CEP e Cidade
    const endereco = await obterDadosPorCep(cep);

    const cidadeAtendida = CIDADES_ATENDIDAS.some(
      c => c.toLowerCase() === endereco.localidade.toLowerCase()
    );

    if (!cidadeAtendida) {
      throw new Error(`Infelizmente ainda não atendemos a cidade de ${endereco.localidade}.`);
    }

    // 2. Cadastro do Cliente
    const resCliente = await fetch(`${SUPABASE_URL}/rest/v1/clientes`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({ nome, telefone, email })
    });

    const clienteCriado = await resCliente.json();

    if (!clienteCriado || clienteCriado.length === 0) {
      throw new Error("Erro ao salvar cliente. Verifique se as permissões (RLS) no Supabase estão liberadas.");
    }

    const clienteId = clienteCriado[0].id;

    // 3. Cadastro do Endereço (vinculado ao ID do cliente)
    const resEndereco = await fetch(`${SUPABASE_URL}/rest/v1/enderecos_clientes`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({
        cliente_id: clienteId,
        cep: endereco.cep,
        rua: endereco.logradouro,
        bairro: endereco.bairro,
        cidade: endereco.localidade
      })
    });

    if (!resEndereco.ok) {
      throw new Error("Cliente cadastrado, mas houve um erro ao salvar o endereço.");
    }

    return { sucesso: true, cliente: clienteCriado[0] };

  } catch (erro) {
    console.error("Falha na operação:", erro.message);
    throw erro; // Repassa o erro para ser tratado na UI
  }
}

// --- FUNÇÃO PARA CRIAR AGENDAMENTO ---

async function criarAgendamento(clienteId, servico, dataHora) {
    try {
        // 1. Verificar se o cliente existe antes de agendar
        const resVerificacao = await fetch(`${SUPABASE_URL}/rest/v1/clientes?id=eq.${clienteId}`, {
            method: "GET",
            headers: HEADERS
        });
        
        const clienteExiste = await resVerificacao.json();

        if (!clienteExiste || clienteExiste.length === 0) {
            throw new Error("ID de cliente não encontrado. Cadastre o cliente primeiro!");
        }

        // 2. Se o cliente existe, cria o agendamento
        const resAgendamento = await fetch(`${SUPABASE_URL}/rest/v1/agendamentos`, {
            method: "POST",
            headers: HEADERS,
            body: JSON.stringify({
                cliente_id: clienteId,
                servico: servico,
                data_agendamento: dataHora
            })
        });

        if (!resAgendamento.ok) throw new Error("Erro ao salvar agendamento.");

        return true;
    } catch (erro) {
        throw erro;
    }
}

// --- LOGICA DE CONEXÃO COM O NOVO FORMULÁRIO ---
// Adicione isso dentro do seu document.addEventListener('DOMContentLoaded', ...)
const formAgenda = document.getElementById('formAgendamento');
if (formAgenda) {
    formAgenda.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        
        const id = document.getElementById('agenda_cliente_id').value;
        const servico = document.getElementById('agenda_servico').value;
        const data = document.getElementById('agenda_data').value;

        btn.innerText = "Agendando...";
        try {
            await criarAgendamento(id, servico, data);
            alert("📅 Agendamento realizado com sucesso!");
            formAgenda.reset();
            if (window.uiListar) window.uiListar(); // Atualiza a tabela automaticamente
        } catch (erro) {
            alert("❌ " + erro.message);
        } finally {
            btn.innerText = "Confirmar Agendamento";
        }
    });
}
async function listarAgendamentos(servico = null) {
  let url = `${SUPABASE_URL}/rest/v1/agendamentos?select=*,clientes(nome)`;

  if (servico) {
    url += `&servico=eq.${servico}`;
  }

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: HEADERS
    });
    const dados = await res.json();
    return dados;
  } catch (erro) {
    console.error("Erro ao listar:", erro);
    return [];
  }
}
async function deletarAgendamentosAntigos() {
  const hoje = new Date().toISOString();

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/agendamentos?data_agendamento=lt.${hoje}`, {
      method: "DELETE",
      headers: HEADERS
    });
    console.log("Agendamentos antigos removidos!");
  } catch (erro) {
    console.error("Erro ao deletar:", erro);
  }
}

// --- CONEXÃO COM O HTML (EVENT LISTENERS) ---

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formCadastro');
  const btn = document.getElementById('btnCadastrar');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); // Impede a página de recarregar
      
      // Captura os valores no momento do clique
      const nome = document.getElementById('nome').value;
      const telefone = document.getElementById('telefone').value;
      const email = document.getElementById('email').value;
      const cep = document.getElementById('cep').value;

      // Feedback visual simples
      if(btn) btn.innerText = "Cadastrando...";
      
      try {
        await cadastrarClienteComEndereco(nome, telefone, email, cep);
        alert("✨ Sucesso! Cliente cadastrado com endereço confirmado.");
        form.reset();
      } catch (erro) {
        alert("⚠️ Atenção: " + erro.message);
      } finally {
        if(btn) btn.innerText = "Cadastrar Cliente";
      }
    });
  }
});
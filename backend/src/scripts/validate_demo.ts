const API_BASE = 'http://127.0.0.1:3000/api';

async function fetchJson(url: string, options: any = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`HTTP ${res.status}: ${errorBody}`);
  }
  return res.json();
}

async function validate() {
  console.log('=== INICIANDO VALIDAÇÃO COMPLETA DA BASE DE DEMO ===\n');

  try {
    // 1. Test Admin Login
    console.log('1. Testando Login como Administrador (admin / admin123)...');
    const adminLoginRes = await fetchJson(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    const adminToken = adminLoginRes.token;
    console.log('✔ Login Admin realizado com sucesso! Token obtido:', adminToken.substring(0, 15) + '...');
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // 2. Test Technician Login
    console.log('\n2. Testando Login como Técnico (lucas.martins / password123)...');
    const techLoginRes = await fetchJson(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        username: 'lucas.martins',
        password: 'password123'
      })
    });
    console.log('✔ Login Técnico realizado com sucesso! Nome:', techLoginRes.user.name);

    // 3. Test Regular User Login
    console.log('\n3. Testando Login como Usuário (ana.souza / password123)...');
    const userLoginRes = await fetchJson(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        username: 'ana.souza',
        password: 'password123'
      })
    });
    console.log('✔ Login Usuário realizado com sucesso! Nome:', userLoginRes.user.name);

    // 4. Test Analytics Endpoint (Dashboard)
    console.log('\n4. Testando Endpoint de Analytics (/api/analytics)...');
    const analytics = await fetchJson(`${API_BASE}/analytics`, { headers: adminHeaders });
    console.log('✔ Resposta de Analytics recebida:');
    console.log('- Tempo Médio de Resolução:', analytics.avgResolutionTime, 'horas');
    console.log('- Top Usuários com mais Chamados:', JSON.stringify(analytics.topUserOpen, null, 2));
    console.log('- Top Técnicos com mais Resoluções:', JSON.stringify(analytics.topTechResolve, null, 2));
    console.log('- Frequência por Categoria:', JSON.stringify(analytics.categoryFreq, null, 2));

    // 5. Test Tickets List
    console.log('\n5. Testando Endpoint de Chamados (/api/tickets)...');
    const tickets = await fetchJson(`${API_BASE}/tickets`, { headers: adminHeaders });
    console.log(`✔ Total de Chamados retornados: ${tickets.length}`);

    const statusCounts: Record<string, number> = {};
    const priorityCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};
    const authorCounts: Record<string, number> = {};
    const techCounts: Record<string, number> = {};

    tickets.forEach((t: any) => {
      statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
      priorityCounts[t.priority] = (priorityCounts[t.priority] || 0) + 1;
      categoryCounts[t.category?.name || 'Sem categoria'] = (categoryCounts[t.category?.name || 'Sem categoria'] || 0) + 1;
      authorCounts[t.author?.name || 'Desconhecido'] = (authorCounts[t.author?.name || 'Desconhecido'] || 0) + 1;
      if (t.assignedTo) {
        techCounts[t.assignedTo.name] = (techCounts[t.assignedTo.name] || 0) + 1;
      }
    });

    console.log('- Distribuição por Status:', statusCounts);
    console.log('- Distribuição por Prioridade:', priorityCounts);
    console.log('- Distribuição por Categoria:', categoryCounts);
    console.log('- Distribuição por Autor (Usuário):', authorCounts);
    console.log('- Chamados Atribuídos por Técnico:', techCounts);

    // 6. Test Users Management
    console.log('\n6. Testando Gerenciamento de Usuários (/api/admin/users)...');
    const users = await fetchJson(`${API_BASE}/admin/users`, { headers: adminHeaders });
    console.log(`✔ Total de Usuários cadastrados: ${users.length}`);
    users.forEach((u: any) => {
      console.log(`  • ${u.name} (${u.username}) - Perfil: ${u.role} - Email: ${u.email} - Especialidades: ${u.specialties?.map((s: any) => s.name).join(', ') || 'Nenhuma'}`);
    });

    // 7. Test Categories Management
    console.log('\n7. Testando Listagem de Categorias (/api/categories)...');
    const categories = await fetchJson(`${API_BASE}/categories`, { headers: adminHeaders });
    console.log(`✔ Total de Categorias cadastradas: ${categories.length}`);
    categories.forEach((c: any) => {
      console.log(`  • ${c.name}: ${c.description}`);
    });

    // 8. Test Settings
    console.log('\n8. Testando Configurações (/api/settings)...');
    const settings = await fetchJson(`${API_BASE}/settings`, { headers: adminHeaders });
    console.log('✔ Configurações atuais:', settings);

    // 9. Strict Content Verification
    console.log('\n9. Verificação Rigorosa de Conteúdo Proibido...');
    const allDataStr = JSON.stringify({ tickets, users, categories, analytics });
    const forbiddenTerms = [
      'Camilo',
      'Tozzi',
      'fastworkps',
      'tozzicc@gmail.com',
      'Protheus',
      '"Teste"',
      '"Teste 2"',
      '"Teste 3"'
    ];

    let foundForbidden = false;
    for (const term of forbiddenTerms) {
      if (allDataStr.toLowerCase().includes(term.toLowerCase())) {
        console.error(`❌ ALERTA: Termo proibido encontrado: "${term}"`);
        foundForbidden = true;
      }
    }

    if (!foundForbidden) {
      console.log('✔ NENHUM dado pessoal, termo de teste ou referência antiga foi encontrado na base!');
    }

    console.log('\n=== VALIDAÇÃO CONCLUÍDA COM SUCESSO! ===');

  } catch (error: any) {
    console.error('Erro na validação:', error.response?.data || error.message);
    process.exit(1);
  }
}

validate();

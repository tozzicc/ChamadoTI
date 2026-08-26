import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function connectWithRetry(retries = 5, delay = 2000) {
  for (let i = 1; i <= retries; i++) {
    try {
      console.log(`Tentativa ${i} de conexão com o banco de dados...`);
      await prisma.$connect();
      console.log('Conectado com sucesso!');
      return;
    } catch (err: any) {
      console.warn(`Tentativa ${i} falhou:`, err.message || err);
      if (i === retries) throw err;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

async function runSeed() {
  try {
    await connectWithRetry();

    console.log('Limpando dados anteriores...');
    await prisma.attachment.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
    await prisma.settings.deleteMany();

    console.log('Criando configurações padrão...');
    await prisma.settings.create({
      data: {
        id: 1,
        appName: 'Chamado TI',
        logoPath: null,
        smtpHost: null,
        smtpPort: null,
        smtpUser: null,
        smtpPass: null,
        smtpSecure: false,
        visibleCharts: JSON.stringify(['user_open', 'tech_resolve', 'resolution_time', 'category_freq']),
        defaultChartType: 'BAR'
      }
    });

    console.log('Criando categorias fictícias...');
    const categoriesData = [
      { name: 'Hardware', description: 'Problemas relacionados a computadores, monitores e periféricos.' },
      { name: 'Software', description: 'Instalação, atualização e problemas em aplicativos.' },
      { name: 'Rede e Internet', description: 'Problemas de conexão, Wi-Fi e acesso à rede.' },
      { name: 'Acessos e Permissões', description: 'Solicitações de usuários, senhas e permissões.' },
      { name: 'Impressoras', description: 'Problemas de impressão e configuração de equipamentos.' },
      { name: 'Sistemas', description: 'Dúvidas e problemas relacionados aos sistemas corporativos.' }
    ];

    const categoryMap = new Map<string, number>();
    for (const cat of categoriesData) {
      const created = await prisma.category.create({ data: cat });
      categoryMap.set(cat.name, created.id);
    }

    console.log('Criando usuários fictícios...');
    const defaultPasswordHash = await bcrypt.hash('admin123', 10);
    const userPasswordHash = await bcrypt.hash('password123', 10);

    // 1. Admin
    const admin = await prisma.user.create({
      data: {
        name: 'Administrador',
        username: 'admin',
        email: 'admin@empresa.demo',
        password: defaultPasswordHash,
        role: 'ADMIN',
        isActive: true
      }
    });

    // 2. Technicians
    const techLucas = await prisma.user.create({
      data: {
        name: 'Lucas Martins',
        username: 'lucas.martins',
        email: 'lucas.martins@empresa.demo',
        password: userPasswordHash,
        role: 'TECHNICIAN',
        isActive: true,
        specialties: {
          connect: [
            { id: categoryMap.get('Hardware')! },
            { id: categoryMap.get('Impressoras')! },
            { id: categoryMap.get('Rede e Internet')! }
          ]
        }
      }
    });

    const techMariana = await prisma.user.create({
      data: {
        name: 'Mariana Costa',
        username: 'mariana.costa',
        email: 'mariana.costa@empresa.demo',
        password: userPasswordHash,
        role: 'TECHNICIAN',
        isActive: true,
        specialties: {
          connect: [
            { id: categoryMap.get('Software')! },
            { id: categoryMap.get('Sistemas')! },
            { id: categoryMap.get('Acessos e Permissões')! }
          ]
        }
      }
    });

    const techRafael = await prisma.user.create({
      data: {
        name: 'Rafael Oliveira',
        username: 'rafael.oliveira',
        email: 'rafael.oliveira@empresa.demo',
        password: userPasswordHash,
        role: 'TECHNICIAN',
        isActive: true,
        specialties: {
          connect: [
            { id: categoryMap.get('Rede e Internet')! },
            { id: categoryMap.get('Sistemas')! },
            { id: categoryMap.get('Hardware')! }
          ]
        }
      }
    });

    // 3. Regular Users
    const userAna = await prisma.user.create({
      data: {
        name: 'Ana Souza',
        username: 'ana.souza',
        email: 'ana.souza@empresa.demo',
        password: userPasswordHash,
        role: 'USER',
        isActive: true
      }
    });

    const userBruno = await prisma.user.create({
      data: {
        name: 'Bruno Almeida',
        username: 'bruno.almeida',
        email: 'bruno.almeida@empresa.demo',
        password: userPasswordHash,
        role: 'USER',
        isActive: true
      }
    });

    const userCarla = await prisma.user.create({
      data: {
        name: 'Carla Mendes',
        username: 'carla.mendes',
        email: 'carla.mendes@empresa.demo',
        password: userPasswordHash,
        role: 'USER',
        isActive: true
      }
    });

    const userFelipe = await prisma.user.create({
      data: {
        name: 'Felipe Santos',
        username: 'felipe.santos',
        email: 'felipe.santos@empresa.demo',
        password: userPasswordHash,
        role: 'USER',
        isActive: true
      }
    });

    const userJuliana = await prisma.user.create({
      data: {
        name: 'Juliana Rocha',
        username: 'juliana.rocha',
        email: 'juliana.rocha@empresa.demo',
        password: userPasswordHash,
        role: 'USER',
        isActive: true
      }
    });

    console.log('Criando chamados fictícios distribuídos...');
    const now = new Date();

    const getPastDate = (daysAgo: number, hoursOffset = 0) => {
      const d = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000) - (hoursOffset * 60 * 60 * 1000));
      return d;
    };

    const ticketsData = [
      // 1. Fechado - Bruno - Rede e Internet - Rafael
      {
        title: 'Computador não conecta à rede',
        description: 'A estação de trabalho do setor comercial perdeu a conexão com o cabo de rede. Foi realizada a troca do conector RJ45 e testado o ponto de rede, restabelecendo o sinal.',
        status: 'CLOSED' as const,
        priority: 'HIGH' as const,
        categoryId: categoryMap.get('Rede e Internet')!,
        authorId: userBruno.id,
        assignedToId: techRafael.id,
        daysAgo: 24,
        resolutionHours: 2.5
      },
      // 2. Fechado - Ana - Acessos - Mariana
      {
        title: 'Solicitação de acesso ao sistema financeiro',
        description: 'Necessário perfil de consulta no módulo financeiro para o novo assistente. Acesso liberado conforme aprovação da gerência.',
        status: 'CLOSED' as const,
        priority: 'MEDIUM' as const,
        categoryId: categoryMap.get('Acessos e Permissões')!,
        authorId: userAna.id,
        assignedToId: techMariana.id,
        daysAgo: 22,
        resolutionHours: 1.8
      },
      // 3. Fechado - Carla - Impressoras - Lucas
      {
        title: 'Impressora do financeiro não imprime',
        description: 'Fila de impressão travada e papel encravado no alimentador traseiro. Realizada a limpeza dos roletes e reiniciado o spooler de impressão.',
        status: 'CLOSED' as const,
        priority: 'HIGH' as const,
        categoryId: categoryMap.get('Impressoras')!,
        authorId: userCarla.id,
        assignedToId: techLucas.id,
        daysAgo: 20,
        resolutionHours: 3.2
      },
      // 4. Fechado - Felipe - Hardware - Lucas
      {
        title: 'Notebook apresentando lentidão excessiva',
        description: 'Notebook demorando para inicializar e abrir aplicações. Realizada desfragmentação, limpeza de arquivos temporários e otimização dos serviços de inicialização.',
        status: 'CLOSED' as const,
        priority: 'MEDIUM' as const,
        categoryId: categoryMap.get('Hardware')!,
        authorId: userFelipe.id,
        assignedToId: techLucas.id,
        daysAgo: 18,
        resolutionHours: 4.5
      },
      // 5. Fechado - Juliana - Software - Mariana
      {
        title: 'Instalação do pacote de ferramentas de design',
        description: 'Solicitada instalação e ativação da licença corporativa dos editores gráficos para criação de materiais promocionais.',
        status: 'CLOSED' as const,
        priority: 'LOW' as const,
        categoryId: categoryMap.get('Software')!,
        authorId: userJuliana.id,
        assignedToId: techMariana.id,
        daysAgo: 16,
        resolutionHours: 1.2
      },
      // 6. Fechado - Bruno - Acessos - Mariana
      {
        title: 'Usuário sem acesso à pasta compartilhada de Projetos',
        description: 'Permissão de leitura e gravação concedida no servidor de arquivos para o diretório corporativo de Projetos.',
        status: 'CLOSED' as const,
        priority: 'MEDIUM' as const,
        categoryId: categoryMap.get('Acessos e Permissões')!,
        authorId: userBruno.id,
        assignedToId: techMariana.id,
        daysAgo: 15,
        resolutionHours: 0.9
      },
      // 7. Fechado - Ana - Hardware - Rafael
      {
        title: 'Monitor secundário sem sinal de vídeo',
        description: 'Segundo monitor parou de reconhecer a entrada HDMI. Cabo substituído e resolução reconfigurada no Windows.',
        status: 'CLOSED' as const,
        priority: 'LOW' as const,
        categoryId: categoryMap.get('Hardware')!,
        authorId: userAna.id,
        assignedToId: techRafael.id,
        daysAgo: 13,
        resolutionHours: 1.5
      },
      // 8. Fechado - Carla - Rede e Internet - Rafael
      {
        title: 'Wi-Fi instável na sala de reuniões principal',
        description: 'Quedas intermitentes durante videoconferências. Ponto de acesso reiniciado, firmware atualizado e canal de transmissão ajustado para diminuir interferências.',
        status: 'CLOSED' as const,
        priority: 'HIGH' as const,
        categoryId: categoryMap.get('Rede e Internet')!,
        authorId: userCarla.id,
        assignedToId: techRafael.id,
        daysAgo: 11,
        resolutionHours: 5.0
      },
      // 9. Fechado - Juliana - Sistemas - Mariana
      {
        title: 'Erro ao exportar relatórios no sistema corporativo',
        description: 'Falha de timeout ao gerar relatórios consolidados em Excel. Ajustado o tempo limite de consulta e índices no banco do sistema.',
        status: 'CLOSED' as const,
        priority: 'HIGH' as const,
        categoryId: categoryMap.get('Sistemas')!,
        authorId: userJuliana.id,
        assignedToId: techMariana.id,
        daysAgo: 9,
        resolutionHours: 3.5
      },
      // 10. Fechado - Felipe - Hardware - Lucas
      {
        title: 'Configuração de novo computador para colaborador',
        description: 'Setup completo de nova máquina: instalação do sistema operacional padrão, ingresso no domínio, antivírus e softwares essenciais.',
        status: 'CLOSED' as const,
        priority: 'MEDIUM' as const,
        categoryId: categoryMap.get('Hardware')!,
        authorId: userFelipe.id,
        assignedToId: techLucas.id,
        daysAgo: 8,
        resolutionHours: 6.0
      },
      // 11. Fechado - Bruno - Acessos - Mariana
      {
        title: 'Problema com senha de acesso expirada',
        description: 'Conta bloqueada após tentativas com senha antiga. Senha temporária redefinida e primeiro login orientado.',
        status: 'CLOSED' as const,
        priority: 'MEDIUM' as const,
        categoryId: categoryMap.get('Acessos e Permissões')!,
        authorId: userBruno.id,
        assignedToId: techMariana.id,
        daysAgo: 6,
        resolutionHours: 0.5
      },
      // 12. Fechado - Carla - Software - Lucas
      {
        title: 'Atualização do software de contabilidade',
        description: 'Instalação da versão mais recente com correções fiscais nos computadores da equipe contábil.',
        status: 'CLOSED' as const,
        priority: 'LOW' as const,
        categoryId: categoryMap.get('Software')!,
        authorId: userCarla.id,
        assignedToId: techLucas.id,
        daysAgo: 5,
        resolutionHours: 2.0
      },
      // 13. Fechado - Ana - Impressoras - Rafael
      {
        title: 'Falha na impressão de documentos em PDF',
        description: 'Documentos com fontes personalizadas gerando folhas em branco. Atualizado o driver PostScript da impressora de rede.',
        status: 'CLOSED' as const,
        priority: 'MEDIUM' as const,
        categoryId: categoryMap.get('Impressoras')!,
        authorId: userAna.id,
        assignedToId: techRafael.id,
        daysAgo: 4,
        resolutionHours: 1.8
      },
      // 14. Em Andamento - Felipe - Hardware - Rafael
      {
        title: 'Computador reiniciando sozinho durante o uso',
        description: 'Máquina desliga inesperadamente após algumas horas de uso contínuo. Suspeita de superaquecimento da CPU; agendada troca de pasta térmica e teste de memória.',
        status: 'IN_PROGRESS' as const,
        priority: 'HIGH' as const,
        categoryId: categoryMap.get('Hardware')!,
        authorId: userFelipe.id,
        assignedToId: techRafael.id,
        daysAgo: 3
      },
      // 15. Em Andamento - Juliana - Rede e Internet - Rafael
      {
        title: 'Acesso remoto via VPN indisponível',
        description: 'Certificado VPN apresentando erro de validação ao conectar em home office. Em análise de rotas e reemissão de certificado.',
        status: 'IN_PROGRESS' as const,
        priority: 'HIGH' as const,
        categoryId: categoryMap.get('Rede e Internet')!,
        authorId: userJuliana.id,
        assignedToId: techRafael.id,
        daysAgo: 2
      },
      // 16. Em Andamento - Bruno - Software - Mariana
      {
        title: 'Configuração de conta de e-mail no smartphone',
        description: 'Colaborador necessita sincronizar a caixa postal corporativa e calendário no dispositivo móvel institucional.',
        status: 'IN_PROGRESS' as const,
        priority: 'LOW' as const,
        categoryId: categoryMap.get('Software')!,
        authorId: userBruno.id,
        assignedToId: techMariana.id,
        daysAgo: 2
      },
      // 17. Em Andamento - Carla - Hardware - Lucas
      {
        title: 'Troca de teclado e mouse com defeito',
        description: 'Teclas de espaço e acentuação falhando intermitentemente. Separado kit novo no estoque para substituição presencial.',
        status: 'IN_PROGRESS' as const,
        priority: 'LOW' as const,
        categoryId: categoryMap.get('Hardware')!,
        authorId: userCarla.id,
        assignedToId: techLucas.id,
        daysAgo: 1
      },
      // 18. Em Andamento - Ana - Sistemas - Mariana
      {
        title: 'Lentidão nas consultas do módulo de faturamento',
        description: 'Abertura de telas e pesquisas de clientes levando mais de 30 segundos. Analisando consumo de memória no servidor da aplicação.',
        status: 'IN_PROGRESS' as const,
        priority: 'MEDIUM' as const,
        categoryId: categoryMap.get('Sistemas')!,
        authorId: userAna.id,
        assignedToId: techMariana.id,
        daysAgo: 1
      },
      // 19. Aberto - Juliana - Acessos - sem técnico
      {
        title: 'Solicitação de criação de novo usuário para estagiário',
        description: 'Novo estagiário do setor de Recursos Humanos inicia na próxima semana. Necessário login de rede, e-mail institucional e grupo de RH.',
        status: 'OPEN' as const,
        priority: 'MEDIUM' as const,
        categoryId: categoryMap.get('Acessos e Permissões')!,
        authorId: userJuliana.id,
        assignedToId: null,
        daysAgo: 1
      },
      // 20. Aberto - Bruno - Impressoras - sem técnico
      {
        title: 'Impressora multifuncional apresentando manchas na impressão',
        description: 'Linhas pretas verticais aparecendo nas páginas digitalizadas e impressas. Necessário verificação do cilindro de imagem.',
        status: 'OPEN' as const,
        priority: 'LOW' as const,
        categoryId: categoryMap.get('Impressoras')!,
        authorId: userBruno.id,
        assignedToId: null,
        daysAgo: 0.5
      },
      // 21. Aberto - Felipe - Rede e Internet - sem técnico
      {
        title: 'Queda intermitente na conexão da sala de treinamento',
        description: 'Computadores da sala de treinamento perdendo conexão com o gateway periodicamente. Solicito inspeção no switch do rack 2.',
        status: 'OPEN' as const,
        priority: 'HIGH' as const,
        categoryId: categoryMap.get('Rede e Internet')!,
        authorId: userFelipe.id,
        assignedToId: null,
        daysAgo: 0.3
      },
      // 22. Aberto - Carla - Software - sem técnico
      {
        title: 'Instalação do visualizador de arquivos técnicos CAD',
        description: 'Necessário instalar visualizador homologado para conferência de projetos recebidos de fornecedores.',
        status: 'OPEN' as const,
        priority: 'LOW' as const,
        categoryId: categoryMap.get('Software')!,
        authorId: userCarla.id,
        assignedToId: null,
        daysAgo: 0.1
      }
    ];

    for (const item of ticketsData) {
      const createdAt = getPastDate(item.daysAgo);
      let closedAt: Date | null = null;
      if (item.status === 'CLOSED' && item.resolutionHours) {
        closedAt = new Date(createdAt.getTime() + item.resolutionHours * 60 * 60 * 1000);
      }

      await prisma.ticket.create({
        data: {
          title: item.title,
          description: item.description,
          status: item.status,
          priority: item.priority,
          categoryId: item.categoryId,
          authorId: item.authorId,
          assignedToId: item.assignedToId,
          createdAt,
          updatedAt: closedAt || createdAt,
          closedAt
        }
      });
    }

    console.log(`--- SEED CONCLUÍDO COM SUCESSO ---`);
    console.log(`Categorias criadas: ${categoriesData.length}`);
    console.log(`Usuários criados: 9 (1 Admin, 3 Técnicos, 5 Usuários)`);
    console.log(`Chamados criados: ${ticketsData.length}`);

  } catch (error) {
    console.error('Erro no seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runSeed();

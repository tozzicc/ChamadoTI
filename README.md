# 🎫 ChamadoTI | IT Help Desk & Ticket Management System

> 🇺🇸 Web application for IT help desk, support ticket management and service tracking.  
> 🇧🇷 Aplicação web para gestão de chamados de TI, suporte técnico e acompanhamento de atendimentos.

🌐 **Live Demo | Demonstração Online:**  
https://chamado-ti.vercel.app/

---

# 🇺🇸 English

## 📌 About the Project

**ChamadoTI** is a full-stack web application developed to manage IT support tickets and help desk operations through a centralized and practical interface.

The system allows support teams to register, organize and monitor technical requests, providing better visibility over ticket status, priorities, deadlines and support activities.

The project was developed as a real-world application, combining frontend development, backend services, authentication, business rules and production deployment.

It demonstrates the implementation of a complete web solution focused on IT service management and operational support.

## ✨ Main Features

- IT support ticket management
- Ticket creation and tracking
- Ticket status control
- Priority management
- User management
- Authentication and access control
- Administrative area
- Ticket filtering and searching
- SLA monitoring
- Dashboard with operational information
- Application settings
- Responsive web interface
- Backend API integration
- Production deployment

## 🛠 Technologies

### Frontend

- React
- TypeScript
- Vite
- HTML
- CSS

### Backend

- Node.js
- REST API

### Infrastructure & Deployment

- Vercel
- Environment variables
- Git / GitHub

## 🏗 Project Structure

    ChamadoTI/
    ├── backend/              # Backend services and API
    ├── frontend/             # React web application
    ├── .gitignore
    ├── package.json
    ├── package-lock.json
    └── vercel.json           # Vercel deployment configuration

---

# 🇧🇷 Português

## 📌 Sobre o Projeto

**ChamadoTI** é uma aplicação web full-stack desenvolvida para gerenciamento de chamados de TI e operações de Help Desk por meio de uma interface centralizada e prática.

O sistema permite que equipes de suporte registrem, organizem e acompanhem solicitações técnicas, proporcionando maior visibilidade sobre o status dos chamados, prioridades, prazos e atividades de atendimento.

O projeto foi desenvolvido como uma aplicação real, combinando desenvolvimento frontend, serviços de backend, autenticação, regras de negócio e publicação em ambiente de produção.

A aplicação demonstra a implementação de uma solução web completa voltada para gestão de serviços de TI e suporte operacional.

## ✨ Principais Funcionalidades

- Gestão de chamados de TI
- Abertura e acompanhamento de chamados
- Controle de status dos chamados
- Gerenciamento de prioridades
- Gestão de usuários
- Autenticação e controle de acesso
- Área administrativa
- Pesquisa e filtros de chamados
- Monitoramento de SLA
- Dashboard com informações operacionais
- Configurações da aplicação
- Interface web responsiva
- Integração com API backend
- Publicação em ambiente de produção

## 🛠 Tecnologias

### Frontend

- React
- TypeScript
- Vite
- HTML
- CSS

### Backend

- Node.js
- REST API

### Infraestrutura e Deploy

- Vercel
- Variáveis de ambiente
- Git / GitHub

## 🏗 Estrutura do Projeto

    ChamadoTI/
    ├── backend/              # Serviços de backend e API
    ├── frontend/             # Aplicação web React
    ├── .gitignore
    ├── package.json
    ├── package-lock.json
    └── vercel.json           # Configuração de deploy na Vercel

---

# 🌐 Live Demo | Demonstração Online

**ChamadoTI:**  
https://chamado-ti.vercel.app/

---

# 👨‍💻 Author | Autor

**Camilo Tozzi**

## Deploy em Produção — Vercel

### Arquitetura atual

O projeto é publicado em um único projeto Vercel usando **Vercel Services**:

- **Frontend:** React/Vite em um serviço separado, com `root` em `frontend`.
- **Backend:** Node.js + Express em um serviço separado, com `root` em `backend`, `runtime` `container` e `entrypoint` `Dockerfile.vercel`.
- **PostgreSQL/Prisma:** o banco é externo e configurado por `DATABASE_URL`. O Prisma Client é usado pelo backend. O deploy não deve executar migrations ou seeds automaticamente.

### Configuração da Vercel

- **Framework Preset:** `Services`
- **Root Directory:** `./`
- **Production Branch:** `main`
- Um push para `main` inicia o deploy automático de produção.

Variáveis obrigatórias em produção:

- `DATABASE_URL`
- `JWT_SECRET`

Nunca registre os valores desses secrets neste README ou no repositório.

### Fluxo de roteamento

O frontend atende a aplicação web. As requisições em `/api/*` são encaminhadas pelo `vercel.json` ao serviço `backend`. O Express roda dentro do container do backend, que inicia o servidor HTTP na porta fornecida por `process.env.PORT`.

### Dockerfile do backend

O arquivo `backend/Dockerfile.vercel`:

- instala as dependências do backend;
- gera o Prisma Client;
- compila o TypeScript;
- cria a imagem de runtime de produção;
- instala OpenSSL nos estágios de build e runtime para compatibilidade com o Prisma;
- inicia a aplicação com `node dist/index.js`.

OpenSSL é necessário para o Prisma funcionar no container e não deve ser removido sem validar o Prisma em produção.

### Problema de runtime resolvido

Inicialmente, a Vercel transformava o backend Express em uma Function `/index`. O runtime em `/var/task/index.js` falhava com `Cannot find module 'express'`. Tentativas de corrigir apenas o empacotamento dessa Function não resolveram o problema.

A solução definitiva foi executar o backend como container dentro do Vercel Services. Em seguida, o Prisma apresentou erro relacionado à ausência de OpenSSL e encerramento do processo. A instalação de OpenSSL nos estágios build/runtime do Dockerfile resolveu esse problema.

Estado final validado:

- frontend funcionando;
- backend Express funcionando;
- Prisma funcionando;
- PostgreSQL preservado;
- login funcionando em produção.

### Procedimento de deploy

1. Valide o frontend e o backend localmente.
2. Execute `git status` e `git diff --check`.
3. Crie o commit da alteração.
4. Execute `git push origin main`.
5. Aguarde o deployment automático e confirme o status `Ready`.
6. Teste `/api/settings` e o login.
7. Valide Dashboard, Chamados e Usuários.

### Troubleshooting

| Sintoma | Causa histórica | Estado atual / ação |
| --- | --- | --- |
| `Cannot find module 'express'` | Backend empacotado como Function sem dependências de runtime. | O backend deve permanecer em runtime `container`. |
| Solicitação de instalação de OpenSSL ou falha do Prisma. | OpenSSL ausente no container. | Manter OpenSSL em `backend/Dockerfile.vercel`. |
| HTTP 500 no login. | Pode ser uma falha de runtime, configuração ou dependência. | Verificar Runtime Logs antes de alterar senha, banco ou executar migrations. |

### Segurança

- Nunca versione `.env`.
- Nunca coloque `DATABASE_URL` ou `JWT_SECRET` no README.
- Nunca execute reset ou seed em produção sem backup e autorização.
- Não apague o banco para resolver erro de runtime ou deploy.
- Rotacione secrets caso sejam expostos.

🇺🇸 IT Professional focused on ERP, SQL Server, web development and business solutions.

🇧🇷 Profissional de TI com foco em ERP, SQL Server, desenvolvimento web e soluções para negócios.

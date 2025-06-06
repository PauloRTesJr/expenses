# 🗄️ Database Setup & Management Guide

Este projeto utiliza um sistema simplificado de configuração do banco de dados Supabase com setup unificado e automação completa.

## 🎯 Setup Simplificado

### **Método Principal: Script Unificado**

**Recomendado para todos os casos:** Use o script unificado que configura tudo de uma só vez.

1. Acesse o Supabase Dashboard > SQL Editor
2. Execute o script completo: `scripts/unified-setup.sql`

**O que é criado automaticamente:**

- ✅ Todas as tabelas (profiles, categories, transactions, budgets)
- ✅ Row Level Security (RLS) e políticas de segurança
- ✅ Índices de performance para consultas rápidas
- ✅ Funções utilitárias e triggers
- ✅ Categorias padrão para novos usuários
- ✅ Validações e constraints de dados
- ✅ Sistema de tracking de migrations

## 📋 Scripts Disponíveis (Automação)

```bash
# Verificar status atual do banco
npm run db:status

# Executar migrations pendentes
npm run migrate

# Criar nova migration
npm run migrate:create nome_da_migration

# Ver status das migrations
npm run migrate:status
```

## 🛠️ Como Usar

### 1. Primeira Configuração

```bash
# 1. Configure variáveis de ambiente no .env.local
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_servico

# 2. Execute o script unificado no Supabase Dashboard
# Copie e cole o conteúdo de: scripts/unified-setup.sql

# 3. Verifique o setup
npm run db:status
```

### 2. Desenvolvimento Contínuo

```bash
# Criar nova migration para mudanças futuras
npm run migrate:create add_new_feature

# Executar migrations pendentes
npm run migrate

# Verificar status sempre que necessário
npm run db:status
```

## 📁 Estrutura de Arquivos

```
scripts/
├── unified-setup.sql     # 🎯 SCRIPT PRINCIPAL - Use este!
├── complete-setup.sql    # Legacy (manter por compatibilidade)
├── fix-missing-functions.sql # Legacy (manter por compatibilidade)
├── migrate.ts           # Sistema de migrations
└── db-status.ts         # Verificação de status

migrations/
├── 20250606_092200_add_installments_support.sql
└── [futuras_migrations].sql
```

## 🗄️ Estrutura do Banco

### Tabelas Principais

**profiles** - Perfis de usuário

```sql
- id: UUID (referência auth.users)
- email: TEXT
- full_name: TEXT
- avatar_url: TEXT
- created_at, updated_at: TIMESTAMP
```

**categories** - Categorias de receitas/despesas

```sql
- id: UUID
- name: VARCHAR(100)
- color: VARCHAR(7) - Código hexadecimal
- icon: VARCHAR(50) - Nome do ícone
- type: ENUM('income', 'expense')
- user_id: UUID (referência auth.users)
```

**transactions** - Transações financeiras

```sql
- id: UUID
- description: VARCHAR(255)
- amount: DECIMAL(10,2)
- type: ENUM('income', 'expense')
- category_id: UUID (opcional)
- date: DATE
- user_id: UUID
- is_installment: BOOLEAN
- installment_count: INTEGER
- installment_current: INTEGER
- installment_group_id: UUID
```

**budgets** - Orçamentos

```sql
- id: UUID
- name: VARCHAR(100)
- amount: DECIMAL(10,2)
- category_id: UUID
- period: ENUM('monthly', 'weekly', 'yearly')
- user_id: UUID
```

### Funcionalidades Avançadas

**Row Level Security (RLS)**

- Cada usuário só acessa seus próprios dados
- Políticas automáticas para todas as operações

**Performance**

- Índices otimizados para consultas frequentes
- Índices compostos para queries complexas

**Automação**

- Triggers para `updated_at` automático
- Criação automática de categorias padrão
- Validações de integridade de dados

**Parcelamento**

- Suporte nativo a transações parceladas
- Agrupamento por `installment_group_id`

## 🚨 Resolução de Problemas

### Erro: "Table does not exist"

```bash
# Execute o script unificado novamente (é idempotente)
# No Supabase Dashboard > SQL Editor > scripts/unified-setup.sql
```

### Erro: "RLS Policy Violation"

```bash
# Verifique se o usuário está autenticado
# Confirme que as políticas RLS foram criadas
npm run db:status
```

### Banco "desatualizado"

```bash
# Execute migrations pendentes
npm run migrate

# Para casos extremos, re-execute o script unificado
```

### Verificar Setup

```bash
# Sempre use este comando para diagnosticar
npm run db:status
```

## 📊 Exemplo de Output do Status

```
🔧 Environment Configuration:
   ✅ NEXT_PUBLIC_SUPABASE_URL: Set
   ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: Set  
   ✅ SUPABASE_SERVICE_ROLE_KEY: Set

📊 DATABASE STATUS REPORT
🔗 Connection: ✅ Connected

📋 Tables:
   ✅ profiles (0 rows) 🔒 RLS
   ✅ categories (36 rows) 🔒 RLS  
   ✅ transactions (0 rows) 🔒 RLS
   ✅ budgets (0 rows) 🔒 RLS

🚀 Migrations:
   ✅ Migration table exists
   📊 1 migrations executed

⚙️ Functions:
   ✅ handle_updated_at
   ✅ create_default_categories
   ✅ exec_sql

🔒 Security:
   📊 16 RLS policies active

🎯 Summary:
   ✅ Database is fully configured and ready!
```

## 🔄 Fluxo de Desenvolvimento

### Setup Inicial

1. **Supabase Dashboard** → Execute `scripts/unified-setup.sql`
2. `npm run db:status` → Verificar configuração
3. Pronto para desenvolvimento! 🚀

### Mudanças Futuras

1. `npm run migrate:create new_feature` → Criar migration
2. Editar o arquivo SQL gerado
3. `npm run migrate` → Aplicar mudanças
4. `npm run db:status` → Verificar resultado

### Colaboração em Time

1. **Pull** do repositório
2. `npm run migrate` → Aplicar migrations dos colegas
3. Desenvolver e criar suas próprias migrations
4. **Commit** inclui arquivos de migration

---

💡 **Dica**: O script `unified-setup.sql` é idempotente - pode ser executado múltiplas vezes sem problemas!

# ADR-003: Sistema de Listagem de Transações no Dashboard

## Status

Aceita

## Contexto

O sistema precisa de uma funcionalidade completa para listagem e visualização de receitas e despesas no dashboard principal. Os usuários necessitam de:

1. Visualização tabular das transações do mês atual
2. Gráficos interativos para análise mensal e anual
3. Sistema de filtros por nome, período e categoria
4. Indicadores visuais para transações parceladas
5. Cálculos automáticos de totais (receitas, despesas, saldo)

## Decisão

Implementaremos um sistema modular de listagem com os seguintes componentes:

### Arquitetura de Componentes

1. **TransactionsList**: Componente principal da tabela
2. **TransactionFilters**: Sistema de filtros reutilizável
3. **MonthlyChart**: Gráfico mensal usando Chart.js/Recharts
4. **YearlyChart**: Gráfico anual comparativo
5. **FinancialSummary**: Cards de resumo com cálculos automáticos

### Tecnologias Escolhidas

- **Recharts**: Biblioteca de gráficos moderna e responsiva
- **Date-fns**: Manipulação de datas
- **React Hooks**: useState e useEffect para gerenciamento de estado local
- **Tailwind CSS**: Estilização consistente com o design system

### Estrutura de Dados

```typescript
interface TransactionListItem extends Transaction {
  category?: Category;
  installment_info?: {
    current: number;
    total: number;
    group_id: string;
    original_amount: number;
  };
}

interface FilterState {
  month: Date;
  search: string;
  category_id?: string;
  type?: 'income' | 'expense' | 'all';
}
```

### Performance

- Server-side rendering inicial dos dados do mês atual
- Client-side filtering e sorting para responsividade
- Paginação virtual para grandes volumes de dados
- Memoização de cálculos pesados

## Consequências

### Positivas

- Interface intuitiva e responsiva
- Performance otimizada com SSR + CSR
- Visualizações ricas com gráficos interativos
- Filtros em tempo real
- Suporte completo a transações parceladas

### Negativas

- Aumento do bundle size com biblioteca de gráficos
- Complexidade adicional no gerenciamento de estado
- Necessidade de otimizações para grandes volumes

## Implementação

### Fase 1: Estrutura Base

- Componente de listagem tabular
- Sistema de filtros básico
- Cálculos de totais

### Fase 2: Visualizações

- Gráficos mensais e anuais
- Cards de resumo financeiro

### Fase 3: Otimizações

- Performance improvements
- UX enhancements
- Acessibilidade

## Data

2025-06-06

## Revisores

- Equipe de Desenvolvimento
- Product Owner

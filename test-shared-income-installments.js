/**
 * Teste manual para verificar se receitas compartilhadas em parcelas
 * estão sendo criadas corretamente
 */

const { createClient } = require('@supabase/supabase-js');

// Configurar cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSharedIncomeInstallments() {
  console.log('🧪 Testando receitas compartilhadas em parcelas...');

  try {
    // Primeiro, vamos simular a criação de uma receita compartilhada em 3 parcelas
    const testTransactionData = {
      description: 'Receita Teste Compartilhada',
      amount: 300, // R$ 300 dividido em 3 parcelas de R$ 100 cada
      type: 'income',
      category_id: null,
      date: new Date('2025-06-16'),
      is_installment: true,
      installment_count: 3
    };

    const testShares = [
      {
        userId: 'test-user-1', // Substitua por um ID de usuário real no seu sistema
        shareType: 'equal',
        shareValue: null
      }
    ];

    console.log('📋 Dados do teste:');
    console.log('- Descrição:', testTransactionData.description);
    console.log('- Valor:', testTransactionData.amount);
    console.log('- Tipo:', testTransactionData.type);
    console.log('- Parcelado:', testTransactionData.is_installment);
    console.log('- Número de parcelas:', testTransactionData.installment_count);
    console.log('- Compartilhado com:', testShares.length, 'usuário(s)');

    // Vamos verificar se existem transações de teste anteriores
    const { data: existingTransactions, error: searchError } = await supabase
      .from('transactions')
      .select('*')
      .ilike('description', '%Receita Teste Compartilhada%')
      .order('created_at', { ascending: false });

    if (searchError) {
      console.error('❌ Erro ao buscar transações existentes:', searchError);
      return;
    }

    if (existingTransactions && existingTransactions.length > 0) {
      console.log(`\n📊 Encontradas ${existingTransactions.length} transações de teste anteriores:`);
      existingTransactions.forEach((tx, index) => {
        console.log(`  ${index + 1}. ${tx.description} - R$ ${tx.amount} (${tx.date})`);
        console.log(`     Parcela: ${tx.installment_current}/${tx.installment_count}`);
      });
    }

    console.log('\n✅ Teste concluído - verificar dados acima para validar o comportamento');
    console.log('\n💡 Para testar a criação, você precisa:');
    console.log('1. Fazer login no sistema');
    console.log('2. Criar uma receita compartilhada em parcelas');
    console.log('3. Verificar se múltiplas entradas são criadas na tabela');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testSharedIncomeInstallments();

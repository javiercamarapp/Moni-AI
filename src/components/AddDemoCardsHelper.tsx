import { useEffect } from 'react';
import { createBankConnection } from '@/lib/bankConnection';
import { supabase } from '@/integrations/supabase/client';

export const AddDemoCardsHelper = () => {
  useEffect(() => {
    const addDemoCards = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check if cards already exist
        const { data: existing } = await supabase
          .from('bank_connections')
          .select('id')
          .eq('user_id', user.id);

        if (existing && existing.length > 0) {
          console.log('Cards already exist');
          return;
        }

        // Add the three cards
        await createBankConnection({
          bankName: 'Banamex',
          accountId: '5234567890123456',
          plaintextToken: 'demo_banamex_conquista_token',
          plaidItemId: 'banamex_conquista'
        });

        await createBankConnection({
          bankName: 'BBVA',
          accountId: '4123456789012345',
          plaintextToken: 'demo_bbva_platinum_token',
          plaidItemId: 'bbva_platinum'
        });

        await createBankConnection({
          bankName: 'BBVA',
          accountId: '4987654321098765',
          plaintextToken: 'demo_bbva_debito_token',
          plaidItemId: 'bbva_debito'
        });

        console.log('Demo cards added successfully');
        window.location.reload();
      } catch (error) {
        console.error('Error adding demo cards:', error);
      }
    };

    addDemoCards();
  }, []);

  return null;
};

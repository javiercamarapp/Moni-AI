import { useEffect, useState } from 'react';
import { createBankConnection } from '@/lib/bankConnection';
import { supabase } from '@/integrations/supabase/client';

export const AddBBVACards = () => {
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const addCards = async () => {
      if (added) return;
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check if BBVA cards exist
        const { data: existing } = await supabase
          .from('bank_connections')
          .select('plaid_item_id')
          .eq('user_id', user.id)
          .in('plaid_item_id', ['bbva_platinum', 'bbva_debito']);

        if (existing && existing.length >= 2) {
          console.log('BBVA cards already exist');
          setAdded(true);
          return;
        }

        const existingIds = existing?.map(e => e.plaid_item_id) || [];

        // Add BBVA Platinum if it doesn't exist
        if (!existingIds.includes('bbva_platinum')) {
          await createBankConnection({
            bankName: 'BBVA',
            accountId: '4123456789012345',
            plaintextToken: 'demo_bbva_platinum_token_secure',
            plaidItemId: 'bbva_platinum'
          });
          console.log('Added BBVA Platinum');
        }

        // Add BBVA Débito if it doesn't exist
        if (!existingIds.includes('bbva_debito')) {
          await createBankConnection({
            bankName: 'BBVA',
            accountId: '4987654321098765',
            plaintextToken: 'demo_bbva_debito_token_secure',
            plaidItemId: 'bbva_debito'
          });
          console.log('Added BBVA Débito');
        }

        setAdded(true);
        
        // Reload to show new cards
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } catch (error) {
        console.error('Error adding BBVA cards:', error);
      }
    };

    addCards();
  }, [added]);

  return null;
};

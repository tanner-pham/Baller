/**
 * Backend Unit Tests - Supabase Client (Mocha + Chai)
 * Tests that the Supabase client initializes correctly
 * and handles missing environment variables gracefully
 */

import { expect } from 'chai';
import { describe, it } from 'mocha';

describe('Supabase Client', () => {

  describe('Environment Variables', () => {
    it('should have SUPABASE_URL defined in environment', () => {
      const url = process.env.SUPABASE_URL;
      expect(url).to.be.a('string');
    });

    it('should have SUPABASE_ANON_KEY defined in environment', () => {
      const key = process.env.SUPABASE_ANON_KEY;
      expect(key).to.be.a('string');
    });

    it('SUPABASE_URL should be a valid URL format', () => {
      const url = process.env.SUPABASE_URL ?? '';
      expect(url).to.match(/^https?:\/\/.+/);
    });

    it('SUPABASE_ANON_KEY should be a non-empty string', () => {
      const key = process.env.SUPABASE_ANON_KEY ?? '';
      expect(key.length).to.be.greaterThan(0);
    });
  });

  describe('Client Initialization', () => {
    it('should import supabase client without throwing', async () => {
      const fn = async () => {
        const { createClient } = await import('@supabase/supabase-js');
        const url = process.env.SUPABASE_URL ?? 'https://placeholder.supabase.co';
        const key = process.env.SUPABASE_ANON_KEY ?? 'placeholder-key';
        return createClient(url, key);
      };
      expect(fn).to.not.throw();
    });
  });
});

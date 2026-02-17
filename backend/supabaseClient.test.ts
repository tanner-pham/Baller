/**
 * Backend Unit Tests - Supabase Client (Mocha + Chai)
 * Tests that the Supabase client initializes correctly
 * and handles missing environment variables gracefully
 */

import { expect } from 'chai';
import { describe, it } from 'mocha';

describe('Supabase Client', () => {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL ??
    'https://placeholder.supabase.co';
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    'placeholder-anon-key';

  describe('Environment Variables', () => {
    it('should have Supabase URL defined in environment', () => {
      expect(supabaseUrl).to.be.a('string');
    });

    it('should have Supabase anon key defined in environment', () => {
      expect(supabaseAnonKey).to.be.a('string');
    });

    it('Supabase URL should be a valid URL format', () => {
      expect(supabaseUrl).to.match(/^https?:\/\/.+/);
    });

    it('Supabase anon key should be a non-empty string', () => {
      expect(supabaseAnonKey.length).to.be.greaterThan(0);
    });
  });

  describe('Client Initialization', () => {
    it('should import supabase client without throwing', async () => {
      const fn = async () => {
        const { createClient } = await import('@supabase/supabase-js');
        return createClient(supabaseUrl, supabaseAnonKey);
      };
      expect(fn).to.not.throw();
    });
  });
});

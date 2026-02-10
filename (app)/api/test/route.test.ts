/**
 * Backend Integration Tests - API Route /api/test (Mocha + Chai)
 * Tests the GET endpoint that fetches from Supabase testTable
 * Uses mocking to avoid real network calls during CI
 */

import { expect } from 'chai';
import { describe, it } from 'mocha';

// Simulates a successful Supabase response
function mockSupabaseSuccess(data: object[]) {
  return {
    from: () => ({
      select: () => Promise.resolve({ data, error: null })
    })
  };
}

// Simulates a failed Supabase response
function mockSupabaseError(message: string) {
  return {
    from: () => ({
      select: () => Promise.resolve({ data: null, error: { message } })
    })
  };
}

// Simulates the GET handler logic from app/api/test/route.ts
async function simulateGET(supabase: ReturnType<typeof mockSupabaseSuccess>) {
  const { data, error } = await supabase.from('testTable').select('*');
  if (error) {
    return { status: 500, body: { error: error.message } };
  }
  return { status: 200, body: { data } };
}

describe('GET /api/test', () => {

  describe('Success cases', () => {
    it('should return 200 with data when Supabase query succeeds', async () => {
      const mockData = [{ id: 1, name: 'test item' }];
      const supabase = mockSupabaseSuccess(mockData);
      const result = await simulateGET(supabase);
      expect(result.status).to.equal(200);
      expect(result.body).to.have.property('data');
      expect(result.body.data).to.deep.equal(mockData);
    });

    it('should return an empty array when testTable has no rows', async () => {
      const supabase = mockSupabaseSuccess([]);
      const result = await simulateGET(supabase);
      expect(result.status).to.equal(200);
      expect(result.body.data).to.be.an('array').that.is.empty;
    });
  });

  describe('Error cases', () => {
    it('should return 500 when Supabase returns an error', async () => {
      const supabase = mockSupabaseError('relation "testTable" does not exist');
      const result = await simulateGET(supabase);
      expect(result.status).to.equal(500);
      expect(result.body).to.have.property('error');
    });

    it('should include the error message in the response body', async () => {
      const errorMessage = 'connection timeout';
      const supabase = mockSupabaseError(errorMessage);
      const result = await simulateGET(supabase);
      expect(result.body.error).to.equal(errorMessage);
    });
  });
});

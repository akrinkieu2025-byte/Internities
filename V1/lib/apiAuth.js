import { supabaseAdmin } from './supabaseAdmin';

// Extract user from Authorization: Bearer <access_token>
export async function getUserFromAuthHeader(headers) {
  const auth = headers.get('authorization') || headers.get('Authorization');
  if (!auth || !auth.toLowerCase().startsWith('bearer ')) {
    throw new Error('Unauthorized: missing bearer token');
  }
  const token = auth.slice(7).trim();
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    throw new Error('Unauthorized: invalid token');
  }
  return data.user;
}

export async function getProfileIdFromAuth(headers) {
  const user = await getUserFromAuthHeader(headers);
  return user.id;
}

export async function assertCompanyMember(profileId, companyId) {
  const { data, error } = await supabaseAdmin
    .from('company_members')
    .select('id')
    .eq('profile_id', profileId)
    .eq('company_id', companyId)
    .maybeSingle();
  if (error) throw new Error('Authorization check failed');
  if (!data) throw new Error('Forbidden: not a company member');
}

export async function assertCompanyMemberForRole(profileId, roleId) {
  const { data, error } = await supabaseAdmin
    .from('roles')
    .select('company_id')
    .eq('id', roleId)
    .maybeSingle();
  if (error) throw new Error('Authorization check failed');
  if (!data) throw new Error('Role not found');
  await assertCompanyMember(profileId, data.company_id);
  return data.company_id;
}

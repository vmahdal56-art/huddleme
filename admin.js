
export async function setUserRoleCallable(role, uid){
  // This will be implemented via callable HTTPS function / role assignment in the backend
  // Front-end will call: fetch('/setRole', {method:'POST', body: JSON.stringify({uid, role})}) or Firebase callable
  alert('Role assignment is backend-protected. Use the admin panel connected to callable Cloud Function.');
}

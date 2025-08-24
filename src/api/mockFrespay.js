// Simple mock endpoint to simulate Frespay payment gateway calls
// This is synchronous mock used from frontend components in dev/testing.
export async function processPayment({ amount, method, reference }){
  // simulate network latency
  await new Promise(r => setTimeout(r, 900));
  // naive validation
  if(!amount || amount <= 0) return { success:false, error:'Invalid amount' };
  if(!['airtel','orange','mpesa'].includes(method)) return { success:false, error:'Invalid method' };
  // generate fake transaction id
  const tx = 'FP' + Date.now();
  return { success:true, transactionId: tx, provider: method, amount };
}

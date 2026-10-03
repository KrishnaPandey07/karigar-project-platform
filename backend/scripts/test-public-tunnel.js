async function testPublicRegistration() {
  const publicBase = 'https://furthermore-craps-claire-went.trycloudflare.com';

  console.log('Testing public registration on:', publicBase);

  const testEmail = `publicuser_${Date.now()}@example.com`;
  const res = await fetch(`${publicBase}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'Password123!',
      role: 'CUSTOMER',
      fullName: 'Rahul Sharma',
      phone: '+91 98765 43210',
    }),
  });

  const data = await res.json();
  console.log(`Status: ${res.status}`);
  console.log('Response:', JSON.stringify(data, null, 2));

  if (res.ok && data.success) {
    console.log('🎉 Public registration works seamlessly over Cloudflare tunnel!');
  } else {
    console.error('❌ Public registration failed');
  }
}

testPublicRegistration().catch(console.error);

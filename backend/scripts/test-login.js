async function testCustomAdminLogin() {
  const email = 'lgtvk84@gmail.com';
  const password = 'Krishna,0007';

  const res = await fetch('http://localhost:5000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  console.log(`Status: ${res.status}`);
  console.log('Result:', JSON.stringify(data, null, 2));
}

testCustomAdminLogin().catch(console.error);

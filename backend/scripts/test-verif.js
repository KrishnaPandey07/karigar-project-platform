async function checkVerifications() {
  const loginRes = await fetch('http://localhost:5000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'lgtvk84@gmail.com', password: 'Krishna,0007' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.accessToken;

  const verifRes = await fetch('http://localhost:5000/api/v1/admin/verifications', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const verifData = await verifRes.json();

  console.log('✅ Verifications Count:', verifData.data?.verifications?.length);
  for (const v of verifData.data?.verifications?.slice(0, 3) || []) {
    console.log(`- Vendor: ${v.vendor?.businessName}, Status: ${v.status}, Phone: ${v.vendor?.phone}`);
    console.log(`  Documents:`, v.documents?.map((d) => d.documentType));
  }
}

checkVerifications().catch(console.error);

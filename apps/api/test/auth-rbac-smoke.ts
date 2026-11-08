import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import express from 'express';
import { toNodeHandler } from 'better-auth/node';
import { AppModule } from '../dist/app.module.js';
import { AuthService } from '../dist/auth/auth.service.js';
import { ApiExceptionFilter } from '../dist/core/api-exception.filter.js';

async function runAuthRbacSmoke() {
  console.log('--- Starting ASTECAA Auth, RBAC & Voting End-to-End Verification ---');

  process.env.APP_ENV = 'development';
  process.env.BETTER_AUTH_SECRET =
    process.env.BETTER_AUTH_SECRET ?? 'astecaa-development-secret-key-at-least-32-characters';
  process.env.BETTER_AUTH_URL = process.env.BETTER_AUTH_URL ?? 'http://localhost:8000';
  process.env.ALLOWED_ORIGINS = 'http://localhost:4200,http://localhost:4300';

  const app = await NestFactory.create(AppModule, { bodyParser: false, logger: false });
  const auth = app.get(AuthService);

  // Middleware
  app.use((req: any, res: any, next: any) => {
    res.setHeader('X-Request-Id', 'test-req-id');
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    next();
  });

  const betterAuthHandler = toNodeHandler(auth.handler);
  app.use((request: any, response: any, next: any) => {
    if (request.path.startsWith('/api/auth/')) {
      void betterAuthHandler(request, response);
      return;
    }
    next();
  });

  app.use(express.json({ limit: '1mb' }));
  app.useGlobalFilters(new ApiExceptionFilter());

  await app.init();
  const server = app.getHttpServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Test API running at ${baseUrl}`);

  try {
    // 1. Super Admin Sign-In
    console.log('1. Testing Super Admin Login (admin@astecaa.org)...');
    const loginRes = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:4300',
      },
      body: JSON.stringify({
        email: 'admin@astecaa.org',
        password: 'AdminAstec2026!',
      }),
    });

    if (loginRes.status !== 200) {
      const errText = await loginRes.text();
      throw new Error(`Super admin login failed with status ${loginRes.status}: ${errText}`);
    }

    const setCookie = loginRes.headers.get('set-cookie');
    if (!setCookie) {
      throw new Error('No cookie set on login response.');
    }
    const adminCookie = setCookie.split(';')[0];
    console.log('✓ Super Admin authenticated successfully');

    // 2. Verify /api/v1/me returns super_admin with full permissions
    console.log('2. Testing GET /api/v1/me for Super Admin...');
    const meRes = await fetch(`${baseUrl}/api/v1/me`, {
      headers: { Cookie: adminCookie, Origin: 'http://localhost:4300' },
    });
    if (meRes.status !== 200) {
      throw new Error(`GET /api/v1/me failed with status ${meRes.status}`);
    }
    const meData = await meRes.json();
    if (meData.role !== 'super_admin' || !meData.roles.includes('super_admin')) {
      throw new Error(`Expected super_admin role, got: ${JSON.stringify(meData)}`);
    }
    if (!meData.permissions.includes('users:write') || !meData.permissions.includes('elections:write')) {
      throw new Error(`Missing expected permissions for super admin: ${JSON.stringify(meData.permissions)}`);
    }
    console.log(`✓ Super Admin identity verified (${meData.email}, role: ${meData.role}, ${meData.permissions.length} permissions)`);

    // 3. Test Roles & Permissions API
    console.log('3. Testing GET /api/admin/v1/roles...');
    const rolesRes = await fetch(`${baseUrl}/api/admin/v1/roles`, {
      headers: { Cookie: adminCookie, Origin: 'http://localhost:4300' },
    });
    if (rolesRes.status !== 200) {
      throw new Error(`GET /api/admin/v1/roles failed: ${rolesRes.status}`);
    }
    const rolesList = await rolesRes.json();
    if (!Array.isArray(rolesList) || rolesList.length === 0) {
      throw new Error('Expected non-empty roles list');
    }
    console.log(`✓ Roles API OK (returned ${rolesList.length} configured roles)`);

    // 4. Test User Invitation API
    console.log('4. Testing POST /api/admin/v1/invitations...');
    const inviteEmail = `invited-${Date.now()}@astecaa.org`;
    const inviteRes = await fetch(`${baseUrl}/api/admin/v1/invitations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
        Origin: 'http://localhost:4300',
      },
      body: JSON.stringify({
        email: inviteEmail,
        role: 'Event Manager',
      }),
    });
    if (inviteRes.status !== 201 && inviteRes.status !== 200) {
      throw new Error(`POST /api/admin/v1/invitations failed: ${inviteRes.status}`);
    }
    const inviteData = await inviteRes.json();
    console.log(`✓ Invitation created for ${inviteData.email} with role ${inviteData.role} (token: ${inviteData.token.slice(0, 8)}...)`);

    // 5. Test Public Alumni Sign-Up / Registration
    console.log('5. Testing Alumni Registration (/api/auth/sign-up/email)...');
    const alumniEmail = `alumni-${Date.now()}@example.com`;
    const registerRes = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:4200',
      },
      body: JSON.stringify({
        email: alumniEmail,
        password: 'AlumniPassword2026!',
        name: 'Chioma Okoli',
      }),
    });
    if (registerRes.status !== 200) {
      const err = await registerRes.text();
      throw new Error(`Alumni registration failed (${registerRes.status}): ${err}`);
    }
    const alumniCookie = registerRes.headers.get('set-cookie')?.split(';')[0];
    console.log(`✓ Alumni account registered for ${alumniEmail}`);

    // 6. Verify Alumni Profile and Role ('alumni')
    console.log('6. Testing GET /api/v1/me for Alumni...');
    const alumniMeRes = await fetch(`${baseUrl}/api/v1/me`, {
      headers: { Cookie: alumniCookie!, Origin: 'http://localhost:4200' },
    });
    if (alumniMeRes.status !== 200) {
      throw new Error(`GET /api/v1/me for alumni failed: ${alumniMeRes.status}`);
    }
    const alumniData = await alumniMeRes.json();
    if (alumniData.role !== 'alumni') {
      throw new Error(`Expected role 'alumni', got: ${alumniData.role}`);
    }
    console.log(`✓ Alumni role verified: ${alumniData.role}`);

    // 7. Verify RBAC Guard: Alumni attempting to access /api/admin/v1/users must receive 403 Forbidden
    console.log('7. Testing RBAC Guard enforcement (Alumni accessing /api/admin/v1/users)...');
    const forbiddenRes = await fetch(`${baseUrl}/api/admin/v1/users`, {
      headers: { Cookie: alumniCookie!, Origin: 'http://localhost:4200' },
    });
    if (forbiddenRes.status !== 403) {
      throw new Error(`Expected 403 FORBIDDEN for alumni accessing admin API, got ${forbiddenRes.status}`);
    }
    console.log('✓ RBAC Guard correctly blocked unauthorized alumni access with 403 Forbidden');

    // 8. Test Election, Position, Candidate Creation (Admin)
    console.log('8. Testing Election creation (POST /api/admin/v1/elections)...');
    const now = new Date();
    const electionRes = await fetch(`${baseUrl}/api/admin/v1/elections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
        Origin: 'http://localhost:4300',
      },
      body: JSON.stringify({
        title: `2026 Executive Council Election ${Date.now()}`,
        description: 'Annual election for the ASTECAA governing council.',
        start_date: new Date(now.getTime() - 3600000).toISOString(), // started 1h ago
        end_date: new Date(now.getTime() + 86400000 * 7).toISOString(), // ends in 7 days
        is_active: true,
        results_published: false,
      }),
    });
    if (electionRes.status !== 201 && electionRes.status !== 200) {
      const err = await electionRes.text();
      throw new Error(`Create election failed: ${err}`);
    }
    const electionData = await electionRes.json();
    const electionId = electionData.id;
    console.log(`✓ Election created: ${electionData.title} (ID: ${electionId})`);

    // Position
    const posRes = await fetch(`${baseUrl}/api/admin/v1/elections/${electionId}/positions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
        Origin: 'http://localhost:4300',
      },
      body: JSON.stringify({
        title: 'President',
        description: 'Principal executive officer',
        sort_order: 1,
      }),
    });
    const posData = await posRes.json();
    const positionId = posData.id;
    console.log(`✓ Position created: ${posData.title} (ID: ${positionId})`);

    // Candidate
    const candRes = await fetch(`${baseUrl}/api/admin/v1/candidates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
        Origin: 'http://localhost:4300',
      },
      body: JSON.stringify({
        position_id: positionId,
        full_name: 'Dr. Obinna Nnamdi',
        graduation_year: 2010,
        department: 'Computer Science',
        manifesto: 'Innovation, transparency, and global alumni networking.',
      }),
    });
    const candData = await candRes.json();
    const candidateId = candData.id;
    console.log(`✓ Candidate created: ${candData.full_name} (ID: ${candidateId})`);

    // 9. Test Public Voting Flow (Request OTP -> Verify OTP -> Cast Ballot -> Finalize)
    console.log('9. Testing Public Voting Flow...');
    const voterPhone = '08031234567';
    const otpReqRes = await fetch(`${baseUrl}/api/v1/elections/${electionId}/request-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:4200',
      },
      body: JSON.stringify({
        name: 'Chioma Okoli',
        email: alumniEmail,
        phone: voterPhone,
        graduationYear: '2015',
      }),
    });
    if (otpReqRes.status !== 200 && otpReqRes.status !== 201) {
      const err = await otpReqRes.text();
      throw new Error(`Request OTP failed: ${err}`);
    }
    const otpReqData = await otpReqRes.json();
    const debugOtp = otpReqData.debugOtp;
    if (!debugOtp) {
      throw new Error('Debug OTP not returned in development mode.');
    }
    console.log(`✓ OTP requested successfully (masked phone: ${otpReqData.maskedPhone}, OTP: ${debugOtp})`);

    // Verify OTP
    const verifyOtpRes = await fetch(`${baseUrl}/api/v1/elections/${electionId}/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:4200',
      },
      body: JSON.stringify({
        email: alumniEmail,
        otp: debugOtp,
      }),
    });
    if (verifyOtpRes.status !== 200 && verifyOtpRes.status !== 201) {
      throw new Error(`Verify OTP failed: ${await verifyOtpRes.text()}`);
    }
    console.log('✓ OTP verified successfully');

    // Cast Vote
    const castVoteRes = await fetch(`${baseUrl}/api/v1/elections/${electionId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:4200',
      },
      body: JSON.stringify({
        positionId,
        candidateId,
        voterEmail: alumniEmail,
      }),
    });
    if (castVoteRes.status !== 200 && castVoteRes.status !== 201) {
      throw new Error(`Cast vote failed: ${await castVoteRes.text()}`);
    }
    console.log('✓ Ballot choice recorded');

    // Finalize Ballot
    const finalizeRes = await fetch(`${baseUrl}/api/v1/elections/${electionId}/finalize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:4200',
      },
      body: JSON.stringify({ voterEmail: alumniEmail }),
    });
    if (finalizeRes.status !== 200 && finalizeRes.status !== 201) {
      throw new Error(`Finalize ballot failed: ${await finalizeRes.text()}`);
    }
    console.log('✓ Ballot finalized and ballot hash recorded');

    // 10. Check Admin Results
    console.log('10. Testing Admin Election Results...');
    const resultsRes = await fetch(`${baseUrl}/api/admin/v1/elections/${electionId}/results`, {
      headers: { Cookie: adminCookie, Origin: 'http://localhost:4300' },
    });
    const resultsData = await resultsRes.json();
    const candidateResult = resultsData.positions[0]?.candidates.find((c: any) => c.id === candidateId);
    if (!candidateResult || candidateResult.vote_count !== 1) {
      throw new Error(`Expected vote_count 1 for candidate, got: ${candidateResult?.vote_count}`);
    }
    console.log(`✓ Admin live results verified: candidate ${candidateResult.full_name} has ${candidateResult.vote_count} vote(s)`);

    // 11. Test Event Registration
    console.log('11. Testing Event Registration...');
    // Create an event first
    const newEventRes = await fetch(`${baseUrl}/api/admin/v1/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
        Origin: 'http://localhost:4300',
      },
      body: JSON.stringify({
        title: `Alumni Gala Night ${Date.now()}`,
        subtitle: 'An evening of celebration and reconnecting',
        description: 'Join fellow alumni for an exquisite dinner and gala.',
        longDescription: 'Extended description for the alumni gala night.',
        date: '2026-12-15',
        time: '18:00',
        venue: 'Grand Ballroom, ASTEC',
        city: 'Enugu',
        category: 'Reunion',
        capacity: 100,
        status: 'published',
        featured: true,
        poster: '/images/reunion.jpg',
        banner: '/images/harvest-festival.jpg',
        gallery: [],
        schedule: [],
        organizer: 'Gala Committee',
        organizerRole: 'Coordinator',
        organizerPhoto: '',
        tags: ['gala', 'celebration'],
      }),
    });
    const newEvent = await newEventRes.json();
    console.log(`✓ Test event created: ${newEvent.title} (slug: ${newEvent.slug})`);

    // Public registration
    const regRes = await fetch(`${baseUrl}/api/v1/events/${newEvent.id}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:4200',
      },
      body: JSON.stringify({
        name: 'Chioma Okoli',
        email: alumniEmail,
        phone: '08031234567',
        graduationYear: '2015',
      }),
    });
    if (regRes.status !== 200 && regRes.status !== 201) {
      throw new Error(`Event registration failed: ${await regRes.text()}`);
    }
    const regData = await regRes.json();
    console.log(`✓ Event registration confirmed: ${regData.message}`);

    // 12. Test Admin Dashboard Stats
    console.log('12. Testing Admin Dashboard Stats (GET /api/admin/v1/dashboard/stats)...');
    const statsRes = await fetch(`${baseUrl}/api/admin/v1/dashboard/stats`, {
      headers: { Cookie: adminCookie, Origin: 'http://localhost:4300' },
    });
    const statsData = await statsRes.json();
    if (statsData.totalUsers < 1) {
      throw new Error(`Expected at least 1 total user, got: ${statsData.totalUsers}`);
    }
    console.log(`✓ Real dashboard statistics verified:
      Total Users: ${statsData.totalUsers}
      Upcoming Events: ${statsData.upcomingEvents}
      Active Elections: ${statsData.activeElections}
      Total Votes: ${statsData.totalVotes}`);

    // 13. Test Alumni Profile Update & Retrieval (PATCH & GET /api/v1/profile)
    console.log('13. Testing Alumni Profile Update & Retrieval (/api/v1/profile)...');
    const updateProfileRes = await fetch(`${baseUrl}/api/v1/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: alumniCookie!,
        Origin: 'http://localhost:4200',
      },
      body: JSON.stringify({
        graduationSet: '2015',
        phone: '+234 803 123 4567',
        department: 'Science & Engineering',
        bio: 'Proud ASTEC alumnus working in software engineering.',
      }),
    });
    if (updateProfileRes.status !== 200) {
      throw new Error(`Update profile failed: ${await updateProfileRes.text()}`);
    }
    const updatedProfile = await updateProfileRes.json();
    if (updatedProfile.graduation_set !== '2015' || updatedProfile.department !== 'Science & Engineering') {
      throw new Error(`Profile update mismatch: ${JSON.stringify(updatedProfile)}`);
    }

    const getProfileRes = await fetch(`${baseUrl}/api/v1/profile`, {
      headers: { Cookie: alumniCookie!, Origin: 'http://localhost:4200' },
    });
    const fetchedProfile = await getProfileRes.json();
    if (fetchedProfile.bio !== 'Proud ASTEC alumnus working in software engineering.') {
      throw new Error(`Fetched profile mismatch: ${JSON.stringify(fetchedProfile)}`);
    }
    console.log(`✓ Alumni profile verified: ${fetchedProfile.full_name} (${fetchedProfile.graduation_set}, ${fetchedProfile.department})`);

    console.log('\n🎉 ALL AUTHENTICATION, RBAC, ELECTIONS, VOTING, AND ALUMNI FLOWS PASSED VERIFICATION! 🎉');
  } finally {
    await app.close();
  }
}

runAuthRbacSmoke().catch((err) => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});


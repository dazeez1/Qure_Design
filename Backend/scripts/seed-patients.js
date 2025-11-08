/* eslint-disable no-console */
// Seed 12 patients with queues and appointments across 6 hospitals,
// and 6 staff (one per hospital). Then test staff queue actions.
// Run with: node Backend/scripts/seed-patients.js

const BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";

async function jsonFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (_e) {
    data = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function registerUser(user) {
  return jsonFetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    body: JSON.stringify(user),
  });
}

async function loginUser({ email, password }) {
  const data = await jsonFetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    body: JSON.stringify({ emailOrPhone: email, password }),
  });
  return data.token;
}

async function joinQueue(token, { hospitalName, specialty, notes, priority }) {
  return jsonFetch(`${BASE_URL}/api/queues/join`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ hospitalName, specialty, notes, priority }),
  });
}

async function createAppointment(token, appt) {
  return jsonFetch(`${BASE_URL}/api/appointments`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(appt),
  });
}

async function callNextStaff(token, opts = {}) {
  return jsonFetch(`${BASE_URL}/api/queues/call-next`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(opts),
  });
}

async function completeCurrentStaff(token, queueId) {
  return jsonFetch(`${BASE_URL}/api/queues/complete`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ queueId }),
  });
}

async function seed() {
  const PASSWORD = "1234567890";

  const HOSPITALS = [
    "Bera Clinic",
    "Hope Health",
    "Green Cross",
    "CityCare Hospital",
    "Sunrise Medical",
    "Unity Clinic",
  ];

  const ts = Date.now();
  const patients = [
    {
      firstName: "Ada",
      lastName: "Okoro",
      email: `ada.okoro+p1.${ts}@example.com`,
      phone: "+1110000001",
    },
    {
      firstName: "Ben",
      lastName: "Faith",
      email: `ben.faith+p2.${ts}@example.com`,
      phone: "+1110000002",
    },
    {
      firstName: "John",
      lastName: "Yakubu",
      email: `john.yakubu+p3.${ts}@example.com`,
      phone: "+1110000003",
    },
    {
      firstName: "Mary",
      lastName: "Udo",
      email: `mary.udo+p4.${ts}@example.com`,
      phone: "+1110000004",
    },
    {
      firstName: "Aisha",
      lastName: "Bawa",
      email: `aisha.bawa+p5.${ts}@example.com`,
      phone: "+1110000005",
    },
    {
      firstName: "Chinedu",
      lastName: "Ike",
      email: `chinedu.ike+p6.${ts}@example.com`,
      phone: "+1110000006",
    },
    {
      firstName: "Grace",
      lastName: "Ade",
      email: `grace.ade+p7.${ts}@example.com`,
      phone: "+1110000007",
    },
    {
      firstName: "Ibrahim",
      lastName: "Lawal",
      email: `ibrahim.lawal+p8.${ts}@example.com`,
      phone: "+1110000008",
    },
    {
      firstName: "Kemi",
      lastName: "Balogun",
      email: `kemi.balogun+p9.${ts}@example.com`,
      phone: "+1110000009",
    },
    {
      firstName: "Tunde",
      lastName: "Ojo",
      email: `tunde.ojo+p10.${ts}@example.com`,
      phone: "+1110000010",
    },
    {
      firstName: "Ngozi",
      lastName: "Eze",
      email: `ngozi.eze+p11.${ts}@example.com`,
      phone: "+1110000011",
    },
    {
      firstName: "Samuel",
      lastName: "Ife",
      email: `samuel.ife+p12.${ts}@example.com`,
      phone: "+1110000012",
    },
  ];

  const specialties = [
    "Cardiology",
    "Dermatology",
    "Pediatrics",
    "Pharmacy",
    "EM",
    "Radiology",
  ];

  console.log("\n=== Seeding Patients ===");
  for (let i = 0; i < patients.length; i++) {
    const p = patients[i];
    try {
      await registerUser({
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.email,
        phone: p.phone,
        password: PASSWORD,
        role: "patient",
      });
      console.log(`Registered patient: ${p.firstName} ${p.lastName}`);
    } catch (e) {
      console.log(`Register existing patient (ok): ${p.email} -> ${e.message}`);
    }

    const token = await loginUser({
      email: p.email,
      password: PASSWORD,
    });
    console.log(`Logged in: ${p.email}`);

    const specialty = specialties[i % specialties.length];
    const hospitalForPatient = HOSPITALS[i % HOSPITALS.length];

    // Join queue
    try {
      const jq = await joinQueue(token, {
        hospitalName: hospitalForPatient,
        specialty,
        notes: `Seeded queue for ${specialty}`,
        priority: "normal",
      });
      console.log(
        `Joined queue: ${p.firstName} -> ${jq.data.queueNumber} (${specialty})`
      );
    } catch (e) {
      console.log(`Join queue skipped for ${p.email}: ${e.message}`);
    }

    // Create appointment (tomorrow)
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const appt = {
      doctor: "Dr. Smith",
      specialty,
      appointmentDate: tomorrow.toISOString(),
      appointmentTime: "10:00",
      notes: `Seeded appointment for ${specialty}`,
      hospitalName: hospitalForPatient,
      patientInfo: {
        fullName: `${p.firstName} ${p.lastName}`,
        phoneNumber: p.phone,
        gender: "male",
        dateOfBirth: "1995-01-01",
      },
    };
    try {
      const ca = await createAppointment(token, appt);
      console.log(`Appointment created: ${p.firstName} -> ${ca.data._id}`);
    } catch (e) {
      console.log(`Create appointment skipped for ${p.email}: ${e.message}`);
    }
  }

  // Staff across hospitals and actions
  console.log("\n=== Seeding Staff (6 hospitals) ===");
  const staffUsers = HOSPITALS.map((h, idx) => ({
    firstName: "Staff",
    lastName: `H${idx + 1}`,
    email: `staff.h${idx + 1}.${ts}@example.com`,
    phone: `+22200000${idx + 1}`,
    password: PASSWORD,
    role: "staff",
    hospitalName: h,
  }));

  const staffTokens = [];
  for (const s of staffUsers) {
    try {
      await registerUser(s);
      console.log(`Registered staff: ${s.email} (${s.hospitalName})`);
    } catch (e) {
      console.log(`Staff may already exist (ok): ${s.email} -> ${e.message}`);
    }
    try {
      const t = await loginUser({ email: s.email, password: PASSWORD });
      staffTokens.push({
        token: t,
        email: s.email,
        hospitalName: s.hospitalName,
      });
      console.log(`Logged in staff: ${s.email}`);
    } catch (e) {
      console.log(`Staff login failed ${s.email}: ${e.message}`);
    }
  }

  // Try call-next and complete per hospital
  for (const st of staffTokens) {
    console.log(`\n-- Staff actions for ${st.hospitalName} (${st.email}) --`);
    try {
      const call1 = await callNextStaff(st.token, {});
      console.log("Call-next #1:", call1.data);
      const call2 = await callNextStaff(st.token, {});
      console.log("Call-next #2:", call2.data);
    } catch (e) {
      console.log("Call-next error (may be none waiting):", e.message);
    }

    try {
      const done = await completeCurrentStaff(st.token);
      console.log("Completed:", done.data);
    } catch (e) {
      console.log("Complete error:", e.message);
    }
  }

  console.log("\nSeeding complete. You can refresh the staff dashboard.");
}

seed().catch((e) => {
  console.error("Seed script failed:", e);
  process.exit(1);
});

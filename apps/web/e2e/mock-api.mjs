import http from "node:http";

const port = Number(process.env.MOCK_API_PORT ?? 3101);

const unit = {
  id: "11111111-1111-4111-8111-111111111111",
  name: { fi: "Keskustakirjasto", en: "Central Library" },
  address: { fi: "Linnankatu 2, Turku", en: "Linnankatu 2, Turku" },
  createdAt: "2026-04-20T09:00:00Z",
  updatedAt: "2026-04-20T09:00:00Z",
};

const resource = {
  id: "22222222-2222-4222-8222-222222222222",
  unit,
  name: { fi: "Kokoushuone A", en: "Meeting room A" },
  description: {
    fi: "Rauhallinen kokoustila kymmenelle hengelle.",
    en: "Quiet meeting room for ten people.",
  },
  reservationInstructions: {
    fi: "Saavu kirjaston palvelupisteelle ennen varausta.",
    en: "Check in at the library service desk before your reservation.",
  },
  capacity: 10,
  slotMinutes: 60,
  requiresApproval: true,
  createdAt: "2026-04-20T09:00:00Z",
  updatedAt: "2026-04-20T09:00:00Z",
};

const users = {
  staff: {
    id: "44444444-4444-4444-8444-444444444444",
    email: "staff@example.com",
    name: "Demo Staff",
    isAdmin: false,
    staffUnitIds: [unit.id],
  },
  admin: {
    id: "55555555-5555-4555-8555-555555555555",
    email: "admin@example.com",
    name: "Demo Admin",
    isAdmin: true,
    staffUnitIds: [],
  },
};

const tokens = new Map([
  ["staff-token", users.staff],
  ["admin-token", users.admin],
]);

const membership = {
  id: "66666666-6666-4666-8666-666666666666",
  unit,
  user: {
    id: users.staff.id,
    email: users.staff.email,
    name: users.staff.name,
    isAdmin: users.staff.isAdmin,
  },
  createdAt: "2026-04-20T09:00:00Z",
};

const reservation = {
  id: "77777777-7777-4777-8777-777777777777",
  resource,
  user: {
    id: "33333333-3333-4333-8333-333333333333",
    email: "user@example.com",
    name: "Demo User",
    isAdmin: false,
  },
  begin: "2026-04-24T09:00:00Z",
  end: "2026-04-24T10:00:00Z",
  state: "requested",
  note: "",
  createdAt: "2026-04-20T09:00:00Z",
  updatedAt: "2026-04-20T09:00:00Z",
};

function json(res, status, body) {
  const payload = body === undefined ? "" : JSON.stringify(body);
  res.writeHead(status, {
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  });
  res.end(payload);
}

function userFromRequest(req) {
  const authorization = req.headers.authorization ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "");
  return tokens.get(token);
}

async function bodyJson(req) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
  }
  return raw ? JSON.parse(raw) : {};
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  const path = url.pathname;

  if (req.method === "OPTIONS") {
    json(res, 204);
    return;
  }

  if (req.method === "GET" && path === "/health") {
    json(res, 200, { ok: true });
    return;
  }

  if (!path.startsWith("/api/v1")) {
    json(res, 404, { detail: "Not found." });
    return;
  }

  if (req.method === "GET" && path === "/api/v1/resources") {
    json(res, 200, { count: 1, results: [resource] });
    return;
  }

  if (req.method === "POST" && path === "/api/v1/auth/signin") {
    const body = await bodyJson(req);
    const token =
      body.password === "Local-demo-12345" && body.email === users.staff.email
        ? "staff-token"
        : body.password === "Local-demo-12345" && body.email === users.admin.email
          ? "admin-token"
          : null;

    if (!token) {
      json(res, 400, { detail: "Invalid email or password." });
      return;
    }

    const user = tokens.get(token);
    json(res, 200, {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
      },
    });
    return;
  }

  const user = userFromRequest(req);
  if (!user) {
    json(res, 401, { detail: "Authentication credentials were not provided." });
    return;
  }

  if (req.method === "GET" && path === "/api/v1/me") {
    json(res, 200, user);
    return;
  }

  if (req.method === "GET" && path === "/api/v1/staff/units") {
    json(res, 200, [unit]);
    return;
  }

  if (req.method === "GET" && path === "/api/v1/staff/reservations") {
    json(res, 200, { count: 1, results: [reservation] });
    return;
  }

  if (req.method === "GET" && path === "/api/v1/staff/memberships") {
    json(res, 200, [membership]);
    return;
  }

  json(res, 404, { detail: "Not found." });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Mock API listening on http://127.0.0.1:${port}`);
});

function close() {
  server.close(() => process.exit(0));
}

process.on("SIGINT", close);
process.on("SIGTERM", close);

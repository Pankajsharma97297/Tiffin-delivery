const roles = [
  {
    envPrefix: "ADMIN",
    name: "MIDDO Admin",
    email: "admin@middo.com",
    phone: "+91 90000 00001",
    role: "admin",
  },
  {
    envPrefix: "VENDOR",
    name: "MIDDO Vendor",
    email: "vendor@middo.com",
    phone: "+91 90000 00002",
    role: "vendor",
  },
  {
    envPrefix: "RIDER",
    name: "MIDDO Rider",
    email: "rider@middo.com",
    phone: "+91 90000 00003",
    role: "rider",
  },
  {
    envPrefix: "CUSTOMER",
    name: "MIDDO Customer",
    email: "customer@middo.com",
    phone: "+91 90000 00004",
    role: "customer",
  },
];

const getEnv = (key, fallback) => process.env[key] || fallback;

const defaultSeedPassword = "Middo@123";

const getPassword = (key) => {
  const value =
    process.env[key] || process.env.SEED_DEFAULT_PASSWORD || defaultSeedPassword;

  if (!value) {
    throw new Error(`${key} or SEED_DEFAULT_PASSWORD is required for seeding`);
  }

  return value;
};

function getSeedUsers() {
  return roles.map((user) => ({
    name: getEnv(`SEED_${user.envPrefix}_NAME`, user.name),
    email: getEnv(`SEED_${user.envPrefix}_EMAIL`, user.email),
    phone: getEnv(`SEED_${user.envPrefix}_PHONE`, user.phone),
    password: getPassword(`SEED_${user.envPrefix}_PASSWORD`),
    role: user.role,
    isActive: true,
  }));
}

function getSeedSuperAdmin() {
  return {
    name: getEnv("SEED_SUPER_ADMIN_NAME", "MIDDO Super Admin"),
    email: getEnv("SEED_SUPER_ADMIN_EMAIL", "superadmin@middo.com"),
    password: getPassword("SEED_SUPER_ADMIN_PASSWORD"),
    role: "super_admin",
    isActive: true,
  };
}

module.exports = {
  getSeedSuperAdmin,
  getSeedUsers,
};

const { OAuth2Client } = require("google-auth-library");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Customer = require("../models/Customer");
const { admin, initializeFirebaseAdmin } = require("../config/firebaseAdmin");
const asyncHandler = require("../utils/asyncHandler");
const generateToken = require("../utils/generateToken");
const { sendSuccess } = require("../utils/apiResponse");
const { toStoredAvatarPath } = require("../utils/avatarPath");
const logger = require("../utils/logger");

const allowedRoles = ["customer", "vendor", "rider", "admin"];
const googleClient = new OAuth2Client();
const otpSessions = new Map();

const normalizeFirebaseUserRole = (role = "customer") => {
  const value = String(role || "").toLowerCase().trim();

  if (value === "homechef" || value === "homechefs" || value === "vendor") {
    return "vendor";
  }

  if (value === "rider" || value === "delivery") {
    return "rider";
  }

  return allowedRoles.includes(value) ? value : "customer";
};

const normalizeFirebasePartnerRole = (role = "") => {
  const userRole = normalizeFirebaseUserRole(role);

  if (userRole === "vendor") {
    return "homechef";
  }

  if (userRole === "rider") {
    return "rider";
  }

  return "";
};

const normalizePhone = (dialCode = "+91", phone = "") => {
  const cleanPhone = String(phone || "").replace(/\D/g, "");
  const cleanDialCode = String(dialCode || "+91").trim();

  return cleanPhone ? `${cleanDialCode} ${cleanPhone}`.trim() : "";
};

const createOtpCode = () => process.env.DEV_LOGIN_OTP || "123456";

const startPhoneOtp = asyncHandler(async (req, res) => {
  const { dialCode = "+91", phone } = req.body;
  const normalizedPhone = normalizePhone(dialCode, phone);

  if (!normalizedPhone) {
    return res.status(400).json({
      success: false,
      message: "Valid phone number is required",
    });
  }

  const otp = createOtpCode();
  const ttlMinutes = Number(process.env.OTP_TTL_MINUTES || 5);
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  otpSessions.set(normalizedPhone, {
    otp,
    expiresAt,
    attempts: 0,
  });

  return sendSuccess(res, 200, "OTP sent successfully", {
    phone: normalizedPhone,
    expiresAt,
    ...(process.env.NODE_ENV === "production" ? {} : { otp }),
  });
});

const verifyPhoneOtp = asyncHandler(async (req, res) => {
  const {
    address,
    avatar,
    dialCode = "+91",
    email,
    liveAddress,
    name,
    otp,
    phone,
  } = req.body;
  const normalizedPhone = normalizePhone(dialCode, phone);

  if (!normalizedPhone || !otp) {
    return res.status(400).json({
      success: false,
      message: "Phone number and OTP are required",
    });
  }

  const session = otpSessions.get(normalizedPhone);
  if (!session) {
    return res.status(400).json({
      success: false,
      message: "OTP session expired. Please request a new OTP.",
    });
  }

  if (session && session.expiresAt < new Date()) {
    otpSessions.delete(normalizedPhone);
    return res.status(400).json({
      success: false,
      message: "OTP expired. Please request a new OTP.",
    });
  }

  if (session && session.otp !== String(otp)) {
    session.attempts += 1;
    if (session.attempts >= 5) {
      otpSessions.delete(normalizedPhone);
    }
    return res.status(401).json({
      success: false,
      message: "Invalid OTP",
    });
  }

  otpSessions.delete(normalizedPhone);

  const cleanEmail = email ? String(email).toLowerCase().trim() : "";
  const query = cleanEmail
    ? { $or: [{ phone: normalizedPhone }, { email: cleanEmail }] }
    : { phone: normalizedPhone };
  const existingUser = await User.findOne(query);
  const existingCustomer = await Customer.findOne(
    cleanEmail
      ? { $or: [{ phone: normalizedPhone }, { email: cleanEmail }] }
      : { phone: normalizedPhone },
  );
  const cleanName = String(
    name || existingCustomer?.name || existingUser?.name || "MIDDO Customer",
  ).trim();
  const cleanAvatar = toStoredAvatarPath(
    avatar || existingCustomer?.avatar || existingUser?.avatar,
  );
  const shouldUnsetAvatar =
    Boolean(avatar || existingCustomer?.avatar || existingUser?.avatar) &&
    !cleanAvatar;
  const user = await User.findOneAndUpdate(
    query,
    {
      $set: {
        name: cleanName,
        phone: normalizedPhone,
        ...(cleanEmail ? { email: cleanEmail } : {}),
        ...(cleanAvatar ? { avatar: cleanAvatar } : {}),
        authProvider: "phone",
        role: "customer",
        isActive: true,
        lastLoginAt: new Date(),
      },
      ...(shouldUnsetAvatar ? { $unset: { avatar: "" } } : {}),
    },
    {
      returnDocument: "after",
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );
  const customer = await Customer.findOneAndUpdate(
    cleanEmail
      ? { $or: [{ phone: normalizedPhone }, { email: cleanEmail }] }
      : { phone: normalizedPhone },
    {
      $set: {
        name: existingCustomer?.name || user.name,
        phone: normalizedPhone,
        ...(cleanEmail ? { email: cleanEmail } : {}),
        ...(cleanAvatar ? { avatar: cleanAvatar } : {}),
        authProvider: "phone",
        ...(address ? { address, location: liveAddress || address } : {}),
        ...(liveAddress ? { liveAddress, location: liveAddress } : {}),
        isActive: true,
      },
      ...(shouldUnsetAvatar ? { $unset: { avatar: "" } } : {}),
      $setOnInsert: {
        walletBalance: 0,
      },
    },
    {
      returnDocument: "after",
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );
  const token = generateToken(user);

  return sendSuccess(res, 200, "OTP verified successfully", {
    token,
    user,
    customer,
  });
});

const getGoogleAudience = () => {
  const ids = [
    process.env.GOOGLE_WEB_CLIENT_ID,
    process.env.GOOGLE_IOS_CLIENT_ID,
    process.env.GOOGLE_ANDROID_CLIENT_ID,
  ].filter(Boolean);

  return ids.length > 0 ? ids : undefined;
};

const verifyGoogleIdToken = async (idToken) => {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: getGoogleAudience(),
  });

  const payload = ticket.getPayload();

  if (!payload?.email || !payload?.sub) {
    throw new Error("Google account did not return required profile details");
  }

  return payload;
};

const decodeJwtPart = (token, partIndex) => {
  const part = String(token || "").split(".")[partIndex];
  if (!part) return null;

  return JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
};

const getApplePublicKey = async (kid) => {
  const response = await fetch("https://appleid.apple.com/auth/keys");
  const jwks = await response.json();
  const jwk = jwks.keys?.find((key) => key.kid === kid);

  if (!jwk) {
    throw new Error("Apple public key not found");
  }

  return crypto.createPublicKey({ key: jwk, format: "jwk" });
};

const verifyAppleIdentityToken = async (identityToken) => {
  const header = decodeJwtPart(identityToken, 0);

  if (!header?.kid) {
    throw new Error("Invalid Apple identity token header");
  }

  const publicKey = await getApplePublicKey(header.kid);
  const options = {
    algorithms: ["RS256"],
    issuer: "https://appleid.apple.com",
  };

  if (process.env.APPLE_CLIENT_ID) {
    options.audience = process.env.APPLE_CLIENT_ID;
  }

  return jwt.verify(identityToken, publicKey, options);
};

const findCustomerQuery = ({ email, phone }) => {
  const cleanEmail = email ? String(email).toLowerCase().trim() : "";
  const cleanPhone = phone ? String(phone).trim() : "";

  if (!cleanEmail && !cleanPhone) {
    return null;
  }

  return cleanEmail ? { email: cleanEmail } : { phone: cleanPhone };
};

const getAuthProviderFromFirebase = (decodedToken) => {
  const provider =
    decodedToken.firebase?.sign_in_provider ||
    decodedToken.firebase?.identities?.["sign_in_provider"];

  if (provider === "phone") return "phone";
  if (provider === "apple.com") return "apple";
  if (provider === "google.com") return "google";

  return decodedToken.phone_number ? "phone" : "google";
};

const getFirebaseProviderIdentity = (decodedToken, providerId) => {
  const identities = decodedToken.firebase?.identities?.[providerId];
  return Array.isArray(identities) ? identities[0] : "";
};

const buildIdentityQuery = ({ appleId, email, firebaseUid, googleId, phone }) => {
  const identities = [
    appleId ? { appleId } : null,
    firebaseUid ? { firebaseUid } : null,
    googleId ? { googleId } : null,
    email ? { email } : null,
    phone ? { phone } : null,
  ].filter(Boolean);

  return identities.length > 1 ? { $or: identities } : identities[0];
};

const syncCustomerFromUser = async (user) => {
  const cleanAvatar = toStoredAvatarPath(user.avatar);
  const customerPayload = {
    name: user.name,
    phone: user.phone,
    email: user.email,
    authProvider: user.authProvider,
    firebaseUid: user.firebaseUid,
    googleId: user.googleId,
    appleId: user.appleId,
    isActive: user.isActive,
  };
  const query = buildIdentityQuery({
    email: user.email,
    firebaseUid: user.firebaseUid,
    googleId: user.googleId,
    appleId: user.appleId,
    phone: user.phone,
  });

  if (!query) {
    return null;
  }

  return Customer.findOneAndUpdate(
    query,
    {
      $set: {
        ...customerPayload,
        ...(cleanAvatar ? { avatar: cleanAvatar } : {}),
      },
      ...(!cleanAvatar && user.avatar ? { $unset: { avatar: "" } } : {}),
    },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true },
  );
};

const buildAuthResponse = async (user) => {
  const token = generateToken(user);
  const customer =
    user.role === "customer" ? await syncCustomerFromUser(user) : null;

  user.password = undefined;

  return {
    token,
    user,
    customer,
  };
};

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role = "customer" } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(400).json({
      success: false,
      message: "Name, email, phone and password are required",
    });
  }

  if (!allowedRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: "Invalid role selected",
      roles: allowedRoles,
    });
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });

  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: "Email already exists",
    });
  }

  const user = await User.create({ name, email, phone, password, role });
  const authData = await buildAuthResponse(user);

  return sendSuccess(res, 201, "User registered successfully", {
    ...authData,
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password",
  );

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  if (!user.isActive) {
    return res.status(403).json({
      success: false,
      message: "Your account is inactive",
    });
  }

  user.lastLoginAt = new Date();
  await user.save();

  const authData = await buildAuthResponse(user);

  return sendSuccess(res, 200, "Login successful", {
    ...authData,
  });
});

const updateCustomerLocation = asyncHandler(async (req, res) => {
  const {
    address,
    avatar,
    dialCode = "+91",
    email,
    latitude,
    liveAddress,
    longitude,
    name,
    phone,
  } = req.body;

  if (!phone && !email) {
    return res.status(400).json({
      success: false,
      message: "Phone or email is required to save location",
    });
  }

  const cleanPhone = phone
    ? `${dialCode} ${String(phone).replace(/\D/g, "")}`.trim()
    : "";
  const locationLabel = liveAddress || address || "";
  const query = email
    ? { email: String(email).toLowerCase() }
    : { phone: cleanPhone };
  const update = {
    authProvider: email ? "google" : "phone",
    isActive: true,
  };

  if (name) {
    update.name = String(name).trim();
  }
  if (avatar) {
    const cleanAvatar = toStoredAvatarPath(avatar);
    if (cleanAvatar) {
      update.avatar = cleanAvatar;
    }
  }
  if (cleanPhone) {
    update.phone = cleanPhone;
  }
  if (email) {
    update.email = String(email).toLowerCase();
  }
  if (locationLabel) {
    update.location = locationLabel;
    update.address = address || locationLabel;
    update.liveAddress = locationLabel;
  }
  if (latitude !== undefined && latitude !== null && latitude !== "") {
    update.latitude = Number(latitude);
  }
  if (longitude !== undefined && longitude !== null && longitude !== "") {
    update.longitude = Number(longitude);
  }

  const existingCustomer = await Customer.findOne(query);
  const shouldSeedSavedAddress =
    locationLabel &&
    (!existingCustomer?.savedAddresses ||
      existingCustomer.savedAddresses.length === 0);

  const locationInsertDefaults = {
    walletBalance: 0,
  };

  if (!update.name) {
    locationInsertDefaults.name =
      update.email || update.phone || "MIDDO Customer";
  }

  const dbUpdate = {
    $set: update,
    $setOnInsert: locationInsertDefaults,
  };

  if (shouldSeedSavedAddress) {
    dbUpdate.$set.savedAddresses = [
      {
        label: "Home",
        address: address || locationLabel,
        liveAddress: locationLabel,
        latitude:
          latitude === undefined || latitude === null || latitude === ""
            ? undefined
            : Number(latitude),
        longitude:
          longitude === undefined || longitude === null || longitude === ""
            ? undefined
            : Number(longitude),
        isDefault: true,
      },
    ];
  }

  const customer = await Customer.findOneAndUpdate(query, dbUpdate, {
    returnDocument: "after",
    upsert: true,
    runValidators: true,
    setDefaultsOnInsert: true,
  });

  const userQuery = buildIdentityQuery({
    email: update.email,
    phone: update.phone,
  });
  const user = userQuery
    ? await User.findOneAndUpdate(
        userQuery,
        {
          $set: {
            name: update.name || customer.name,
            ...(update.email ? { email: update.email } : {}),
            ...(update.phone ? { phone: update.phone } : {}),
            ...(update.avatar ? { avatar: update.avatar } : {}),
            authProvider: update.authProvider,
            role: "customer",
            isActive: true,
            lastLoginAt: new Date(),
          },
        },
        {
          returnDocument: "after",
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        },
      )
    : null;

  return sendSuccess(res, 200, "Customer location saved", { customer, user });
});

const updateCustomerProfile = asyncHandler(async (req, res) => {
  const { address, avatar, email, liveAddress, name, phone } = req.body;
  const reqEmail = req.user?.email || "";
  const reqPhone = req.user?.phone || "";

  if (!email && !phone && !reqEmail && !reqPhone) {
    return res.status(400).json({
      success: false,
      message: "Email or phone is required to update profile",
    });
  }

  const cleanEmail = email
    ? String(email).toLowerCase().trim()
    : String(reqEmail || "").toLowerCase().trim();
  const cleanPhone = phone ? String(phone).trim() : String(reqPhone || "").trim();
  const update = {};
  const unset = {};

  if (name) update.name = String(name).trim();
  if (avatar !== undefined) {
    const cleanAvatar = toStoredAvatarPath(avatar);
    if (cleanAvatar) {
      update.avatar = cleanAvatar;
    } else {
      unset.avatar = "";
    }
  }
  if (cleanEmail) update.email = cleanEmail;
  if (cleanPhone) update.phone = cleanPhone;
  if (address !== undefined) {
    update.address = String(address || "").trim();
    update.location = String(liveAddress || address || "").trim();
  }
  if (liveAddress !== undefined) {
    update.liveAddress = String(liveAddress || "").trim();
    update.location = String(liveAddress || address || "").trim();
  }
  const locationLabel = update.liveAddress || update.address || "";

  if (locationLabel) {
    update.savedAddresses = [
      {
        label: "Home",
        address: update.address || locationLabel,
        liveAddress: update.liveAddress || locationLabel,
        isDefault: true,
      },
    ];
  }

  const customerIdentity = [
    cleanEmail ? { email: cleanEmail } : null,
    cleanPhone ? { phone: cleanPhone } : null,
    reqEmail ? { email: String(reqEmail).toLowerCase().trim() } : null,
    reqPhone ? { phone: String(reqPhone).trim() } : null,
  ].filter(Boolean);
  const customerQuery =
    customerIdentity.length > 1 ? { $or: customerIdentity } : customerIdentity[0];

  const profileInsertDefaults = {
    walletBalance: 0,
  };

  if (!update.name) {
    profileInsertDefaults.name =
      req.user?.name || update.email || update.phone || "MIDDO Customer";
  }

  const customer = await Customer.findOneAndUpdate(
    customerQuery,
    {
      $set: {
        ...update,
        authProvider: req.user?.authProvider || "phone",
        isActive: true,
      },
      $setOnInsert: profileInsertDefaults,
      ...(Object.keys(unset).length ? { $unset: unset } : {}),
    },
    {
      returnDocument: "after",
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );

  const userUpdate = {};
  const userUnset = {};
  if (update.name) userUpdate.name = update.name;
  if (update.avatar) userUpdate.avatar = update.avatar;
  if (unset.avatar) userUnset.avatar = "";
  if (cleanEmail) userUpdate.email = cleanEmail;
  if (cleanPhone) userUpdate.phone = cleanPhone;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      ...(Object.keys(userUpdate).length ? { $set: userUpdate } : {}),
      ...(Object.keys(userUnset).length ? { $unset: userUnset } : {}),
    },
    { returnDocument: "after", runValidators: true },
  );

  return sendSuccess(res, 200, "Customer profile updated", { customer, user });
});

const updateCustomerSettings = asyncHandler(async (req, res) => {
  const query = findCustomerQuery(req.body);

  if (!query) {
    return res.status(400).json({
      success: false,
      message: "Email or phone is required to update settings",
    });
  }

  const { settings = {}, language } = req.body;
  const update = {};

  if (settings.notifications) {
    Object.entries(settings.notifications).forEach(([key, value]) => {
      update[`settings.notifications.${key}`] = Boolean(value);
    });
  }

  if (settings.appearance) {
    Object.entries(settings.appearance).forEach(([key, value]) => {
      update[`settings.appearance.${key}`] = Boolean(value);
    });
  }

  if (settings.language || language) {
    update["settings.language"] = String(settings.language || language);
  }

  const customer = await Customer.findOneAndUpdate(
    query,
    {
      $set: update,
      $setOnInsert: {
        name:
          req.body.name ||
          req.body.customer ||
          req.body.email ||
          req.body.phone ||
          "MIDDO Customer",
        email: req.body.email
          ? String(req.body.email).toLowerCase().trim()
          : undefined,
        phone: req.body.phone ? String(req.body.phone).trim() : undefined,
        isActive: true,
      },
    },
    {
      returnDocument: "after",
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );

  return sendSuccess(res, 200, "Customer settings updated", { customer });
});

const updateCustomerAddresses = asyncHandler(async (req, res) => {
  const query = findCustomerQuery(req.body);

  if (!query) {
    return res.status(400).json({
      success: false,
      message: "Email or phone is required to update addresses",
    });
  }

  const savedAddresses = Array.isArray(req.body.savedAddresses)
    ? req.body.savedAddresses.map((item, index) => ({
        label: String(
          item.label || (index === 0 ? "Home" : `Address ${index + 1}`),
        ).trim(),
        address: String(item.address || item.liveAddress || "").trim(),
        liveAddress: String(item.liveAddress || item.address || "").trim(),
        latitude:
          item.latitude === undefined || item.latitude === null
            ? undefined
            : Number(item.latitude),
        longitude:
          item.longitude === undefined || item.longitude === null
            ? undefined
            : Number(item.longitude),
        isDefault: index === 0 || Boolean(item.isDefault),
      }))
    : [];

  const primaryAddress =
    savedAddresses.find((item) => item.isDefault) || savedAddresses[0];
  const update = { savedAddresses };

  if (primaryAddress) {
    update.address = primaryAddress.address;
    update.liveAddress = primaryAddress.liveAddress || primaryAddress.address;
    update.location = primaryAddress.liveAddress || primaryAddress.address;
    update.latitude = primaryAddress.latitude;
    update.longitude = primaryAddress.longitude;
  }

  const customer = await Customer.findOneAndUpdate(
    query,
    {
      $set: update,
      $setOnInsert: {
        name:
          req.body.name ||
          req.body.customer ||
          req.body.email ||
          req.body.phone ||
          "MIDDO Customer",
        email: req.body.email
          ? String(req.body.email).toLowerCase().trim()
          : undefined,
        phone: req.body.phone ? String(req.body.phone).trim() : undefined,
        isActive: true,
      },
    },
    {
      returnDocument: "after",
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );

  return sendSuccess(res, 200, "Customer addresses updated", { customer });
});

const deactivateCustomerAccount = asyncHandler(async (req, res) => {
  const query = findCustomerQuery(req.body);

  if (!query) {
    return res.status(400).json({
      success: false,
      message: "Email or phone is required to deactivate account",
    });
  }

  const customer = await Customer.findOneAndUpdate(
    query,
    { $set: { isActive: false } },
    { returnDocument: "after" },
  );

  if (!customer) {
    return res
      .status(404)
      .json({ success: false, message: "Customer not found" });
  }

  if (customer.email) {
    await User.findOneAndUpdate(
      { email: customer.email },
      { $set: { isActive: false } },
    );
  }

  return sendSuccess(res, 200, "Customer account deactivated", { customer });
});

const deleteCustomerAccount = asyncHandler(async (req, res) => {
  const query = findCustomerQuery(req.body);

  if (!query) {
    return res.status(400).json({
      success: false,
      message: "Email or phone is required to delete account",
    });
  }

  const customer = await Customer.findOneAndDelete(query);

  if (!customer) {
    return res
      .status(404)
      .json({ success: false, message: "Customer not found" });
  }

  if (customer.email) {
    await User.findOneAndDelete({ email: customer.email });
  }

  return sendSuccess(res, 200, "Customer account deleted", { customer });
});

const googleLoginUser = asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({
      success: false,
      message: "Google ID token is required",
    });
  }

  let googleProfile;

  try {
    googleProfile = await verifyGoogleIdToken(idToken);
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Google sign-in verification failed",
    });
  }

  const email = googleProfile.email.toLowerCase();
  const name = googleProfile.name || email.split("@")[0];

  const user = await User.findOneAndUpdate(
    {
      $or: [{ email }, { googleId: googleProfile.sub }],
    },
    {
      $set: {
        name,
        email,
        authProvider: "google",
        googleId: googleProfile.sub,
        isActive: true,
        lastLoginAt: new Date(),
      },
      $setOnInsert: {
        role: "customer",
      },
    },
    {
      returnDocument: "after",
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );

  const customer =
    user.role === "customer" ? await syncCustomerFromUser(user) : null;
  const token = generateToken(user);

  return sendSuccess(res, 200, "Google login successful", {
    token,
    user,
    customer,
  });
});

const appleLoginUser = asyncHandler(async (req, res) => {
  const { email, identityToken, name, user } = req.body;

  if (!identityToken) {
    return res.status(400).json({
      success: false,
      message: "Apple identity token is required",
    });
  }

  let appleProfile;

  try {
    appleProfile = await verifyAppleIdentityToken(identityToken);
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Apple sign-in verification failed",
    });
  }

  const appleId = appleProfile.sub || user;
  const cleanEmail = appleProfile.email
    ? String(appleProfile.email).toLowerCase().trim()
    : email
      ? String(email).toLowerCase().trim()
      : "";

  if (!appleId && !cleanEmail) {
    return res.status(400).json({
      success: false,
      message: "Apple account did not return a usable identity",
    });
  }

  const query = buildIdentityQuery({ appleId, email: cleanEmail });
  const existingUserByEmail = email
    ? await User.findOne({ email }).lean()
    : null;
  const existingUser = existingUserByEmail || await User.findOne(query).lean();
  const existingCustomer = await Customer.findOne(query).lean();
  const cleanName = String(
    name ||
      existingCustomer?.name ||
      existingUser?.name ||
      (cleanEmail ? cleanEmail.split("@")[0] : "") ||
      "MIDDO Customer",
  ).trim();

  const update = {
    name: cleanName,
    authProvider: "apple",
    isActive: true,
    lastLoginAt: new Date(),
  };

  if (appleId) update.appleId = appleId;
  if (cleanEmail) update.email = cleanEmail;

  const signedInUser = await User.findOneAndUpdate(
    query,
    {
      $set: update,
      $setOnInsert: {
        role: "customer",
      },
    },
    {
      returnDocument: "after",
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );

  const customer =
    signedInUser.role === "customer"
      ? await syncCustomerFromUser(signedInUser)
      : null;
  const token = generateToken(signedInUser);

  return sendSuccess(res, 200, "Apple login successful", {
    token,
    user: signedInUser,
    customer,
  });
});

const firebaseLoginUser = asyncHandler(async (req, res) => {
  const { idToken, profile = {}, role } = req.body;

  if (!idToken) {
    return res.status(400).json({
      success: false,
      message: "Firebase ID token is required",
    });
  }

  let decodedToken;

  try {
    initializeFirebaseAdmin();
    decodedToken = await admin.auth().verifyIdToken(idToken);
  } catch (error) {
    logger.error(
      `[firebase-auth] verifyIdToken failed: ${error?.code || "unknown"} ${error?.message || error}`,
    );
    return res.status(401).json({
      success: false,
      message: "Firebase sign-in verification failed",
    });
  }

  const firebaseUid = decodedToken.uid;
  const email = decodedToken.email
    ? String(decodedToken.email).toLowerCase().trim()
    : "";
  const phone = decodedToken.phone_number || "";
  const authProvider = getAuthProviderFromFirebase(decodedToken);
  const googleId =
    authProvider === "google"
      ? getFirebaseProviderIdentity(decodedToken, "google.com")
      : "";
  const appleId =
    authProvider === "apple"
      ? profile.appleId || getFirebaseProviderIdentity(decodedToken, "apple.com")
      : "";
  const query = buildIdentityQuery({
    appleId,
    email,
    firebaseUid,
    googleId,
    phone,
  });

  if (!query) {
    return res.status(400).json({
      success: false,
      message: "Firebase token did not include a usable identity",
    });
  }

  const existingUser = await User.findOne(query).lean();
  const existingCustomer = await Customer.findOne(query).lean();
  const profileName = String(profile.name || "").trim();
  const decodedName = String(decodedToken.name || "").trim();
  const name =
    existingCustomer?.name ||
    existingUser?.name ||
    profileName ||
    decodedName ||
    (email ? email.split("@")[0] : "") ||
    phone ||
    `MIDDO User ${firebaseUid.slice(0, 6)}`;
  const avatar = toStoredAvatarPath(
    existingCustomer?.avatar ||
      existingUser?.avatar ||
      profile.avatar ||
      profile.photoURL ||
      decodedToken.picture,
  );
  const requestedRole = existingUser?.partnerProfile?.role || existingUser?.role || role || profile.role;
  const userRole = normalizeFirebaseUserRole(requestedRole);
  const partnerRole = normalizeFirebasePartnerRole(requestedRole);
  const isExistingUser = Boolean(existingUser);

  const update = {
    name,
    authProvider,
    firebaseUid,
    isActive: true,
    lastLoginAt: new Date(),
    role: userRole,
  };

  if (email) update.email = existingUser?.email || email;
  if (phone) update.phone = phone;
  if (googleId) update.googleId = googleId;
  if (appleId) update.appleId = appleId;
  if (avatar) update.avatar = avatar;
  if (partnerRole) {
    update.partnerProfile = {
      ...(existingUser?.partnerProfile || {}),
      ...profile,
      avatar,
      email: existingUser?.partnerProfile?.email || existingUser?.email || email,
      name,
      phone,
      role: partnerRole,
    };
  }

  const user = await User.findOneAndUpdate(
    existingUser?._id ? { _id: existingUser._id } : query,
    {
      $set: update,
    },
    {
      returnDocument: "after",
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );

  const customer =
    user.role === "customer" ? await syncCustomerFromUser(user) : null;
  const token = generateToken(user);
  const profileComplete = Boolean(
    user.partnerProfile?.role &&
      (user.partnerProfile?.name || user.name) &&
      (user.partnerProfile?.email || user.email || user.partnerProfile?.phone || user.phone),
  );
  const needsSetup = !isExistingUser || !profileComplete;

  return sendSuccess(res, 200, "Firebase login successful", {
    isNewUser: !isExistingUser,
    needsSetup,
    profile: user.partnerProfile || null,
    profileComplete,
    token,
    user,
    customer,
  });
});

module.exports = {
  deactivateCustomerAccount,
  deleteCustomerAccount,
  firebaseLoginUser,
  googleLoginUser,
  appleLoginUser,
  startPhoneOtp,
  updateCustomerAddresses,
  updateCustomerSettings,
  updateCustomerProfile,
  updateCustomerLocation,
  verifyPhoneOtp,
  registerUser,
  loginUser,
};

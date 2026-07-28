-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,
    "refreshToken" TEXT,
    "refreshTokenExpires" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatbotConfig" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "botName" TEXT NOT NULL DEFAULT 'Aria',
    "personalityTone" TEXT NOT NULL DEFAULT 'friendly',
    "avatarPreset" TEXT NOT NULL DEFAULT 'green',
    "logoUrl" TEXT,
    "welcomeMessage" TEXT,
    "starterPrompts" TEXT,
    "brandColor" TEXT DEFAULT '#00A460',
    "language" TEXT DEFAULT 'en',
    "capProducts" BOOLEAN NOT NULL DEFAULT true,
    "capOrderTracking" BOOLEAN NOT NULL DEFAULT true,
    "capPolicies" BOOLEAN NOT NULL DEFAULT true,
    "capFaqs" BOOLEAN NOT NULL DEFAULT true,
    "setupComplete" BOOLEAN NOT NULL DEFAULT false,
    "customInstructions" TEXT,

    CONSTRAINT "ChatbotConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantConfig" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "supportEmail" TEXT,
    "supportUrl" TEXT,
    "productCache" TEXT,
    "cacheSyncedAt" TIMESTAMP(3),

    CONSTRAINT "MerchantConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faq" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Faq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerName" TEXT DEFAULT 'Guest',
    "customerEmail" TEXT,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChatbotConfig_shop_key" ON "ChatbotConfig"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantConfig_shop_key" ON "MerchantConfig"("shop");

-- CreateIndex
CREATE INDEX "Policy_shop_idx" ON "Policy"("shop");

-- CreateIndex
CREATE INDEX "Faq_shop_idx" ON "Faq"("shop");

-- CreateIndex
CREATE INDEX "Conversation_shop_idx" ON "Conversation"("shop");

-- CreateIndex
CREATE INDEX "Conversation_shop_createdAt_idx" ON "Conversation"("shop", "createdAt");

-- CreateIndex
CREATE INDEX "Conversation_shop_role_createdAt_idx" ON "Conversation"("shop", "role", "createdAt");

-- CreateIndex
CREATE INDEX "Conversation_shop_sessionId_idx" ON "Conversation"("shop", "sessionId");

-- Script: Database Schema Initialization for FlowSpeak
-- Database: SQL Server

-- 1. LookupStatus Table
CREATE TABLE [dbo].[LookupStatuses] (
    [Id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [ExternalId] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    [Code] NVARCHAR(50) NOT NULL UNIQUE,
    [DisplayName] NVARCHAR(100) NOT NULL,
    [Description] NVARCHAR(255) NULL,
    [CreatedAt] DATETIME2(7) NOT NULL DEFAULT SYSUTCDATETIME(),
    [UpdatedAt] DATETIME2(7) NULL,
    [IsDeleted] BIT NOT NULL DEFAULT 0
);
GO

-- 2. AppUsers Table
CREATE TABLE [dbo].[AppUsers] (
    [Id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [ExternalId] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    [PhoneNumber] NVARCHAR(50) NOT NULL UNIQUE,
    [FullName] NVARCHAR(100) NOT NULL,
    [Role] NVARCHAR(20) NOT NULL DEFAULT 'User',
    [IsActive] BIT NOT NULL DEFAULT 1,
    [CreatedAt] DATETIME2(7) NOT NULL DEFAULT SYSUTCDATETIME(),
    [UpdatedAt] DATETIME2(7) NULL,
    [IsDeleted] BIT NOT NULL DEFAULT 0
);
GO

-- 3. Products Table
CREATE TABLE [dbo].[Products] (
    [Id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [ExternalId] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    [Name] NVARCHAR(200) NOT NULL,
    [SKU] NVARCHAR(50) NOT NULL,
    [Price] DECIMAL(18,2) NOT NULL,
    [StockQuantity] INT NOT NULL,
    [Metadata] NVARCHAR(MAX) NULL, -- JSON formatted payload
    [SearchVector] NVARCHAR(500) NULL,
    [CreatedAt] DATETIME2(7) NOT NULL DEFAULT SYSUTCDATETIME(),
    [UpdatedAt] DATETIME2(7) NULL,
    [IsDeleted] BIT NOT NULL DEFAULT 0
);
GO
CREATE NONCLUSTERED INDEX [IX_Products_Name] ON [dbo].[Products] ([Name]);
GO

-- 4. SalesLogs Table
CREATE TABLE [dbo].[SalesLogs] (
    [Id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [ExternalId] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    [ProductId] BIGINT NOT NULL,
    [QuantitySold] INT NOT NULL,
    [TotalAmount] DECIMAL(18,2) NOT NULL,
    [SoldByPhoneNumber] NVARCHAR(50) NOT NULL,
    [AppUserId] BIGINT NULL,
    [TransactionStatusId] BIGINT NULL,
    [CreatedAt] DATETIME2(7) NOT NULL DEFAULT SYSUTCDATETIME(),
    [UpdatedAt] DATETIME2(7) NULL,
    [IsDeleted] BIT NOT NULL DEFAULT 0,
    CONSTRAINT [FK_SalesLogs_Products] FOREIGN KEY ([ProductId]) REFERENCES [dbo].[Products] ([Id]),
    CONSTRAINT [FK_SalesLogs_AppUsers] FOREIGN KEY ([AppUserId]) REFERENCES [dbo].[AppUsers] ([Id]),
    CONSTRAINT [FK_SalesLogs_LookupStatuses] FOREIGN KEY ([TransactionStatusId]) REFERENCES [dbo].[LookupStatuses] ([Id])
);
GO

-- ExternalId Global Indexes ensures fast lookup from webhooks bypassing ID guessing
CREATE UNIQUE NONCLUSTERED INDEX [IX_AppUsers_ExternalId] ON [dbo].[AppUsers] ([ExternalId]);
CREATE UNIQUE NONCLUSTERED INDEX [IX_Products_ExternalId] ON [dbo].[Products] ([ExternalId]);
CREATE UNIQUE NONCLUSTERED INDEX [IX_SalesLogs_ExternalId] ON [dbo].[SalesLogs] ([ExternalId]);
CREATE UNIQUE NONCLUSTERED INDEX [IX_LookupStatuses_ExternalId] ON [dbo].[LookupStatuses] ([ExternalId]);
GO

-- 5. AI_CommandLogs Table
-- Purpose: Immutable audit trail for every intent processed by the AI layer.
--          BIGINT PK supports billions of log rows without overflow.
--          No FK constraints intentionally — this table is append-only and survives schema refactors.
CREATE TABLE [dbo].[AI_CommandLogs] (
    [Id]              BIGINT         IDENTITY(1,1) PRIMARY KEY,
    [ExternalId]      UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    [Intent]          NVARCHAR(100)  NOT NULL,           -- e.g. CHECK_STOCK, RECORD_SALE
    [Entity]          NVARCHAR(200)  NULL,               -- The spoken entity (e.g. "Dell XPS 15")
    [RawPayload]      NVARCHAR(MAX)  NULL,               -- Full JSON sent by n8n / Groq
    [ResponsePayload] NVARCHAR(MAX)  NULL,               -- Full JSON returned by the API
    [CallerPhone]     NVARCHAR(50)   NULL,               -- AppUser.PhoneNumber for traceability
    [WasSuccessful]   BIT            NOT NULL DEFAULT 1,
    [ErrorMessage]    NVARCHAR(1000) NULL,
    [ProcessedAt]     DATETIME2(7)   NOT NULL DEFAULT SYSUTCDATETIME(),
    [CreatedAt]       DATETIME2(7)   NOT NULL DEFAULT SYSUTCDATETIME(),
    [UpdatedAt]       DATETIME2(7)   NULL,
    [IsDeleted]       BIT            NOT NULL DEFAULT 0
);
GO
-- Index for fast time-range queries and per-caller reporting
CREATE NONCLUSTERED INDEX [IX_AI_CommandLogs_ProcessedAt] ON [dbo].[AI_CommandLogs] ([ProcessedAt] DESC);
CREATE NONCLUSTERED INDEX [IX_AI_CommandLogs_CallerPhone] ON [dbo].[AI_CommandLogs] ([CallerPhone]);
CREATE NONCLUSTERED INDEX [IX_AI_CommandLogs_Intent]      ON [dbo].[AI_CommandLogs] ([Intent]);
CREATE UNIQUE NONCLUSTERED INDEX [IX_AI_CommandLogs_ExternalId] ON [dbo].[AI_CommandLogs] ([ExternalId]);
GO

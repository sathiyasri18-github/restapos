IF OBJECT_ID(N'dbo.PasswordResetTokens', N'U') IS NOT NULL DROP TABLE dbo.PasswordResetTokens;
GO

CREATE TABLE dbo.PasswordResetTokens
(
    PasswordResetTokenId INT            NOT NULL IDENTITY(1,1),
    UserId               INT            NOT NULL,
    TokenHash            NVARCHAR(256)  NOT NULL,
    ExpiresAt            DATETIME2(0)   NOT NULL,
    UsedAt               DATETIME2(0)   NULL,
    CreatedDate          DATETIME2(0)   NOT NULL CONSTRAINT DF_PasswordResetTokens_CreatedDate DEFAULT (GETDATE()),

    CONSTRAINT PK_PasswordResetTokens PRIMARY KEY (PasswordResetTokenId),

    CONSTRAINT FK_PasswordResetTokens_User
        FOREIGN KEY (UserId) REFERENCES dbo.Users (UserId) ON DELETE CASCADE
);
GO

CREATE INDEX IX_PasswordResetTokens_TokenHash ON dbo.PasswordResetTokens (TokenHash);
GO

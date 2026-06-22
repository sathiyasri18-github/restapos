-- Users, Roles, UserRoles, Menus, RoleMenus

IF OBJECT_ID(N'dbo.RoleMenus', N'U') IS NOT NULL DROP TABLE dbo.RoleMenus;
IF OBJECT_ID(N'dbo.UserRoles', N'U') IS NOT NULL DROP TABLE dbo.UserRoles;
IF OBJECT_ID(N'dbo.Menus', N'U') IS NOT NULL DROP TABLE dbo.Menus;
IF OBJECT_ID(N'dbo.Roles', N'U') IS NOT NULL DROP TABLE dbo.Roles;
IF OBJECT_ID(N'dbo.Users', N'U') IS NOT NULL DROP TABLE dbo.Users;
GO

CREATE TABLE dbo.Users
(
    UserId          INT            NOT NULL IDENTITY(1,1),
    UserName        NVARCHAR(50)   NOT NULL,
    DisplayName     NVARCHAR(100)  NOT NULL,
    Email           NVARCHAR(100)  NULL,
    PasswordHash    NVARCHAR(256)  NOT NULL,
    IsActive        BIT            NOT NULL CONSTRAINT DF_Users_IsActive DEFAULT (1),
    LastLoginDate   DATETIME2(0)   NULL,
    CreatedDate     DATETIME2(0)   NOT NULL CONSTRAINT DF_Users_CreatedDate DEFAULT (GETDATE()),
    CreatedBy       INT            NULL,
    ModifiedDate    DATETIME2(0)   NOT NULL CONSTRAINT DF_Users_ModifiedDate DEFAULT (GETDATE()),
    ModifiedBy      INT            NULL,

    CONSTRAINT PK_Users PRIMARY KEY (UserId)
);
GO

CREATE UNIQUE INDEX UX_Users_UserName ON dbo.Users (UserName);
GO

CREATE UNIQUE INDEX UX_Users_Email ON dbo.Users (Email) WHERE Email IS NOT NULL;
GO

CREATE TABLE dbo.Roles
(
    RoleId          INT            NOT NULL IDENTITY(1,1),
    RoleName        NVARCHAR(50)   NOT NULL,
    Description     NVARCHAR(200)  NULL,
    IsActive        BIT            NOT NULL CONSTRAINT DF_Roles_IsActive DEFAULT (1),
    CreatedDate     DATETIME2(0)   NOT NULL CONSTRAINT DF_Roles_CreatedDate DEFAULT (GETDATE()),
    CreatedBy       INT            NULL,
    ModifiedDate    DATETIME2(0)   NOT NULL CONSTRAINT DF_Roles_ModifiedDate DEFAULT (GETDATE()),
    ModifiedBy      INT            NULL,

    CONSTRAINT PK_Roles PRIMARY KEY (RoleId)
);
GO

CREATE UNIQUE INDEX UX_Roles_RoleName ON dbo.Roles (RoleName);
GO

CREATE TABLE dbo.UserRoles
(
    UserRoleId      INT            NOT NULL IDENTITY(1,1),
    UserId          INT            NOT NULL,
    RoleId          INT            NOT NULL,
    CreatedDate     DATETIME2(0)   NOT NULL CONSTRAINT DF_UserRoles_CreatedDate DEFAULT (GETDATE()),
    CreatedBy       INT            NULL,

    CONSTRAINT PK_UserRoles PRIMARY KEY (UserRoleId),
    CONSTRAINT FK_UserRoles_User FOREIGN KEY (UserId) REFERENCES dbo.Users (UserId),
    CONSTRAINT FK_UserRoles_Role FOREIGN KEY (RoleId) REFERENCES dbo.Roles (RoleId)
);
GO

CREATE UNIQUE INDEX UX_UserRoles_User_Role ON dbo.UserRoles (UserId, RoleId);
GO

CREATE INDEX IX_UserRoles_RoleId ON dbo.UserRoles (RoleId);
GO

CREATE TABLE dbo.Menus
(
    MenuId          INT            NOT NULL IDENTITY(1,1),
    ParentMenuId    INT            NULL,
    MenuCode        NVARCHAR(50)   NOT NULL,
    MenuName        NVARCHAR(100)  NOT NULL,
    RoutePath       NVARCHAR(200)  NULL,
    Icon            NVARCHAR(50)   NULL,
    SortOrder       INT            NOT NULL CONSTRAINT DF_Menus_SortOrder DEFAULT (0),
    IsActive        BIT            NOT NULL CONSTRAINT DF_Menus_IsActive DEFAULT (1),
    CreatedDate     DATETIME2(0)   NOT NULL CONSTRAINT DF_Menus_CreatedDate DEFAULT (GETDATE()),
    CreatedBy       INT            NULL,
    ModifiedDate    DATETIME2(0)   NOT NULL CONSTRAINT DF_Menus_ModifiedDate DEFAULT (GETDATE()),
    ModifiedBy      INT            NULL,

    CONSTRAINT PK_Menus PRIMARY KEY (MenuId),
    CONSTRAINT FK_Menus_Parent FOREIGN KEY (ParentMenuId) REFERENCES dbo.Menus (MenuId)
);
GO

CREATE UNIQUE INDEX UX_Menus_MenuCode ON dbo.Menus (MenuCode);
GO

CREATE INDEX IX_Menus_ParentMenuId ON dbo.Menus (ParentMenuId);
GO

CREATE TABLE dbo.RoleMenus
(
    RoleMenuId      INT            NOT NULL IDENTITY(1,1),
    RoleId          INT            NOT NULL,
    MenuId          INT            NOT NULL,
    CanView         BIT            NOT NULL CONSTRAINT DF_RoleMenus_CanView DEFAULT (1),
    CanAdd          BIT            NOT NULL CONSTRAINT DF_RoleMenus_CanAdd DEFAULT (0),
    CanEdit         BIT            NOT NULL CONSTRAINT DF_RoleMenus_CanEdit DEFAULT (0),
    CanDelete       BIT            NOT NULL CONSTRAINT DF_RoleMenus_CanDelete DEFAULT (0),
    CreatedDate     DATETIME2(0)   NOT NULL CONSTRAINT DF_RoleMenus_CreatedDate DEFAULT (GETDATE()),
    CreatedBy       INT            NULL,
    ModifiedDate    DATETIME2(0)   NOT NULL CONSTRAINT DF_RoleMenus_ModifiedDate DEFAULT (GETDATE()),
    ModifiedBy      INT            NULL,

    CONSTRAINT PK_RoleMenus PRIMARY KEY (RoleMenuId),
    CONSTRAINT FK_RoleMenus_Role FOREIGN KEY (RoleId) REFERENCES dbo.Roles (RoleId),
    CONSTRAINT FK_RoleMenus_Menu FOREIGN KEY (MenuId) REFERENCES dbo.Menus (MenuId)
);
GO

CREATE UNIQUE INDEX UX_RoleMenus_Role_Menu ON dbo.RoleMenus (RoleId, MenuId);
GO

CREATE INDEX IX_RoleMenus_MenuId ON dbo.RoleMenus (MenuId);
GO

-- Optional seed role (create first user via Users page in the app)
IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleName = N'Administrator')
    INSERT INTO dbo.Roles (RoleName, Description, IsActive) VALUES (N'Administrator', N'Full access', 1);
GO

-- Password reset tokens (run PasswordResetTokenTable.sql if table missing)
IF OBJECT_ID(N'dbo.PasswordResetTokens', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PasswordResetTokens
    (
        PasswordResetTokenId INT            NOT NULL IDENTITY(1,1),
        UserId               INT            NOT NULL,
        TokenHash            NVARCHAR(256)  NOT NULL,
        ExpiresAt            DATETIME2(0)   NOT NULL,
        UsedAt               DATETIME2(0)   NULL,
        CreatedDate          DATETIME2(0)   NOT NULL CONSTRAINT DF_PasswordResetTokens_CreatedDate DEFAULT (GETDATE()),
        CONSTRAINT PK_PasswordResetTokens PRIMARY KEY (PasswordResetTokenId),
        CONSTRAINT FK_PasswordResetTokens_User FOREIGN KEY (UserId) REFERENCES dbo.Users (UserId) ON DELETE CASCADE
    );
    CREATE INDEX IX_PasswordResetTokens_TokenHash ON dbo.PasswordResetTokens (TokenHash);
END
GO

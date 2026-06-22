CREATE TABLE dbo.CustomFields
(
    CustomFieldId   INT            NOT NULL IDENTITY(1,1),
    EntityTypeId    INT            NOT NULL,
    FieldTypeId     INT            NOT NULL,
    FieldKey        NVARCHAR(100)  NOT NULL,
    Label           NVARCHAR(200)  NOT NULL,
    OptionsJson     NVARCHAR(MAX)  NULL,
    SortOrder       INT            NOT NULL CONSTRAINT DF_CustomFields_SortOrder DEFAULT (0),
    IsRequired      BIT            NOT NULL CONSTRAINT DF_CustomFields_IsRequired DEFAULT (0),
    IsActive        BIT            NOT NULL CONSTRAINT DF_CustomFields_IsActive DEFAULT (1),
    CreatedDate     DATETIME2(0)   NOT NULL CONSTRAINT DF_CustomFields_CreatedDate DEFAULT (GETDATE()),
    CreatedBy       INT            NULL,
    ModifiedDate    DATETIME2(0)   NOT NULL CONSTRAINT DF_CustomFields_ModifiedDate DEFAULT (GETDATE()),
    ModifiedBy      INT            NULL,

    CONSTRAINT PK_CustomFields PRIMARY KEY (CustomFieldId),

    CONSTRAINT FK_CustomFields_EntityType
        FOREIGN KEY (EntityTypeId) REFERENCES dbo.Category (CategoryId),

    CONSTRAINT FK_CustomFields_FieldType
        FOREIGN KEY (FieldTypeId) REFERENCES dbo.Category (CategoryId)
);
GO

CREATE UNIQUE INDEX UX_CustomFields_EntityType_FieldKey
    ON dbo.CustomFields (EntityTypeId, FieldKey);
GO

CREATE INDEX IX_CustomFields_EntityTypeId
    ON dbo.CustomFields (EntityTypeId)
    INCLUDE (FieldKey, Label, FieldTypeId, OptionsJson, SortOrder, IsRequired)
    WHERE IsActive = 1;
GO

CREATE TABLE dbo.CustomFieldValues
(
    CustomFieldValueId INT            NOT NULL IDENTITY(1,1),
    CustomFieldId      INT            NOT NULL,
    EntityId           INT            NOT NULL,
    ValueText          NVARCHAR(500)  NULL,
    CreatedDate        DATETIME2(0)   NOT NULL CONSTRAINT DF_CustomFieldValues_CreatedDate DEFAULT (GETDATE()),
    CreatedBy          INT            NULL,
    ModifiedDate       DATETIME2(0)   NOT NULL CONSTRAINT DF_CustomFieldValues_ModifiedDate DEFAULT (GETDATE()),
    ModifiedBy         INT            NULL,

    CONSTRAINT PK_CustomFieldValues PRIMARY KEY (CustomFieldValueId),

    CONSTRAINT FK_CustomFieldValues_CustomField
        FOREIGN KEY (CustomFieldId) REFERENCES dbo.CustomFields (CustomFieldId)
);
GO

CREATE UNIQUE INDEX UX_CustomFieldValues_Field_Entity
    ON dbo.CustomFieldValues (CustomFieldId, EntityId);
GO

CREATE INDEX IX_CustomFieldValues_EntityId
    ON dbo.CustomFieldValues (EntityId);
GO

CREATE INDEX IX_CustomFieldValues_CustomFieldId
    ON dbo.CustomFieldValues (CustomFieldId);
GO

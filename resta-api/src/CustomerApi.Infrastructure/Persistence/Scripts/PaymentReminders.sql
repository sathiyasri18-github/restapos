CREATE TABLE dbo.PaymentReminders
(
    PaymentReminderId   INT           NOT NULL IDENTITY(1,1),
    CustomerId          INT           NOT NULL,
    ReminderTypeId      INT           NOT NULL,
    ReminderDate        DATE          NOT NULL,
    DueDate             DATE          NULL,
    Amount              DECIMAL(18,2) NULL,
    Remarks             NVARCHAR(500) NULL,
    IsSent              BIT           NOT NULL CONSTRAINT DF_PaymentReminders_IsSent DEFAULT (0),
    SentDate            DATETIME2(0)  NULL,
    CreatedDate         DATETIME2(0)  NOT NULL CONSTRAINT DF_PaymentReminders_CreatedDate DEFAULT (GETDATE()),
    CreatedBy           INT           NULL,
    ModifiedDate        DATETIME2(0)  NOT NULL CONSTRAINT DF_PaymentReminders_ModifiedDate DEFAULT (GETDATE()),
    ModifiedBy          INT           NULL,

    CONSTRAINT PK_PaymentReminders PRIMARY KEY (PaymentReminderId),

    CONSTRAINT FK_PaymentReminders_Customer
        FOREIGN KEY (CustomerId) REFERENCES dbo.Customer (CustomerId),

    CONSTRAINT FK_PaymentReminders_Category
        FOREIGN KEY (ReminderTypeId) REFERENCES dbo.Category (CategoryId)
);
GO

CREATE UNIQUE INDEX UX_PaymentReminders_Customer_Category_Date
    ON dbo.PaymentReminders (CustomerId, ReminderTypeId, ReminderDate);
GO

CREATE INDEX IX_PaymentReminders_CustomerId ON dbo.PaymentReminders (CustomerId);
CREATE INDEX IX_PaymentReminders_DueDate    ON dbo.PaymentReminders (DueDate);
GO
